// Singpass login and account-linking flows.
//
// Rules this service enforces:
//   - Authentication and ID token validation happen here, never in the browser.
//   - A Singpass identity is the validated (issuer, sub) pair. It is linked to an
//     existing user only by that user, while signed in with their password.
//     Nothing is ever matched by email or name.
//   - An unlinked identity, a revoked link, an inactive user or a role outside
//     SINGPASS_ALLOWED_ROLES never receives an app token.
//   - Every transaction, hand-off code and link ticket is single-use and expires.
//   - The app token is built by the same function as password login, so roles
//     and claims are unchanged.
const crypto = require("crypto");

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const randomToken = () => crypto.randomBytes(32).toString("base64url");

// Error codes sent to the frontend. Provider error text is never forwarded.
const ERR = {
  SESSION_EXPIRED: "session_expired",
  EXPIRED: "expired",
  REPLAY: "replay",
  CANCELLED: "cancelled",
  PROVIDER_ERROR: "provider_error",
  FAILED: "failed",
  NOT_LINKED: "not_linked",
  NOT_PERMITTED: "not_permitted",
  ALREADY_LINKED: "already_linked",
  LINK_CONFLICT: "link_conflict",
};

class SingpassError extends Error {
  constructor(code, status = 400, message = code) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const isActiveFlag = (value) => {
  if (Buffer.isBuffer(value)) return value[0] === 1; // userac.active is BIT(1)
  return Number(value) === 1 || value === true;
};

/**
 * @param {object} deps
 * @param {object} deps.cfg      result of loadSingpassConfig()
 * @param {object} deps.oidc     createSingpassOidcClient(cfg) or a test double
 * @param {object} deps.store    models/singpassModel or an in-memory equivalent
 * @param {{getById: Function}} deps.users
 * @param {(user: object, email: string) => Promise<string>} deps.buildAuthToken
 * @param {() => Date} [deps.now]
 */
const createSingpassService = ({ cfg, oidc, store, users, buildAuthToken, now = () => new Date() }) => {
  const later = (seconds) => new Date(now().getTime() + seconds * 1000);

  const audit = (entry) =>
    store.audit({ ...entry, now: now() }).catch((err) => console.error("[singpass] audit write failed:", err.message));

  const loadEligibleUser = async (useracid) => {
    const user = useracid ? await users.getById(useracid) : null;
    if (!user) return { user: null, reason: "user_missing" };
    if (!isActiveFlag(user.active)) return { user, reason: "user_inactive" };
    if (!cfg.allowedRoles.includes(user.role)) return { user, reason: "role_not_allowed" };
    return { user, reason: null };
  };

  const startTransaction = async ({ purpose, useracid }) => {
    const txnToken = randomToken();
    const state = oidc.randomState();
    const nonce = oidc.randomNonce();
    const codeVerifier = oidc.randomPKCECodeVerifier();
    const dpopKeyPair = await oidc.newDpopKeyPair();

    await store.createTxn({
      txnHash: sha256(txnToken),
      purpose,
      useracid,
      state,
      nonce,
      codeVerifier,
      dpopKeyPair,
      now: now(),
      expiresAt: later(cfg.txnTtlSeconds),
    });

    // Housekeeping; failures here must not block a login.
    store.purgeExpired(new Date(now().getTime() - 24 * 3600 * 1000)).catch(() => {});

    const redirectUrl = await oidc.buildAuthorizationUrl({ state, nonce, codeVerifier, dpopKeyPair });
    return { txnToken, redirectUrl };
  };

  // ---- login ----------------------------------------------------------------

  const startLogin = async ({ ip }) => {
    const result = await startTransaction({ purpose: "login", useracid: null });
    audit({ event: "login_started", outcome: "ok", ip });
    return result;
  };

  // ---- linking --------------------------------------------------------------

  /** Called by a user who is signed in with their password. */
  const createLinkTicket = async ({ useracid, ip }) => {
    const { reason } = await loadEligibleUser(useracid);
    if (reason) {
      audit({ event: "link_ticket", outcome: "rejected", useracid, detail: reason, ip });
      throw new SingpassError(ERR.NOT_PERMITTED, 403, "This account is not permitted to use Singpass login");
    }
    if (await store.findActiveIdentityForUser(useracid)) {
      throw new SingpassError(ERR.ALREADY_LINKED, 409, "A Singpass account is already linked");
    }

    const ticket = randomToken();
    await store.createOneTimeCode({
      codeHash: sha256(ticket),
      purpose: "link_ticket",
      useracid,
      now: now(),
      expiresAt: later(cfg.linkTicketTtlSeconds),
    });
    audit({ event: "link_ticket", outcome: "ok", useracid, ip });
    return ticket;
  };

  /** Browser navigation with the ticket from createLinkTicket(). */
  const startLink = async ({ ticket, ip }) => {
    const claimed = ticket ? await store.consumeOneTimeCode(sha256(ticket), "link_ticket", now()) : { status: "not_found" };
    if (claimed.status !== "ok") {
      audit({
        event: "link_started",
        outcome: "rejected",
        useracid: claimed.code?.useracid,
        detail: `ticket_${claimed.status}`,
        ip,
      });
      throw new SingpassError(claimed.status === "consumed" ? ERR.REPLAY : ERR.EXPIRED, 400);
    }
    const { useracid } = claimed.code;
    const { reason } = await loadEligibleUser(useracid);
    if (reason) {
      audit({ event: "link_started", outcome: "rejected", useracid, detail: reason, ip });
      throw new SingpassError(ERR.NOT_PERMITTED, 403);
    }
    const result = await startTransaction({ purpose: "link", useracid });
    audit({ event: "link_started", outcome: "ok", useracid, ip });
    return result;
  };

  // ---- callback -------------------------------------------------------------

  // Login results go to the completion page; link results go back to Profile.
  // Values travel in the URL fragment so they never reach server logs or Referer.
  const frontendRedirect = (purpose, fragment) =>
    purpose === "link"
      ? `${cfg.frontendUrl}/profile#singpass=${fragment}`
      : `${cfg.frontendUrl}/auth/singpass/complete#${fragment}`;

  /**
   * Handle the redirect back from Singpass.
   * @param {{txnToken?: string, params: URLSearchParams, ip?: string}} input
   * @returns {Promise<string>} URL to redirect the browser to
   */
  const handleCallback = async ({ txnToken, params, ip }) => {
    if (!txnToken) {
      audit({ event: "callback", outcome: "rejected", detail: "no_session_cookie", ip });
      return frontendRedirect("login", `error=${ERR.SESSION_EXPIRED}`);
    }

    // Claim the transaction first: whatever happens next, it cannot be used again.
    const claimed = await store.consumeTxn(sha256(txnToken), now());
    const purpose = claimed.txn?.purpose || "login";
    const fail = (code, detail, extra = {}) => {
      audit({ event: `${purpose}_callback`, outcome: "rejected", detail: detail || code, ip, ...extra });
      return frontendRedirect(purpose, purpose === "link" ? `error-${code}` : `error=${code}`);
    };

    if (claimed.status === "not_found") return fail(ERR.SESSION_EXPIRED, "txn_not_found");
    if (claimed.status === "consumed") return fail(ERR.REPLAY, "txn_replayed", { useracid: claimed.txn.useracid });
    if (claimed.status === "expired") return fail(ERR.EXPIRED, "txn_expired", { useracid: claimed.txn.useracid });

    const txn = claimed.txn;

    // Singpass always returns iss (RFC 9207); the library only checks it when present.
    if (!params.get("iss")) return fail(ERR.FAILED, "missing_iss_parameter", { useracid: txn.useracid });

    let claims;
    let issuer;
    try {
      ({ claims, issuer } = await oidc.exchangeCode(params, txn));
    } catch (err) {
      if (err instanceof oidc.AuthorizationResponseError) {
        const providerError = String(err.error || "unknown").slice(0, 64);
        const code = providerError === "access_denied" ? ERR.CANCELLED : ERR.PROVIDER_ERROR;
        return fail(code, `provider_${providerError}`, { useracid: txn.useracid });
      }
      console.error("[singpass] code exchange / ID token validation failed:", err.code || "", err.message, err.cause?.message || "");
      return fail(ERR.FAILED, `validation_${String(err.code || err.name || "error").slice(0, 40)}`, {
        useracid: txn.useracid,
      });
    }

    // Checks beyond what openid-client already enforces.
    const subject = typeof claims.sub === "string" ? claims.sub : "";
    if (!subject || subject.length > 255) return fail(ERR.FAILED, "invalid_sub", { useracid: txn.useracid });
    if (claims.iss !== cfg.issuerUrl || issuer !== cfg.issuerUrl) {
      return fail(ERR.FAILED, "unexpected_issuer", { useracid: txn.useracid });
    }
    if (claims.sub_type !== undefined && claims.sub_type !== "user") {
      return fail(ERR.FAILED, "unexpected_sub_type", { issuer, subject, useracid: txn.useracid });
    }
    if (!cfg.acceptedAcr.includes(claims.acr)) {
      return fail(ERR.NOT_PERMITTED, "acr_not_accepted", { issuer, subject, useracid: txn.useracid });
    }

    return txn.purpose === "link"
      ? completeLink({ txn, issuer, subject, ip, fail })
      : completeLogin({ issuer, subject, ip, fail });
  };

  const completeLogin = async ({ issuer, subject, ip, fail }) => {
    const identity = await store.findActiveIdentityBySubject(issuer, subject);
    if (!identity) return fail(ERR.NOT_LINKED, "identity_not_linked", { issuer, subject });

    const { reason } = await loadEligibleUser(identity.useracid);
    if (reason) return fail(ERR.NOT_PERMITTED, reason, { issuer, subject, useracid: identity.useracid });

    const code = randomToken();
    await store.createOneTimeCode({
      codeHash: sha256(code),
      purpose: "handoff",
      useracid: identity.useracid,
      identityId: identity.id,
      now: now(),
      expiresAt: later(cfg.handoffTtlSeconds),
    });
    audit({ event: "login_callback", outcome: "ok", useracid: identity.useracid, issuer, subject, ip });
    return frontendRedirect("login", `code=${code}`);
  };

  const completeLink = async ({ txn, issuer, subject, ip, fail }) => {
    const { useracid } = txn;
    const { reason } = await loadEligibleUser(useracid);
    if (reason) return fail(ERR.NOT_PERMITTED, reason, { issuer, subject, useracid });

    const existing = await store.findActiveIdentityBySubject(issuer, subject);
    if (existing && existing.useracid === useracid) return frontendRedirect("link", "linked");
    if (existing) return fail(ERR.LINK_CONFLICT, "subject_linked_to_other_user", { issuer, subject, useracid });

    const inserted = await store.insertIdentity({ useracid, issuer, subject, linkedBy: useracid, now: now() });
    if (inserted.status !== "ok") return fail(ERR.LINK_CONFLICT, "unique_constraint", { issuer, subject, useracid });

    audit({ event: "link_callback", outcome: "ok", useracid, issuer, subject, ip, detail: `identity_${inserted.id}` });
    return frontendRedirect("link", "linked");
  };

  // ---- hand-off -------------------------------------------------------------

  /** Swap the single-use hand-off code for the app JWT. */
  const exchangeHandoff = async ({ code, ip }) => {
    const claimed = code ? await store.consumeOneTimeCode(sha256(code), "handoff", now()) : { status: "not_found" };
    if (claimed.status !== "ok") {
      audit({ event: "handoff", outcome: "rejected", useracid: claimed.code?.useracid, detail: `code_${claimed.status}`, ip });
      throw new SingpassError(
        claimed.status === "consumed" ? ERR.REPLAY : ERR.EXPIRED,
        401,
        "Login link is invalid or has expired"
      );
    }

    const { useracid, identityId } = claimed.code;
    // Re-check: the link or the user may have changed since the callback.
    const identity = identityId ? await store.findIdentityById(identityId) : null;
    if (!identity || !identity.active || identity.useracid !== useracid) {
      audit({ event: "handoff", outcome: "rejected", useracid, detail: "identity_revoked", ip });
      throw new SingpassError(ERR.NOT_LINKED, 401, "Singpass account is no longer linked");
    }
    const { user, reason } = await loadEligibleUser(useracid);
    if (reason) {
      audit({ event: "handoff", outcome: "rejected", useracid, detail: reason, ip });
      throw new SingpassError(ERR.NOT_PERMITTED, 403, "This account is not permitted to use Singpass login");
    }

    const token = await buildAuthToken(user, user.email);
    await store.touchIdentityLogin(identity.id, now());
    audit({ event: "login_success", outcome: "ok", useracid, issuer: identity.issuer, subject: identity.subject, ip });
    return { token, user: { id: user.useracid, email: user.email, name: user.username } };
  };

  // ---- link management ------------------------------------------------------

  const getLinkStatus = async (useracid) => {
    const identity = await store.findActiveIdentityForUser(useracid);
    const { reason } = await loadEligibleUser(useracid);
    return {
      eligible: !reason,
      linked: Boolean(identity),
      linkedAt: identity?.linkedAt || null,
      lastLoginAt: identity?.lastLoginAt || null,
    };
  };

  const unlinkOwn = async ({ useracid, ip }) => {
    const identity = await store.findActiveIdentityForUser(useracid);
    if (!identity) throw new SingpassError(ERR.NOT_LINKED, 404, "No Singpass account is linked");
    await store.revokeIdentity(identity.id, useracid, now());
    audit({
      event: "link_revoked",
      outcome: "ok",
      useracid,
      issuer: identity.issuer,
      subject: identity.subject,
      detail: "self",
      ip,
    });
  };

  // The JWT role claim is "Therapist" for Admins too, so admin rights are read
  // from the database rather than the token.
  const assertAdmin = async (useracid) => {
    const user = useracid ? await users.getById(useracid) : null;
    if (!user || user.role !== "Admin" || !isActiveFlag(user.active)) {
      throw new SingpassError("forbidden", 403, "Admin access required");
    }
  };

  const listLinks = async ({ adminId }) => {
    await assertAdmin(adminId);
    return store.listActiveIdentities();
  };

  const revokeLink = async ({ adminId, identityId, ip }) => {
    await assertAdmin(adminId);
    const identity = await store.findIdentityById(identityId);
    if (!identity || !identity.active) throw new SingpassError(ERR.NOT_LINKED, 404, "Link not found");
    await store.revokeIdentity(identity.id, adminId, now());
    audit({
      event: "link_revoked",
      outcome: "ok",
      useracid: identity.useracid,
      issuer: identity.issuer,
      subject: identity.subject,
      detail: `by_admin_${adminId}`,
      ip,
    });
  };

  return {
    startLogin,
    createLinkTicket,
    startLink,
    handleCallback,
    exchangeHandoff,
    getLinkStatus,
    unlinkOwn,
    listLinks,
    revokeLink,
  };
};

module.exports = { createSingpassService, SingpassError, ERR, isActiveFlag };

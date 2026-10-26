// TEST ONLY. A local stand-in for the Singpass FAPI 2.0 authorization server.
// Never required from src/ (enforced by a test); the app only talks to it when
// SINGPASS_ALLOW_LOCAL_MOCK_ISSUER=true outside production.
//
// It enforces the parts of the Singpass spec that the client must get right:
// private_key_jwt client assertions (typ, aud, lifetime <= 120s, single-use jti),
// DPoP proofs (typ, htm, htu, iat, single-use jti, key binding from PAR to token),
// PKCE S256, registered redirect URIs, single-use codes, and JWE(JWS) ID tokens.
const crypto = require("crypto");
const http = require("http");
const express = require("express");
const jose = require("jose");

const createMockSingpass = async ({ clientId, clientPublicJwks, redirectUris, interactive = false, port = 0 }) => {
  const opKey = await jose.generateKeyPair("ES256", { extractable: true });
  const opPublicJwk = { ...(await jose.exportJWK(opKey.publicKey)), kid: "mock-op-sig", use: "sig", alg: "ES256" };
  // A second key that is NOT published, for "bad signature" tests.
  const rogueKey = await jose.generateKeyPair("ES256");
  const clientKeys = jose.createLocalJWKSet(clientPublicJwks);
  const clientEncJwk = clientPublicJwks.keys.find((k) => k.use === "enc");

  const seenJti = new Set();
  const parRequests = new Map();
  const codes = new Map();
  const queue = [];
  const events = [];
  let issuer = "";

  const app = express();
  app.use(express.urlencoded({ extended: false }));

  const oauthError = (res, status, error, description) => {
    events.push({ type: "error", error, description });
    res.status(status).json({ error, error_description: description });
  };

  const verifyClientAssertion = async (body) => {
    if (body.client_assertion_type !== "urn:ietf:params:oauth:client-assertion-type:jwt-bearer") {
      throw new Error("bad client_assertion_type");
    }
    const { payload, protectedHeader } = await jose.jwtVerify(body.client_assertion, clientKeys, {
      issuer: clientId,
      subject: clientId,
      audience: issuer,
      algorithms: ["ES256", "ES384", "ES512"],
      typ: "JWT",
    });
    if (!protectedHeader.typ) throw new Error("client assertion typ missing");
    if (payload.exp - payload.iat > 120) throw new Error("client assertion lifetime > 120s");
    if (!payload.jti || seenJti.has(`ca:${payload.jti}`)) throw new Error("client assertion jti reused");
    seenJti.add(`ca:${payload.jti}`);
    if (body.client_id && body.client_id !== clientId) throw new Error("client_id mismatch");
  };

  const verifyDpop = async (req, path) => {
    const proof = req.get("DPoP");
    if (!proof) throw new Error("DPoP header missing");
    const { payload, protectedHeader } = await jose.jwtVerify(proof, jose.EmbeddedJWK, {
      typ: "dpop+jwt",
      algorithms: ["ES256"],
    });
    if (protectedHeader.jwk.d) throw new Error("DPoP jwk contains private key");
    if (payload.htm !== "POST") throw new Error("DPoP htm mismatch");
    if (payload.htu !== `${issuer}${path}`) throw new Error(`DPoP htu mismatch: ${payload.htu}`);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - payload.iat) > 120) throw new Error("DPoP iat out of range");
    if (payload.exp && payload.exp - payload.iat > 120) throw new Error("DPoP lifetime > 120s");
    if (!payload.jti || seenJti.has(`dpop:${payload.jti}`)) throw new Error("DPoP jti reused");
    seenJti.add(`dpop:${payload.jti}`);
    return jose.calculateJwkThumbprint(protectedHeader.jwk);
  };

  app.get("/fapi/.well-known/openid-configuration", (req, res) => {
    res.json({
      issuer,
      authorization_endpoint: `${issuer}/auth`,
      pushed_authorization_request_endpoint: `${issuer}/par`,
      token_endpoint: `${issuer}/token`,
      jwks_uri: `${issuer}/jwks`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code"],
      scopes_supported: ["openid", "user.identity", "name", "email", "mobileno"],
      subject_types_supported: ["public"],
      token_endpoint_auth_methods_supported: ["private_key_jwt"],
      token_endpoint_auth_signing_alg_values_supported: ["ES256", "ES384", "ES512"],
      id_token_signing_alg_values_supported: ["ES256"],
      id_token_encryption_alg_values_supported: ["ECDH-ES+A128KW", "ECDH-ES+A192KW", "ECDH-ES+A256KW"],
      id_token_encryption_enc_values_supported: ["A256CBC-HS512"],
      dpop_signing_alg_values_supported: ["ES256"],
      code_challenge_methods_supported: ["S256"],
      require_pushed_authorization_requests: true,
      authorization_response_iss_parameter_supported: true,
    });
  });

  app.get("/fapi/jwks", (req, res) => res.json({ keys: [opPublicJwk] }));

  app.post("/fapi/par", async (req, res) => {
    try {
      await verifyClientAssertion(req.body);
    } catch (err) {
      return oauthError(res, 401, "invalid_client", err.message);
    }
    let jkt;
    try {
      jkt = await verifyDpop(req, "/par");
    } catch (err) {
      return oauthError(res, 400, "invalid_dpop_proof", err.message);
    }
    const p = req.body;
    if (p.response_type !== "code") return oauthError(res, 400, "invalid_request", "response_type");
    if (!String(p.scope || "").split(" ").includes("openid")) return oauthError(res, 400, "invalid_scope", "openid");
    if (!redirectUris.includes(p.redirect_uri)) return oauthError(res, 400, "invalid_request", "redirect_uri");
    if (p.code_challenge_method !== "S256" || !p.code_challenge) return oauthError(res, 400, "invalid_request", "pkce");
    if (!p.state || !p.nonce) return oauthError(res, 400, "invalid_request", "state/nonce");
    if (!p.authentication_context_type) return oauthError(res, 400, "invalid_request", "authentication_context_type");

    const requestUri = `urn:ietf:params:oauth:request_uri:${crypto.randomBytes(16).toString("hex")}`;
    parRequests.set(requestUri, { params: p, jkt, expiresAt: Date.now() + 60_000 });
    events.push({ type: "par", params: p });
    res.status(201).json({ request_uri: requestUri, expires_in: 60 });
  });

  const escapeHtml = (v) => String(v).replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);

  // Simulates the user at the Singpass login page; the outcome comes from queueLogin(),
  // or, in interactive mode, from a small form (fictional test identities only).
  app.get("/fapi/auth", (req, res) => {
    const par = parRequests.get(req.query.request_uri);
    if (!par || req.query.client_id !== clientId) return res.status(400).send("invalid_request_uri");
    if (Date.now() > par.expiresAt) return res.status(400).send("request_uri expired");

    if (interactive && !req.query.decision) {
      const ru = escapeHtml(req.query.request_uri);
      return res.send(`<!doctype html><meta charset="utf-8"><title>MOCK Singpass</title>
<body style="font-family:sans-serif;max-width:420px;margin:40px auto">
<h2 style="color:#b00">MOCK Singpass (local test only)</h2>
<form method="get" action="/fapi/auth">
<input type="hidden" name="client_id" value="${escapeHtml(clientId)}"><input type="hidden" name="request_uri" value="${ru}">
<label>Fictional Singpass subject (UUID)<br><input name="sub" value="mock-user-0001" style="width:100%"></label><br><br>
<button name="decision" value="success">Log in</button> <button name="decision" value="cancel">Cancel</button>
</form></body>`);
    }
    parRequests.delete(req.query.request_uri);

    const next = interactive
      ? { outcome: req.query.decision === "cancel" ? "cancel" : "success", sub: String(req.query.sub || "mock-user-0001") }
      : queue.shift() || { outcome: "success", sub: "default-sub" };
    const target = new URL(par.params.redirect_uri);
    target.searchParams.set("state", next.state ?? par.params.state);
    if (next.omitIss !== true) target.searchParams.set("iss", next.iss ?? issuer);

    if (next.outcome === "cancel") {
      target.searchParams.set("error", "access_denied");
      target.searchParams.set("error_description", "<script>user cancelled</script>");
    } else if (next.outcome === "server_error") {
      target.searchParams.set("error", "server_error");
    } else {
      const code = crypto.randomBytes(24).toString("base64url");
      codes.set(code, { par, next, used: false, expiresAt: Date.now() + 60_000 });
      target.searchParams.set("code", code);
    }
    res.redirect(302, target.href);
  });

  app.post("/fapi/token", async (req, res) => {
    try {
      await verifyClientAssertion(req.body);
    } catch (err) {
      return oauthError(res, 401, "invalid_client", err.message);
    }
    let jkt;
    try {
      jkt = await verifyDpop(req, "/token");
    } catch (err) {
      return oauthError(res, 400, "invalid_dpop_proof", err.message);
    }

    const entry = codes.get(req.body.code);
    if (req.body.grant_type !== "authorization_code" || !entry) return oauthError(res, 400, "invalid_grant", "code");
    if (entry.used) return oauthError(res, 400, "invalid_grant", "code already used");
    entry.used = true;
    if (Date.now() > entry.expiresAt) return oauthError(res, 400, "invalid_grant", "code expired");
    if (entry.par.jkt !== jkt) return oauthError(res, 400, "invalid_dpop_proof", "DPoP key differs from PAR");
    if (req.body.redirect_uri !== entry.par.params.redirect_uri) return oauthError(res, 400, "invalid_grant", "redirect_uri");
    const challenge = crypto.createHash("sha256").update(req.body.code_verifier || "").digest("base64url");
    if (challenge !== entry.par.params.code_challenge) return oauthError(res, 400, "invalid_grant", "PKCE verifier");

    const { next } = entry;
    const now = Math.floor(Date.now() / 1000);
    const claims = {
      iss: issuer,
      aud: clientId,
      sub: next.sub,
      sub_type: "user",
      iat: now,
      exp: now + 600,
      nonce: entry.par.params.nonce,
      acr: "urn:singpass:authentication:loa:2",
      amr: ["pwd", "otp-sms"],
      ...(next.claims || {}),
    };
    for (const [k, v] of Object.entries(claims)) if (v === undefined) delete claims[k];

    const signingKey = next.rogueSignature ? rogueKey.privateKey : opKey.privateKey;
    const jws = await new jose.SignJWT(claims)
      .setProtectedHeader({ alg: "ES256", kid: "mock-op-sig", typ: "JWT" })
      .sign(signingKey);
    const idToken = await new jose.CompactEncrypt(new TextEncoder().encode(jws))
      .setProtectedHeader({ alg: "ECDH-ES+A256KW", enc: "A256CBC-HS512", kid: clientEncJwk.kid, cty: "JWT" })
      .encrypt(await jose.importJWK(clientEncJwk, "ECDH-ES+A256KW"));

    events.push({ type: "token", sub: next.sub });
    res.json({
      access_token: crypto.randomBytes(24).toString("base64url"),
      token_type: "DPoP",
      expires_in: 600,
      scope: entry.par.params.scope,
      id_token: idToken,
    });
  });

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(port, "localhost", resolve));
  issuer = `http://localhost:${server.address().port}/fapi`;

  return {
    issuer,
    events,
    /** Decide what the next simulated Singpass login does. */
    queueLogin: (next) => queue.push({ outcome: "success", ...next }),
    close: () => new Promise((resolve) => server.close(resolve)),
  };
};

module.exports = { createMockSingpass };

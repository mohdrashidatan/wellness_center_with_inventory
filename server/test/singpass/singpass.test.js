// Singpass Login pilot: end-to-end tests against a local mock Singpass server.
// Run from server/:  npm test
//
// No database is used (in-memory store), no network beyond localhost, and the
// real openid-client validation path runs (PAR, DPoP, PKCE, private_key_jwt,
// JWE decryption, ID token signature, iss/aud/exp/nonce).
process.env.JWT_SECRET = "test-only-secret-" + "x".repeat(48);

const { describe, it, before, after, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");
const { spawnSync } = require("child_process");
const express = require("express");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { createMockSingpass } = require("./mockSingpass");
const { createMemoryStore } = require("./memoryStore");
const { loadSingpassConfig } = require("../../src/config/singpass");
const { createSingpassService } = require("../../src/services/singpassService");
const { createSingpassOidcClient } = require("../../src/services/singpassOidcClient");
const { createSingpassRouter } = require("../../src/routes/singpassRoutes");

// Real password-login code with its database calls stubbed.
const User = require("../../src/models/userModel");
const Therapist = require("../../src/models/therapistModal");
const Customer = require("../../src/models/customerModel");
const authService = require("../../src/services/authService");

const SERVER_DIR = path.resolve(__dirname, "../..");
const CLIENT_ID = "PilotTestClient0123456789abcdefX"; // 32 chars, fictional
const FRONTEND = "http://localhost:5174";
const PASSWORD = "pilot-password-1";

const bit = (v) => Buffer.from([v]); // userac.active is BIT(1)
const USERS = [
  { useracid: 1, username: "Tara Therapist", email: "tara@pilot.test", role: "Therapist", active: bit(1) },
  { useracid: 2, username: "Adam Admin", email: "adam@pilot.test", role: "Admin", active: bit(1) },
  { useracid: 3, username: "Cara Customer", email: "cara@pilot.test", role: "Customer", active: bit(1) },
  { useracid: 4, username: "Ian Inactive", email: "ian@pilot.test", role: "Therapist", active: bit(1) },
  { useracid: 5, username: "Theo Therapist", email: "theo@pilot.test", role: "Therapist", active: bit(1) },
  { useracid: 6, username: "Rae Revoked", email: "rae@pilot.test", role: "Therapist", active: bit(1) },
];
const THERAPIST_IDS = { "tara@pilot.test": 101, "theo@pilot.test": 105, "ian@pilot.test": 104, "rae@pilot.test": 106 };

const makeJwks = () => {
  const make = (use, alg) => {
    const { privateKey } = crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });
    return { ...privateKey.export({ format: "jwk" }), use, alg, kid: `test-${use}-${crypto.randomBytes(3).toString("hex")}` };
  };
  return { keys: [make("sig", "ES256"), make("enc", "ECDH-ES+A256KW")] };
};

describe("Singpass login pilot (mock Singpass)", () => {
  let mock;
  let appServer;
  let appBase;
  let cfg;
  let store;
  let clockOffsetMs = 0;
  const passwordHash = bcrypt.hashSync(PASSWORD, 4);

  const usersRepo = {
    getById: async (id) => {
      const u = USERS.find((x) => x.useracid === Number(id));
      return u && { ...u };
    },
  };

  before(async () => {
    // Stub the DB calls used by the real password login / token builder.
    User.findUserByEmail = async (email) => {
      const u = USERS.find((x) => x.email === email);
      return u && { useracid: u.useracid, email: u.email, password: passwordHash, role: u.role };
    };
    Therapist.getDataByEmail = async (email) =>
      THERAPIST_IDS[email] ? { therapistsid: THERAPIST_IDS[email], email } : undefined;
    Customer.getCustomerByAccountId = async () => ({ customerid: 903 });

    // App server first, so its port is known for the redirect URI.
    let handler = (req, res) => res.end();
    appServer = http.createServer((req, res) => handler(req, res));
    await new Promise((r) => appServer.listen(0, "localhost", r));
    appBase = `http://localhost:${appServer.address().port}`;
    const redirectUri = `${appBase}/api/auth/singpass/callback`;

    const privateJwks = makeJwks();
    const publicJwks = { keys: privateJwks.keys.map(({ d, ...pub }) => pub) };
    mock = await createMockSingpass({ clientId: CLIENT_ID, clientPublicJwks: publicJwks, redirectUris: [redirectUri] });

    cfg = loadSingpassConfig({
      NODE_ENV: "test",
      SINGPASS_ENABLED: "true",
      SINGPASS_ALLOW_LOCAL_MOCK_ISSUER: "true",
      SINGPASS_ISSUER_URL: mock.issuer,
      SINGPASS_CLIENT_ID: CLIENT_ID,
      SINGPASS_REDIRECT_URI: redirectUri,
      SINGPASS_FRONTEND_URL: FRONTEND,
      SINGPASS_PRIVATE_JWKS: JSON.stringify(privateJwks),
    });
    assert.equal(cfg.mock, true);

    store = createMemoryStore();
    const service = createSingpassService({
      cfg,
      oidc: createSingpassOidcClient(cfg),
      store,
      users: usersRepo,
      buildAuthToken: authService.buildAuthToken,
      now: () => new Date(Date.now() + clockOffsetMs),
    });

    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use("/api/auth/singpass", createSingpassRouter(service, cfg, { rateLimitMax: 1000 }));
    // Real protected routes, to prove what a token does (or does not) unlock.
    app.use("/api/profile", require("../../src/routes/profileRoutes"));
    app.use("/api/products", require("../../src/routes/productsRoute"));
    handler = app;
  });

  after(async () => {
    await mock?.close();
    await new Promise((r) => appServer?.close(r));
  });

  afterEach(() => {
    clockOffsetMs = 0;
  });

  // ---- helpers ---------------------------------------------------------------

  const get = (url, cookie) => fetch(url, { redirect: "manual", headers: cookie ? { cookie } : {} });
  const txnCookie = (res) => (res.headers.getSetCookie().find((c) => c.startsWith("pwg_sp_txn=")) || "").split(";")[0];
  const fragment = (url) => new URLSearchParams(new URL(url).hash.slice(1));

  /** Browser: app start URL -> Singpass (mock) -> back to our callback URL (not yet followed). */
  const throughSingpass = async (startUrl, next) => {
    mock.queueLogin(next);
    const start = await get(startUrl);
    assert.equal(start.status, 302, "start should redirect to Singpass");
    const cookie = txnCookie(start);
    assert.ok(cookie, "transaction cookie set");
    const setCookie = start.headers.getSetCookie().join(";").toLowerCase();
    assert.match(setCookie, /httponly/);
    assert.match(setCookie, /samesite=lax/);
    assert.ok(start.headers.get("location").startsWith(`${mock.issuer}/auth?`));

    const atSingpass = await get(start.headers.get("location"));
    assert.equal(atSingpass.status, 302);
    return { cookie, callbackUrl: atSingpass.headers.get("location") };
  };

  const followCallback = async (callbackUrl, cookie) => {
    const res = await get(callbackUrl, cookie);
    assert.equal(res.status, 302);
    assert.match(res.headers.getSetCookie().join(";"), /pwg_sp_txn=;/, "cookie cleared on callback");
    return res.headers.get("location");
  };

  const singpassLogin = async (next) => {
    const { cookie, callbackUrl } = await throughSingpass(`${appBase}/api/auth/singpass/login`, next);
    return followCallback(callbackUrl, cookie);
  };

  const passwordToken = async (email) => (await authService.loginUser(email, PASSWORD)).token;

  const api = (method, route, { token, body } = {}) =>
    fetch(`${appBase}${route}`, {
      method,
      headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });

  const linkSingpass = async (email, sub, extra = {}) => {
    const token = await passwordToken(email);
    const ticketRes = await api("POST", "/api/auth/singpass/link/ticket", { token });
    assert.equal(ticketRes.status, 200, `ticket for ${email}`);
    const { url } = (await ticketRes.json()).data;
    const { cookie, callbackUrl } = await throughSingpass(url, { sub, ...extra });
    return followCallback(callbackUrl, cookie);
  };

  const exchange = (code) => api("POST", "/api/auth/singpass/exchange", { body: { code } });

  const stripVolatile = ({ iat, exp, jti, ...rest }) => rest;

  // ---- tests -----------------------------------------------------------------

  it("PAR request follows the Singpass FAPI 2.0 profile", async () => {
    const before = mock.events.length;
    await singpassLogin({ sub: "par-check-sub" });
    const par = mock.events.slice(before).find((e) => e.type === "par").params;
    assert.equal(par.scope, "openid", "requests openid only (no NRIC/name)");
    assert.equal(par.code_challenge_method, "S256");
    assert.equal(par.authentication_context_type, "APP_AUTHENTICATION_DEFAULT");
    assert.equal(par.response_type, "code");
    assert.ok(par.state && par.nonce);
  });

  describe("unauthorised access", () => {
    it("an unknown (unlinked) Singpass user gets no token and no inventory access", async () => {
      const landing = await singpassLogin({ sub: "unknown-sub-1" });
      assert.equal(fragment(landing).get("error"), "not_linked");
      assert.equal(fragment(landing).get("code"), null);
      assert.equal((await api("GET", "/api/products")).status, 401);
      assert.ok(store.auditLog.some((e) => e.detail === "identity_not_linked" && e.subject === "unknown-sub-1"));
    });

    it("never links by email: a Singpass email matching a user does not grant access", async () => {
      const landing = await singpassLogin({
        sub: "email-match-sub",
        claims: { sub_attributes: { email: "tara@pilot.test", name: "Tara Therapist" } },
      });
      assert.equal(fragment(landing).get("error"), "not_linked");
      assert.equal(store.identities.some((i) => i.subject === "email-match-sub"), false);
    });

    it("Customer accounts cannot start a Singpass link", async () => {
      const res = await api("POST", "/api/auth/singpass/link/ticket", { token: await passwordToken("cara@pilot.test") });
      assert.equal(res.status, 403);
    });

    it("link ticket requires an authenticated session", async () => {
      assert.equal((await api("POST", "/api/auth/singpass/link/ticket")).status, 401);
    });

    it("a forged or unknown link ticket is rejected", async () => {
      const res = await get(`${appBase}/api/auth/singpass/link/start?ticket=forged`);
      assert.equal(res.status, 302);
      assert.equal(fragment(res.headers.get("location")).get("singpass"), "error-expired");
      assert.equal(txnCookie(res), "");
    });

    it("non-admins cannot list or revoke links", async () => {
      const token = await passwordToken("tara@pilot.test");
      assert.equal((await api("GET", "/api/auth/singpass/links", { token })).status, 403);
      assert.equal((await api("POST", "/api/auth/singpass/links/1/revoke", { token })).status, 403);
    });

    it("an invalid hand-off code returns no token", async () => {
      const res = await exchange("not-a-real-code");
      assert.equal(res.status, 401);
      assert.equal((await res.json()).data, undefined);
    });
  });

  describe("account linking and successful login", () => {
    it("links via password session, then Singpass login issues the same token as password login", async () => {
      const linked = await linkSingpass("tara@pilot.test", "sub-tara");
      assert.equal(linked, `${FRONTEND}/profile#singpass=linked`);
      const identity = store.identities.find((i) => i.subject === "sub-tara");
      assert.equal(identity.useracid, 1);
      assert.equal(identity.issuer, mock.issuer);

      const landing = await singpassLogin({ sub: "sub-tara" });
      assert.ok(landing.startsWith(`${FRONTEND}/auth/singpass/complete#code=`));
      const res = await exchange(fragment(landing).get("code"));
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);

      const singpassClaims = jwt.decode(body.data.token);
      const passwordClaims = jwt.decode(await passwordToken("tara@pilot.test"));
      assert.deepEqual(stripVolatile(singpassClaims), stripVolatile(passwordClaims));
      assert.equal(singpassClaims.role, "Therapist");
      assert.equal(singpassClaims.therapistId, 101);

      // The token works on existing protected routes exactly like a password token.
      const profile = await api("GET", "/api/profile", { token: body.data.token });
      assert.equal(profile.status, 200);
      assert.equal((await profile.json()).user.userId, 1);
    });

    it("Admin keeps exactly the claims password login gives Admin", async () => {
      await linkSingpass("adam@pilot.test", "sub-adam");
      const landing = await singpassLogin({ sub: "sub-adam" });
      const { data } = await (await exchange(fragment(landing).get("code"))).json();
      const passwordClaims = jwt.decode(await passwordToken("adam@pilot.test"));
      assert.deepEqual(stripVolatile(jwt.decode(data.token)), stripVolatile(passwordClaims));
    });

    it("link status and admin listing reflect the link", async () => {
      const status = await (await api("GET", "/api/auth/singpass/link", { token: await passwordToken("tara@pilot.test") })).json();
      assert.equal(status.data.linked, true);
      const list = await api("GET", "/api/auth/singpass/links", { token: await passwordToken("adam@pilot.test") });
      assert.equal(list.status, 200);
      assert.ok((await list.json()).data.some((i) => i.subject === "sub-tara"));
    });

    it("a Singpass identity already linked to another user cannot be linked again", async () => {
      const landing = await linkSingpass("theo@pilot.test", "sub-tara");
      assert.equal(landing, `${FRONTEND}/profile#singpass=error-link_conflict`);
      assert.equal(store.identities.filter((i) => i.subject === "sub-tara" && i.isActive === 1).length, 1);
    });

    it("a user with a link cannot request a second link", async () => {
      const res = await api("POST", "/api/auth/singpass/link/ticket", { token: await passwordToken("tara@pilot.test") });
      assert.equal(res.status, 409);
    });
  });

  describe("cancellation and provider errors", () => {
    it("user cancelling at Singpass returns cancelled without echoing provider text", async () => {
      const landing = await singpassLogin({ outcome: "cancel" });
      assert.equal(landing, `${FRONTEND}/auth/singpass/complete#error=cancelled`);
      assert.doesNotMatch(landing, /script/);
    });

    it("Singpass server_error maps to provider_error", async () => {
      assert.equal(fragment(await singpassLogin({ outcome: "server_error" })).get("error"), "provider_error");
    });

    it("cancelling a link attempt returns to profile", async () => {
      const token = await passwordToken("theo@pilot.test");
      const { url } = (await (await api("POST", "/api/auth/singpass/link/ticket", { token })).json()).data;
      const { cookie, callbackUrl } = await throughSingpass(url, { outcome: "cancel" });
      assert.equal(await followCallback(callbackUrl, cookie), `${FRONTEND}/profile#singpass=error-cancelled`);
    });
  });

  describe("expiry", () => {
    it("login transaction older than 10 minutes is rejected", async () => {
      const { cookie, callbackUrl } = await throughSingpass(`${appBase}/api/auth/singpass/login`, { sub: "sub-tara" });
      clockOffsetMs = 10 * 60 * 1000 + 1000;
      assert.equal(fragment(await followCallback(callbackUrl, cookie)).get("error"), "expired");
    });

    it("hand-off code older than 60 seconds is rejected", async () => {
      const landing = await singpassLogin({ sub: "sub-tara" });
      clockOffsetMs = 61 * 1000;
      const res = await exchange(fragment(landing).get("code"));
      assert.equal(res.status, 401);
      assert.equal((await res.json()).code, "expired");
    });

    it("link ticket older than 60 seconds is rejected", async () => {
      const token = await passwordToken("theo@pilot.test");
      const { url } = (await (await api("POST", "/api/auth/singpass/link/ticket", { token })).json()).data;
      clockOffsetMs = 61 * 1000;
      const res = await get(url);
      assert.equal(fragment(res.headers.get("location")).get("singpass"), "error-expired");
    });

    it("an expired ID token is rejected", async () => {
      const past = Math.floor(Date.now() / 1000) - 3600;
      const landing = await singpassLogin({ sub: "sub-tara", claims: { iat: past - 600, exp: past } });
      assert.equal(fragment(landing).get("error"), "failed");
    });
  });

  describe("replay rejection", () => {
    it("replaying the callback (same cookie and code) is rejected", async () => {
      const { cookie, callbackUrl } = await throughSingpass(`${appBase}/api/auth/singpass/login`, { sub: "sub-tara" });
      assert.ok(fragment(await followCallback(callbackUrl, cookie)).get("code"));
      assert.equal(fragment(await followCallback(callbackUrl, cookie)).get("error"), "replay");
    });

    it("a stolen callback URL without the browser's transaction cookie is rejected", async () => {
      const { callbackUrl } = await throughSingpass(`${appBase}/api/auth/singpass/login`, { sub: "sub-tara" });
      const res = await get(callbackUrl);
      assert.equal(fragment(res.headers.get("location")).get("error"), "session_expired");
    });

    it("a callback paired with another browser's transaction cookie is rejected (state mismatch)", async () => {
      const a = await throughSingpass(`${appBase}/api/auth/singpass/login`, { sub: "sub-tara" });
      const b = await throughSingpass(`${appBase}/api/auth/singpass/login`, { sub: "sub-tara" });
      assert.equal(fragment(await followCallback(a.callbackUrl, b.cookie)).get("error"), "failed");
    });

    it("a hand-off code can be exchanged only once", async () => {
      const code = fragment(await singpassLogin({ sub: "sub-tara" })).get("code");
      assert.equal((await exchange(code)).status, 200);
      const again = await exchange(code);
      assert.equal(again.status, 401);
      assert.equal((await again.json()).code, "replay");
    });

    it("a link ticket can be used only once", async () => {
      const token = await passwordToken("theo@pilot.test");
      const { url } = (await (await api("POST", "/api/auth/singpass/link/ticket", { token })).json()).data;
      assert.equal((await get(url)).status, 302);
      const again = await get(url);
      assert.equal(fragment(again.headers.get("location")).get("singpass"), "error-replay");
    });
  });

  describe("ID token and response validation", () => {
    const cases = [
      ["wrong audience", { claims: { aud: "SomeOtherClient000000000000000000" } }],
      ["wrong nonce", { claims: { nonce: "attacker-nonce" } }],
      ["wrong issuer claim", { claims: { iss: "https://evil.example/fapi" } }],
      ["signature by a key not in the Singpass JWKS", { rogueSignature: true }],
      ["tampered state in the redirect", { state: "tampered-state" }],
      ["foreign iss in the redirect", { iss: "https://evil.example/fapi" }],
      ["missing iss in the redirect", { omitIss: true }],
      ["unexpected sub_type", { claims: { sub_type: "service" } }],
    ];
    for (const [name, next] of cases) {
      it(`rejects ${name}`, async () => {
        const landing = await singpassLogin({ sub: "sub-tara", ...next });
        assert.equal(fragment(landing).get("error"), "failed", landing);
        assert.equal(fragment(landing).get("code"), null);
      });
    }

    it("rejects an assurance level outside SINGPASS_ACCEPTED_ACR", async () => {
      const landing = await singpassLogin({ sub: "sub-tara", claims: { acr: "urn:singpass:authentication:loa:0" } });
      assert.equal(fragment(landing).get("error"), "not_permitted");
    });
  });

  describe("revocation and deactivation", () => {
    it("admin revoke blocks the next Singpass login", async () => {
      await linkSingpass("rae@pilot.test", "sub-rae");
      const id = store.identities.find((i) => i.subject === "sub-rae").id;
      const revoke = await api("POST", `/api/auth/singpass/links/${id}/revoke`, { token: await passwordToken("adam@pilot.test") });
      assert.equal(revoke.status, 200);
      assert.equal(fragment(await singpassLogin({ sub: "sub-rae" })).get("error"), "not_linked");
    });

    it("revocation between callback and hand-off exchange is enforced", async () => {
      await linkSingpass("rae@pilot.test", "sub-rae-2");
      const code = fragment(await singpassLogin({ sub: "sub-rae-2" })).get("code");
      const token = await passwordToken("rae@pilot.test");
      assert.equal((await api("DELETE", "/api/auth/singpass/link", { token })).status, 200);
      const res = await exchange(code);
      assert.equal(res.status, 401);
      assert.equal((await res.json()).code, "not_linked");
    });

    it("a deactivated user cannot log in with a linked Singpass", async () => {
      await linkSingpass("ian@pilot.test", "sub-ian");
      USERS.find((u) => u.useracid === 4).active = bit(0);
      assert.equal(fragment(await singpassLogin({ sub: "sub-ian" })).get("error"), "not_permitted");
    });
  });

  it("serves only public keys on the JWKS endpoint", async () => {
    const jwks = await (await fetch(`${appBase}/api/auth/singpass/jwks`)).json();
    assert.equal(jwks.keys.length, 2);
    for (const key of jwks.keys) assert.equal(key.d, undefined);
  });
});

describe("Singpass configuration guards", () => {
  const keys = JSON.stringify(makeJwks());
  const base = {
    SINGPASS_ENABLED: "true",
    SINGPASS_CLIENT_ID: CLIENT_ID,
    SINGPASS_REDIRECT_URI: "https://api.example.test/api/auth/singpass/callback",
    SINGPASS_FRONTEND_URL: "https://app.example.test",
    SINGPASS_PRIVATE_JWKS: keys,
  };

  it("is off unless SINGPASS_ENABLED=true", () => {
    assert.deepEqual(loadSingpassConfig({}), { enabled: false });
  });

  it("refuses the mock switch in production, even when Singpass is disabled", () => {
    assert.throws(() => loadSingpassConfig({ NODE_ENV: "production", SINGPASS_ALLOW_LOCAL_MOCK_ISSUER: "true" }), /never be set/);
  });

  it("refuses a non-Singpass issuer in production", () => {
    assert.throws(
      () => loadSingpassConfig({ ...base, NODE_ENV: "production", SINGPASS_ISSUER_URL: "http://localhost:9999/fapi" }),
      /only official Singpass issuers/
    );
  });

  it("refuses a local issuer without the explicit mock switch", () => {
    assert.throws(() => loadSingpassConfig({ ...base, SINGPASS_ISSUER_URL: "http://localhost:9999/fapi" }), /not an official/);
  });

  it("refuses a non-local mock issuer even with the switch", () => {
    assert.throws(
      () => loadSingpassConfig({ ...base, SINGPASS_ALLOW_LOCAL_MOCK_ISSUER: "true", SINGPASS_ISSUER_URL: "https://evil.example/fapi" }),
      /not an official/
    );
  });

  it("refuses LoA 1 (password only) against production Singpass", () => {
    assert.throws(
      () =>
        loadSingpassConfig({
          ...base,
          SINGPASS_ISSUER_URL: "https://id.singpass.gov.sg/fapi",
          SINGPASS_ACCEPTED_ACR: "urn:singpass:authentication:loa:1",
        }),
      /LoA 1/
    );
  });

  it("defaults to staging, accepts LoA 2/3 only against production", () => {
    assert.equal(loadSingpassConfig(base).issuerUrl, "https://stg-id.singpass.gov.sg/fapi");
    const prod = loadSingpassConfig({ ...base, NODE_ENV: "production", SINGPASS_ISSUER_URL: "https://id.singpass.gov.sg/fapi" });
    assert.deepEqual(prod.acceptedAcr, ["urn:singpass:authentication:loa:2", "urn:singpass:authentication:loa:3"]);
    assert.equal(prod.mock, false);
  });

  it("omits authentication_context_type for Myinfo apps when set to none", () => {
    assert.equal(loadSingpassConfig(base).authenticationContextType, "APP_AUTHENTICATION_DEFAULT");
    assert.equal(loadSingpassConfig({ ...base, SINGPASS_AUTH_CONTEXT_TYPE: "none" }).authenticationContextType, null);
  });

  it("requires https redirect in production and the private keys", () => {
    assert.throws(
      () => loadSingpassConfig({ ...base, NODE_ENV: "production", SINGPASS_REDIRECT_URI: "http://api.example.test/api/auth/singpass/callback" }),
      /https/
    );
    assert.throws(() => loadSingpassConfig({ ...base, SINGPASS_PRIVATE_JWKS: "" , SINGPASS_PRIVATE_JWKS_FILE: "" }), /PRIVATE_JWKS/);
    const publicOnly = JSON.stringify({ keys: JSON.parse(keys).keys.map(({ d, ...p }) => p) });
    assert.throws(() => loadSingpassConfig({ ...base, SINGPASS_PRIVATE_JWKS: publicOnly }), /signing key/);
  });

  it("the real server entry refuses to load with mock settings in production", () => {
    const run = (env) =>
      spawnSync(process.execPath, ["-e", "require('./src/routes/index')"], {
        cwd: SERVER_DIR,
        env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, ...env },
        encoding: "utf8",
        timeout: 30000,
      });
    const blocked = run({ NODE_ENV: "production", SINGPASS_ALLOW_LOCAL_MOCK_ISSUER: "true" });
    assert.notEqual(blocked.status, 0);
    assert.match(blocked.stderr, /SINGPASS_ALLOW_LOCAL_MOCK_ISSUER must never be set/);

    const disabled = run({ NODE_ENV: "production" });
    assert.equal(disabled.status, 0, disabled.stderr);
  });

  it("no application code loads the test-only mock", () => {
    const offenders = [];
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(p);
        else if (p.endsWith(".js") && /mockSingpass|memoryStore|[\\/]test[\\/]/.test(fs.readFileSync(p, "utf8"))) offenders.push(p);
      }
    };
    walk(path.join(SERVER_DIR, "src"));
    assert.deepEqual(offenders, []);
  });
});

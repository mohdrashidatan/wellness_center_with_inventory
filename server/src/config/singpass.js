// Singpass Login (FAPI 2.0) configuration.
//
// Everything is read from environment variables and validated once at startup.
// A misconfiguration throws, so the server refuses to start rather than running
// with a weakened login. Nothing here is used unless SINGPASS_ENABLED=true.
const fs = require("fs");
const path = require("path");

// Issuers published by Singpass. Production deployments may only use these.
// Verify against the Singpass Developer Portal before go-live.
const OFFICIAL_ISSUERS = {
  staging: "https://stg-id.singpass.gov.sg/fapi",
  production: "https://id.singpass.gov.sg/fapi",
};

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

// LoA 1 (password only) is issued by Singpass staging only.
const ACR_LOA1 = "urn:singpass:authentication:loa:1";
const ACR_LOA2 = "urn:singpass:authentication:loa:2";
const ACR_LOA3 = "urn:singpass:authentication:loa:3";

const SIG_ALGS = new Set(["ES256", "ES384", "ES512"]);
const ENC_ALGS = new Set(["ECDH-ES+A128KW", "ECDH-ES+A192KW", "ECDH-ES+A256KW"]);
const EC_CURVES = new Set(["P-256", "P-384", "P-521"]);

const fail = (message) => {
  throw new Error(`[singpass] Invalid configuration: ${message}`);
};

const list = (value) =>
  String(value || "")
    .split(/[,\s]+/)
    .map((v) => v.trim())
    .filter(Boolean);

const parseUrl = (value, name) => {
  try {
    return new URL(value);
  } catch {
    return fail(`${name} must be an absolute URL`);
  }
};

const readPrivateJwks = (env) => {
  let raw = env.SINGPASS_PRIVATE_JWKS;
  if (!raw) {
    const file = env.SINGPASS_PRIVATE_JWKS_FILE;
    if (!file) fail("set SINGPASS_PRIVATE_JWKS_FILE (path to the private JWKS) or SINGPASS_PRIVATE_JWKS");
    const resolved = path.resolve(__dirname, "../..", file);
    if (!fs.existsSync(resolved)) fail(`private JWKS file not found: ${resolved}`);
    raw = fs.readFileSync(resolved, "utf8");
  }

  let jwks;
  try {
    jwks = JSON.parse(raw);
  } catch {
    return fail("private JWKS is not valid JSON");
  }
  const keys = Array.isArray(jwks?.keys) ? jwks.keys : [];

  const isEc = (k) => k.kty === "EC" && EC_CURVES.has(k.crv) && k.d && k.kid;
  const sig = keys.filter((k) => isEc(k) && k.use === "sig" && SIG_ALGS.has(k.alg));
  const enc = keys.filter((k) => isEc(k) && k.use === "enc" && ENC_ALGS.has(k.alg));

  if (sig.length < 1) fail("private JWKS needs an EC signing key (use=sig, alg ES256/384/512, with kid and d)");
  if (enc.length < 1) fail("private JWKS needs an EC encryption key (use=enc, alg ECDH-ES+A*KW, with kid and d)");

  const kids = keys.map((k) => k.kid);
  if (new Set(kids).size !== kids.length) fail("every key in the JWKS must have a unique kid");

  // The first signing key signs client assertions; all encryption keys are
  // kept so ID tokens encrypted to an older key still decrypt during rotation.
  return { signingKey: sig[0], encryptionKeys: enc };
};

const toPublicJwk = ({ d, ...publicPart }) => publicPart;

/**
 * Load and validate the Singpass configuration.
 * @param {NodeJS.ProcessEnv} env
 * @returns {{enabled: false} | object}
 */
const loadSingpassConfig = (env = process.env) => {
  const isProduction = env.NODE_ENV === "production";
  const allowLocalMock = env.SINGPASS_ALLOW_LOCAL_MOCK_ISSUER === "true";

  // Checked before the enabled flag: a production environment carrying the mock
  // switch is a deployment mistake that should never pass silently.
  if (isProduction && allowLocalMock) {
    fail("SINGPASS_ALLOW_LOCAL_MOCK_ISSUER must never be set when NODE_ENV=production");
  }

  if (env.SINGPASS_ENABLED !== "true") {
    return { enabled: false };
  }

  const clientId = env.SINGPASS_CLIENT_ID || "";
  if (!/^[A-Za-z0-9]{32}$/.test(clientId)) {
    fail("SINGPASS_CLIENT_ID must be the 32-character client ID issued by Singpass");
  }

  const issuerUrl = (env.SINGPASS_ISSUER_URL || OFFICIAL_ISSUERS.staging).replace(/\/+$/, "");
  const issuer = parseUrl(issuerUrl, "SINGPASS_ISSUER_URL");
  const isOfficial = Object.values(OFFICIAL_ISSUERS).includes(issuerUrl);
  const isStaging = issuerUrl === OFFICIAL_ISSUERS.staging;

  let mock = false;
  if (!isOfficial) {
    if (isProduction) fail("only official Singpass issuers are allowed when NODE_ENV=production");
    if (!allowLocalMock || !LOCAL_HOSTS.has(issuer.hostname)) {
      fail(
        "SINGPASS_ISSUER_URL is not an official Singpass issuer. A local mock issuer is only accepted " +
          "on localhost with SINGPASS_ALLOW_LOCAL_MOCK_ISSUER=true outside production."
      );
    }
    mock = true;
  }

  const redirectUri = env.SINGPASS_REDIRECT_URI || "";
  const redirect = parseUrl(redirectUri, "SINGPASS_REDIRECT_URI");
  if (isProduction && redirect.protocol !== "https:") {
    fail("SINGPASS_REDIRECT_URI must use https when NODE_ENV=production");
  }
  if (!redirect.pathname.endsWith("/api/auth/singpass/callback")) {
    fail("SINGPASS_REDIRECT_URI must point at <api origin>/api/auth/singpass/callback");
  }

  const frontendUrl = (env.SINGPASS_FRONTEND_URL || list(env.FRONTEND_URL)[0] || "").replace(/\/+$/, "");
  const frontend = parseUrl(frontendUrl, "SINGPASS_FRONTEND_URL / FRONTEND_URL");
  if (isProduction && frontend.protocol !== "https:") {
    fail("SINGPASS_FRONTEND_URL must use https when NODE_ENV=production");
  }

  const scopes = list(env.SINGPASS_SCOPES || "openid");
  if (!scopes.includes("openid")) fail("SINGPASS_SCOPES must include openid");

  const allowedRoles = list(env.SINGPASS_ALLOWED_ROLES || "Therapist,Admin");
  if (allowedRoles.length === 0) fail("SINGPASS_ALLOWED_ROLES must list at least one role");

  const defaultAcr = isStaging || mock ? [ACR_LOA1, ACR_LOA2, ACR_LOA3] : [ACR_LOA2, ACR_LOA3];
  const acceptedAcr = env.SINGPASS_ACCEPTED_ACR ? list(env.SINGPASS_ACCEPTED_ACR) : defaultAcr;
  if (!isStaging && !mock && acceptedAcr.includes(ACR_LOA1)) {
    fail("LoA 1 (password only) is not acceptable outside Singpass staging");
  }

  const { signingKey, encryptionKeys } = readPrivateJwks(env);

  return Object.freeze({
    enabled: true,
    mock,
    environment: mock ? "mock" : isStaging ? "staging" : "production",
    issuerUrl,
    clientId,
    redirectUri,
    apiOrigin: redirect.origin,
    frontendUrl,
    scopes: scopes.join(" "),
    // Mandatory for Singpass Login apps, rejected for Myinfo apps: "none" omits it.
    authenticationContextType:
      env.SINGPASS_AUTH_CONTEXT_TYPE === "none" ? null : env.SINGPASS_AUTH_CONTEXT_TYPE || "APP_AUTHENTICATION_DEFAULT",
    allowedRoles,
    acceptedAcr,
    signingKey,
    encryptionKeys,
    publicJwks: { keys: [signingKey, ...encryptionKeys].map(toPublicJwk) },
    cookieSecure: redirect.protocol === "https:",
    txnTtlSeconds: 600, // Singpass gives users up to 10 minutes to authenticate
    handoffTtlSeconds: 60,
    linkTicketTtlSeconds: 60,
  });
};

module.exports = { loadSingpassConfig, OFFICIAL_ISSUERS, ACR_LOA1, ACR_LOA2, ACR_LOA3 };

// Thin wrapper around panva/openid-client, following the official Singpass demo
// (https://github.com/singpass/demo-app, examples/nodejs/src/router.ts):
// PAR + PKCE (S256) + DPoP + private_key_jwt + JWE-encrypted ID token.
//
// Two hardening steps on top of the demo:
//   - the client assertion carries typ=JWT, as the Singpass spec requires;
//   - enableNonRepudiationChecks() verifies the ID token signature against the
//     Singpass JWKS (openid-client otherwise relies on TLS alone).
const { webcrypto } = require("crypto");
const oidc = require("openid-client");

const { subtle } = webcrypto;
const REFRESH_MS = 60 * 60 * 1000; // re-read Singpass discovery hourly, as the demo recommends
const DPOP_KEY_PARAMS = { name: "ECDSA", namedCurve: "P-256" };

const CURVE_TO_ES = { "P-256": "ES256", "P-384": "ES384", "P-521": "ES512" };

const importSigningKey = async (jwk) => ({
  kid: jwk.kid,
  alg: jwk.alg,
  key: await subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: jwk.crv }, false, ["sign"]),
});

const importDecryptionKey = async (jwk) => ({
  kid: jwk.kid,
  alg: jwk.alg,
  key: await subtle.importKey("jwk", jwk, { name: "ECDH", namedCurve: jwk.crv }, false, ["deriveBits", "deriveKey"]),
});

const createSingpassOidcClient = (cfg) => {
  let current = null;
  let loadedAt = 0;
  let pending = null;

  const init = async () => {
    if (CURVE_TO_ES[cfg.signingKey.crv] !== cfg.signingKey.alg) {
      throw new Error("[singpass] signing key alg does not match its curve");
    }
    const signingKey = await importSigningKey(cfg.signingKey);
    const decryptionKeys = await Promise.all(cfg.encryptionKeys.map(importDecryptionKey));

    const clientAuth = oidc.PrivateKeyJwt(signingKey, {
      [oidc.modifyAssertion]: (header) => {
        header.typ = "JWT";
      },
    });

    const config = await oidc.discovery(
      new URL(cfg.issuerUrl),
      cfg.clientId,
      undefined,
      clientAuth,
      // Plain-http issuers are only reachable in local mock mode (enforced in config/singpass.js).
      cfg.mock ? { execute: [oidc.allowInsecureRequests] } : undefined
    );

    oidc.enableDecryptingResponses(config, ["A256GCM", "A256CBC-HS512"], ...decryptionKeys);
    oidc.enableNonRepudiationChecks(config);
    return config;
  };

  const getConfig = async () => {
    const stale = Date.now() - loadedAt > REFRESH_MS;
    if (current && !stale) return current;

    if (!pending) {
      pending = init()
        .then((config) => {
          current = config;
          loadedAt = Date.now();
          return config;
        })
        .finally(() => {
          pending = null;
        });
    }
    if (!current) return pending;

    // Background refresh; keep serving the previous config if it fails.
    pending.catch((err) => console.error("[singpass] discovery refresh failed:", err.message));
    return current;
  };

  // DPoP keys are ephemeral (one per login) and stored with the server-side
  // login transaction so the same key is used for PAR and the token request.
  const newDpopKeyPair = async () => {
    const kp = await oidc.randomDPoPKeyPair("ES256", { extractable: true });
    return {
      privateKey: await subtle.exportKey("jwk", kp.privateKey),
      publicKey: await subtle.exportKey("jwk", kp.publicKey),
    };
  };

  const dpopOptions = async (config, { privateKey, publicKey }) => ({
    DPoP: oidc.getDPoPHandle(
      config,
      {
        privateKey: await subtle.importKey("jwk", privateKey, DPOP_KEY_PARAMS, false, ["sign"]),
        publicKey: await subtle.importKey("jwk", publicKey, DPOP_KEY_PARAMS, true, ["verify"]),
      },
      {
        [oidc.modifyAssertion]: (_header, payload) => {
          // Singpass accepts DPoP proofs valid for at most 2 minutes.
          if (typeof payload.iat === "number") payload.exp = payload.iat + 120;
        },
      }
    ),
  });

  /** Push the authorization request (PAR) and return the Singpass URL to redirect to. */
  const buildAuthorizationUrl = async ({ state, nonce, codeVerifier, dpopKeyPair }) => {
    const config = await getConfig();
    const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);
    const url = await oidc.buildAuthorizationUrlWithPAR(
      config,
      {
        response_type: "code",
        redirect_uri: cfg.redirectUri,
        scope: cfg.scopes,
        code_challenge_method: "S256",
        code_challenge: codeChallenge,
        nonce,
        state,
        ...(cfg.authenticationContextType && { authentication_context_type: cfg.authenticationContextType }),
      },
      await dpopOptions(config, dpopKeyPair)
    );
    return url.href;
  };

  /**
   * Validate the redirect (iss, state, error), exchange the code with PKCE + DPoP,
   * decrypt and validate the ID token (signature, iss, aud, exp, iat, nonce).
   * @param {URLSearchParams} params query parameters received on the callback
   */
  const exchangeCode = async (params, { state, nonce, codeVerifier, dpopKeyPair }) => {
    const config = await getConfig();
    // Rebuild the URL from the configured redirect URI instead of trusting Host headers.
    const currentUrl = new URL(cfg.redirectUri);
    currentUrl.search = params.toString();

    const tokens = await oidc.authorizationCodeGrant(
      config,
      currentUrl,
      {
        pkceCodeVerifier: codeVerifier,
        expectedNonce: nonce,
        expectedState: state,
        idTokenExpected: true,
      },
      undefined,
      await dpopOptions(config, dpopKeyPair)
    );
    const claims = tokens.claims();
    if (!claims) throw new Error("ID token claims are missing");
    return { claims, issuer: config.serverMetadata().issuer };
  };

  return {
    getConfig,
    newDpopKeyPair,
    buildAuthorizationUrl,
    exchangeCode,
    randomState: oidc.randomState,
    randomNonce: oidc.randomNonce,
    randomPKCECodeVerifier: oidc.randomPKCECodeVerifier,
    AuthorizationResponseError: oidc.AuthorizationResponseError,
  };
};

module.exports = { createSingpassOidcClient };

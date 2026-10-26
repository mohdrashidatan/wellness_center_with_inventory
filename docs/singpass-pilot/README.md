# Login with Singpass — pilot

Status as of 2026-10-17, on branch `singpass-pilot` (based on `aea526d`):

| Area | Status |
|---|---|
| Code (Express backend + React client) | Done |
| Automated tests against a local mock Singpass | **48 / 48 passing** |
| Database tables | Created on the dev database `primeapp_pwgnew` @ 192.168.0.143 (additive only) |
| Singpass **staging** end-to-end | **Not yet run.** Needs Developer Portal access, a staging app and test accounts (see [Staging tests](#5c-staging-tests-pending)) |
| Production / live system | **Not modified, not deployed** |

Password login is unchanged. Singpass is an additional option. It is off unless `SINGPASS_ENABLED=true` on the server and `VITE_SINGPASS_ENABLED=true` in the client build.

---

## 1. How it works

The implementation follows the official Singpass FAPI 2.0 docs and the official demo ([singpass/demo-app](https://github.com/singpass/demo-app), Node.js example, commit `7d3367a`). It uses the same library (`openid-client` v6) and the same flow, with two additional checks (see [Security properties](#6-security-properties)).

```
Browser                 Express API (/api/auth/singpass)              Singpass (FAPI 2.0)
   │ click "Login with Singpass"  │                                             │
   ├── GET /login ───────────────►│ new state, nonce, PKCE verifier, DPoP key   │
   │                              │ saved server-side (oidc_auth_txn, 10 min)   │
   │                              ├── PAR (private_key_jwt + DPoP) ────────────►│
   │◄── 302 + HttpOnly txn cookie ┤◄── request_uri ─────────────────────────────┤
   ├──────────────── user authenticates at Singpass ───────────────────────────►│
   │◄─────────────────────────── 302 /callback?code&state&iss ──────────────────┤
   ├── GET /callback (cookie) ───►│ claim txn (single use) → check iss, state   │
   │                              ├── token request (PKCE + DPoP + assertion) ─►│
   │                              │◄── JWE(JWS) ID token ───────────────────────┤
   │                              │ decrypt; verify signature, iss, aud, exp,   │
   │                              │ nonce, sub_type, acr                        │
   │                              │ look up (issuer, sub) in user_external_identity
   │◄── 302 /auth/singpass/complete#code=<60 s single-use code>                 │
   ├── POST /exchange {code} ────►│ re-check link + user active + role          │
   │◄── { token } (same JWT as password login) ┤                                │
```

- **Identity:** a user is identified only by the validated `(iss, sub)` pair. Only `openid` is requested, so no NRIC, name or email is ever received.
- **Linking:** linking is self-service. A Therapist or Admin who is logged in with their password opens **Profile → Link Singpass account** and logs in to Singpass once; that `(iss, sub)` is then stored against their account. Admins can see and revoke links under **Setup → Users → Singpass links**. Nothing is ever matched by email or name.
- **Unknown Singpass users:** they get the message "not linked to an inventory user" and no token. Each attempt is audited.
- **Roles and permissions:** the app JWT is built by `buildAuthToken()`, the same function password login uses. Roles, claims and permissions are therefore identical to password login, and this is tested.

## 2. What changed

**Server** (`server/`)

| File | Purpose |
|---|---|
| `src/config/singpass.js` | Reads and validates environment variables; refuses unsafe configurations at startup |
| `src/services/singpassOidcClient.js` | `openid-client` wrapper: discovery, PAR, PKCE, DPoP, `private_key_jwt`, JWE decryption, signature check |
| `src/services/singpassService.js` | Login, link, callback, hand-off, revoke and audit logic |
| `src/models/singpassModel.js` | MySQL access for the four new tables |
| `src/controllers/singpassController.js`, `src/routes/singpassRoutes.js` | HTTP layer |
| `src/routes/index.js` | Mounts `/api/auth/singpass` only when enabled |
| `src/services/authService.js` | Token creation moved into `buildAuthToken()`; password login behaviour unchanged |
| `src/routes/authRoutes.js` | Optional `DISABLE_PUBLIC_SIGNUP=true` guard (default off) |
| `migrations/run_add_singpass_tables.js`, `run_drop_singpass_tables.js` | Create and drop the four tables |
| `scripts/singpass-generate-keys.js` | Generates signing and encryption keys; prints the public JWKS |
| `test/singpass/*` | Mock Singpass server, in-memory store, test suite, interactive mock runner (test-only code) |
| `package.json` | Adds `openid-client` (runtime) and `jose` (dev only); scripts `test`, `pilot`, `singpass:keys`, `singpass:mock` |

**Client** (`client/`)

| File | Purpose |
|---|---|
| `src/pages/LoginPage.jsx` | "Login with Singpass" button below the existing form |
| `src/pages/SingpassCompletePage.jsx` | `/auth/singpass/complete`: exchanges the hand-off code, or shows a fixed error message |
| `src/pages/ProfilePage.jsx` | Shows link status, with Link and Unlink actions |
| `src/components/singpass/SingpassLinksPanel.jsx` | Admin list of links with Revoke, on the Users page |
| `src/context/AuthContext.jsx` | Adds `loginWithToken()`; the role-based redirect is shared with password login |
| `src/components/Navbar.jsx` | Adds a Profile entry to the desktop avatar menu |
| `src/services/singpassService.js`, `src/router/routes.jsx` | API calls and the route |

## 3. Database changes

The changes are additive only. **No existing table or column is altered.** They were applied to the dev database on 2026-10-17 with:

```bash
cd server
node migrations/run_add_singpass_tables.js --confirm=<DB_HOST>/<DB_NAME>
```

The `--confirm` value must equal `DB_HOST/DB_NAME` from `server/.env`. This is a deliberate check against running on the wrong database. The script also refuses to run when `NODE_ENV=production`.

| Table | Contents | Notes |
|---|---|---|
| `user_external_identity` | Singpass `(provider, issuer, subject)` → `userac.useracid`, with linked and revoked metadata | Foreign key to `userac`. Unique while active on both (issuer, subject) and the user. Revoking sets `is_active = NULL`, which frees the unique keys for a later re-link and keeps the history. Collation is `utf8mb4_bin` because `sub` is case-sensitive. |
| `oidc_auth_txn` | Per-login state, nonce, PKCE verifier and ephemeral DPoP key | Valid for 10 minutes and single use. Sensitive columns are cleared when the row is used. Rows older than a day are purged. |
| `auth_one_time_code` | Hashed (SHA-256) login hand-off codes and link tickets | Valid for 60 seconds, single use, and bound to a purpose. |
| `auth_audit_log` | Login, link, rejection and revocation events | Stores `sub` (an opaque Singpass UUID), but never tokens or personal data. |

**Rollback** removes all Singpass links and audit history; `userac` is untouched:

```bash
node migrations/run_drop_singpass_tables.js --confirm=<DB_HOST>/<DB_NAME>
```

## 4. Setup

### 4a. Local, with the mock Singpass (no credentials needed)

1. Create the tables (section 3) in your dev database.
2. Terminal 1 (from `server/`): `npm run singpass:mock`. This starts a mock Singpass on `http://localhost:5199/fapi`, generates throwaway keys in `server/secrets/singpass-mock/` (git-ignored), and prints the environment variables to use.
3. Create `server/.env.pilot` (git-ignored) with the printed variables, plus `SINGPASS_FRONTEND_URL=http://localhost:5174`, `FRONTEND_URL=http://localhost:5174` and `DISABLE_PUBLIC_SIGNUP=true`.
4. Terminal 2 (from `server/`): `npm run pilot`. This starts the API on port 5100, loading `.env.pilot` first and then `.env`.
5. Terminal 3 (from `client/`): `VITE_API_URL=http://localhost:5100 VITE_SINGPASS_ENABLED=true npx vite --port 5174`.
6. Log in with a password as a Therapist or Admin, go to **Profile → Link Singpass account**, and pick a fictional subject on the red "MOCK Singpass" page. Then log out and use **Login with Singpass**.

The mock page is plainly labelled "MOCK". The server only accepts it when the issuer is on `localhost`, `SINGPASS_ALLOW_LOCAL_MOCK_ISSUER=true` is set, and `NODE_ENV` is not `production`.

### 4b. Singpass staging

1. Get Developer Portal access (section 4c), then create the staging app and test accounts.
2. Generate keys from `server/` with `npm run singpass:keys`. This writes `server/secrets/singpass/private-jwks.json`, which is git-ignored and must never be shared, and prints the **public** JWKS to paste into the portal. It refuses to overwrite existing keys or to write private keys anywhere git would track them.
3. Create `server/.env.pilot`:
   ```
   PORT=5100
   SINGPASS_ENABLED=true
   SINGPASS_ISSUER_URL=https://stg-id.singpass.gov.sg/fapi
   SINGPASS_CLIENT_ID=<32-char client ID from the portal>
   SINGPASS_REDIRECT_URI=http://localhost:5100/api/auth/singpass/callback
   SINGPASS_FRONTEND_URL=http://localhost:5174
   FRONTEND_URL=http://localhost:5174
   SINGPASS_PRIVATE_JWKS_FILE=secrets/singpass/private-jwks.json
   DISABLE_PUBLIC_SIGNUP=true
   ```
4. Run the API and client as in 4a, steps 4–5, then work through section 5.

### 4c. Singpass Developer Portal configuration

1. **Access.** Portal access is granted through Corppass. Your organisation's Corppass Admin (look them up by UEN at corppass.gov.sg → Find your Corppass Admin) must give your Singpass account access to the Singpass Developer Portal.
2. **Create the app.** At [developer.singpass.gov.sg](https://developer.singpass.gov.sg), switch the dashboard to **Staging**, choose **+ New App → Singpass Login**, and set:
   - **App name:** for example "PWG Inventory (pilot)"
   - **Redirect URL:** exactly `http://localhost:5100/api/auth/singpass/callback`. Singpass's own demo registers a `localhost` redirect for staging. Redirect URLs may not use an IP address. If the portal rejects `http://localhost`, use an https tunnel or hostname and update `SINGPASS_REDIRECT_URI` to match.
   - **JWKS:** register the public JWKS **as JSON** (static). A hosted JWKS URL must be publicly reachable and answer within 3 seconds, which a local pilot can't do. The API also serves the public keys at `/api/auth/singpass/jwks` for later hosted use.
   - **Scopes:** **openid only**. Leave Principal Name, User Identity, Email and Mobile **unticked**; the pilot needs none of them.
3. **Test accounts.** Create staging test accounts under the app's **Test Accounts** page (up to 5; reveal the password with the eye icon). The official demo also points to the [Myinfo test personas](https://docs.developer.singpass.gov.sg/docs/testing/myinfo-test-personas). Choose "password login" on the staging login page.
4. **Copy the client ID** into `SINGPASS_CLIENT_ID`.

Do **not** reuse the client ID or keys from `singpass/demo-app`. Its private keys are public on GitHub.

### Configuration reference

| Variable | Default | Notes |
|---|---|---|
| `SINGPASS_ENABLED` | off | Must be exactly `true` |
| `SINGPASS_ISSUER_URL` | staging issuer | Must be `https://stg-id.singpass.gov.sg/fapi` or `https://id.singpass.gov.sg/fapi`, unless the local mock is in use. Confirm the production issuer in the portal before go-live. |
| `SINGPASS_CLIENT_ID` | — | 32 alphanumeric characters |
| `SINGPASS_REDIRECT_URI` | — | Must end in `/api/auth/singpass/callback`; https is required in production |
| `SINGPASS_FRONTEND_URL` | first `FRONTEND_URL` | Where the browser lands after Singpass |
| `SINGPASS_PRIVATE_JWKS_FILE` / `SINGPASS_PRIVATE_JWKS` | — | Path relative to `server/`, or the JSON itself. Needs one `sig` key (ES256/384/512) and at least one `enc` key (`ECDH-ES+A*KW`). |
| `SINGPASS_SCOPES` | `openid` | Must include `openid` |
| `SINGPASS_ALLOWED_ROLES` | `Therapist,Admin` | Roles that may link and use Singpass |
| `SINGPASS_ACCEPTED_ACR` | staging: LoA 1–3; production: LoA 2–3 | LoA 1 (password only) is refused against production |
| `SINGPASS_AUTH_CONTEXT_TYPE` | `APP_AUTHENTICATION_DEFAULT` | Mandatory for **Singpass Login** apps. **Myinfo** apps reject it (`invalid_request`: "can only be provided for Login apps"), so set `none` to omit it. |
| `SINGPASS_ALLOW_LOCAL_MOCK_ISSUER` | unset | Local development only. **The server refuses to start if it is set with `NODE_ENV=production`, even when Singpass is disabled.** |
| `DISABLE_PUBLIC_SIGNUP` | off | Blocks `POST /api/auth/signup` (see section 7) |
| `VITE_SINGPASS_ENABLED` (client) | off | Shows the button and Profile card |

## 5. Test results

### 5a. Local, automated, with mocks: 48 / 48 pass

Run from `server/` with `npm test`. Last run: 2026-10-17, Node 22.21.1, `openid-client` 6.8.8.

The suite drives real redirects: app → mock Singpass → app callback → hand-off exchange. It runs the real `openid-client` validation path. The mock Singpass enforces the rules the real one applies to us:
- client assertion: `typ`, `aud`, lifetime of 120 seconds or less, single-use `jti`
- DPoP: `typ`, `htm`, `htu`, `iat`, single-use `jti`, and the key from PAR must match the key used at the token endpoint
- PKCE S256, registered redirect URIs and single-use codes
- `ECDH-ES+A256KW` / `A256CBC-HS512` encryption over an ES256-signed ID token.

| Requirement | Tests (all pass) |
|---|---|
| **Successful login** | Linked Therapist logs in; the JWT claims are **identical** to password login (role, userId, email, therapistId); the token works on existing protected routes. Admin also gets claims identical to Admin password login. PAR uses `scope=openid`, S256, `APP_AUTHENTICATION_DEFAULT`. |
| **Account linking** | Linking requires a password session and a single-use ticket. Customers can't link. A Singpass identity already linked to user A can't be linked to user B. A user can't hold two links. **An email in Singpass claims that matches an existing user still gives `not_linked`.** |
| **Cancellation** | Cancel at Singpass gives `cancelled`, and the provider's text (including an injected `<script>`) is never shown. `server_error` gives `provider_error`. Cancelling a link attempt returns to Profile. |
| **Expiry** | Login transaction older than 10 minutes; hand-off code older than 60 seconds; link ticket older than 60 seconds; expired ID token `exp`. |
| **Replay rejection** | Replayed callback (same cookie and code); stolen callback URL without the browser's cookie; callback paired with another browser's cookie (state mismatch); hand-off code reused; link ticket reused. |
| **Unauthorised access** | Unknown Singpass user gets no token, and `/api/products` returns 401. A forged ticket and a forged hand-off code are rejected. Non-admins can't list or revoke links. A revoked link is blocked, including a revoke **between** callback and exchange. A deactivated user is blocked. |
| **Token and response validation** | Rejects: wrong `aud`; wrong `nonce`; wrong `iss` claim; **signature by a key not in Singpass's JWKS**; tampered `state`; foreign `iss` in the redirect; missing `iss`; unexpected `sub_type`; `acr` not accepted. |
| **Mock never in production** | The real `src/routes/index.js` exits non-zero with `NODE_ENV=production` plus the mock switch. Non-Singpass and non-local issuers are refused. LoA 1 is refused against production. http redirects are refused in production. No file in `src/` references the test mock. |
| **Secrets** | The JWKS endpoint serves no private (`d`) values. The key script refuses to overwrite keys or write them to a path git would track. |

Each rejection was checked against the library's own error, so it fails for the intended reason. For example, the rogue-key case fails with "JWT signature verification failed". With `enableNonRepudiationChecks()` disabled, that case is **accepted**, which shows that check is necessary.

### 5b. Local, against the real code and dev database (manual, 2026-10-17)

- **MySQL model** (temporary script; it deleted every row it wrote):
  - a transaction is single use and its secrets are wiped after use
  - three concurrent claims gave exactly one `ok` and two `consumed`
  - replayed, not-found and expired cases are each reported correctly
  - a code for one purpose can't be used for the other, and each code is single use
  - identity links are unique while active, `sub` matching is case-sensitive, and re-linking works after a revoke.
- **Real `index.js` on port 5100 with the mock issuer:**
  - startup logs `Login with Singpass enabled (mock …)`
  - login gives a 302 to Singpass with an `HttpOnly` cookie
  - the callback for an unknown `sub` gives `#error=not_linked`
  - replaying that callback gives `#error=replay`
  - `/api/products` without a token returns 401, and the password login route still responds.
  - The audit rows were checked, then deleted.
- **Singpass staging discovery** (public, no credentials):
  - our real client initialises against `https://stg-id.singpass.gov.sg/fapi`
  - the metadata matches our assumptions: issuer string, `authorization_response_iss_parameter_supported: true`, `private_key_jwt` with ES256, ID token ES256 / `ECDH-ES+A256KW` / `A256CBC-HS512`, DPoP ES256
  - the JWKS is at `https://stg-id.singpass.gov.sg/.well-known/keys`.

### 5c. Staging tests (pending)

These need a staging app, keys registered in the portal and staging test accounts. Record the date, tester and result for each.

| # | Test | Steps | Expected | Result |
|---|---|---|---|---|
| S1 | Request accepted | Click **Login with Singpass** | Singpass staging login page opens (PAR, client assertion and DPoP accepted) | ✅ 2026-10-17 (server side). Staging **Singpass Login** app `0BsGQBBUej1AYItpOTvwRlo0IlUcyGxi`, with default `authentication_context_type`; PAR returned 302 to `stg-id.singpass.gov.sg/fapi/auth`. An earlier Myinfo v5 app rejected `authentication_context_type`, so it was replaced. Browser login page not yet checked. |
| S2 | Unknown user | Log in with test account A (not linked) | "not linked to an inventory user"; no token; audit `identity_not_linked` | ☐ |
| S3 | Link | Password-login as a Therapist → Profile → Link → log in with A | "Singpass account linked"; row in `user_external_identity` | ☐ |
| S4 | Successful login | Log out → Login with Singpass → A | Lands on `/therapist` with the same menus and permissions as password login | ☐ |
| S5 | Admin | Repeat S3–S4 with an Admin and test account B | Admin keeps the Users page and the Singpass links panel | ☐ |
| S6 | Cancellation | Login with Singpass → cancel on Singpass | "Singpass login was cancelled." **Confirm Singpass's actual `error` value** (expected `access_denied`). Any other value shows the generic provider error. | ☐ |
| S7 | Expiry | Start a login and wait more than 10 minutes before finishing | "took too long" (from Singpass's timeout or ours) | ☐ |
| S8 | Replay | After S4, reload the `/api/auth/singpass/callback?...` URL from browser history | "already been used" | ☐ |
| S9 | Conflict | Link test account A to a second user | "already linked to another user" | ☐ |
| S10 | Revoke | Admin revokes A → log in with A | "not linked" | ☐ |
| S11 | Deactivated | Deactivate the S3 user → log in with A | "not permitted" | ☐ |
| S12 | Claims | Check the audit log for S4 | `acr` and `amr` accepted; real encryption algorithm works | ☐ |

## 6. Security properties

- **Server-side only:** authentication and every token check run on Express. The browser never sees Singpass tokens, only a 60-second single-use code it trades for the app JWT. That code travels in the URL fragment, so it doesn't reach server logs or the Referer header.
- **Follows Singpass FAPI 2.0:**
  - pushed authorization requests (PAR)
  - PKCE S256
  - a fresh DPoP key for each login, with proofs that expire after 120 seconds
  - `private_key_jwt` client assertions (single use, about 60-second lifetime)
  - encrypted ID tokens
  - an hourly refresh of Singpass's configuration.
- **Beyond the official demo:**
  1. The client assertion header sets `typ: "JWT"`, as the Singpass spec requires. The library doesn't add it.
  2. `enableNonRepudiationChecks()` verifies the ID token's signature against Singpass's published keys, as Singpass's docs say to. The library otherwise relies on TLS alone.
  3. The callback requires the `iss` parameter. The library only checks it when it is present.
- **Transaction cookie:** `HttpOnly`, `SameSite=Lax`, scoped to `/api/auth/singpass`, and `Secure` when the redirect URI is https.
- **Responses:** `Cache-Control: no-store`. The start and exchange endpoints are rate-limited.
- **Admin checks:** Admin rights for link management are read from the database, because the JWT labels Admins as `Therapist`.
- **Private keys:** private keys stay in `server/secrets/` or an environment variable. `.gitignore` covers `server/secrets/`, `server/.env.*` and `*private-jwks*.json`.

## 7. Existing issues found (not caused by Singpass, not changed)

These affect the "no automatic inventory access" goal through **password** login. They are recorded here for a separate decision.

1. **Open signup creates Therapists.** `POST /api/auth/signup` has no validation, and `userModel.createUser` inserts `role = 'Therapist'`, so anyone can self-register with inventory access. Mitigation in the pilot: `DISABLE_PUBLIC_SIGNUP=true` (opt-in, so production behaviour is unchanged).
2. **Deactivated users can still log in with a password.** `authService.loginUser` never checks `userac.active`. Singpass login does check it.
3. **No role checks on API routes.** Every route only calls `authenticateToken`, so a Customer token can call inventory APIs.
4. **Admins are labelled Therapist in the JWT.** `buildAuthToken` maps every non-Customer to `role: "Therapist"`. This is preserved deliberately.
5. **Customer branch bug.** `buildAuthToken`'s Customer branch calls `Customer.initiate(user.id)`, but `user.id` is undefined (the column is `useracid`). This is unchanged; Singpass doesn't use the Customer branch.
6. **Token storage.** The app JWT is stored in a JavaScript-readable cookie (`js-cookie`), not an HttpOnly cookie as the CLAUDE.md says. This is unchanged and applies to both login methods.
7. **Shared database tool access.** `server/.env` and the MySQL tool used for development both point at `primeapp_pwgnew` with insert, update, delete and schema rights.

## 8. Open items before any production use

- [ ] Complete the staging tests S1–S12 and record the results above.
- [ ] Confirm the production issuer (`https://id.singpass.gov.sg/fapi`) and the cancellation error code in the portal and docs.
- [ ] Production app: create it in the portal with an https redirect URL (for example `https://api.tcplsys.primeapps.sg/api/auth/singpass/callback`), new keys (never the staging keys), and the private JWKS supplied through a secret environment variable or a file outside the web root.
- [ ] Production tables: review the SQL in `run_add_singpass_tables.js` and apply it deliberately (the script itself refuses `NODE_ENV=production`).
- [ ] Key rotation, at least yearly:
  - **Signing key:** add the new public key, wait one hour, switch to signing with it, then remove the old key.
  - **Encryption key:** keep the old private key loaded (the server accepts several `enc` keys), publish the new one, wait one hour, then remove the old one.
- [ ] Decide on the existing issues in section 7, especially numbers 1–3.
- [ ] The rate limiter and the hourly discovery refresh are per process. That's fine on a single Passenger instance; revisit for multiple instances.
- [ ] Singpass requires all Login apps to use FAPI 2.0 by 31 Dec 2026; this pilot already does.

## References

- Official demo: https://github.com/singpass/demo-app
- FAPI 2.0 changelog: https://docs.developer.singpass.gov.sg/docs/upcoming-changes/fapi-2.0-authentication-api/changelog
- Integration guide (authorization request, redirect handling, ID token parsing): https://docs.developer.singpass.gov.sg/docs/technical-specifications/integration-guide.md
- JWKS requirements: https://docs.developer.singpass.gov.sg/docs/technical-specifications/technical-concepts/json-web-key-sets-jwks.md
- Client assertion: https://docs.developer.singpass.gov.sg/docs/technical-specifications/technical-concepts/generation-of-client-assertion.md
- Portal: create a staging app, create test accounts, get access: https://docs.developer.singpass.gov.sg/docs/singpass-developer-portal-sdp/

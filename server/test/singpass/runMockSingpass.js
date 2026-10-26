// DEV/TEST ONLY: run the mock Singpass server for clicking through the UI locally.
//
//   node test/singpass/runMockSingpass.js
//
// Generates throwaway keys under server/secrets/singpass-mock/ (git-ignored) and
// prints the env vars to start the API against it. Refuses to run in production.
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { createMockSingpass } = require("./mockSingpass");

if (process.env.NODE_ENV === "production") {
  console.error("✗  The mock Singpass server must never run with NODE_ENV=production.");
  process.exit(1);
}

const MOCK_PORT = Number(process.env.MOCK_SINGPASS_PORT || 5199);
const API = process.env.MOCK_API_ORIGIN || "http://localhost:5100";
const CLIENT_ID = "LocalMockClient00000000000000000";
const dir = path.join(__dirname, "../../secrets/singpass-mock");
const keyFile = path.join(dir, "private-jwks.json");

const mk = (use, alg) => ({
  ...crypto.generateKeyPairSync("ec", { namedCurve: "P-256" }).privateKey.export({ format: "jwk" }),
  use,
  alg,
  kid: `mock-${use}-${crypto.randomBytes(3).toString("hex")}`,
});

fs.mkdirSync(dir, { recursive: true });
if (!fs.existsSync(keyFile)) {
  fs.writeFileSync(keyFile, JSON.stringify({ keys: [mk("sig", "ES256"), mk("enc", "ECDH-ES+A256KW")] }, null, 2), { mode: 0o600 });
}
const privateJwks = JSON.parse(fs.readFileSync(keyFile, "utf8"));

createMockSingpass({
  clientId: CLIENT_ID,
  clientPublicJwks: { keys: privateJwks.keys.map(({ d, ...pub }) => pub) },
  redirectUris: [`${API}/api/auth/singpass/callback`],
  interactive: true,
  port: MOCK_PORT,
}).then((mock) => {
  console.log(`MOCK Singpass running at ${mock.issuer}\n`);
  console.log("Start the API (from server/) with these extra env vars, e.g. in server/.env.pilot:\n");
  console.log(`PORT=${new URL(API).port}`);
  console.log("SINGPASS_ENABLED=true");
  console.log("SINGPASS_ALLOW_LOCAL_MOCK_ISSUER=true");
  console.log(`SINGPASS_ISSUER_URL=${mock.issuer}`);
  console.log(`SINGPASS_CLIENT_ID=${CLIENT_ID}`);
  console.log(`SINGPASS_REDIRECT_URI=${API}/api/auth/singpass/callback`);
  console.log("SINGPASS_PRIVATE_JWKS_FILE=secrets/singpass-mock/private-jwks.json");
});

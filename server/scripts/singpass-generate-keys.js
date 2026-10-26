/**
 * Generate the Singpass client key pair set (one signing key, one encryption key).
 *
 *   node server/scripts/singpass-generate-keys.js [output-dir]
 *
 * Writes (default dir: server/secrets/singpass, which is git-ignored):
 *   private-jwks.json  KEEP SECRET. Point SINGPASS_PRIVATE_JWKS_FILE at it.
 *   public-jwks.json   Paste into the Singpass Developer Portal (static JWKS).
 *
 * Existing files are never overwritten; rotate by adding new keys, see docs/singpass-pilot/README.md.
 */
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const outDir = path.resolve(process.argv[2] || path.join(__dirname, "../secrets/singpass"));
const privatePath = path.join(outDir, "private-jwks.json");
const publicPath = path.join(outDir, "public-jwks.json");

for (const file of [privatePath, publicPath]) {
  if (fs.existsSync(file)) {
    console.error(`✗  ${file} already exists. Refusing to overwrite keys.`);
    process.exit(1);
  }
}

// Refuse to write private keys anywhere git would track them.
const repoRoot = path.resolve(__dirname, "../..");
if (outDir.startsWith(repoRoot)) {
  try {
    fs.mkdirSync(outDir, { recursive: true });
    execFileSync("git", ["-C", repoRoot, "check-ignore", "-q", privatePath], { stdio: "ignore" });
  } catch {
    console.error(`✗  ${privatePath} is not git-ignored. Add it to .gitignore or choose a directory outside the repo.`);
    process.exit(1);
  }
}

const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
const suffix = crypto.randomBytes(3).toString("hex");

const makeKey = (use, alg) => {
  const { privateKey } = crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });
  return { ...privateKey.export({ format: "jwk" }), use, alg, kid: `pwg-${use}-${stamp}-${suffix}` };
};

const sig = makeKey("sig", "ES256");
const enc = makeKey("enc", "ECDH-ES+A256KW");
const publicJwks = { keys: [sig, enc].map(({ d, ...pub }) => pub) };

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(privatePath, JSON.stringify({ keys: [sig, enc] }, null, 2) + "\n", { mode: 0o600 });
fs.writeFileSync(publicPath, JSON.stringify(publicJwks, null, 2) + "\n");

console.log(`✓  Private JWKS: ${privatePath}  (secret; never commit or share)`);
console.log(`✓  Public JWKS:  ${publicPath}`);
console.log("\nPublic JWKS to register in the Singpass Developer Portal:\n");
console.log(JSON.stringify(publicJwks, null, 2));

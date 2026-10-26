/**
 * Singpass Login pilot rollback: drop the four tables created by
 * run_add_singpass_tables.js. Removes all Singpass links and audit history.
 * Existing tables (userac etc.) are not touched.
 *
 *   node server/migrations/run_drop_singpass_tables.js --confirm=<DB_HOST>/<DB_NAME>
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mysql = require("mysql2/promise");

const target = `${process.env.DB_HOST}/${process.env.DB_NAME}`;
const confirm = (process.argv.find((a) => a.startsWith("--confirm=")) || "").slice("--confirm=".length);

if (process.env.NODE_ENV === "production") {
  console.error("✗  Refusing to run with NODE_ENV=production (pilot rollback).");
  process.exit(1);
}
if (confirm !== target) {
  console.error(`✗  Pass --confirm=${target} to confirm the target database.`);
  process.exit(1);
}

const tables = ["auth_one_time_code", "oidc_auth_txn", "auth_audit_log", "user_external_identity"];

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  for (const table of tables) {
    await conn.query(`DROP TABLE IF EXISTS \`${table}\``);
    console.log(`✓  Dropped ${table} (if it existed)`);
  }

  await conn.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

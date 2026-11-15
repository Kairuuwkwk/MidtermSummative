// create-admin.js — creates (or resets) an administrator account in PostgreSQL.
// Usage:  node create-admin.js <username> <password> [display name]
require('dotenv').config();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const username = (process.argv[2] || '').trim().toLowerCase();
const password = process.argv[3] || '';
const displayName = (process.argv[4] || 'Administrator').trim();

if (!username || !password) {
  console.log('Usage: node create-admin.js <username> <password> [display name]');
  process.exit(1);
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

(async () => {
  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO users (first_name, last_name, mobile, email, username, password_hash, role)
     VALUES ($1, 'Admin', 'N/A', $2, $3, $4, 'admin')
     ON CONFLICT (username)
     DO UPDATE SET first_name = EXCLUDED.first_name,
                   password_hash = EXCLUDED.password_hash,
                   role = 'admin'`,
    [displayName, username + '@synchrochain.local', username, hash]
  );
  console.log('Administrator "' + username + '" (' + displayName + ') is ready.');
  await pool.end();
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
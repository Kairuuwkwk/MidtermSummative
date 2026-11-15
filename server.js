require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const path = require('path');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Serves all your existing pages (index.html, login.html, etc.)
app.use(express.static(path.join(__dirname)));

/* ---------- Admin tokens (kept in memory; admin must log in again after a server restart) ---------- */
const adminTokens = new Map();
const TOKEN_HOURS = 12;

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const entry = adminTokens.get(token);
  if (!entry || entry.expires < Date.now()) {
    adminTokens.delete(token);
    return res.status(401).json({ message: 'Administrator login required.' });
  }
  req.adminId = entry.id;
  next();
}

// REGISTER
app.post('/api/register', async (req, res) => {
  try {
    const { firstName, middleName, lastName, mobile, email, password } = req.body;

    if (!firstName || !lastName || !mobile || !email || !password) {
      return res.status(400).json({ message: 'Please fill in all required fields.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ message: 'This email is already registered.' });
    }

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO users (first_name, middle_name, last_name, mobile, email, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [firstName.trim(), (middleName || '').trim() || null, lastName.trim(), mobile.trim(), cleanEmail, hash]
    );

    res.json({ message: 'Account created successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// USER LOGIN
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [(email || '').trim().toLowerCase()]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    res.json({
      message: 'Login successful.',
      user: {
        id: user.id,
        firstName: user.first_name,
        middleName: user.middle_name,
        lastName: user.last_name,
        mobile: user.mobile,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ADMIN LOGIN
app.post('/api/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const id = (username || '').trim().toLowerCase();

    const result = await pool.query(
      `SELECT * FROM users WHERE role = 'admin' AND (username = $1 OR email = $1)`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid administrator username or password.' });
    }

    const admin = result.rows[0];
    const match = await bcrypt.compare(password || '', admin.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid administrator username or password.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    adminTokens.set(token, { id: admin.id, expires: Date.now() + TOKEN_HOURS * 3600 * 1000 });

    res.json({
      message: 'Administrator login successful.',
      token: token,
      user: {
        id: admin.id,
        name: admin.first_name,
        username: admin.username || admin.email,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// REGISTERED USERS (administrators only)
app.get('/api/users', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, first_name, middle_name, last_name, mobile, email, role, created_at
       FROM users WHERE role = 'user' ORDER BY id ASC`
    );

    res.json({
      users: result.rows.map((u) => ({
        id: u.id,
        name: [u.first_name, u.middle_name, u.last_name].filter(Boolean).join(' '),
        mobile: u.mobile,
        email: u.email,
        role: u.role,
        createdAt: u.created_at,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

app.listen(process.env.PORT, '0.0.0.0', () => {
  console.log(`SynchroChain running at http://localhost:${process.env.PORT}`);
});
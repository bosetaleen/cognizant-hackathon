// routes/auth.js
const express = require('express');
const router = express.Router();
const pool = require('../db');   // PostgreSQL connection
const bcrypt = require('bcrypt');

// Constant admin credentials
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_NAME = 'Admin User';

// Login page
router.get('/login', (req, res) => {
  res.render('login', { title: "Login", error: null });
});

// Handle login POST
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1️⃣ Check if it's the constant admin
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      req.session.user = {
        id: 0,
        email: ADMIN_EMAIL,
        role: 'admin',
        name: ADMIN_NAME
      };
      return res.redirect('/admin/dashboard');
    }

    // 2️⃣ Else, check employees from DB
  const result = await pool.query('SELECT id, name, email, password, role FROM users WHERE email = $1',[email]);

    if (result.rows.length === 0) {
      return res.render('login', { title: "Login", error: "Invalid credentials" });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render('login', { title: "Login", error: "Invalid credentials" });
    }

    req.session.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    };


    return res.redirect('/employee/dashboard');

  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

// Check if admin exists
const checkAdminExists = async () => {
  const result = await pool.query('SELECT COUNT(*) FROM admin');
  return result.rows[0].count > 0;
};

// Login page
router.get('/', async (req, res) => {
  const adminExists = await checkAdminExists();
  res.render('login', { adminExists });
});

// Admin login
router.post('/admin/login', passport.authenticate('local', {
  successRedirect: '/admin/dashboard',
  failureRedirect: '/',
  failureFlash: true
}));

// Admin register
router.post('/admin/register', async (req, res) => {
  try {
    const adminExists = await checkAdminExists();
    if (adminExists) {
      return res.status(400).send('Admin already exists');
    }

    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO admin (username, password) VALUES ($1, $2)', [username, hashedPassword]);
    res.redirect('/');
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Google OAuth routes
router.get('/auth/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

router.get('/auth/google/callback',
  passport.authenticate('google', {
    successRedirect: '/client/dashboard',
    failureRedirect: '/'
  })
);

// Logout
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).send('Error logging out');
    }
    res.redirect('/');
  });
});

module.exports = router; 
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Middleware to check if user is approved client
const isApprovedClient = (req, res, next) => {
  if (req.isAuthenticated() && req.user.type === 'client' && req.user.status === 'approved') {
    return next();
  }
  res.redirect('/');
};

// Client dashboard
router.get('/dashboard', isApprovedClient, async (req, res) => {
  // Log the login
  await pool.query('INSERT INTO login_logs (client_id) VALUES ($1)', [req.user.id]);
  res.render('client/dashboard', { user: req.user });
});

module.exports = router; 
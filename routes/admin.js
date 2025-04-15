const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.type === 'admin') {
    return next();
  }
  res.redirect('/');
};

// Admin dashboard
router.get('/dashboard', isAdmin, async (req, res) => {
  try {
    const logs = await pool.query(`
      SELECT c.name, c.email, l.login_time 
      FROM login_logs l 
      JOIN clients c ON l.client_id = c.id 
      ORDER BY l.login_time DESC
    `);
    res.render('admin/dashboard', { logs: logs.rows });
  } catch (err) {
    console.error('Error fetching logs:', err);
    res.status(500).send('Error loading dashboard');
  }
});

// Access requests
router.get('/requests', isAdmin, async (req, res) => {
  try {
    const requests = await pool.query('SELECT * FROM clients WHERE status = $1', ['pending']);
    res.render('admin/requests', { requests: requests.rows });
  } catch (err) {
    console.error('Error fetching requests:', err);
    res.status(500).send('Error loading requests');
  }
});

// Approve access
router.post('/approve/:id', isAdmin, async (req, res) => {
  try {
    await pool.query('UPDATE clients SET status = $1 WHERE id = $2', ['approved', req.params.id]);
    res.redirect('/admin/requests');
  } catch (err) {
    console.error('Error approving request:', err);
    res.status(500).send('Error approving request');
  }
});

// Reject access
router.post('/reject/:id', isAdmin, async (req, res) => {
  try {
    await pool.query('UPDATE clients SET status = $1 WHERE id = $2', ['rejected', req.params.id]);
    res.redirect('/admin/requests');
  } catch (err) {
    console.error('Error rejecting request:', err);
    res.status(500).send('Error rejecting request');
  }
});

module.exports = router; 
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pgSession = require('connect-pg-simple')(session);
const { pool } = require('../config/database');

const app = express();

// View engine setup - Use absolute path
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views')); // This is the key change

// Session configuration - must match main app
app.use(session({
  store: new pgSession({
    pool,
    tableName: 'session'
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, { id: user.id, type: user.type });
});

passport.deserializeUser(async (data, done) => {
  try {
    const result = await pool.query('SELECT * FROM clients WHERE id = $1', [data.id]);
    done(null, { ...result.rows[0], type: 'client' });
  } catch (err) {
    done(err);
  }
});

// Middleware to check authentication
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated() && req.user.status === 'approved') {
    return next();
  }
  res.redirect('http://localhost:3000');
};

// Routes
app.get('/', isAuthenticated, (req, res) => {
  res.render('apps/app2', { user: req.user });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`App2 running on port ${PORT}`);
}); 
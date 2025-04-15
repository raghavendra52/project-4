require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const pgSession = require('connect-pg-simple')(session);
const { pool } = require('./config/database');
const path = require('path');

const app = express();

// Middleware
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session configuration
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

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/', require('./routes/auth'));
app.use('/admin', require('./routes/admin'));
app.use('/client', require('./routes/client'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Main application running on port ${PORT}`);
}); 
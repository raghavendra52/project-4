const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const { pool } = require('./database');

// Serialize user for the session
passport.serializeUser((user, done) => {
  done(null, { id: user.id, type: user.type });
});

// Deserialize user from the session
passport.deserializeUser(async (data, done) => {
  try {
    if (data.type === 'admin') {
      const result = await pool.query('SELECT * FROM admin WHERE id = $1', [data.id]);
      done(null, { ...result.rows[0], type: 'admin' });
    } else {
      const result = await pool.query('SELECT * FROM clients WHERE id = $1', [data.id]);
      done(null, { ...result.rows[0], type: 'client' });
    }
  } catch (err) {
    done(err);
  }
});

// Local Strategy for Admin
passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const result = await pool.query('SELECT * FROM admin WHERE username = $1', [username]);
      if (!result.rows[0]) {
        return done(null, false, { message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, result.rows[0].password);
      if (!isMatch) {
        return done(null, false, { message: 'Invalid credentials' });
      }

      return done(null, { ...result.rows[0], type: 'admin' });
    } catch (err) {
      return done(err);
    }
  }
));

// Google Strategy for Clients
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists
      const existingUser = await pool.query('SELECT * FROM clients WHERE google_id = $1', [profile.id]);
      
      if (existingUser.rows[0]) {
        if (existingUser.rows[0].status !== 'approved') {
          return done(null, false, { message: 'Access request not approved' });
        }
        return done(null, { ...existingUser.rows[0], type: 'client' });
      }

      // Create new user with pending status
      const newUser = await pool.query(
        'INSERT INTO clients (google_id, email, name, status) VALUES ($1, $2, $3, $4) RETURNING *',
        [profile.id, profile.emails[0].value, profile.displayName, 'pending']
      );

      return done(null, { ...newUser.rows[0], type: 'client' });
    } catch (err) {
      return done(err);
    }
  }
));

module.exports = passport; 
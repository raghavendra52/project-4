const express = require('express');
const passport = require('passport');
const expressSession = require('express-session');
const { Sequelize } = require('sequelize');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/user'); // Sequelize model
const app = express();

// Middleware
app.use(expressSession({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Set up EJS
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Passport Google Strategy Setup
passport.use(new GoogleStrategy({
    clientID:process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/callback',
  },
  function (token, tokenSecret, profile, done) {
    User.findOne({ where: { googleId: profile.id } })
      .then((user) => {
        if (!user) {
          // Create a new user if it does not exist
          User.create({
            googleId: profile.id,
            email: profile.emails[0].value,
            displayName: profile.displayName,
          }).then((newUser) => {
            return done(null, newUser);
          }).catch((err) => done(err));
        } else {
          return done(null, user);
        }
      })
      .catch((err) => done(err));
  }
));

// Serialize and Deserialize User
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  User.findByPk(id).then((user) => done(null, user));
});

// Routes
app.get('/', (req, res) => {
  res.render('index', { user: req.user });
});

app.get('/auth/google', (req, res, next) => {
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        prompt: 'select_account'  // Ensures Google shows the account selection prompt
    })(req, res, next);
});


app.get('/auth/google/callback', passport.authenticate('google', {
  failureRedirect: '/'
}), (req, res) => {
  res.redirect('/dashboard');
});

app.get('/dashboard', (req, res) => {
  if (!req.user) return res.redirect('/');
  res.render('dashboard', { user: req.user });
});

app.get('/logout', (req, res) => {
  req.logout((err) => {
    res.redirect('/');
  });
});

// Start the server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});

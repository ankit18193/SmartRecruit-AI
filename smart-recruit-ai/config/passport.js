const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const User = require('../models/user.model'); 


passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true 
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        
        let dynamicRole = 'candidate';
        if (req.query.state) {
          try {
            const decodedState = JSON.parse(Buffer.from(req.query.state, 'base64').toString('ascii'));
            if (decodedState.role) dynamicRole = decodedState.role;
          } catch (e) {
            console.error("State parsing error:", e);
          }
        }

        let user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          
          if (user.role !== dynamicRole) {
            
            return done(null, false, { message: 'role_mismatch' });
          }
          
          
          return done(null, user);
        } else {
          
          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            password: Math.random().toString(36).slice(-10) + 'A1@', 
            role: dynamicRole, 
            isVerified: true 
          });
          return done(null, user);
        }
      } catch (error) {
        console.error("Passport Google Error:", error);
        return done(error, null);
      }
    }
  )
);


passport.use(
  new LinkedInStrategy(
    {
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: process.env.LINKEDIN_CALLBACK_URL,
      scope: ['r_emailaddress', 'r_liteprofile'],
      passReqToCallback: true 
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        let dynamicRole = 'candidate';
        if (req.query.state) {
          try {
            const decodedState = JSON.parse(Buffer.from(req.query.state, 'base64').toString('ascii'));
            if (decodedState.role) dynamicRole = decodedState.role;
          } catch (e) {}
        }

        const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
        if (!email) {
          return done(new Error("No email found from LinkedIn profile"), null);
        }

        let user = await User.findOne({ email: email });

        if (user) {
          
          if (user.role !== dynamicRole) {
            
            return done(null, false, { message: 'role_mismatch' });
          }
          
          
          return done(null, user);
        } else {
          user = await User.create({
            name: profile.displayName,
            email: email,
            password: Math.random().toString(36).slice(-10) + 'A1@', 
            role: dynamicRole, 
            isVerified: true
          });
          return done(null, user);
        }
      } catch (error) {
        console.error("Passport LinkedIn Error:", error);
        return done(error, null);
      }
    }
  )
);

module.exports = passport;
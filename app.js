//jshint esversion:6
require("dotenv").config();
const express = require("express");
const https = require("https");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static("public"));

app.use(session({
  secret: "Our little secret", //the secret shuold be stored in an env variable!
  resave: false,
  saveUninitialized: false //this object does not have a store option. Use the store option to store the session data in a db. Default is the memory store.

}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/userDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
//get rid of deprecation warning...
mongoose.set("useCreateIndex", true);

var userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  facebookId: String,
  secret:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// const secret = "Thisisourlittlesecret.";
// mongoose encryption process. Here the encrypt plugin is used to ecrypt the password using the secret phrase. Secret is stored
// in an environment variable using the dotenv package.
//userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]});
var User = mongoose.model('User', userSchema);
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo" //this line is added to manage the deprecating of google plus APIs which is sunsetting.
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({
      googleId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile.id);
    User.findOrCreate({
      facebookId: profile.id
    }, function(err, user) {
      //console.log(err);
      return cb(err, user);
    });
  }
));


app.get("/", function(req, res) {
  res.render("home.ejs");
});

// app.get("/auth/google",function(req,res){
//   console.log("am here");
//   passport.authenticate("google",{scope:["profile"]});
// });

app.get("/auth/google",
  passport.authenticate('google', {
    scope: ['profile']
  }));

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/google/secrets',
  passport.authenticate('google', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });

app.get("/login", function(req, res) {
  res.render("login.ejs");
});

app.get("/secrets", function(req, res) {
User.find({"secret":{$ne:null}},function(err,foundUsers){
  if (err){
    console.log(err);
  } else{
    if(foundUsers){
      res.render("secrets",{usersWithSecrets:foundUsers})
    }
  }
});
});

app.get("/register", function(req, res) {
  res.render("register.ejs");
});

// app.get ("/secrets",function(req,res){
//   res.render("secrets.ejs");
// });

app.get("/submit", function(req, res) {
  if (req.isAuthenticated()) {
    console.log(req.isAuthenticated);
    res.render("submit.ejs");
  } else {
    res.redirect("/login");
  }

});

app.get("/logout", function(req, res) {

  req.logout();
  res.redirect("/");

});

app.post("/register", function(req, res) {
  User.register({
    username: req.body.username
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      })
    }
  });

});

app.post("/login", function(req, res) {

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err) {
    if (err) {
      res.redirect("/login");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/submit",function(req,res){
  const submittedSecret = req.body.secret;
  User.findById(req.user.id,function(err,foundUser){
    if (err){console.log(err);} else{
      if (foundUser){
        foundUser.secret = submittedSecret;
        foundUser.save(function(){
          res.redirect("/secrets");
        });
      }
    }
  });

});


app.listen(3000, function() {
  console.log("listening on port 3000");
});

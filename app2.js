//jshint esversion:6
require ("dotenv").config();
const express = require("express");
const https = require("https");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const ejs = require("ejs");
const session = require ("express-session");
const passport = require ("passport");
const passportLocalMongoose = require ("passport-local-mongoose");


const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static("public"));

app.use(session({
  secret:"Our little secret",   //the secret shuold be stored in an env variable!
  resave:false,
  saveUninitialized:false     //this object does not have a store option. Use the store option to store the session data in a db. Default is the memory store.

}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/userDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
//get rid of deprecation warning...
mongoose.set("useCreateIndex",true);

var userSchema = new mongoose.Schema({
  email: String,
  password: String
});

userSchema.plugin(passportLocalMongoose);

// const secret = "Thisisourlittlesecret.";
// mongoose encryption process. Here the encrypt plugin is used to ecrypt the password using the secret phrase. Secret is stored
// in an environment variable using the dotenv package.
//userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]});
var User = mongoose.model('User', userSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res) {
  res.render("home.ejs");
});

app.get("/login", function(req, res) {
  res.render("login.ejs");
});

app.get("/secrets",function(req,res){
  if(req.isAuthenticated()){
    console.log(req.isAuthenticated);
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.get("/register", function(req, res) {
    res.render("register.ejs");
});

// app.get ("/secrets",function(req,res){
//   res.render("secrets.ejs");
// });

app.get("/submit", function(req, res) {
  res.render("submit.ejs");
});

app.get("/logout",function(req,res){

  req.logout();
  res.redirect("/");

});

app.post("/register", function(req, res) {
  User.register({username:req.body.username},req.body.password,function(err,user){
    if (err){
      console.log(err);
      res.redirect("/register");
    } else{
      passport.authenticate("local")(req,res,function(){
      res.redirect("/secrets");
      })
    }
  });

});

app.post("/login", function(req, res) {

const user = new User({
  username:req.body.username,
  password:req.body.password
});

req.login(user,function(err){
  if (err){
    res.redirect("/login");
  }else{
    passport.authenticate("local")(req,res,function(){
    res.redirect("/secrets");
  });
  }
});

});



app.listen(3000, function() {
  console.log("listening on port 3000");
});

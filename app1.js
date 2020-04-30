//jshint esversion:6
require ("dotenv").config();
const express = require("express");
const https = require("https");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const ejs = require("ejs");
// used for implementing mongoose-encryption.

// const encrypt = require ("mongoose-encryption");
//Used for implementing MD5 based encryption.

//const md5 = require ("md5");

const bcrypt = require ("bcrypt");
const saltRounds = 10;

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static("public"));

mongoose.connect('mongodb://localhost:27017/userDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

var userSchema = new mongoose.Schema({
  email: String,
  password: String
});

// const secret = "Thisisourlittlesecret.";
// mongoose encryption process. Here the encrypt plugin is used to ecrypt the password using the secret phrase. Secret is stored
// in an environment variable using the dotenv package.
//userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]});
var User = mongoose.model('User', userSchema);

app.get("/", function(req, res) {
  res.render("home.ejs");
});

app.get("/login", function(req, res) {
  res.render("login.ejs");
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

app.post("/register", function(req, res) {

  var userName = req.body.username;
  //Using MD5 to hash the password.
  //var password = md5(req.body.password);


  //using bcrypt to create a hash WITH Salt
  bcrypt.hash(req.body.password,saltRounds,function(err,hash){
    if (!err){
      var addUser = new User({
        email: userName,
        password: hash
      });
      addUser.save(function(err) {
        if (!err) {
          res.render("secrets");
        } else {
          res.send("There was an error posting the document!")
        }
      });
    }
  });
});

app.post("/login", function(req, res) {

  var inputUsername = req.body.username;
  var inputPassword = req.body.password;

  User.findOne({
    email: inputUsername
  }, function(err, recordFound) {
    if (recordFound) {
      //Comment: Using the bcrypt compare function to compare the input password with the database hash
      bcrypt.compare(inputPassword,recordFound.password,function(err,result){
        if(result===true){
          res.render("secrets.ejs");
        } else {
            res.render("login.ejs");
        }
      });
  }

  // Comment: Checking he MD5 encryption against the database value.
    //   if (recordFound.password === md5(inputPassword)){
    //    res.render("secrets.ejs");
    //   }
    // } else {
    //   res.render("login.ejs");

  });
});



app.listen(3000, function() {
  console.log("listening on port 3000");
});

var express = require('express');
var morgan = require('morgan');
var path = require('path');
var pug = require('pug');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var crypto = require('crypto')
var session = require('express-session');
var cookieParser = require('cookie-parser');
var Sequelize = require('sequelize');
var connection = new Sequelize('pantharshit00', 'pantharshit00', process.env.DB_password, {
    host: 'db.imad.hasura-app.io',
    dialect: 'postgres'
});

var User = connection.define('user',{
    id:{type:Sequelize.INTEGER,autoIncrement:true, primaryKey:true},
   name: Sequelize.STRING,
    email:{ type: Sequelize.STRING , unique: true } ,
    password:Sequelize.TEXT

});

connection.sync();









var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;


var app = express();


app.use(cookieParser());
app.use(morgan('dev'));
app.use('/static', express.static('static'));
app.set('view engine', 'pug');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator());
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true , maxAge: 2592000000 }
}));
app.use(passport.initialize());
app.use(passport.session());



function validatePassword(password,originalPassword){
    var salt = originalPassword.split('$')[0];
  var submittedPasswordHash = crypto.pbkdf2Sync(password,salt,10000,64,'sha512').toString('hex');
    if(submittedPasswordHash === originalPassword.split('$')[1])
        return true;
    else
        return false;
};


app.get('/', function (req, res) {
    res.render('index', {title: "Home | Articles"});
});

app.get('/:filename.png', function (req, res) {
    res.sendFile(path.join(__dirname, req.params.filename + '.png'));
});

app.get('/:filename.json', function (req, res) {
    res.sendFile(path.join(__dirname, req.params.filename + '.json'));
});

app.get('/:filename.svg', function (req, res) {
    res.sendFile(path.join(__dirname, req.params.filename + '.svg'));
});

app.get('/:filename.xml', function (req, res) {
    res.sendFile(path.join(__dirname, req.params.filename + '.xml'));
});

app.get('/login', function(req,res){
   res.render('login',{title: "Login | Articles"});
});
var errors = {};
app.get('/register',function(req,res){
   res.render('register',{title:"Sign Up | Articles"});
});

function createHash(text){
    var salt = crypto.randomBytes(16).toString('hex');
    var hashed = crypto.pbkdf2Sync(text,salt,10000,64,'sha512').toString('hex');
    return [salt,hashed].join('$');

};

app.post('/signup',function (req,res) {
    var name = req.body.name;
    var email = req.body.email;
    var password = req.body.password;
    var password2 = req.body.password2;

    req.checkBody('name', 'Name is required').notEmpty();
    req.checkBody('email', 'Email is required').notEmpty();
    req.checkBody('email', 'Email is not valid').isEmail();
    req.checkBody('password', 'Password is required').notEmpty();
    req.checkBody('password2', 'Confirm Your Password').notEmpty();
    req.checkBody('password2', 'Passwords Do not match').equals(req.body.password);
    var emailAvailable;
    errors = req.validationErrors();
    if (errors) {
        res.render('register', {
            errors: errors

        })
        ;
    } else if (errors === false) {
        User.findOne({
            where: {email: email}
        }).then(function (user) {
            if (user === null) {
                User.create({
                    name: name,
                    email: email,
                    password:createHash(password)
                })
                res.redirect('/login');
            }
            else {
                res.render('register', {
                    errors: [{msg: "Email is alredy in use"}]
                })
            }
        })}});


app.use(function (req, res) {
    res.status(404).render('error', {message: "Cannot load the destination", error: "Error 404"});
});

app.listen(8080, function () {
    console.log("app started");
});



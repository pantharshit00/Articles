var express = require('express');
var morgan = require('morgan');
var path = require('path');
var pug = require('pug');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var crypto = require('crypto')
var session = require('express-session');
var cookieParser = require('cookie-parser');
var flash = require('connect-flash')
var Sequelize = require('sequelize');
var nodemailer = require('nodemailer');
var connection = new Sequelize('pantharshit00', 'pantharshit00', process.env.DB_password, {
    host: 'db.imad.hasura-app.io',
    dialect: 'postgres'
});

var User = connection.define('user',{
    id:{type:Sequelize.INTEGER,autoIncrement:true, primaryKey:true},
   name: Sequelize.STRING,
    email:{ type: Sequelize.STRING , unique: true } ,
    password:Sequelize.TEXT,
    resetPasswordToken:Sequelize.TEXT,
    resetPasswordExpires: Sequelize.DATE

});

connection.sync();







var gpass= process.env.GMAIL_PASSWORD;

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
    secret: 'this-is-some-random-text',
    resave: false,
    saveUninitialized: true,
    cookie: {maxAge: 2592000000 }
}))
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

    app.use(function (req, res, next) {
        res.locals.success_msg = req.flash('success_msg');
        res.locals.error_msg = req.flash('error_msg');
        res.locals.error = req.flash('error');
        res.locals.userCheck = req.user || null;
        next();
    });


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

    errors = req.validationErrors();

    if (errors) {
        res.status(403).render('register', {
            errors: errors

        });
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
                req.flash('success_msg','You are now registered and can login.')
                res.redirect('/login');
            }
            else {
                res.status(403).render('register', {
                    errors: [{msg: "Email is already in use"}]
                })
            }
        })}});
app.post('/login',
    passport.authenticate('local', { successRedirect: '/user/dashboard',
        failureRedirect: '/login',
        failureFlash: true })
);

passport.use(new LocalStrategy(
    function(email, password, done) {
        User.findOne({
            where: {
                'email': email
            }
        }).then(function (user) {
            if (user == null) {
                return done(null, false,{message:"Username or password is invalid"})
            }

            if (validatePassword(password,user.password)) {
                return done(null, user)
            }

            return done(null, false,{message:"Username or password is invalid"})
        })
    }
))

passport.serializeUser(function(user, done) {
    done(null, user.id)
})

passport.deserializeUser(function(id, done) {
    User.findOne({
        where: {
            'id': id
        }
    }).then(function (user) {
        if (user == null) {
            done(new Error('Wrong user id.'))
        }

        done(null, user)
    })
})

function loggedIn(req, res, next) {
    if (req.user) {
        next();
    } else {
        req.flash('error_msg',"You can't access that path without logging in");
        res.redirect('/login');
    }
}

app.get('/logout', function(req, res){
    req.logout();
    req.flash('success_msg','You are now logged out');
    res.redirect('/login');
});

app.get('/forgot', function(req, res) {
    res.render('forgot', {
        user: req.user,title: "Reset Password | Articles"
    });
});

app.post('/forgot', function(req, res, next) {
            var email = req.body.email;
            req.checkBody('email','Email field is empty').notEmpty();
            errors = req.validationErrors();
            if (errors) {
                req.flash('error','Email field is empty');
                res.status(403).redirect('/forgot');
            }
            var token;
            var gpass= process.env.GMAIL_PASSWORD;
            crypto.randomBytes(20, function(err, buf) {
                token = buf.toString('hex');
            });
            User.findOne({where : {"email" : req.body.email }}).then(function(user) {
                if (user==null) {
                    req.flash('error', 'No account with that email address exists.');
                    return res.redirect('/forgot');
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                user.save();
                var smtpTransport = nodemailer.createTransport('SMTP',{
                    service: 'Gmail',
                    auth: {
                        user: 'artclesinc@gmail.com',
                        pass: gpass
                    }
                });
                var mailOptions = {
                    to: req.body.email,
                    from: 'artclesinc@gmail.com',
                    subject: 'Articles Password Reset',
                    text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                    'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                    'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                    'If you did not request this, please ignore this email and your password will remain unchanged.\n'
                };
                smtpTransport.sendMail(mailOptions, function(err) {
                    if (err) throw err;
                    req.flash('success_msg', 'An e-mail has been sent to ' + req.body.email + ' with further instructions.');
                    res.redirect('/forgot');
                });

            });
});


app.get('/reset/:token', function(req, res) {
    User.findOne({where:{ 'resetPasswordToken': req.params.token, 'resetPasswordExpires': { $gt: Date.now() } }}).then(function(user) {
        if (user==null) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('/forgot');
        }
        res.render('reset', {
            user: req.user,title: "Reset Password | Articles"
        });
    });
});

app.post('/reset/:token', function(req, res) {
    var password = req.body.password;
    var confirm = req.body.confirm;
    req.checkBody('password', 'Password is required').notEmpty();
    req.checkBody('confirm', 'Confirm Your Password').notEmpty();
    req.checkBody('confirm', 'Passwords Do not match').equals(req.body.password);

    errors = req.validationErrors();
    if (errors) {
        req.flash('error','Password do not match or not provided. TRY AGAIN');
        res.status(403).redirect('/reset/'+req.params.token);
    }
    else {
        User.findOne({where:{
            resetPasswordToken: req.params.token,
            resetPasswordExpires: {$gt: Date.now()}
        }}).then(function (user) {
            if (user == null) {
                req.flash('error', 'Password reset token is invalid or has expired.');
                return res.redirect('back');
            }
            var newCred = {
                password: createHash(req.body.password),
                resetPasswordToken: null,
                resetPasswordExpires: null
            }

            User.update(newCred, {where: {'email': user.email}}).then(function () {
                req.flash('success_msg', 'Password has been changed')
                res.redirect('/login');
            }, function (err) {
                if (err) throw err;
            });

        });
    }

});

app.get('/user/dashboard',loggedIn,function(req,res){
    res.render('dashboard',{user: req.user,title: "Dashboard | Articles"})
})

app.use(function (req, res) {
    res.status(404).render('error', {message: "Cannot load the destination", error: "Error 404"});
});

app.listen(8080, function () {
    console.log("app started");
});



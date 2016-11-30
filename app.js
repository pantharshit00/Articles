var express = require('express');
var morgan = require('morgan');
var path = require('path');
var pug = require('pug');
var app = express();
app.use(morgan('combined'));
app.use('/static', express.static('static'));
app.set('view engine', 'pug');

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

app.get('/register',function(req,res){
   res.render('register',{title:"Sign Up | Articles"});
});

app.use(function (req, res) {
    res.status(404).render('error', {message: "Cannot load the destination", error: "Error 404"});
});

app.listen(8080, function () {
    console.log("app started");
});



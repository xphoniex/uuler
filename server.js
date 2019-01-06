// server.js

// set up ======================================================================
var express = require('express')
var app = express()
var morgan = require('morgan')
var bodyParser = require('body-parser')
var methodOverride = require('method-override')
var server = require('http').createServer(app)
var io = require('socket.io')(server)
var passport = require('passport')
var session = require('express-session')
var MemoryStore = require('session-memory-store')(session)

// configuration ===============================================================
app.use(express.static(__dirname + '/app'))
app.use(session({secret: "Alpha, Beta, Comma!", saveUninitialized: false, resave: false, store: new MemoryStore({ expires: 30*60 , checkperiod: 600*60 }), cookie  : { maxAge  : new Date(Date.now() + (5000 * 60 * 1000)) } }))
app.use(passport.initialize())
app.use(passport.session())
app.use('/dashboard', checkAuthentication, express.static(__dirname + '/app/admin'))
app.use(morgan('dev'))
app.use(bodyParser.urlencoded({'extended':'true'}))
app.use(bodyParser.json())
app.use(bodyParser.json({ type: 'application/vnd.api+json' }))
app.use(methodOverride())

// application -----------------------------------------------------------------
require('./modules/routes.js')(app, passport) // routes
require('./modules/bus.js')(io)               // pub/sub + socket.io

// listen (start app with node server.js) ======================================
server.listen(8080)
console.log("App listening on port 8080")

function checkAuthentication(req, res, next) {
  if (req.isAuthenticated())
    next()
  else
    res.redirect("/login")
}

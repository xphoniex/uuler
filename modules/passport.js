// passport.js

const bcrypt        = require('bcrypt')
const LocalStrategy = require('passport-local')

module.exports = function (app, passport) {

passport.use(new LocalStrategy(
	function(username, password, done) {
		if (username == "admin") {
			bcrypt.compare(password, "$2a$05$zUT2EiT0FZy8vAaqMOVtBuvTB7GV/UtAPyk4rmC0KZwL9G8vXEMaK", function(err, matches) {
				if (matches)
          return done(null, {id:1, username:'admin', password:'admin'})
      	return done(null, false)
			})
		} else {
		  return done(null, false)
    }
}))

passport.serializeUser(function(user, cb) {
	cb(null, user.id)
})

passport.deserializeUser(function(id, cb) {
	if (id == 1)
		return cb(null, {id:1, username:'admin', password:'admin'})
	else
		return cb("error!")
})

// login handling
app.post('/login', passport.authenticate('local', { failureRedirect: '/login/', successRedirect: '/dashboard/' }))
app.get('/login/', function(req, res) { res.sendFile('login.html', {root : './app/views/'}) })
//
}

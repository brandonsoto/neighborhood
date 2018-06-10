require('./config/config');

const _ = require('lodash');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const passport = require('passport');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');

var {mongoose} = require('./db/mongoose');
var {Todo} = require('./models/todo');
var {User} = require('./models/user');
const port = process.env.PORT;
var LocalStrategy = require('passport-local').Strategy;
var mongoStore = new MongoStore({mongooseConnection: mongoose.connection});
var appSession = session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: true,
    store: mongoStore
});

var app = express();
app.use(bodyParser.json());
app.use(appSession);
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.isAuthenticated();
    next();
});
passport.use(new LocalStrategy(
    function (username, password, done) {
        User.findOne({
            username
        }, function (err, user) {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false);
            }

            user.verifyPassword(password)
                .then(() => done(null, user))
                .catch(() => done(null, false));
        });
    }
));


app.get('/', (req, res) => {
    console.log(`User : ${req.user}`);
    console.log(`User authenticated: ${req.isAuthenticated()}`);
    console.log("GET / cookies: " + JSON.stringify(req.cookies));
    res.send();
});

app.get('/profile', authenticateMiddleware(), (req, res) => {
    res.send();
});

app.post('/login', passport.authenticate(
    'local', {
        successRedirect: '/profile',
        failureRedirect: '/login'
    }
));

app.get('/logout', (req, res) => {
    req.logout();
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});


app.post('/users', async (req, res) => {
    const body = _.pick(req.body, ['email', 'password']);
    const user = new User(body);

    try {
        await user.save();
        req.login(user._id, (err) => {
            if (err) {
                res.status(400).send(err);
            } else {
                res.send(user);
            }
        });
    } catch(err) {
        res.status(400).send(err);
    }
});

passport.serializeUser(function (user_id, done) {
    done(null, user_id);
});

passport.deserializeUser(function (user_id, done) {
    User.findById(user_id, function (err, user) {
        done(err, user);
    });
});

function authenticateMiddleware () {
    return (req, res, next) => {
        if (req.isAuthenticated()) {
            return next();
        } else {
            res.status(400).send();
        }
    };
};

app.listen(port, () => {
    console.log(`Started server at port ${port}`);
});

module.exports = {app, mongoStore};

require('./config/config');

const _ = require('lodash');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');

const middle = require('./middleware/authenticate');
const {mongoose} = require('./db/mongoose');
const {User} = require('./models/user');

var mongoStore = new MongoStore({mongooseConnection: mongoose.connection});

var app = express();
app.use(bodyParser.json());
app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: true,
    store: mongoStore
}));
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
    res.send();
});

app.get('/profile', middle.authenticate(), (req, res) => {
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

app.listen(process.env.PORT, () => {
    console.log(`Started server at port ${process.env.PORT}`);
});

module.exports = {app, mongoStore, mongoose};

require('./config/config');

const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');

var {mongoose} = require('./db/mongoose');
var {Todo} = require('./models/todo');
var {User} = require('./models/user');
var {authenticate} = require('./middleware/authenticate');
const port = process.env.PORT;

var app = express();
app.use(bodyParser.json());

app.post('/users', async (req, res) => {
    const body = _.pick(req.body, ['email', 'password']);
    const user = new User(body);

    try {
        await user.save();
        res.send(user);
    } catch(err) {
        res.status(400).send(err);
    }
});

app.listen(port, () => {
    console.log(`Started server at port ${port}`);
});

module.exports = {app};

var mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI, {
    socketTimeoutMS: 0,
    keepAlive: true,
    reconnectTries: 30,
    useMongoClient: true
});

module.exports = {mongoose};

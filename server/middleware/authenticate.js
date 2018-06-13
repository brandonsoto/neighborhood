module.exports.authenticate = function() {
    return (req, res, next) => {
        if (req.isAuthenticated()) {
            return next();
        } else {
            res.status(400).send();
        }
    };
};
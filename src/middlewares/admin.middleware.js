const jwt=require('jsonwebtoken');
const adminMiddleware = (req, res, next) => {
    if (req.user.Role !== 'Admin') {
        return res.status(403).json({
            message: 'Admin access only'
        });
    }
    next();
};

module.exports = adminMiddleware;
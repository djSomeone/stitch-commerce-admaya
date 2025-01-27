const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateToken=(req, res, next)=>{
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) return res.status(401).send('Authorization header missing');

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).send('Invalid token format');
    }

    jwt.verify(token, process.env.JWTS_KEY, (err, user) => {
        if (err) return res.status(403).send('Invalid or expired token');
        req.user = user;
        next();
    });
}   
module.exports = authenticateToken;
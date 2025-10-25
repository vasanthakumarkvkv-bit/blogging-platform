// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  // tokens expected in Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // attach user id to request (do NOT attach full sensitive user object)
    req.user = { id: payload.id };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalid or expired' });
  }
};
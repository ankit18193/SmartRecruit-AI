const jwt = require('jsonwebtoken');

function generateToken(user, options = {}) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }

  const expiresIn = options.expiresIn || '7d';
  const payload = { id: user._id || user.id, role: user.role };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

module.exports = { generateToken };

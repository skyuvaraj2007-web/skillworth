const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'skillworth_rpl_platform_jwt_auth_secret_2026';

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session. Please sign in again.' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    const userRole = (req.user.role || '').toUpperCase();
    const allowed = roles.map(r => r.toUpperCase());
    if (!allowed.includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Access forbidden: Insufficient role permissions.' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole, JWT_SECRET };

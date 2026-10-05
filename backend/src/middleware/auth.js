const jwt = require('jsonwebtoken');
const db = require('../db');
const relationalManager = require('../db/relationalManager');

const JWT_SECRET = process.env.JWT_SECRET || 'skillnexus_quantum_super_secret_jwt_key_2026';

const requireAuth = async (req, res, next) => {
  let token = null;

  // 1. Check HTTP-only cookie
  if (req.cookies && req.cookies.nexus_session) {
    token = req.cookies.nexus_session;
  }

  // 2. Check Authorization Header (Bearer token)
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  // 3. Reject if no token
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in to access this resource.'
    });
  }

  // 4. Verify token and load real user
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Look up via relationalManager (or legacy db)
    let user = await relationalManager.getUserById(decoded.id);
    if (!user && decoded.email) {
      user = await relationalManager.getUserByEmail(decoded.email);
    }
    if (!user && !relationalManager.isPgRequired && db && typeof db.getUserById === 'function') {
      user = db.getUserById(decoded.id);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Account not found or session revoked. Please log in again.'
      });
    }

    req.user = {
      ...user,
      role: (decoded.role || user.role || 'student').toLowerCase(),
      institutionId: user.institutionId || decoded.institutionId || user.collegeId || decoded.collegeId,
      collegeId: user.collegeId || decoded.collegeId || user.institutionId || decoded.institutionId,
      companyId: user.companyId || decoded.companyId,
      studentId: user.studentId || decoded.studentId
    };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: err.name === 'TokenExpiredError' 
        ? 'Session expired. Please log in again.' 
        : 'Invalid authentication token. Please log in.'
    });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const userRole = (req.user.role || '').toLowerCase();
    const allowedRoles = roles.map(r => r.toLowerCase());

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of: ${roles.join(', ')}`
      });
    }

    next();
  };
};

module.exports = {
  requireAuth,
  requireRole,
  JWT_SECRET
};


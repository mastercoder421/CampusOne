const requireRole = (...allowedRoles) => {
  // Flatten if passed as an array e.g. requireRole(['admin', 'faculty'])
  const roles = allowedRoles.flat();

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access requires one of [${roles.join(', ')}] role(s). Your role is '${req.user.role}'.`,
      });
    }

    next();
  };
};

module.exports = { requireRole };

const { verifyToken } = require('./auth');

function authMiddleware(handler) {
  return async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ 
          success: false, 
          error: 'Unauthorized - Token tidak ada' 
        });
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ 
          success: false, 
          error: 'Unauthorized - Token tidak valid' 
        });
      }

      req.user = decoded;
      return handler(req, res);
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  };
}

function adminOnly(handler) {
  return authMiddleware(async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Forbidden - Hanya admin' 
      });
    }
    return handler(req, res);
  });
}

function mitraOnly(handler) {
  return authMiddleware(async (req, res) => {
    if (req.user.role !== 'mitra') {
      return res.status(403).json({ 
        success: false, 
        error: 'Forbidden - Hanya mitra' 
      });
    }
    return handler(req, res);
  });
}

module.exports = {
  authMiddleware,
  adminOnly,
  mitraOnly
};
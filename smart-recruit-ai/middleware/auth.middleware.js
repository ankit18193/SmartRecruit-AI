const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    console.warn('No authorization header provided');
    return res.status(401).json({ 
      message: "No token provided. Please login first." 
    });
  }

  const token = authHeader.split(" ")[1];
  
  if (!token) {
    console.warn('Malformed authorization header');
    return res.status(401).json({ 
      message: "Invalid token format. Use: Authorization: Bearer <token>" 
    });
  }

  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      return res.status(500).json({ 
        message: "Server configuration error" 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.warn('Token verification failed:', err.message);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: "Your session has expired. Please login again.",
        expired: true
      });
    }
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: "Invalid or corrupted token. Please login again." 
      });
    }

    res.status(401).json({ 
      message: "Authentication failed. Please login again.",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, tier: true, isActive: true }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ error: 'Token expired' });
    }
    next(error);
  }
};

const requireTier = (minTier) => {
  const tierHierarchy = {
    'FREE': 0,
    'BRONZE': 1,
    'SILVER': 2,
    'GOLD': 3,
    'PLATINUM': 4
  };

  return (req, res, next) => {
    const userTierLevel = tierHierarchy[req.user.tier] || 0;
    const requiredTierLevel = tierHierarchy[minTier] || 0;

    if (userTierLevel < requiredTierLevel) {
      return res.status(403).json({ 
        error: 'Insufficient access tier',
        required: minTier,
        current: req.user.tier
      });
    }

    next();
  };
};

module.exports = { authenticateToken, requireTier };

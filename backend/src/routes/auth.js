const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');

const router = express.Router();
const prisma = new PrismaClient();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

router.post('/register',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').optional().trim(),
  validate,
  async (req, res, next) => {
    try {
      const { email, password, name } = req.body;

      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || null,
          tier: 'FREE'
        },
        select: {
          id: true,
          email: true,
          name: true,
          tier: true,
          createdAt: true
        }
      });

      const { accessToken, refreshToken } = generateTokens(user.id);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt
        }
      });

      res.status(201).json({
        user,
        accessToken,
        refreshToken
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const { accessToken, refreshToken } = generateTokens(user.id);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt
        }
      });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          tier: user.tier
        },
        accessToken,
        refreshToken
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/refresh',
  body('refreshToken').notEmpty(),
  validate,
  async (req, res, next) => {
    try {
      const { refreshToken } = req.body;

      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true }
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        return res.status(403).json({ error: 'Invalid or expired refresh token' });
      }

      const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);

      await prisma.refreshToken.delete({
        where: { token: refreshToken }
      });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: decoded.userId,
          expiresAt
        }
      });

      res.json({
        accessToken,
        refreshToken: newRefreshToken
      });
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(403).json({ error: 'Invalid refresh token' });
      }
      next(error);
    }
  }
);

router.post('/logout',
  body('refreshToken').notEmpty(),
  validate,
  async (req, res, next) => {
    try {
      const { refreshToken } = req.body;

      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken }
      });

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;

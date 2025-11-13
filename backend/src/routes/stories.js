const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireTier } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const tierHierarchy = {
  'FREE': 0,
  'BRONZE': 1,
  'SILVER': 2,
  'GOLD': 3,
  'PLATINUM': 4
};

router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const userTierLevel = tierHierarchy[req.user.tier] || 0;

    const stories = await prisma.story.findMany({
      where: {
        isPublished: true,
        patreonTierRequired: {
          in: Object.keys(tierHierarchy).filter(
            tier => tierHierarchy[tier] <= userTierLevel
          )
        }
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        chapters: {
          select: {
            id: true,
            title: true,
            order: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(stories);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userTierLevel = tierHierarchy[req.user.tier] || 0;

    const story = await prisma.story.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        chapters: {
          include: {
            media: {
              orderBy: {
                order: 'asc'
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    const requiredTierLevel = tierHierarchy[story.patreonTierRequired] || 0;

    if (userTierLevel < requiredTierLevel && story.ownerId !== req.user.id) {
      return res.status(403).json({ 
        error: 'Insufficient access tier',
        required: story.patreonTierRequired,
        current: req.user.tier
      });
    }

    res.json(story);
  } catch (error) {
    next(error);
  }
});

router.post('/',
  authenticateToken,
  body('title').trim().notEmpty(),
  body('author').trim().notEmpty(),
  body('description').optional().trim(),
  body('patreonTierRequired').optional().isIn(['FREE', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM']),
  validate,
  async (req, res, next) => {
    try {
      const { title, author, description, patreonTierRequired } = req.body;

      const story = await prisma.story.create({
        data: {
          title,
          author,
          description,
          patreonTierRequired: patreonTierRequired || 'FREE',
          ownerId: req.user.id
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      res.status(201).json(story);
    } catch (error) {
      next(error);
    }
  }
);

router.put('/:id',
  authenticateToken,
  body('title').optional().trim().notEmpty(),
  body('author').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('patreonTierRequired').optional().isIn(['FREE', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM']),
  body('isPublished').optional().isBoolean(),
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const story = await prisma.story.findUnique({
        where: { id }
      });

      if (!story) {
        return res.status(404).json({ error: 'Story not found' });
      }

      if (story.ownerId !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to update this story' });
      }

      const updatedStory = await prisma.story.update({
        where: { id },
        data: req.body,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          chapters: true
        }
      });

      res.json(updatedStory);
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const story = await prisma.story.findUnique({
      where: { id }
    });

    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    if (story.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this story' });
    }

    await prisma.story.delete({
      where: { id }
    });

    res.json({ message: 'Story deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

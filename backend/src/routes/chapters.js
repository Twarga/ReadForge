const express = require('express');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { uploadToMinio, deleteFromMinio } = require('../utils/storage');

const router = express.Router();
const prisma = new PrismaClient();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed.'));
    }
  }
});

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.post('/:storyId',
  authenticateToken,
  body('title').trim().notEmpty(),
  body('order').isInt({ min: 0 }),
  body('content').optional().trim(),
  validate,
  async (req, res, next) => {
    try {
      const { storyId } = req.params;
      const { title, order, content } = req.body;

      const story = await prisma.story.findUnique({
        where: { id: storyId }
      });

      if (!story) {
        return res.status(404).json({ error: 'Story not found' });
      }

      if (story.ownerId !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to add chapters to this story' });
      }

      const chapter = await prisma.chapter.create({
        data: {
          storyId,
          title,
          order: parseInt(order),
          content
        },
        include: {
          media: true
        }
      });

      res.status(201).json(chapter);
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Chapter order already exists for this story' });
      }
      next(error);
    }
  }
);

router.post('/:chapterId/media',
  authenticateToken,
  upload.single('file'),
  async (req, res, next) => {
    try {
      const { chapterId } = req.params;
      const { order } = req.body;

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const chapter = await prisma.chapter.findUnique({
        where: { id: chapterId },
        include: { story: true }
      });

      if (!chapter) {
        return res.status(404).json({ error: 'Chapter not found' });
      }

      if (chapter.story.ownerId !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to upload media to this chapter' });
      }

      const mediaType = req.file.mimetype.startsWith('image/') ? 'IMAGE' : 'VIDEO';
      const fileName = `${Date.now()}-${req.file.originalname}`;
      
      const url = await uploadToMinio(req.file.buffer, fileName, req.file.mimetype);

      const media = await prisma.media.create({
        data: {
          chapterId,
          type: mediaType,
          url,
          order: parseInt(order) || 0
        }
      });

      res.status(201).json(media);
    } catch (error) {
      next(error);
    }
  }
);

router.get('/:storyId', authenticateToken, async (req, res, next) => {
  try {
    const { storyId } = req.params;

    const story = await prisma.story.findUnique({
      where: { id: storyId }
    });

    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    const chapters = await prisma.chapter.findMany({
      where: { storyId },
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
    });

    res.json(chapters);
  } catch (error) {
    next(error);
  }
});

router.delete('/:chapterId', authenticateToken, async (req, res, next) => {
  try {
    const { chapterId } = req.params;

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { 
        story: true,
        media: true 
      }
    });

    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    if (chapter.story.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this chapter' });
    }

    for (const media of chapter.media) {
      try {
        await deleteFromMinio(media.url);
      } catch (err) {
        console.error('Error deleting media from storage:', err);
      }
    }

    await prisma.chapter.delete({
      where: { id: chapterId }
    });

    res.json({ message: 'Chapter deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

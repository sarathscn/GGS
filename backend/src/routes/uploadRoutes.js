const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { verifyToken } = require('../middleware/authMiddleware');
const imageService = require('../services/imageService');

// POST /api/upload
router.post('/upload', verifyToken, (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      // Handle Multer specific errors
      return res.status(400).json({ detail: err.message || 'File upload error' });
    }

    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ detail: 'No file uploaded or empty file buffer' });
      }

      // Determine upload category/preset from body or query (e.g., 'post', 'avatar', 'message', 'kyc')
      const type = req.body.type || req.query.type || 'default';

      // Automatically optimize image, strip EXIF, normalize rotation, convert to WebP and save
      const result = await imageService.optimizeAndSaveImage(req.file.buffer, {
        type: type,
        originalname: req.file.originalname
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error('Image optimization & upload error:', error);
      return res.status(400).json({ detail: error.message || 'Failed to process image' });
    }
  });
});

module.exports = router;

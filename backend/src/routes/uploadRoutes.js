const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { verifyToken } = require('../middleware/authMiddleware');

// POST /api/upload
router.post('/upload', verifyToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ detail: 'No file uploaded' });
    }
    const filename = req.file.filename;
    return res.status(200).json({ url: `/api/uploads/${filename}` });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ detail: error.message });
  }
});

module.exports = router;

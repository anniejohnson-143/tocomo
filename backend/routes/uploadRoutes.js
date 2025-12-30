//uploadRoutes.js
const express = require('express');
const router = express.Router();
const { upload, deleteFile } = require('../middleware/upload');
const { protect } = require('../middleware/authMiddleware');
const path = require('path');

// Single file upload
router.post('/single', protect, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  res.json({
    success: true,
    file: {
      url: `/uploads/${req.file.filename}`,
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      mediaType: req.file.mimetype.startsWith('image/') ? 'image' : 'video'
    }
  });
});

// Multiple files upload
router.post('/multiple', protect, upload.array('files', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files uploaded' });
  }

  const files = req.files.map(file => ({
    url: `/uploads/${file.filename}`,
    filename: file.filename,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    mediaType: file.mimetype.startsWith('image/') ? 'image' : 'video'
  }));

  res.json({ success: true, files });
});

// Delete file
router.delete('/:filename', protect, async (req, res) => {
  try {
    const deleted = await deleteFile(req.params.filename);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, message: 'Error deleting file' });
  }
});

module.exports = router;

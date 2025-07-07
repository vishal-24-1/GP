// Express server for handling test uploads
// Supports local file system and S3 (stub for serverless)

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());

const UPLOAD_DIR = path.join(__dirname, 'uploads', 'tests');
const ensureUploadDir = () => {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadDir();
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({ storage });

// Upload endpoint for answer key and response sheet only
app.post('/api/upload_test', upload.fields([
  { name: 'answer_key', maxCount: 1 },
  { name: 'response_sheet', maxCount: 1 },
]), (req, res) => {
  try {
    const answerKey = req.files['answer_key']?.[0];
    const responseSheet = req.files['response_sheet']?.[0];
    if (!answerKey || !responseSheet) {
      return res.status(400).json({ error: 'Both answer key and response sheet are required.' });
    }
    res.json({ success: true, message: 'Files uploaded', files: { answerKey: answerKey.filename, responseSheet: responseSheet.filename } });
  } catch (err) {
    res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});

// Upload endpoint: accepts any files, no validation, saves to /uploads/tests/
app.post('/api/upload', upload.array('files'), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }
    const uploadedFiles = req.files.map(f => ({
      originalName: f.originalname,
      savedAs: f.filename,
      size: f.size
    }));
    res.json({ success: true, message: 'Files uploaded', files: uploadedFiles });
  } catch (err) {
    res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => res.send('OK'));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Upload server running on port ${PORT}`));

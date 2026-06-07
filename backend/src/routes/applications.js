const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { UPLOAD_DIR, DRAWING_TYPES } = require('../config');
const applicationService = require('../services/applicationService');

const uploadDir = path.join(__dirname, '..', '..', UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({ storage });

router.get('/', (req, res) => {
  try {
    const { tenant_id } = req.query;
    let applications;
    if (tenant_id) {
      applications = applicationService.getApplicationsByTenant(tenant_id);
    } else {
      applications = applicationService.getAllApplications();
    }
    res.json(applications);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const application = applicationService.getApplicationById(req.params.id);
    if (!application) {
      return res.status(404).json({ error: '申请不存在' });
    }
    res.json(application);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { tenant_id, title, description } = req.body;
    if (!tenant_id || !title) {
      return res.status(400).json({ error: '缺少必填字段' });
    }
    const application = applicationService.createApplication(tenant_id, { title, description });
    res.status(201).json(application);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/submit', (req, res) => {
  try {
    const application = applicationService.submitApplication(req.params.id, req.body);
    res.json(application);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/review', (req, res) => {
  try {
    const { reviewer_id, status, comments } = req.body;
    if (!reviewer_id || !status) {
      return res.status(400).json({ error: '缺少必填字段' });
    }
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: '无效的审核状态' });
    }
    const application = applicationService.reviewApplication(req.params.id, reviewer_id, { status, comments });
    res.json(application);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/issue-permit', (req, res) => {
  try {
    const { issued_by, valid_from, valid_to, allowed_time_slots } = req.body;
    if (!issued_by || !valid_from || !valid_to) {
      return res.status(400).json({ error: '缺少必填字段' });
    }
    const application = applicationService.issuePermit(req.params.id, issued_by, {
      valid_from,
      valid_to,
      allowed_time_slots
    });
    res.json(application);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/drawings', upload.single('file'), (req, res) => {
  try {
    const { type } = req.body;
    if (!type || !DRAWING_TYPES.includes(type)) {
      return res.status(400).json({ error: '无效的图纸类型' });
    }
    if (!req.file) {
      return res.status(400).json({ error: '未上传文件' });
    }
    const drawing = applicationService.addDrawing(req.params.id, {
      type,
      file_name: req.file.originalname,
      file_path: req.file.filename
    });
    res.status(201).json(drawing);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/drawings/:drawingId', (req, res) => {
  try {
    applicationService.deleteDrawing(req.params.drawingId);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

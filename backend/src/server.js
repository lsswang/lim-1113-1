const express = require('express');
const cors = require('cors');
const path = require('path');
const { PORT } = require('./config');
const applicationRoutes = require('./routes/applications');
const userRoutes = require('./routes/users');
require('./db');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/config', (req, res) => {
  res.json({
    allowed_noise_slots: require('./config').ALLOWED_NOISE_SLOTS,
    drawing_types: require('./config').DRAWING_TYPES,
    status_map: {
      draft: '草稿',
      submitted: '已提交',
      reviewing: '会审中',
      rejected: '已驳回',
      approved: '会审通过',
      permit_pending: '待核发施工证',
      permit_issued: '施工证已核发'
    }
  });
});

app.use('/api/applications', applicationRoutes);
app.use('/api/users', userRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`租户装修会审系统后端服务已启动: http://localhost:${PORT}`);
  });
}

module.exports = app;

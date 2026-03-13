require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 정적 파일 서빙 (프론트엔드)
app.use(express.static(path.join(__dirname, '..')));

// API 라우트
app.use('/api/research', require('./routes/research'));
app.use('/api/copy', require('./routes/copy'));
app.use('/api/projects', require('./routes/projects'));

// 헬스 체크
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\n  Product Detail Tool Server`);
  console.log(`  ─────────────────────────`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  API:     http://localhost:${PORT}/api\n`);
});

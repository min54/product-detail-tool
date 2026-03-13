const express = require('express');
const router = express.Router();
const db = require('../services/db');

router.get('/', (req, res) => {
  const list = db.listProjects();
  res.json({ success: true, data: list });
});

router.get('/:id', (req, res) => {
  const project = db.getProject(Number(req.params.id));
  if (!project) return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다' });
  res.json({ success: true, data: project });
});

router.post('/', (req, res) => {
  const { name, data } = req.body;
  if (!name) return res.status(400).json({ error: '프로젝트명을 입력하세요' });
  const result = db.createProject(name, data || {});
  res.json({ success: true, data: result });
});

router.put('/:id', (req, res) => {
  const { name, data } = req.body;
  const result = db.updateProject(Number(req.params.id), name, data);
  res.json({ success: true, data: result });
});

router.delete('/:id', (req, res) => {
  db.deleteProject(Number(req.params.id));
  res.json({ success: true });
});

module.exports = router;

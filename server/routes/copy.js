const express = require('express');
const router = express.Router();
const { generateCopy } = require('../services/gemini');

// AI 카피 생성
router.post('/generate', async (req, res) => {
  try {
    const { productData } = req.body;
    if (!productData) return res.status(400).json({ error: '제품 데이터가 필요합니다' });

    console.log(`[Copy] AI 카피 생성 중...`);
    const result = await generateCopy(productData);
    res.json({ success: true, data: result });
  } catch (e) {
    console.error('[Copy] Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

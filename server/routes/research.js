const express = require('express');
const router = express.Router();
const { researchByName, researchByUrl } = require('../services/gemini');
const { scrapeUrl } = require('../services/scraper');

// 상품명으로 조사
router.post('/name', async (req, res) => {
  try {
    const { productName } = req.body;
    if (!productName) return res.status(400).json({ error: '상품명을 입력하세요' });

    console.log(`[Research] 상품명 조사: ${productName}`);
    const result = await researchByName(productName);
    res.json({ success: true, data: result });
  } catch (e) {
    console.error('[Research] Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// URL로 조사
router.post('/url', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL을 입력하세요' });

    console.log(`[Research] URL 크롤링: ${url}`);
    const scraped = await scrapeUrl(url);
    console.log(`[Research] 크롤링 완료, Gemini 분석 중...`);
    const result = await researchByUrl(url, scraped);
    res.json({ success: true, data: result, scraped });
  } catch (e) {
    console.error('[Research] Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

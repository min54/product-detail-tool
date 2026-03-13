const cheerio = require('cheerio');

// ── Gemini 서비스 ──
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

async function callGemini(prompt, options = {}) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: options.temperature || 0.7,
      maxOutputTokens: options.maxTokens || 4096,
      responseMimeType: 'application/json',
    },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned empty response');
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

async function researchByName(productName) {
  const prompt = `당신은 전자제품/가전제품 전문 리서처입니다.
다음 제품에 대해 상세페이지 제작에 필요한 모든 정보를 조사해서 JSON으로 반환하세요.

제품명: ${productName}

반드시 아래 JSON 형식으로 반환하세요:
{
  "brand": "브랜드명",
  "productName": "제품명 (한글)",
  "modelEn": "영문 모델명",
  "heroSub": "히어로 서브 카피 (짧은 한 줄)",
  "heroDesc": "히어로 설명 (2-3줄)",
  "certs": ["KC인증", "전자파적합", "기타 인증들"],
  "keySpecs": [
    {"val": "수치", "unit": "단위", "label": "설명"},
    {"val": "수치", "unit": "단위", "label": "설명"},
    {"val": "수치", "unit": "단위", "label": "설명"},
    {"val": "수치", "unit": "단위", "label": "설명"}
  ],
  "specTable": [["항목", "내용"]],
  "features": [
    {
      "tag": "기능 태그",
      "head": "헤드라인 카피",
      "desc": "상세 설명 (2-3줄)",
      "icons": [{"e": "이모지", "t": "아이콘 라벨"},{"e": "이모지", "t": "아이콘 라벨"},{"e": "이모지", "t": "아이콘 라벨"},{"e": "이모지", "t": "아이콘 라벨"}]
    }
  ],
  "safetyCards": [{"icon": "이모지", "title": "안전 기능명", "desc": "설명"}],
  "bigStats": [{"label": "라벨", "val": "수치", "unit": "단위", "caption": "부가설명"}],
  "darkSection": {"tag": "태그", "head": "헤드카피", "desc": "설명", "display": "대표 수치 (예: 24°C)", "displaySub": "부가 라벨"},
  "nightSection": {"db": "소음 수치", "head": "헤드카피", "desc": "설명"},
  "appSection": {"tag": "태그", "head": "헤드카피", "desc": "설명", "features": ["앱 기능1", "앱 기능2", "앱 기능3"]},
  "introHead": "소개 헤드카피",
  "introDesc": "소개 설명",
  "lifestyleTags": ["태그1", "태그2", "태그3", "태그4"],
  "disclaimer": "면책 조항 문구"
}

- 실제 제품 스펙을 기반으로 작성, 없으면 합리적으로 추정
- features 3~4개, safetyCards 4~6개, bigStats 2~3개
- 한국어로 작성`;

  return callGemini(prompt);
}

async function researchByUrl(url, scrapedData) {
  const prompt = `당신은 전자제품/가전제품 전문 리서처입니다.
아래는 상품 페이지에서 크롤링한 데이터입니다. 이 데이터를 분석하여 상세페이지 제작에 필요한 정보를 정리해주세요.

크롤링 원본 URL: ${url}
크롤링 데이터:
${JSON.stringify(scrapedData, null, 2)}

반드시 아래 JSON 형식으로 반환하세요:
{
  "brand": "브랜드명", "productName": "제품명 (한글)", "modelEn": "영문 모델명",
  "heroSub": "서브 카피", "heroDesc": "설명 2-3줄",
  "certs": ["인증1"], "keySpecs": [{"val":"수치","unit":"단위","label":"설명"}],
  "specTable": [["항목","내용"]],
  "features": [{"tag":"태그","head":"헤드","desc":"설명","icons":[{"e":"이모지","t":"라벨"}]}],
  "safetyCards": [{"icon":"이모지","title":"제목","desc":"설명"}],
  "bigStats": [{"label":"라벨","val":"수치","unit":"단위","caption":"부가"}],
  "darkSection": {"tag":"태그","head":"헤드","desc":"설명","display":"수치","displaySub":"라벨"},
  "nightSection": {"db":"소음","head":"헤드","desc":"설명"},
  "appSection": {"tag":"태그","head":"헤드","desc":"설명","features":["기능1"]},
  "introHead": "소개 헤드", "introDesc": "소개 설명",
  "lifestyleTags": ["태그1","태그2"], "disclaimer": "면책 조항"
}
한국어로, 크롤링 데이터 기반 + 부족한 정보 보완`;

  return callGemini(prompt);
}

async function generateCopy(productData) {
  const prompt = `당신은 대한민국 최고의 쇼핑몰 상세페이지 카피라이터입니다.
아래 제품 데이터를 기반으로 구매 전환율을 높이는 매력적인 마케팅 카피를 작성하세요.

제품 데이터:
${JSON.stringify(productData, null, 2)}

반드시 아래 JSON 형식으로 반환:
{
  "heroSub": "임팩트 서브 카피",
  "heroDesc": "히어로 설명 2-3줄",
  "introHead": "소개 헤드카피 (줄바꿈 \\n)",
  "introDesc": "소개 설명",
  "statsHead": "수치 섹션 헤드",
  "statsDesc": "수치 설명",
  "darkTag": "다크 태그", "darkHead": "다크 헤드", "darkDesc": "다크 설명",
  "nightHead": "야간 헤드", "nightDesc": "야간 설명",
  "appTag": "앱 태그", "appHead": "앱 헤드", "appDesc": "앱 설명",
  "features": [{"tag":"태그","head":"헤드 (\\n줄바꿈)","desc":"설명"}],
  "safetyCards": [{"title":"제목 4글자","desc":"설명 1줄"}]
}
- 짧고 강렬한 헤드 + 구체적 설명, 과장 없이 매력적으로, 한국어 네이티브`;

  return callGemini(prompt);
}

// ── 스크래퍼 ──
async function scrapeUrl(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  return parseHtml(html, url);
}

function parseHtml(html, url) {
  const $ = cheerio.load(html);
  const title = $('meta[property="og:title"]').attr('content') || $('h1').first().text().trim() || $('title').text().trim();
  const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
  const price = $('[class*="price"]').first().text().trim() || '';
  const images = [];
  $('meta[property="og:image"]').each((_, el) => { const s = $(el).attr('content'); if (s) images.push(resolveUrl(s, url)); });
  $('img[src]').each((_, el) => {
    const s = $(el).attr('src');
    if (s && !s.includes('icon') && !s.includes('logo')) { const r = resolveUrl(s, url); if (!images.includes(r)) images.push(r); }
  });
  const specs = [];
  $('table').each((_, table) => {
    $(table).find('tr').each((_, tr) => {
      const cells = $(tr).find('td, th');
      if (cells.length >= 2) { const k = $(cells[0]).text().trim(), v = $(cells[1]).text().trim(); if (k && v && k.length < 50) specs.push([k, v]); }
    });
  });
  const bodyTexts = [];
  $('p, [class*="desc"], [class*="detail"]').each((_, el) => { const t = $(el).text().trim(); if (t.length > 20 && t.length < 500) bodyTexts.push(t); });
  const features = [];
  $('li, [class*="feature"]').each((_, el) => { const t = $(el).text().trim(); if (t.length > 5 && t.length < 200) features.push(t); });
  return { title, description, price, images: images.slice(0, 10), specs: specs.slice(0, 20), bodyTexts: bodyTexts.slice(0, 15), features: features.slice(0, 20), url };
}

function resolveUrl(src, base) { try { return new URL(src, base).href; } catch { return src; } }

// ── 프로젝트 저장 (Netlify Blobs 대신 메모리 — 데모용) ──
let projectsStore = { projects: [], nextId: 1 };

// ── 핸들러 ──
exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  const path = event.path.replace('/.netlify/functions/api', '').replace('/api', '') || '/';
  const method = event.httpMethod;
  let body = {};
  try { if (event.body) body = JSON.parse(event.body); } catch {}

  try {
    // Health
    if (path === '/health' || path === '/') {
      return { statusCode: 200, headers, body: JSON.stringify({ status: 'ok' }) };
    }

    // Research by name
    if (path === '/research/name' && method === 'POST') {
      if (!body.productName) return { statusCode: 400, headers, body: JSON.stringify({ error: '상품명을 입력하세요' }) };
      const data = await researchByName(body.productName);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, data }) };
    }

    // Research by URL
    if (path === '/research/url' && method === 'POST') {
      if (!body.url) return { statusCode: 400, headers, body: JSON.stringify({ error: 'URL을 입력하세요' }) };
      const scraped = await scrapeUrl(body.url);
      const data = await researchByUrl(body.url, scraped);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, data, scraped }) };
    }

    // Copy generate
    if (path === '/copy/generate' && method === 'POST') {
      if (!body.productData) return { statusCode: 400, headers, body: JSON.stringify({ error: '제품 데이터 필요' }) };
      const data = await generateCopy(body.productData);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, data }) };
    }

    // Projects CRUD
    if (path === '/projects' && method === 'GET') {
      const list = projectsStore.projects.map(p => ({ id: p.id, name: p.name, created_at: p.created_at, updated_at: p.updated_at }));
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, data: list }) };
    }
    if (path === '/projects' && method === 'POST') {
      const now = new Date().toISOString();
      const project = { id: projectsStore.nextId++, name: body.name, data: body.data, created_at: now, updated_at: now };
      projectsStore.projects.push(project);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, data: { id: project.id, name: project.name } }) };
    }
    const projectMatch = path.match(/^\/projects\/(\d+)$/);
    if (projectMatch) {
      const id = Number(projectMatch[1]);
      if (method === 'GET') {
        const p = projectsStore.projects.find(p => p.id === id);
        if (!p) return { statusCode: 404, headers, body: JSON.stringify({ error: '프로젝트 없음' }) };
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, data: p }) };
      }
      if (method === 'PUT') {
        const p = projectsStore.projects.find(p => p.id === id);
        if (p) { p.name = body.name; p.data = body.data; p.updated_at = new Date().toISOString(); }
        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
      }
      if (method === 'DELETE') {
        projectsStore.projects = projectsStore.projects.filter(p => p.id !== id);
        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
      }
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};

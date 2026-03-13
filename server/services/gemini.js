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

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
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
  "specTable": [
    ["항목", "내용"],
    ["항목", "내용"]
  ],
  "features": [
    {
      "tag": "기능 태그",
      "head": "헤드라인 카피",
      "desc": "상세 설명 (2-3줄)",
      "icons": [
        {"e": "이모지", "t": "아이콘 라벨"},
        {"e": "이모지", "t": "아이콘 라벨"},
        {"e": "이모지", "t": "아이콘 라벨"},
        {"e": "이모지", "t": "아이콘 라벨"}
      ]
    }
  ],
  "safetyCards": [
    {"icon": "이모지", "title": "안전 기능명", "desc": "설명"}
  ],
  "bigStats": [
    {"label": "라벨", "val": "수치", "unit": "단위", "caption": "부가설명"}
  ],
  "darkSection": {
    "tag": "태그",
    "head": "헤드카피",
    "desc": "설명",
    "display": "대표 수치 (예: 24°C)",
    "displaySub": "부가 라벨"
  },
  "nightSection": {
    "db": "소음 수치",
    "head": "헤드카피",
    "desc": "설명"
  },
  "appSection": {
    "tag": "태그",
    "head": "헤드카피",
    "desc": "설명",
    "features": ["앱 기능1", "앱 기능2", "앱 기능3"]
  },
  "introHead": "소개 헤드카피",
  "introDesc": "소개 설명",
  "lifestyleTags": ["태그1", "태그2", "태그3", "태그4"],
  "disclaimer": "면책 조항 문구"
}

- 실제 제품 스펙을 기반으로 작성하세요
- 수치는 정확하게, 없으면 합리적으로 추정하세요
- features는 반드시 4개 작성하세요
- safetyCards는 4~6개 작성하세요
- bigStats는 2~3개 작성하세요
- 한국어로 작성하세요`;

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
  "brand": "브랜드명",
  "productName": "제품명 (한글)",
  "modelEn": "영문 모델명",
  "heroSub": "히어로 서브 카피 (짧은 한 줄)",
  "heroDesc": "히어로 설명 (2-3줄)",
  "certs": ["인증1", "인증2"],
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
      "desc": "상세 설명",
      "icons": [{"e": "이모지", "t": "라벨"}, {"e": "이모지", "t": "라벨"}, {"e": "이모지", "t": "라벨"}, {"e": "이모지", "t": "라벨"}]
    }
  ],
  "safetyCards": [{"icon": "이모지", "title": "안전 기능명", "desc": "설명"}],
  "bigStats": [{"label": "라벨", "val": "수치", "unit": "단위", "caption": "부가설명"}],
  "darkSection": {"tag": "태그", "head": "헤드카피", "desc": "설명", "display": "대표 수치", "displaySub": "부가 라벨"},
  "nightSection": {"db": "소음 수치", "head": "헤드카피", "desc": "설명"},
  "appSection": {"tag": "태그", "head": "헤드카피", "desc": "설명", "features": ["기능1", "기능2"]},
  "introHead": "소개 헤드카피",
  "introDesc": "소개 설명",
  "lifestyleTags": ["태그1", "태그2", "태그3", "태그4"],
  "disclaimer": "면책 조항"
}

- 크롤링 데이터에서 추출 가능한 정보는 그대로 사용하세요
- 부족한 정보는 제품 특성에 맞게 보완하세요
- 한국어로 작성하세요`;

  return callGemini(prompt);
}

async function generateCopy(productData) {
  const prompt = `당신은 대한민국 최고의 쇼핑몰 상세페이지 카피라이터입니다.
아래 제품 데이터를 기반으로 구매 전환율을 높이는 매력적인 마케팅 카피를 작성하세요.

제품 데이터:
${JSON.stringify(productData, null, 2)}

반드시 아래 JSON 형식으로 반환하세요:
{
  "heroSub": "감성적이고 임팩트 있는 서브 카피 (한 줄)",
  "heroDesc": "고객의 마음을 사로잡는 히어로 설명 (2-3줄)",
  "introHead": "제품 소개 헤드카피 (줄바꿈은 \\n 사용)",
  "introDesc": "제품 소개 상세 설명",
  "statsHead": "수치 강조 섹션 헤드카피",
  "statsDesc": "수치 섹션 설명",
  "darkTag": "다크 섹션 태그",
  "darkHead": "다크 섹션 헤드카피 (임팩트 있게)",
  "darkDesc": "다크 섹션 설명",
  "nightHead": "야간 모드 헤드카피",
  "nightDesc": "야간 모드 설명",
  "appTag": "앱 섹션 태그",
  "appHead": "앱 섹션 헤드카피",
  "appDesc": "앱 섹션 설명",
  "features": [
    {
      "tag": "기능 태그 (짧고 임팩트 있게)",
      "head": "기능 헤드카피 (2줄, \\n으로 줄바꿈)",
      "desc": "기능 상세 설명 (감성적이면서 구체적)"
    }
  ],
  "safetyCards": [
    {"title": "안전 기능 제목 (4글자 내외)", "desc": "간결한 설명 (1줄)"}
  ]
}

작성 규칙:
- 고객이 "이거 사야겠다"고 느끼게 만드는 카피
- 수치와 감성을 적절히 믹스
- 짧고 강렬한 헤드카피 + 구체적인 설명
- 과장 없이 매력적으로
- 한국어 네이티브 표현 사용`;

  return callGemini(prompt);
}

module.exports = { callGemini, researchByName, researchByUrl, generateCopy };

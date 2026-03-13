const cheerio = require('cheerio');

async function scrapeUrl(url) {
  // 먼저 간단한 fetch로 시도
  try {
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
  } catch (e) {
    console.log('Simple fetch failed, trying puppeteer:', e.message);
    return scrapeDynamic(url);
  }
}

function parseHtml(html, url) {
  const $ = cheerio.load(html);

  // 제목
  const title =
    $('meta[property="og:title"]').attr('content') ||
    $('h1').first().text().trim() ||
    $('title').text().trim();

  // 설명
  const description =
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') || '';

  // 가격
  const price =
    $('[class*="price"]').first().text().trim() ||
    $('[id*="price"]').first().text().trim() || '';

  // 이미지들
  const images = [];
  $('meta[property="og:image"]').each((_, el) => {
    const src = $(el).attr('content');
    if (src) images.push(resolveUrl(src, url));
  });
  $('img[src]').each((_, el) => {
    const src = $(el).attr('src');
    if (src && !src.includes('icon') && !src.includes('logo') && !src.includes('banner')) {
      const resolved = resolveUrl(src, url);
      if (!images.includes(resolved)) images.push(resolved);
    }
  });

  // 스펙 테이블
  const specs = [];
  $('table').each((_, table) => {
    $(table).find('tr').each((_, tr) => {
      const cells = $(tr).find('td, th');
      if (cells.length >= 2) {
        const key = $(cells[0]).text().trim();
        const val = $(cells[1]).text().trim();
        if (key && val && key.length < 50 && val.length < 200) {
          specs.push([key, val]);
        }
      }
    });
  });

  // dl/dt/dd 스펙
  $('dl').each((_, dl) => {
    const dts = $(dl).find('dt');
    const dds = $(dl).find('dd');
    dts.each((i, dt) => {
      const key = $(dt).text().trim();
      const val = $(dds.eq(i)).text().trim();
      if (key && val) specs.push([key, val]);
    });
  });

  // 본문 텍스트 (주요 설명)
  const bodyTexts = [];
  $('p, [class*="desc"], [class*="detail"], [class*="info"], [class*="content"]').each((_, el) => {
    const t = $(el).text().trim();
    if (t.length > 20 && t.length < 500) bodyTexts.push(t);
  });

  // 특징/기능 리스트
  const features = [];
  $('li, [class*="feature"], [class*="benefit"]').each((_, el) => {
    const t = $(el).text().trim();
    if (t.length > 5 && t.length < 200) features.push(t);
  });

  return {
    title,
    description,
    price,
    images: images.slice(0, 10),
    specs: specs.slice(0, 20),
    bodyTexts: bodyTexts.slice(0, 15),
    features: features.slice(0, 20),
    url,
  };
}

function resolveUrl(src, base) {
  try {
    return new URL(src, base).href;
  } catch {
    return src;
  }
}

async function scrapeDynamic(url) {
  let browser;
  try {
    const puppeteer = require('puppeteer');
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
    const html = await page.content();
    return parseHtml(html, url);
  } catch (e) {
    throw new Error(`Scraping failed: ${e.message}`);
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { scrapeUrl };

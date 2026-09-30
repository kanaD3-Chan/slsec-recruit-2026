/**
 * 生成讲台用的打印版讲稿
 * ------------------------------------------------------------------
 * 用法：
 *   node scripts/make-handout.mjs
 *
 * 读 index.html，输出 讲稿-打印版.html。
 *
 * 为什么不直接用 逐字稿.md：
 *   Markdown 控制不了打印版式 —— 分页、字号、页边距全都不行。
 *   而讲台上的稿子最要紧的就是「翻一页纸 = 翻一页幻灯片」，
 *   所以做成 HTML，用 @media print 精确控制分页。
 *   顺带这个文件在平板/手机上直接打开也能看，字号是照阅读调的。
 *
 * 版式上的几个决定：
 *   · 一页 A4 只放一页幻灯片的稿子 —— 翻纸与翻片一一对应
 *   · 正文用无衬线体而不是 Maple Mono —— 等宽适合显示代码，
 *     不适合在讲台上低头速读；屏幕上那块仍然用等宽，跟 deck 呼应
 *   · 页脚标「下页 →」，翻片卡壳时一眼知道该往哪走
 *   · 每页标预估时长，方便现场配速
 */

import {readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const src = readFileSync(join(ROOT, 'index.html'), 'utf8');

/* ── 工具 ─────────────────────────────────────────────────── */

const decode = (s) =>
  s
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');

const trim = (s) => {
  const lines = s.split('\n').map((l) => l.replace(/\s+$/, ''));
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  return lines.join('\n');
};

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** 把讲稿里的 **加粗** 和段落转成 HTML */
const prose = (text) =>
  text
    .split(/\n\s*\n/)
    .map((block) => {
      const t = esc(block.trim())
        .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
        .replace(/`(.+?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
      return `<p>${t}</p>`;
    })
    .join('\n');

/* ── 解析 index.html ──────────────────────────────────────── */

const chunks = src.split('<section class="slide').slice(1);

const pages = chunks.map((ch) => {
  const mn = ch.match(/<span>(\d\d)\s*\/\s*17<\/span>/);
  const num = mn ? mn[1] : '00';

  const mt = ch.match(/<h[12] class="term-h[12]"[^>]*>([\s\S]*?)<\/h[12]>/);
  let title = mt ? trim(decode(mt[1])).replace(/\n/g, ' ').trim() : '';
  if (!num || num === '00') title = '开场片';

  const mb = ch.match(/<pre class="term-block[^"]*"[^>]*>([\s\S]*?)<\/pre>/);
  const body = mb ? trim(decode(mb[1])) : '';

  const mnote = ch.match(/<div class="notes">([\s\S]*?)<\/div>/);
  let notes = mnote ? mnote[1] : '';
  // notes 已经是 HTML（<p>/<strong>），这里转回 markdown 再统一走 prose()
  notes = notes
    .replace(/<\/p>\s*<p>/g, '\n\n')
    .replace(/<\/?p>/g, '')
    .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
    .replace(/<[^>]+>/g, '');
  notes = trim(decode(notes));

  return {num, title, body, notes};
});

/* 没有 term-block 的页，手工补「屏幕上」 */
const EXTRA = {
  '00': '[ 全屏播放招新视频 · 19 秒 ]',
  '16':
    '[ 01 ] slsec-recruit-2026   github.com/kanaD3-Chan/slsec-recruit-2026   AGPL-3.0\n' +
    '[ 02 ] slsec-recruit-video  github.com/kanaD3-Chan/slsec-recruit-video  AGPL-3.0',
};

/* ── 生成 ─────────────────────────────────────────────────── */

const totalChars = pages.reduce((a, p) => a + p.notes.length, 0);
/** 全篇讲稿预计时长（分钟）。按中文演讲 220 字/分钟估。 */
const TOTAL_MIN = totalChars / 220;

const sheet = (p, i) => {
  const next = pages[i + 1];
  const body = p.body || EXTRA[p.num] || '';
  const label = p.num === '00' ? '开场片' : `${p.num} / 17`;
  // 每页时长 = 该页字数占全篇的比例 × 全篇总时长。
  // 别再除页数 —— 那会把时间摊薄成每页几秒，完全失真。
  const secs = Math.max(5, Math.round((p.notes.length / totalChars) * TOTAL_MIN * 60));
  const timeText =
    secs >= 60 ? `约 ${(secs / 60).toFixed(1)} 分钟` : `约 ${secs} 秒`;

  return `
<section class="sheet${p.num === '00' ? ' cover' : ''}">
  <header class="sh-head">
    <span class="sh-num">${label}</span>
    <span class="sh-title">${esc(p.title)}</span>
    <span class="sh-time">${timeText}</span>
  </header>

  ${body ? `<pre class="sh-screen">${esc(body)}</pre>` : ''}

  <div class="sh-script">
    ${prose(p.notes)}
  </div>

  <footer class="sh-foot">
    ${next ? `<span>下页 → ${next.num === '00' ? '开场片' : next.num + ' · ' + esc(next.title)}</span>` : '<span>全篇结束</span>'}
    <span class="sh-page">${i + 1} / ${pages.length}</span>
  </footer>
</section>`;
};

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>SLsec 2026 招新宣讲 · 讲台稿</title>
<style>
/* ==========================================================================
   讲台稿（打印版）
   --------------------------------------------------------------------------
   用法：浏览器打开 → Ctrl+P → A4 / 纵向 / 边距「默认」/ 勾选「背景图形」
   一页纸 = 一页幻灯片，翻纸与翻片一一对应。
   ========================================================================== */

@page { size: A4 portrait; margin: 14mm 16mm; }

:root {
  --ink: #111;
  --dim: #666;
  --line: #ccc;
  --accent: #0a7a3a;
  --box: #f4f4f2;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  /* 正文用无衬线：等宽适合看代码，不适合在讲台上低头速读 */
  font-family: "Noto Sans SC", "Microsoft YaHei UI", "Microsoft YaHei", sans-serif;
  color: var(--ink);
  background: #e8e8e6;
  -webkit-font-smoothing: antialiased;
}

.sheet {
  width: 210mm;
  min-height: 297mm;
  padding: 14mm 16mm;
  margin: 8mm auto;
  background: #fff;
  box-shadow: 0 2px 14px rgba(0,0,0,.16);
  display: flex;
  flex-direction: column;
  /* 打印时让分页发生在每一「页」之间 */
  break-after: page;
  page-break-after: always;
}
.sheet:last-child { break-after: auto; page-break-after: auto; }

/* ── 页眉 ── */
.sh-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--ink);
  margin-bottom: 14px;
}
.sh-num {
  font-family: "Maple Mono CN", Consolas, monospace;
  font-size: 15px;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: .06em;
  flex: 0 0 auto;
}
.sh-title {
  font-size: 23px;
  font-weight: 700;
  flex: 1 1 auto;
}
.sh-time {
  font-size: 12px;
  color: var(--dim);
  flex: 0 0 auto;
}

/* ── 屏幕上那块：用等宽 + 淡底，跟 deck 呼应 ── */
.sh-screen {
  font-family: "Maple Mono CN", Consolas, monospace;
  font-size: 15px;
  line-height: 1.75;
  white-space: pre-wrap;
  background: var(--box);
  border-left: 4px solid var(--accent);
  padding: 10px 14px;
  margin: 0 0 20px;
  color: #333;
}

/* ── 讲稿正文 ── */
.sh-script { flex: 1 1 auto; }
.sh-script p {
  /* 字号给大：讲台上是低头扫一眼，不是坐着精读。
     页面留白多是正常的，那正好是现场用笔做标记的地方。 */
  font-size: 22px;
  line-height: 2.0;
  margin: 0 0 18px;
}
.sh-script b {
  /* 细线下划线式高亮，不是满格荧光笔。
     讲稿里加粗本来就多（提示词里要求"加粗核心词"），
     整块涂黄会糊成一片，反而失去锚点的作用。 */
  color: #000;
  font-weight: 700;
  background: linear-gradient(transparent 82%, #ffd84d 82%);
}
.sh-script code {
  font-family: "Maple Mono CN", Consolas, monospace;
  font-size: .88em;
  background: var(--box);
  padding: 1px 5px;
  border-radius: 3px;
}

/* ── 页脚 ── */
.sh-foot {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--dim);
  border-top: 1px solid var(--line);
  padding-top: 8px;
  margin-top: 16px;
}
.sh-page { font-family: "Maple Mono CN", Consolas, monospace; }

/* 开场片那页给个提示条 */
.sheet.cover .sh-script::before {
  content: "提示：「屏幕上」是投影画面。放片前先起个头，再按空格起播。";
  display: block;
  font-size: 13px;
  color: #8a6d00;
  background: #fff8e0;
  border-left: 4px solid #e0b000;
  padding: 8px 12px;
  margin-bottom: 18px;
}

@media print {
  body { background: #fff; }
  .sheet {
    width: auto;
    min-height: 0;
    padding: 0;
    margin: 0;
    box-shadow: none;
  }
}
</style>
</head>
<body>
${pages.map(sheet).join('\n')}
</body>
</html>
`;

writeFileSync(join(ROOT, '讲稿-打印版.html'), html, 'utf8');

console.log(`讲稿-打印版.html 已生成 · ${pages.length} 页 · 讲稿共 ${totalChars} 字`);
console.log('打印：浏览器里 Ctrl+P → A4 / 纵向 / 勾选「背景图形」');

/**
 * 生成讲稿的两个交付版本
 * ------------------------------------------------------------------
 * 用法：
 *   node scripts/make-notes.mjs
 *
 * 读 index.html 各页的 .notes，输出两份：
 *
 *   逐字稿.md          纯文本版 —— 发群里、分工、存档，谁都打得开
 *   讲稿-打印版.html    讲台版 —— 一页 A4 = 一页幻灯片，翻纸与翻片同步
 *
 * ------------------------------------------------------------------
 * 为什么两份都从 index.html 派生
 *
 * 讲稿散在三处最容易漂：deck 里的 notes、md、打印版。
 * 定成单一源头（index.html 的 .notes），其余全部生成，
 * 就不会出现「md 改了但投影上还是旧的」这种事。
 *
 * 所以：**要改讲稿，改 index.html 里的 .notes，然后跑这个脚本。**
 * ------------------------------------------------------------------
 */

import {readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const src = readFileSync(join(ROOT, 'index.html'), 'utf8');

/** 中文演讲的估算语速（字/分钟） */
const CPS = 220;

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

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** HTML 的 notes → 纯文本 markdown（<strong> 还原成 **） */
const toMarkdown = (html) =>
  trim(
    decode(
      html
        .replace(/<\/p>\s*<p>/g, '\n\n')
        .replace(/<\/?p>/g, '')
        .replace(/<strong>(.*?)<\/strong>/g, '**$1**'),
    ),
  );

/** 纯文本 → 打印版 HTML（段落包 <p>，** 转 <b>，` 转 <code>） */
const toProse = (text) =>
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

const pages = src
  .split('<section class="slide')
  .slice(1)
  .map((ch) => {
    const mn = ch.match(/<span>(\d\d)\s*\/\s*17<\/span>/);
    const num = mn ? mn[1] : '00';

    const mt = ch.match(/<h[12] class="term-h[12]"[^>]*>([\s\S]*?)<\/h[12]>/);
    let title = mt ? trim(decode(mt[1])).replace(/\n/g, ' ').trim() : '';
    if (num === '00') title = '开场片（招新视频）';

    const mb = ch.match(/<pre class="term-block[^"]*"[^>]*>([\s\S]*?)<\/pre>/);
    const body = mb ? trim(decode(mb[1])) : '';

    const mnote = ch.match(/<div class="notes">([\s\S]*?)<\/div>/);
    const notes = mnote ? toMarkdown(mnote[1]) : '';

    return {num, title, body, notes};
  });

/** 没有 term-block 的页，手工补「屏幕上」的内容 */
const SCREEN = {
  '00': null, // 开场片屏幕上是视频，单独写一句话
  '16':
    '[ 01 ] slsec-recruit-2026   github.com/kanaD3-Chan/slsec-recruit-2026   AGPL-3.0\n' +
    '[ 02 ] slsec-recruit-video  github.com/kanaD3-Chan/slsec-recruit-video  AGPL-3.0',
};

/** 有 term-block、但页面上还有别的关键信息要一并带上 */
const SCREEN_APPEND = {
  '12': '\n\n报名入口  172.16.173.140   （连校园网，现在就能注册）',
};

const totalChars = pages.reduce((a, p) => a + p.notes.length, 0);
const totalMin = totalChars / CPS;

/* ── 逐字稿.md ────────────────────────────────────────────── */

const md = [];
md.push('# SLsec 2026 招新宣讲 · 逐字稿\n');
md.push('> 配合 `index.html` 使用，**页号与 deck 右下角一致**。');
md.push('> 这份是纯文本版，方便发群里、几个人分工各讲几页。');
md.push('>');
md.push('> 讲台用的打印版见 [`讲稿-打印版.html`](讲稿-打印版.html)。');
md.push('> 本场是单屏，演示时看不到讲者窗口，`S` 键已禁用 —— 稿子请打出来或放第二台设备。');
md.push('>');
md.push(`> 全篇讲稿约 **${totalChars} 字**。按每分钟 ${CPS} 字算，**光念稿约 ${Math.round(totalMin)} 分钟**；`);
md.push('> 加上现场演示、放片和提问，整场预留 **25–30 分钟**比较稳。\n');
md.push('---\n');

for (const p of pages) {
  md.push(`## ${p.num} · ${p.title}\n`);

  if (p.num === '00') {
    md.push('> 全屏播放招新视频（19 秒），播完屏幕底部浮出一行「这条片子是纯代码工作流生成的」。\n');
  } else {
    const scr = p.body || SCREEN[p.num];
    if (scr) {
      md.push('**屏幕上**\n');
      md.push('```text');
      md.push(scr);
      md.push('```\n');
    }
    if (p.num === '15') {
      md.push('> 页面右侧另有一个二维码，指向 `kanade-chan.top/ctf/first-step.html`。\n');
    }
  }

  if (p.notes) {
    md.push('**讲稿**\n');
    md.push(p.notes + '\n');
  }
  md.push('---\n');
}

md.push('## 现场提示\n');
md.push('- **第 0 页**：不会自动播。先用两句话起个头，再按空格或回车起播。');
md.push('- **第 11 页（现场演示）**：切到 Cheat Engine 之前先停在这一页，观众能看到四步 runbook。');
md.push('  万一翻车，**按 `V` 播放录屏备份**，再按 `V` 或 `Esc` 关闭。录像播放期间键盘翻页被屏蔽，不会误触跳页。');
md.push('- **第 14 页**：QQ 群码会过期，**演示前务必手机扫一次确认**。');
md.push('- **第 15 页**：全场唯一要观众掏手机的一页，讲慢一点，留出拍照时间。');
md.push('- **第 16 页**：开源凭证。别一念而过 —— 这是「我们真的开源」的实证。');

writeFileSync(join(ROOT, '逐字稿.md'), md.join('\n'), 'utf8');

/* ── 讲稿-打印版.html ────────────────────────────────────── */

const sheet = (p, i) => {
  const next = pages[i + 1];
  let scr = p.body || SCREEN[p.num] || '';
  if (scr && SCREEN_APPEND[p.num]) scr += SCREEN_APPEND[p.num];
  const label = p.num === '00' ? '开场片' : `${p.num} / 17`;
  // 每页时长 = 该页字数占全篇的比例 × 全篇总时长。别再除页数，那会把时间摊薄成几秒。
  const secs = Math.max(5, Math.round((p.notes.length / totalChars) * totalMin * 60));
  const timeText = secs >= 60 ? `约 ${(secs / 60).toFixed(1)} 分钟` : `约 ${secs} 秒`;

  return `
<section class="sheet${p.num === '00' ? ' cover' : ''}">
  <header class="sh-head">
    <span class="sh-num">${label}</span>
    <span class="sh-title">${esc(p.title)}</span>
    <span class="sh-time">${timeText}</span>
  </header>

  ${scr ? `<pre class="sh-screen">${esc(scr)}</pre>` : ''}

  <div class="sh-script">
    ${toProse(p.notes)}
  </div>

  <footer class="sh-foot">
    <span>${next ? `下页 → ${next.num} · ${esc(next.title)}` : '全篇结束'}</span>
    <span class="sh-page">${i + 1} / ${pages.length}</span>
  </footer>
</section>`;
};

const handout = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>SLsec 2026 招新宣讲 · 讲台稿</title>
<style>
/* ==========================================================================
   讲台稿（打印版）· 由 scripts/make-notes.mjs 自动生成，请勿手改
   --------------------------------------------------------------------------
   打印：浏览器 Ctrl+P → A4 / 纵向 / 勾选「背景图形」
   一页纸 = 一页幻灯片，翻纸与翻片一一对应。
   ========================================================================== */

/* 字体自带一份。这个文件可能被单独拷走（打印店、别人的电脑），
   不引字体的话「屏幕上」那块会掉回 Consolas，跟 deck 对不上。 */
@font-face {
  font-family: 'Maple Mono CN';
  src: url('./assets/fonts/MapleMono-CN-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: block;
}
@font-face {
  font-family: 'Maple Mono CN';
  src: url('./assets/fonts/MapleMono-CN-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: block;
}

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
  break-after: page;
  page-break-after: always;
}
.sheet:last-child { break-after: auto; page-break-after: auto; }

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
.sh-title { font-size: 23px; font-weight: 700; flex: 1 1 auto; }
.sh-time { font-size: 12px; color: var(--dim); flex: 0 0 auto; }

/* 「屏幕上」那块：等宽 + 淡底，跟 deck 呼应 */
.sh-screen {
  font-family: "Maple Mono CN", Consolas, monospace;
  font-size: 14.5px;
  line-height: 1.7;
  white-space: pre-wrap;
  background: var(--box);
  border-left: 4px solid var(--accent);
  padding: 10px 14px;
  margin: 0 0 20px;
  color: #333;
}

.sh-script { flex: 1 1 auto; }
.sh-script p {
  /* 字号给大：讲台上是低头扫一眼，不是坐着精读。
     页面留白多是正常的，那正好是现场用笔做标记的地方。 */
  font-size: 21px;
  line-height: 1.92;
  margin: 0 0 15px;
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

writeFileSync(join(ROOT, '讲稿-打印版.html'), handout, 'utf8');

/* ── 汇总 ─────────────────────────────────────────────────── */

console.log(`讲稿共 ${totalChars} 字 · 约 ${Math.round(totalMin)} 分钟 · ${pages.length} 页`);
console.log('  ✓ 逐字稿.md');
console.log('  ✓ 讲稿-打印版.html   （Ctrl+P → A4 / 纵向 / 勾选「背景图形」）');

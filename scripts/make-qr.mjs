/**
 * 生成第 14 页的二维码
 * ------------------------------------------------------------------
 * 用法（需要有 qrcode 包的目录，比如招新视频项目）：
 *   cd ../招新视频 && node ../招新PPT/scripts/make-qr.mjs
 *
 * 或者在本文件夹临时装一次：
 *   npm i qrcode && node scripts/make-qr.mjs
 *
 * 输出：assets/qr-first-step.svg
 *
 * ------------------------------------------------------------------
 * 参数为什么这么选：
 *
 *   纠错等级 H（可容忍约 30% 污损）
 *     投影会被环境光、镜头畸变、后排距离一起折腾。H 级留的余量最大，
 *     代价是模块变密 —— 对这个长度的 URL 来说完全值得。
 *
 *   纯黑模块 + 纯白底，不做反色
 *     QR 规范是「深色模块、浅色底」。反色码有一部分扫码器不认，
 *     视频里那个鬼影是刻意为难，这个是给人用的，不折腾。
 *
 *   4 模块静默区
 *     静默区是扫码成功率的关键，很多人做二维码就栽在省了这一圈白边。
 *     这里留满 4 模块（在 SVG 里就包含进去了）。
 *
 *   合并成单条 path
 *     37×37 的矩阵逐模块画要 800 多个 <rect>，合并横向连续块之后
 *     SVG 只有 5KB，而且缩放时边缘更干净。
 * ------------------------------------------------------------------
 */
import QRCode from 'qrcode';
import {writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'assets', 'qr-first-step.svg');

/** 要编码的地址。改这里，然后重跑本脚本。 */
const URL = 'https://kanade-chan.top/ctf/first-step.html';

const qr = QRCode.create(URL, {errorCorrectionLevel: 'H'});
const size = qr.modules.size;
const data = qr.modules.data;
const QUIET = 4;
const full = size + QUIET * 2;

let d = '';
for (let y = 0; y < full; y++) {
  for (let x = 0; x < full; x++) {
    const mx = x - QUIET;
    const my = y - QUIET;
    const on = mx >= 0 && my >= 0 && mx < size && my < size && data[my * size + mx];
    if (!on) continue;
    // 往右吃连续的黑块，合成一条横线
    let w = 1;
    while (x + w < full) {
      const nx = x + w - QUIET;
      if (nx < 0 || nx >= size) break;
      if (!data[(y - QUIET) * size + nx]) break;
      w++;
    }
    d += `M${x} ${y}h${w}v1h-${w}z`;
    x += w - 1;
  }
}

const svg =
  `<svg class="qr-svg" viewBox="0 0 ${full} ${full}" shape-rendering="crispEdges" ` +
  `xmlns="http://www.w3.org/2000/svg" aria-label="扫码访问 ${URL}">` +
  `<rect width="${full}" height="${full}" fill="#fff"/>` +
  `<path d="${d}" fill="#000"/></svg>`;

writeFileSync(OUT, svg);

console.log(`版本 ${(size - 17) / 4} · ${size}×${size} 模块 · 含静默区 ${full}×${full}`);
console.log(`纠错等级 H · 内容 ${URL.length} 字符`);
console.log(`输出 ${OUT}（${(svg.length / 1024).toFixed(1)} KB）`);

# 第三方资源与许可

本仓库中由 SLsec 实验室创作的部分采用 **GNU Affero General Public License v3.0**
（AGPL-3.0，见 [LICENSE](LICENSE)）。

Copyright (C) 2026 SLsec 网络安全实验室（平顶山学院信息工程学院）

仓库里包含两处第三方资源，它们**适用各自的许可协议**，AGPL-3.0 不覆盖、也不能重新授权它们。

---

## 1. Maple Mono CN 字体

| | |
|---|---|
| 位置 | `assets/fonts/MapleMono-CN-*.woff2` |
| 来源 | https://github.com/subframe7536/maple-font |
| 版本 | v7.9 |
| 作者 | subframe7536 |
| 许可 | **SIL Open Font License 1.1** |

许可全文见 [`assets/fonts/OFL.txt`](assets/fonts/OFL.txt)。

OFL 允许自由使用、修改和再分发（包括随作品一起分发），条件是：

- 保留版权声明与许可全文（本仓库已随字体附带 `OFL.txt`）
- 不得单独出售字体本身
- 若修改了字体，衍生字体不得继续使用其保留字体名（Reserved Font Name）

> 说明：字体已转为 woff2 格式并只保留了 3 个字重，这属于格式转换与子集化，
> 未修改字形，因此不属于 OFL 意义上的「修改版本」。

---

## 2. html-ppt skill 的版式基座

| | |
|---|---|
| 位置 | `assets/base.css`、`assets/runtime.js` |
| 来源 | https://github.com/lewislulu/html-ppt-skill |
| 作者 | lewis \<sudolewis@gmail.com\> |
| 许可 | **MIT License** |

MIT 许可要求保留版权声明与许可文本。原始声明：

```
MIT License

Copyright (c) 2026 lewis <sudolewis@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

> 本仓库对这两个文件**未做修改**，直接取用。
> `assets/deck.css` 是本仓库自己写的终端主题，不在 MIT 覆盖范围内。

---

## 关于 AGPL-3.0 与这些第三方文件的兼容性

**MIT 和 OFL 都可以被并入 AGPL 作品**，两者与 AGPL 不冲突：

- MIT 是宽松许可，允许再许可到更强的 copyleft 许可下。`base.css` 和 `runtime.js`
  这两个**文件本身仍然是 MIT**，但它们与本仓库其它部分组合成的整体适用 AGPL-3.0。
- OFL 同样允许字体被嵌入并随更大的作品一起分发，只要保留 `OFL.txt`
  并且不单独售卖字体本身。

所以：**你想用这个 deck，按 AGPL-3.0 的条款来就行**；其中那两个 MIT 文件和字体，
额外保留了各自的原始许可，需要单独提取时可以按原许可使用。

---

## 为什么是 AGPL 而不是 MIT

这个仓库是实验室「开源反哺」这件事本身的一部分，而 AGPL-3.0 比 MIT 多了一条关键约束：

> **谁把这个作品改一改拿去做成网络服务，谁就必须把改后的源码也开源。**

MIT 允许「拿走 → 改动 → 闭源」。AGPL 不允许。对一份用来证明「我们真的开源」的
材料来说，后者才是自洽的。

如果你的用途需要更宽松的许可，可以单独联系实验室。

# 素材来源与许可

代码、故事文本和项目文档采用 [MIT](LICENSE)。本页记录场景插画的来源、分发许可与署名方式。

## 首版场景

六张基础插画通过用户指定的本机 **画境 / AI Image Studio** 制作，使用 `gpt-image-2.5-sunburst`。长堤街先作为风格与建筑参考，随后生成同城的五个地点。最终图片经 WebP 转换用于网页。

| 文件 | 地点 | 来源 | 许可 |
| --- | --- | --- | --- |
| `public/scenes/street.webp` | 长堤街 | 项目原创 AI 辅助生成 | CC BY 4.0，限持有的权利 |
| `public/scenes/bookshop.webp` | 旧书店 | 同上，以长堤街为参考 | 同上 |
| `public/scenes/workshop.webp` | 修车铺 | 同上，以长堤街为参考 | 同上 |
| `public/scenes/home.webp` | 灯下的家 | 同上，以长堤街为参考 | 同上 |
| `public/scenes/ferry.webp` | 渡口 | 同上，以长堤街为参考 | 同上 |
| `public/scenes/grocery.webp` | 小卖部 | 同上，以长堤街为参考 | 同上 |
| `public/preview.webp` | 游戏预览截图 | 本项目页面与上述插画的合成截图 | 图像部分沿用上述许可；代码与文案为 MIT |

实际提示词、生成时间、任务标识、图片尺寸和文件摘要以 [`docs/asset-manifest.json`](docs/asset-manifest.json) 为准。共同美术规则与制作方式见 [`docs/art-prompts.md`](docs/art-prompts.md)。

首版的天色由 CSS 滤镜调整，雨由 CSS 叠加层表现。表中六张图是实际收录的基础场景，路线图中的其他图片尚属规划。声音控件的实现保存在 [`src/sound.js`](src/sound.js)，默认关闭。

## 如何复用

维护者在所持有权利的范围内，以 [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/) 分发这些项目生成的场景插画。你可以复制、改编和用于其他项目，请保留项目署名、链接、许可，并注明修改。

可使用以下署名：

> 场景插画：潮生项目贡献者 · 画境 / AI Image Studio，gpt-image-2.5-sunburst。来源：https://github.com/StarrySea1412/chaosheng 。CC BY 4.0；如有修改请注明。

AI 辅助产物能否成立版权、保护哪些部分，会依司法辖区和具体创作过程而异。本项目提供的是维护者所持权利的许可，不保证所有生成像素都具有可主张的版权，也不授予生成服务自身的商标权。

## 后续素材

新增素材同时更新来源记录和许可说明。第三方素材沿用其原有许可；项目生成的新素材记录实际工具和模型，署名以资产清单为准。只收录可以清楚说明来源、许可和用途的最终版本。

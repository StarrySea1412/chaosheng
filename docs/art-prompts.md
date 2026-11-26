# 潮生 · 场景美术记录

首章使用六张原创 AI 辅助场景插画。通过用户指定的本机 **画境 / AI Image Studio** 提交请求；生成后的图片由本机 `sharp` 转成 WebP。网站运行和读故事不需要模型、账号或 API Key。

- 调用入口：画境的 `POST /api/generations`（与 `clawhub-skill/huajing-image-gen/scripts/huajing.mjs generate` 相同）。
- 首选模型：`gpt-image-2.5-sunburst`。实际使用的模型、时间、任务和校验摘要以 [asset-manifest.json](asset-manifest.json) 为准。
- 请求画幅：1536 × 1024，单张；页面按原始 3:2 比例显示。
- 参考规则：先生成长堤街作为色彩与建筑参考，再以同一张参考图生成五个相邻地点。参考图仅为本项目新生成的长堤街，不含个人照片。
- 分发许可：`CC-BY-4.0`，限于维护者所持有的权利；AI 辅助产物的版权成立与范围依司法辖区而异。署名建议：`潮生项目贡献者 · AI Image Studio / gpt-image-2.5-sunburst`。
- 切换天气和时间是浏览器内的色彩、光照与雨线效果，首版没有声称每种天气都另生成了一张图。

## 共同约束

一座日常的中国海边小城，夏日傍晚六点。两层旧房、石板巷、褪色的珊瑚色灰泥、深青色木窗、铁皮棚、晾衣绳和零散盆栽。构图适合停下来查看细节，居民占画面很小一部分。干笔水粉、哑光颜料、细纸纹与少量墨线；深青和海军蓝阴影，珊瑚色与赭铜色墙面，灰绿植物，奶油色和淡金色高光，暖窗光。没有文字、标志、水印、UI、拼贴、照片或三维渲染，不模仿特定在世艺术家。

负面提示词：`text, letters, watermarks, logos, interface, collage, frame, photograph, 3d render`。

## 01 · 长堤街 / street

```text
Use case: illustration-story
Asset type: full-frame background painting for an interactive picture novel, 1536x1024 landscape.
Primary request: establish an original Chinese seaside small town called Chaosheng at six oclock on a summer evening, a place with ordinary people and quiet lived-in details. View down a narrow stone-paved lane that slopes gently toward a ferry landing and the sea. On the left foreground is a small weathered coral-plaster secondhand bookstore with dark teal wooden shutters, an open warm-lit doorway, a box of used books outside, a little potted plant. On the right foreground is a bicycle repair shop with a faded rust-red corrugated awning, a bicycle and a plastic stool. Upper balconies have white shirts drying on lines and green plants. Further down the lane there is a tiny corner grocery, a modest ferry at the distant pier, two tiny residents going about their evening. Old two-story houses, poles and slack overhead wires, no high rise. The sea glints pale gold.
Style and medium: an exceptionally composed hand-painted gouache storybook illustration with dry brush marks, soft matte pigment, fine paper grain, delicate ink accents, subtle organic imperfections. Warm nostalgic but specific and grounded. Mature illustrated book aesthetic, environmental storytelling. Original visual language, no named artist reference.
Composition: richly composed whole frame at elevated human eye level with visible depth, strong foreground on both sides and the lane receding toward the sea. Keep a navigable open lane in the lower center. Architectural forms dominate, residents are small. Horizon in the upper middle; sky takes less than one third of the frame. Beautiful coherent painted lighting.
Palette and light: deep petrol blue shadows, muted navy, faded coral and burnt copper plaster, dusty sage plants, cream paper highlights and pale gold late sun, softly glowing amber windows. Restrained saturation, balanced warm/cool light, enough brightness to see details.
Constraints: one single scene, edge-to-edge landscape painting with no border. No text, signs with letters, captions, UI, hotspots, logo or watermark. No modern cars, skyscrapers, science fiction or fantasy creatures. No stock photographs, no 3D render, no chibi characters. All signs are blank textured boards.
```

## 02–06 · 同城的五个地点

以下每次请求会附加上方的共同风格、画幅与约束，并将 `street` 场景上传为画境参考图。各次完整实际提示词保存在资产清单的 `prompt` 字段，便于复现和改写。

| 场景 | 必须看见的物件 | 叙事用途 |
| --- | --- | --- |
| 旧书店 / bookshop | 旧木书架、窗边书桌、蓝布日记、盆栽、斜射窗光 | 找到和阅读遗落的日记 |
| 修车铺 / workshop | 自行车、工具、塑料凳、雨棚、暖色台灯 | 与修车的人聊一会儿 |
| 灯下的家 / home | 旧立式钢琴、开着的海景窗、白窗帘、杯子、室内植物 | 听楼上的练琴声 |
| 渡口 / ferry | 石堤、旧渡船、候船凳、缆绳、提旅行包的旅人 | 让日记与主人重新相遇 |
| 小卖部 / grocery | 旧冰柜、玻璃汽水瓶、货架、门口塑料凳、挂帘 | 看见普通生活留下的小事 |

## 复用和贡献

添一张场景时同时提交文件、提示词、真实来源和许可记录；不要把任务日志中的密钥、私人路径或 Provider 配置复制进仓库。保留建筑颜色与物件位置的依据，用可检查的细节维持场景一致。生成有随机性，同一提示词不会保证逐像素相同。


## v0.2 · 120张小城插画

当前收录120张实际成图，原始六张继续保留。追加30张天气／暮色编辑、24张近景、12张人物肖像、24张故事瞬间和24张新街巷。

每张的完整提示词、实际模型、生成任务、参考关系、原图与成图尺寸、文件摘要都保存在[asset-manifest.json](asset-manifest.json)。天气编辑使用各地点的原始画面，维持镜头、建筑和互动道具位置，只重绘真实天空、灯光与室外降雨；夜景要求移除落日。物件近景采用新的观察距离。人物第二个角度以第一张肖像为身份参考，故事与街巷保持同一套纸纹、水粉、深青窗框和珊瑚色墙面的画风。

成图统一为1536×1024 WebP；原始输出的尺寸另行保留。480×320缩略图由这些成图转换，用于画册加载，不计入生成图片数量。原始生成图继续保存在本机画境图库，开源仓库提供整理后的全尺寸成图与来源记录。

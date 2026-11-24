# 来搭建潮生

欢迎添一条街、写一段对白、画一个居民，也欢迎修正故事前后不一致的地方。先看[小城设定](docs/WORLD.md)，让新内容能和现有的傍晚连起来。

## 开始修改

在 GitHub 上 Fork 仓库，再克隆自己的副本。Node.js 需要 20 或更新版本。

```sh
git clone https://github.com/YOUR_NAME/chaosheng.git
cd chaosheng
npm install
git switch -c add-your-change
npm run dev
```

在 <http://127.0.0.1:4318> 查看修改。提交前运行 `npm run verify`，并实际走一遍受影响的故事分支。界面变动还请运行 `npx playwright install chromium` 与 `npm run test:browser`，查看 `artifacts/` 里的桌面和手机截图。

PR 说明写清楚：玩家在什么情况下会看到变化，变成了什么样，以及怎样验证。截图能说明画面或交互变化时，请附上截图。

## 写对白或加行动

[`src/world.js`](src/world.js) 存放场景资料和文案。一个行动有稳定的 ID，并在 `ACTIONS` 中声明它属于哪个地点：

```js
'look-timetable': {
  scene: 'street',
  label: '看看站牌',
  hint: '长椅旁贴着一张时刻表',
  x: 25,
  y: 59,
  discovery: 'street-bus',
}
```

`x` 和 `y` 是画面上的百分比坐标，范围是 0–100。`discovery` 对应 `DISCOVERIES` 中的一条记录，发现后该行动消失；带 `talk` 的行动每天可执行一次。

`sceneDescription`、`sceneDialogue` 和 `actionResponse` 分别负责场景描述、当前对白和行动后发生的事。人物可以说得少一些，但一句话应该有具体的对象和缘由。

改变故事状态时，在 [`src/engine.js`](src/engine.js) 中加入条件与效果。`getSceneView(state)` 是界面获取可用行动和光点的唯一入口；`reduce(state, event)` 返回新状态，拒绝错误地点和已经完成的行动。新增持久旗标时也要更新 `sanitizeState`，让旧存档能安全恢复。

为改变了的分支补上状态测试：未满足条件时不能完成，满足条件后能完成，重复点击不重复写手记，重新载入能继续。

## 添一个地点

1. 在 `WORLD.scenes` 加入 `{ id, name, subtitle, number, character }`。ID 在发布后保持稳定。
2. 给该地点写场景描述、对白和行动；明确它与现有居民或物件的关系。
3. 在界面资源映射中注册场景图片，使用同一画幅，并校准光点位置。
4. 把发现计数和相关测试更新到实际内容数量；照顾已有存档，必要时写显式迁移。
5. 同时提交素材来源、提示词、许可记录，以及一张能看清新地点的截图。

## 提交插画

首版的基础场景是 1536 × 1024、3:2 的 WebP 图片。风格和生成记录在 [`docs/art-prompts.md`](docs/art-prompts.md) 与 [`docs/asset-manifest.json`](docs/asset-manifest.json)，分发许可见 [ASSETS.md](ASSETS.md)。

请保留一份来源记录：文件、作者或生成工具、实际模型、提示词、日期、尺寸、参考图来源、许可和修改内容。使用项目图片作为参考时保留署名；使用自己的素材时说明其许可。密钥、Provider 配置和私人任务日志留在本机。

先确定要修正的具体问题，再生成下一版。新图应能解释为什么值得加入这座城；PR 中说明采用了哪一版即可，无需把全部废稿加入仓库。

代码和故事贡献沿用 MIT，场景图片沿用项目记录的 CC BY 4.0 范围。其他素材请单独声明兼容的许可与署名。

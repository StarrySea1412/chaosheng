/**
 * 潮生 · 第一章「把名字还给明天」
 * Story text and scene metadata are kept separate from the renderer.
 */
export const WORLD = Object.freeze({
  title: '潮生',
  titleEn: 'Dusk Town',
  chapter: '把名字还给明天',
  chapterNumber: '01',
  discoveryCount: 6,
  scenes: [
    { id: 'street', name: '长堤街', subtitle: '末班车还没有来', number: '01', character: '公交司机' },
    { id: 'bookshop', name: '旧书店', subtitle: '有人把故事忘在这里', number: '02', character: '林姨' },
    { id: 'workshop', name: '修车铺', subtitle: '一声铃响，很多年前', number: '03', character: '阿禾' },
    { id: 'home', name: '灯下的家', subtitle: '楼上又弹起那首曲子', number: '04', character: '陈叔' },
    { id: 'ferry', name: '渡口', subtitle: '最后一班船也可以慢一点', number: '05', character: '许舟' },
    { id: 'grocery', name: '小卖部', subtitle: '零钱和一颗纸星星', number: '06', character: '小满' },
  ],
});

export const SCENE_IDS = WORLD.scenes.map((scene) => scene.id);

export const DISCOVERIES = Object.freeze({
  'street-bus': '长堤街的末班车是十八点四十分。司机说，若有人还在跑，他会多等一会儿。',
  'bookshop-diary': '旧书店的柜台上有本蓝布日记。封面磨白了一角，书签是一张很旧的船票。',
  'workshop-bell': '阿禾修好了许舟小时候那辆自行车的铃。车留在这里，铃声却还认得他。',
  'home-melody': '陈叔每到傍晚就弹同一首曲子。许舟离开小城的那一年，他也弹过。',
  'ferry-tide': '渡口的木牌写着：潮水会变，船每天都开。周伯把最后一班船的时间改迟了十分钟。',
  'grocery-star': '小满用一张买糖的收据折了颗星星。她说，口袋空着的时候，可以先装这个。',
});

export const EXTRA_JOURNAL = Object.freeze({
  'diary-owner': '日记扉页写着「许舟」。最后一页只有一句：回去以前，去听一次楼上的琴。',
  'diary-returned': '我把蓝布日记交回许舟手里。他没有立刻上船，先认真把那张旧船票夹好。',
  'diary-kept': '许舟让我先替他拿着日记。他想再听一遍那首曲子。我们约好，明天在渡口见。',
});

/** Positions are percentages of the shared 1200 × 760 scene viewBox. */
export const ACTIONS = Object.freeze({
  'look-timetable': { scene: 'street', label: '看看站牌', hint: '长椅旁贴着一张时刻表', x: 25, y: 59, discovery: 'street-bus' },
  'talk-driver': { scene: 'street', label: '和司机说句话', hint: '他把保温杯放在窗边', x: 71, y: 59, talk: 'talkStreetDay' },
  'take-diary': { scene: 'bookshop', label: '拿起蓝布日记', hint: '柜台上那本磨白了一角的本子', x: 54, y: 81, discovery: 'bookshop-diary' },
  'read-diary': { scene: 'bookshop', label: '翻开日记扉页', hint: '看看它属于谁', x: 54, y: 81 },
  'talk-bookseller': { scene: 'bookshop', label: '和林姨聊聊', hint: '她正整理柜台上的旧书', x: 24, y: 48, talk: 'talkBookshopDay' },
  'ring-bell': { scene: 'workshop', label: '试试车铃', hint: '工作台上那只擦亮的旧车铃', x: 87, y: 74, discovery: 'workshop-bell' },
  'talk-mechanic': { scene: 'workshop', label: '问问阿禾', hint: '他手里还拿着一把扳手', x: 64, y: 66, talk: 'talkWorkshopDay' },
  'listen-piano': { scene: 'home', label: '听完这一小段', hint: '窗边亮着灯的钢琴', x: 26, y: 73, discovery: 'home-melody' },
  'talk-musician': { scene: 'home', label: '和陈叔打招呼', hint: '他已经听见你的脚步声', x: 43, y: 59, talk: 'talkHomeDay' },
  'read-tides': { scene: 'ferry', label: '看看潮汐木牌', hint: '木牌的漆已经被海风吹旧', x: 90, y: 52, discovery: 'ferry-tide' },
  'talk-traveler': { scene: 'ferry', label: '和等船的人聊聊', hint: '他穿着黄色雨衣', x: 74, y: 61, talk: 'talkFerryDay' },
  'return-diary': { scene: 'ferry', label: '把日记还给许舟', hint: '他已经看见你手里的蓝色封面', x: 58, y: 77, kind: 'primary' },
  'keep-diary': { scene: 'ferry', label: '约好明天再见', hint: '替他保管一晚，再走一会儿', x: 34, y: 77 },
  'fold-star': { scene: 'grocery', label: '接过纸星星', hint: '小满把它放在柜台边', x: 64, y: 70, discovery: 'grocery-star' },
  'talk-shopkeeper': { scene: 'grocery', label: '和小满说句话', hint: '冰柜边的收据攒了一小叠', x: 55, y: 40, talk: 'talkGroceryDay' },
});

export const TALK_KEYS = Object.values(ACTIONS).filter((action) => action.talk).map((action) => action.talk);

export function sceneDescription(sceneId, state) {
  const rain = state.weather === 'rain';
  const late = state.time === 2;
  const descriptions = {
    street: rain
      ? '雨把柏油路洗得发亮。站牌下有人挪出半个位置，刚好够你避雨。远处的公交车拐了个弯。'
      : late ? '街灯一盏盏亮起来。公交车的尾灯还在路口，风里有一点海水和晚饭的味道。'
        : '长堤街朝着海伸过去。最后一点阳光落在站牌上，长椅还留着白天的温度。',
    bookshop: rain
      ? '门帘滴着水。林姨在门口铺了张旧报纸，书架之间闻得到纸张和热茶的气味。'
      : late ? '卷帘门只拉下来一点。柜台的小灯还亮着，林姨说，最后一本看完再关。'
        : state.flags.holdingDiary || state.flags.diaryReturned
          ? '旧书店的门开着。风把柜台上的书页翻过去，林姨给空出来的位置放上一杯热茶。'
          : '旧书店的门开着。风把柜台上的书页翻过去，蓝布封面的日记压在最上面。',
    workshop: rain
      ? '阿禾把自行车往屋里挪了半步。雨水沿着棚边落下来，扳手和车铃都擦得干干净净。'
      : late ? '修车铺只剩工作台上的灯。阿禾擦好最后一把扳手，门边的自行车还没有人来领。'
        : '门口摆着两张塑料凳。阿禾蹲在一辆旧自行车旁，车铃被擦得比车身亮一些。',
    home: rain
      ? '雨声很轻，楼上的琴声也很轻。窗台上的衣服已经收进去了，只剩一盆薄荷。'
      : late ? '楼道里亮着一盏灯。琴声停了一下，又从刚才弹错的地方重新开始。'
        : '楼上有人练琴。窗台晾着白衬衫，一页谱子被风吹起来，又被一只手按住。',
    ferry: rain
      ? '码头的木板被雨淋深了一层。黄色雨衣站在路灯下面，船上留着一块干的位置。'
      : late ? '渡船挂着两盏灯。周伯没有催人，黄色雨衣的人正把手里的旧船票展平。'
        : '海面把天色轻轻晃开。周伯解开一半缆绳，又系了回去。等船的人穿着黄色雨衣。',
    grocery: rain
      ? '冰柜嗡嗡地响。小满从抽屉里找出一块干毛巾，柜台边的纸星星一点也没湿。'
      : late ? '招牌只亮了一半。小满开始数零钱，留在柜台上的最后一颗糖还没有收起来。'
        : '冰柜上凝着小水珠。小满把找零推到柜台边，低头折一张窄窄的收据。',
  };
  return descriptions[sceneId] ?? descriptions.street;
}

export function sceneDialogue(sceneId, state) {
  const tomorrow = state.day > 1;
  const found = state.flags.holdingDiary;
  const returned = state.flags.diaryReturned;
  const dialogue = {
    street: tomorrow
      ? '“昨天也看见你了。今天想往哪儿走？长堤街不长，慢一点就走到海边了。”'
      : '“十八点四十分。你先坐，车来之前，街上还有好多地方能去。”',
    bookshop: returned
      ? '“日记送回去了？那就好。下回他来，还会在这儿坐一下午。”'
      : found ? '“封面是他自己包的。你看看名字，渡口穿黄雨衣的那个就是他。”'
        : tomorrow ? '“又来了？昨天翻到哪一页，就从哪一页开始吧。”'
          : '“柜台上那本日记不是卖的。有个年轻人刚走，连夹在里面的旧船票也忘了。”',
    workshop: tomorrow
      ? '“车铃又擦了一遍。旧东西能多用一天，就多用一天。”'
      : '“许舟小时候骑这辆车，总在陈叔楼下按两下铃。后来人走了，车一直放在这儿。”',
    home: tomorrow
      ? '“昨天那段又弹错了。没关系，今天还能再弹一遍。”'
      : '“许舟从前就在那扇窗下听。今天他回来，我想着，还是弹这首吧。”',
    ferry: returned
      ? '“找到了。谢谢你。我刚才还以为，这些年写的东西都得留在那家书店了。”'
      : state.flags.diaryKept ? '“约好的地方就是这里。你要是还想走走，船明天也开。”'
        : found && state.flags.diaryRead ? '“那是我的日记。你先别急，我还想听一会儿楼上的琴。”'
          : tomorrow ? '“昨天那班船没有坐。今天还在，海也还在。”'
            : '“我回来找几样旧东西。车铃，琴声，还有一本不知道落在哪儿的日记。”',
    grocery: tomorrow
      ? '“你口袋里的星星还在吗？收据折的也挺结实，别放进洗衣机就好。”'
      : '“这颗送你。没有要买的东西也能进来，我正好想找个人说句话。”',
  };
  return dialogue[sceneId] ?? dialogue.street;
}

export function actionResponse(actionId, state) {
  const tomorrow = state.day > 1;
  const responses = {
    'look-timetable': { title: '末班车会等一会儿', text: '时刻表边缘卷了起来。司机从车窗探出头：“十八点四十。有人还在跑，我就多等一会儿。”' },
    'talk-driver': { title: '在长椅上坐一下', text: tomorrow ? '司机认出了你，把窗户又摇下来一点：“昨天的风大。今天舒服些，往海边走吧。”' : '司机问你是不是第一次来。听见你说是，他指了指街尾：“顺着那盏灯走，走累了就回来坐。”' },
    'take-diary': { title: '一本蓝布日记', text: '你托起那本日记。封面的布磨白了一角，书签是一张好多年前的船票。林姨点点头：“看看名字，替他拿过去吧。”' },
    'read-diary': { title: '许舟的名字', text: '扉页写着“许舟”。最后一页只有一句话：回去以前，去听一次楼上的琴。你轻轻合上本子，把船票夹回原处。' },
    'ring-bell': { title: '铃声还认得他', text: '车铃清脆地响了两声。阿禾笑了一下：“许舟小时候就这么按。陈叔听见，会把窗户打开。”' },
    'talk-mechanic': { title: '门口的塑料凳', text: tomorrow ? '阿禾把另一张凳子挪到你脚边：“坐吧。车没有急着要走的人，咱们也不用赶。”' : '阿禾用抹布擦净一张凳子。那辆自行车已经修好很久，他说，替人留着一件东西也不费什么事。' },
    'listen-piano': { title: '听完这一小段', text: '你在楼下站了一会儿。曲子中间停了两次，最后终于弹完。陈叔从窗口看下来，像是早就知道有人在听。' },
    'talk-musician': { title: '窗户开着', text: tomorrow ? '陈叔端着茶杯走到窗口：“昨天那首你听完了？那今天换一首。明天还可以换。”' : '陈叔说这首曲子没有正式的名字。许舟小时候叫它“回家那首”，于是大家也这样叫了。' },
    'read-tides': { title: '船每天都开', text: '潮汐木牌下面多写了一行：最后一班，迟十分钟。周伯拍拍船舷：“人还没上来，缆绳先别解。”' },
    'talk-traveler': { title: '等船的许舟', text: state.flags.diaryReturned ? '许舟把日记放进帆布包，问你要不要明天再来。他说，回来以后才知道，原来这里的傍晚这么长。' : tomorrow ? '许舟把行李箱放平，当作一张临时的凳子：“昨天没舍得走。今天，也还没想好。”' : '黄色雨衣的人叫许舟。他回来找旧日记，也想听听陈叔的琴。行李很轻，手里的旧船票倒是展开了好几回。' },
    'return-diary': { title: '把名字还给明天', text: '许舟接过日记，先认真把那张船票夹好。“谢谢你。”他说完没有马上走，又抬头望向楼上亮着的窗。这个傍晚，还有一点时间。' },
    'keep-diary': { title: '明天，在渡口见', text: '许舟看了看还亮着灯的窗。“替我拿一晚吧。我想再听一遍。”你们约好明天在这里见。他把行李放下，沿着长堤街慢慢走回去。' },
    'fold-star': { title: '口袋里的一颗星', text: '小满把纸星星放到你手心。它是用一张买糖的收据折的。“口袋空着的时候，可以先装这个。”' },
    'talk-shopkeeper': { title: '找零多了一句话', text: tomorrow ? '小满把冰柜上的水珠擦掉：“你昨天没买东西。没关系，今天也不用。我又折了一颗。”' : '小满说，店里最忙的时候是晚饭以前。现在不忙，冰柜的声音刚好能把屋子里的安静填满。' },
  };
  return responses[actionId] ?? { title: '在这里停一会儿', text: '风从街尾慢慢吹过来。' };
}

import baguaTables from '../data/bagua_tables.json' with { type: 'json' };

// 天干地支常量与五行
export const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
export const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

export const BRANCH_WUXING = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木',
  '辰': '土', '巳': '火', '午': '火', '未': '土',
  '申': '金', '酉': '金', '戌': '土', '亥': '水'
};

export const STEM_WUXING = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火',
  '戊': '土', '己': '土', '庚': '金', '辛': '金',
  '壬': '水', '癸': '水'
};

export const TRIGRAM_NAMES = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'];
export const TRIGRAM_BINARIES = {
  '乾': [1, 1, 1], // 从初到上
  '兑': [1, 1, 0],
  '离': [1, 0, 1],
  '震': [1, 0, 0],
  '巽': [0, 1, 1],
  '坎': [0, 1, 0],
  '艮': [0, 0, 1],
  '坤': [0, 0, 0]
};

// 64卦快速索引表 (从 bagua_tables.json 扁平化构建)
const allHexagrams = [];
baguaTables.palaces.forEach(palace => {
  palace.hexagrams.forEach(hex => {
    // 构造阴阳序列: line_number 1 to 6 (初爻至上爻: 1 代表阳, 0 代表阴)
    const binarySeq = hex.lines.map(l => (l.yin_yang === '阳' ? 1 : 0)).join('');
    allHexagrams.push({
      ...hex,
      binarySeq,
      palaceName: palace.name,
      palaceElement: palace.element
    });
  });
});

export const ALL_HEXAGRAMS = allHexagrams;

// 根据 6 爻阴阳序列查找卦象 (从初爻到上爻，如 [1,1,1,0,0,0])
export function findHexagramByLines(linesArr) {
  const binarySeq = linesArr.map(x => (x ? '1' : '0')).join('');
  return allHexagrams.find(h => h.binarySeq === binarySeq) || allHexagrams[0];
}

// 根据卦名查找
export function findHexagramByName(name) {
  if (!name) return allHexagrams[0];
  const cleaned = name.replace(/卦$/, '');
  return allHexagrams.find(h => h.name === cleaned || h.full_name === cleaned) || allHexagrams[0];
}

// 六神起例（依据日干）
export const LIUSHEN_MAP = {
  '甲': ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'],
  '乙': ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'],
  '丙': ['朱雀', '勾陈', '螣蛇', '白虎', '玄武', '青龙'],
  '丁': ['朱雀', '勾陈', '螣蛇', '白虎', '玄武', '青龙'],
  '戊': ['勾陈', '螣蛇', '白虎', '玄武', '青龙', '朱雀'],
  '己': ['螣蛇', '白虎', '玄武', '青龙', '朱雀', '勾陈'],
  '庚': ['白虎', '玄武', '青龙', '朱雀', '勾陈', '螣蛇'],
  '辛': ['白虎', '玄武', '青龙', '朱雀', '勾陈', '螣蛇'],
  '壬': ['玄武', '青龙', '朱雀', '勾陈', '螣蛇', '白虎'],
  '癸': ['玄武', '青龙', '朱雀', '勾陈', '螣蛇', '白虎']
};

export function getLiuShenList(dayStem) {
  const stem = dayStem ? dayStem[0] : '甲';
  return LIUSHEN_MAP[stem] || LIUSHEN_MAP['甲'];
}

// 计算旬空（根据日干支）
export const XUNKONG_MAP = {
  '甲子': ['戌', '亥'], '乙丑': ['戌', '亥'], '丙寅': ['戌', '亥'], '丁卯': ['戌', '亥'], '戊辰': ['戌', '亥'], '己巳': ['戌', '亥'], '庚午': ['戌', '亥'], '辛未': ['戌', '亥'], '壬申': ['戌', '亥'], '癸酉': ['戌', '亥'],
  '甲戌': ['申', '酉'], '乙亥': ['申', '酉'], '丙子': ['申', '酉'], '丁丑': ['申', '酉'], '戊寅': ['申', '酉'], '己卯': ['申', '酉'], '庚辰': ['申', '酉'], '辛巳': ['申', '酉'], '壬午': ['申', '酉'], '癸未': ['申', '酉'],
  '甲申': ['午', '未'], '乙酉': ['午', '未'], '丙戌': ['午', '未'], '丁亥': ['午', '未'], '戊子': ['午', '未'], '己丑': ['午', '未'], '庚寅': ['午', '未'], '辛卯': ['午', '未'], '壬辰': ['午', '未'], '癸巳': ['午', '未'],
  '甲午': ['辰', '巳'], '乙未': ['辰', '巳'], '丙申': ['辰', '巳'], '丁酉': ['辰', '巳'], '戊戌': ['辰', '巳'], '己亥': ['辰', '巳'], '庚子': ['辰', '巳'], '辛丑': ['辰', '巳'], '壬寅': ['辰', '巳'], '癸卯': ['辰', '巳'],
  '甲辰': ['寅', '卯'], '乙巳': ['寅', '卯'], '丙午': ['寅', '卯'], '丁未': ['寅', '卯'], '戊申': ['寅', '卯'], '己酉': ['寅', '卯'], '庚戌': ['寅', '卯'], '辛亥': ['寅', '卯'], '壬子': ['寅', '卯'], '癸丑': ['寅', '卯'],
  '甲寅': ['子', '丑'], '乙卯': ['子', '丑'], '丙辰': ['子', '丑'], '丁巳': ['子', '丑'], '戊午': ['子', '丑'], '己未': ['子', '丑'], '庚申': ['子', '丑'], '辛酉': ['子', '丑'], '壬戌': ['子', '丑'], '癸亥': ['子', '丑']
};

export function getXunKong(dayGanzhi) {
  if (dayGanzhi && XUNKONG_MAP[dayGanzhi]) {
    return XUNKONG_MAP[dayGanzhi];
  }
  return ['戌', '亥'];
}

// 月破对应表 (月建相冲地支)
export const SIX_CLASHES = {
  '子': '午', '丑': '未', '寅': '申', '卯': '酉',
  '辰': '戌', '巳': '亥', '午': '子', '未': '丑',
  '申': '寅', '酉': '卯', '戌': '辰', '亥': '巳'
};

export function getMonthBrokenBranch(monthBranch) {
  return SIX_CLASHES[monthBranch] || '酉';
}

// 通用地支六冲查询（对称关系，与 SIX_CLASHES 共用同一张表）
export function getClashBranch(branch) {
  return SIX_CLASHES[branch] || null;
}

// 地支六合表
export const LIU_HE_MAP = {
  '子': '丑', '丑': '子',
  '寅': '亥', '亥': '寅',
  '卯': '戌', '戌': '卯',
  '辰': '酉', '酉': '辰',
  '巳': '申', '申': '巳',
  '午': '未', '未': '午'
};

export function getHeBranch(branch) {
  return LIU_HE_MAP[branch] || null;
}

// 地支三合局分组
export const SANHE_GROUPS = [
  { branches: ['申', '子', '辰'], element: '水' },
  { branches: ['寅', '午', '戌'], element: '火' },
  { branches: ['巳', '酉', '丑'], element: '金' },
  { branches: ['亥', '卯', '未'], element: '木' }
];

// 三合局检测：传入一组地支（本卦六爻地支 ∪ 变爻地支），返回命中的三合局
export function detectSanHeGroups(branchesInPlay) {
  const uniqueBranches = new Set(branchesInPlay);
  return SANHE_GROUPS
    .filter(g => g.branches.every(b => uniqueBranches.has(b)))
    .map(g => `三合${g.element}局`);
}

// 墓库地支：仅金木水火四行有明确共识；土行墓库归属各派不一（辰/戌两说皆有），存疑不判
export const MUKU_MAP = {
  '水': '辰', '火': '戌', '金': '丑', '木': '未'
};

export function isRuMu(yaoElement, referenceBranch) {
  const muku = MUKU_MAP[yaoElement];
  return !!muku && muku === referenceBranch;
}

// 神煞：以日干起贵人与禄神，以日支起驿马（本项目仅采用旬空/贵人/禄神/驿马，其余不采）
export const GUI_REN_MAP = {
  '甲': ['丑', '未'], '戊': ['丑', '未'], '庚': ['丑', '未'],
  '乙': ['子', '申'], '己': ['子', '申'],
  '丙': ['亥', '酉'], '丁': ['亥', '酉'],
  '壬': ['卯', '巳'], '癸': ['卯', '巳'],
  '辛': ['午', '寅']
};

export function getGuiRen(dayStem) {
  const stem = dayStem ? dayStem[0] : '甲';
  return GUI_REN_MAP[stem] || [];
}

export const LU_SHEN_MAP = {
  '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳',
  '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子'
};

export function getLuShen(dayStem) {
  const stem = dayStem ? dayStem[0] : '甲';
  return LU_SHEN_MAP[stem] || null;
}

export const YI_MA_MAP = {
  '申': '寅', '子': '寅', '辰': '寅',
  '寅': '申', '午': '申', '戌': '申',
  '巳': '亥', '酉': '亥', '丑': '亥',
  '亥': '巳', '卯': '巳', '未': '巳'
};

export function getYiMa(dayBranch) {
  return YI_MA_MAP[dayBranch] || null;
}

// 五行生克与旺相休囚死判断
export const WUXING_RELATIONS = {
  '木': { sheng: '火', ke: '土', beisheng: '水', beike: '金' },
  '火': { sheng: '土', ke: '金', beisheng: '木', beike: '水' },
  '土': { sheng: '金', ke: '水', beisheng: '火', beike: '木' },
  '金': { sheng: '水', ke: '木', beisheng: '土', beike: '火' },
  '水': { sheng: '木', ke: '火', beisheng: '金', beike: '土' }
};

// 五季旺相休囚死
export function getWangXiangStatus(yaoElement, monthBranch) {
  const monthElement = BRANCH_WUXING[monthBranch] || '木';
  if (yaoElement === monthElement) return '旺 (同我为旺)';
  if (WUXING_RELATIONS[monthElement].sheng === yaoElement) return '相 (月生我为相)';
  if (WUXING_RELATIONS[yaoElement].sheng === monthElement) return '休 (我生月为休)';
  if (WUXING_RELATIONS[yaoElement].ke === monthElement) return '囚 (我克月为囚)';
  if (WUXING_RELATIONS[monthElement].ke === yaoElement) return '死 (月克我为死)';
  return '平';
}

// 三枚铜钱摇卦的计分规则：0 代表字/反面 (阴 2)，1 代表背/正面 (阳 3)
// 1背2字 = 3+2+2 = 7 (少阳，静)
// 2背1字 = 3+3+2 = 8 (少阴，静)
// 3背0字 = 3+3+3 = 9 (老阳，动 ◯)
// 0背3字 = 2+2+2 = 6 (老阴，动 ✕)
// 由背面数量 (0~3) 直接解出该爻：既用于模拟摇卦，也用于卦例记录里"逐次输入六次背数"的直接录入场景
export function resolveLineFromBackCount(backCount) {
  let type = '少阳 (单/静)';
  let yinYang = '阳';
  let isMoving = false;
  let changedYinYang = '阳';
  let score = 7;

  if (backCount === 1) { // 7 少阳
    score = 7;
    yinYang = '阳';
    isMoving = false;
    changedYinYang = '阳';
    type = '少阳 (单/静)';
  } else if (backCount === 2) { // 8 少阴
    score = 8;
    yinYang = '阴';
    isMoving = false;
    changedYinYang = '阴';
    type = '少阴 (拆/静)';
  } else if (backCount === 3) { // 9 老阳 (动)
    score = 9;
    yinYang = '阳';
    isMoving = true;
    changedYinYang = '阴';
    type = '老阳 ◯ (重/动)';
  } else if (backCount === 0) { // 6 老阴 (动)
    score = 6;
    yinYang = '阴';
    isMoving = true;
    changedYinYang = '阳';
    type = '老阴 ✕ (交/动)';
  }

  return { backCount, score, yinYang, isMoving, changedYinYang, type };
}

// 模拟摇 3 枚铜钱（随机）
export function tossThreeCoins() {
  const c1 = Math.random() > 0.5 ? 1 : 0;
  const c2 = Math.random() > 0.5 ? 1 : 0;
  const c3 = Math.random() > 0.5 ? 1 : 0;
  const backCount = c1 + c2 + c3;
  return { coins: [c1, c2, c3], ...resolveLineFromBackCount(backCount) };
}

// 完整推演排盘看板数据组装
export function assemblePaipanBoard({
  rawLines, // 6 个元素数组 (初爻至上爻)，每个元素形如 { yinYang: '阳'/'阴', isMoving: boolean }
  monthBranch = '卯',
  dayStem = '戊',
  dayBranch = '辰',
  question = '占前程功名',
  yongShenKey = '官鬼'
}) {
  const dayGanzhi = `${dayStem}${dayBranch}`;
  const xunKong = getXunKong(dayGanzhi);
  const monthBroken = getMonthBrokenBranch(monthBranch);
  const dayClash = getClashBranch(dayBranch);
  const dayHe = getHeBranch(dayBranch);
  const liuShenList = getLiuShenList(dayStem);
  const guiRenBranches = getGuiRen(dayStem);
  const luShenBranch = getLuShen(dayStem);
  const yiMaBranch = getYiMa(dayBranch);

  // 本卦序列 (0/1)
  const benLinesBinary = rawLines.map(l => (l.yinYang === '阳' ? 1 : 0));
  const benGua = findHexagramByLines(benLinesBinary);

  // 变卦序列
  const hasMoving = rawLines.some(l => l.isMoving);
  let bianGua = null;
  if (hasMoving) {
    const bianLinesBinary = rawLines.map(l => {
      if (l.isMoving) {
        return l.yinYang === '阳' ? 0 : 1;
      }
      return l.yinYang === '阳' ? 1 : 0;
    });
    bianGua = findHexagramByLines(bianLinesBinary);
  }

  // 组装 6 爻详细数据
  const yaos = benGua.lines.map((bLine, idx) => {
    const raw = rawLines[idx];
    const isMoving = raw.isMoving;
    const liuShen = liuShenList[idx] || '青龙';
    const yaoBranch = bLine.branch;
    const yaoElement = bLine.element;

    // 变爻信息
    let bianYao = null;
    if (isMoving && bianGua) {
      const targetBianLine = bianGua.lines[idx];
      let dynamicTrend = '变爻';
      // 判断回头生克/进退神
      if (WUXING_RELATIONS[targetBianLine.element].sheng === yaoElement) dynamicTrend = '回头生';
      else if (WUXING_RELATIONS[targetBianLine.element].ke === yaoElement) dynamicTrend = '回头克';
      // 进神：亥化子、寅化卯、巳化午、申化酉、丑化辰、辰化未、未化戌、戌化丑
      else if (yaoBranch === '亥' && targetBianLine.branch === '子') dynamicTrend = '化进神';
      else if (yaoBranch === '寅' && targetBianLine.branch === '卯') dynamicTrend = '化进神';
      else if (yaoBranch === '巳' && targetBianLine.branch === '午') dynamicTrend = '化进神';
      else if (yaoBranch === '申' && targetBianLine.branch === '酉') dynamicTrend = '化进神';
      else if (yaoBranch === '丑' && targetBianLine.branch === '辰') dynamicTrend = '化进神';
      else if (yaoBranch === '辰' && targetBianLine.branch === '未') dynamicTrend = '化进神';
      else if (yaoBranch === '未' && targetBianLine.branch === '戌') dynamicTrend = '化进神';
      else if (yaoBranch === '戌' && targetBianLine.branch === '丑') dynamicTrend = '化进神';
      // 退神：子化亥、卯化寅、午化巳、酉化申、辰化丑、未化辰、戌化未、丑化戌
      else if (yaoBranch === '子' && targetBianLine.branch === '亥') dynamicTrend = '化退神';
      else if (yaoBranch === '卯' && targetBianLine.branch === '寅') dynamicTrend = '化退神';
      else if (yaoBranch === '午' && targetBianLine.branch === '巳') dynamicTrend = '化退神';
      else if (yaoBranch === '酉' && targetBianLine.branch === '申') dynamicTrend = '化退神';
      else if (yaoBranch === '辰' && targetBianLine.branch === '丑') dynamicTrend = '化退神';
      else if (yaoBranch === '未' && targetBianLine.branch === '辰') dynamicTrend = '化退神';
      else if (yaoBranch === '戌' && targetBianLine.branch === '未') dynamicTrend = '化退神';
      else if (yaoBranch === '丑' && targetBianLine.branch === '戌') dynamicTrend = '化退神';

      // 化合/化冲：变爻地支与本爻地支的合冲关系（若已判定为回头生克/进退神则不重复标注）
      let heChong = null;
      if (dynamicTrend === '变爻') {
        if (getHeBranch(yaoBranch) === targetBianLine.branch) heChong = '化合';
        else if (getClashBranch(yaoBranch) === targetBianLine.branch) heChong = '化冲';
      }

      bianYao = {
        yinYang: targetBianLine.yin_yang,
        relative: targetBianLine.relative,
        ganzhi: targetBianLine.stem_branch,
        branch: targetBianLine.branch,
        element: targetBianLine.element,
        dynamicTrend,
        heChong,
        isKong: xunKong.includes(targetBianLine.branch), // 化空
        isRuMu: isRuMu(targetBianLine.element, dayBranch) // 化墓（以日辰为准）
      };
    }

    // 神煞命中（仅旬空/贵人/禄神/驿马）
    const shenSha = [];
    if (guiRenBranches.includes(yaoBranch)) shenSha.push('贵人');
    if (luShenBranch === yaoBranch) shenSha.push('禄神');
    if (yiMaBranch === yaoBranch) shenSha.push('驿马');

    // 旺相休囚死（以月建为准）
    const wangShuai = getWangXiangStatus(yaoElement, monthBranch);

    // 状态标签
    const tags = [];
    if (yaoBranch === monthBroken) tags.push({ text: '月破', type: 'danger' });
    if (xunKong.includes(yaoBranch)) tags.push({ text: '旬空', type: 'warning' });
    if (dayClash === yaoBranch) tags.push({ text: '日破', type: 'danger' });
    if (dayHe === yaoBranch) tags.push({ text: '日合', type: 'info' });
    if (!isMoving && dayClash === yaoBranch && !xunKong.includes(yaoBranch)) tags.push({ text: '暗动', type: 'primary' });
    if (isRuMu(yaoElement, dayBranch)) tags.push({ text: '入墓(日墓)', type: 'warning' });
    if (bLine.is_shi) tags.push({ text: '世爻', type: 'primary' });
    if (bLine.is_ying) tags.push({ text: '应爻', type: 'info' });
    if (bLine.relative === yongShenKey) tags.push({ text: '用神', type: 'success' });
    if (isMoving) tags.push({ text: '发动', type: 'danger' });
    shenSha.forEach(s => tags.push({ text: s, type: 'info' }));

    return {
      index: bLine.line_number,
      yinYang: bLine.yin_yang,
      isMoving,
      relative: bLine.relative,
      ganzhi: bLine.stem_branch,
      branch: yaoBranch,
      element: yaoElement,
      isShi: bLine.is_shi,
      isYing: bLine.is_ying,
      liuShen,
      hiddenSpirit: bLine.hidden_spirit,
      bianYao,
      tags,
      wangShuai,
      shenSha
    };
  });

  const board = {
    question,
    dateGanzhi: {
      month: `${monthBranch}月`,
      monthBranch,
      monthBroken,
      day: dayGanzhi,
      dayStem,
      dayBranch,
      xunKong
    },
    benGua,
    bianGua,
    yaos,
    yongShenKey,
    hasMoving
  };

  board.patterns = resolvePatterns(board);

  return board;
}

// 格局判断（六合六冲/三合局/化空化墓/化合化冲/日辰生克冲合）。
// 卦反吟、卦伏吟未实现：其宫位对冲判定规则把握不足，留待用实例校对后再补，避免编造错误公式。
export function resolvePatterns(board) {
  const patterns = [];

  if (board.benGua.is_six_combine) patterns.push('六合');
  if (board.benGua.is_six_clash) patterns.push('六冲');

  // 含变卦：原著反复强调"六冲变六合""六合变六合"是断吉凶的关键格局（不看用神，径以此断）
  if (board.bianGua) {
    if (board.benGua.is_six_clash && board.bianGua.is_six_combine) patterns.push('六冲变六合');
    if (board.benGua.is_six_combine && board.bianGua.is_six_combine) patterns.push('六合变六合');
    if (board.benGua.is_six_clash && board.bianGua.is_six_clash) patterns.push('六冲变六冲');
  }

  const branchesInPlay = board.yaos.flatMap(y => [y.branch, y.bianYao?.branch].filter(Boolean));
  patterns.push(...detectSanHeGroups(branchesInPlay));

  board.yaos.forEach(y => {
    if (!y.bianYao) return;
    if (y.bianYao.heChong === '化合' && !patterns.includes('化合')) patterns.push('化合');
    if (y.bianYao.heChong === '化冲' && !patterns.includes('化冲')) patterns.push('化冲');
    if (y.bianYao.isKong && !patterns.includes('化空')) patterns.push('化空');
    if (y.bianYao.isRuMu && !patterns.includes('化墓')) patterns.push('化墓');
  });

  return patterns;
}

// 占问事类 → 默认用神六亲。仅覆盖能直接归类到固定六亲的事类；
// 婚姻按占问者自身男方视角默认取妻财，女方占婚姻应取官鬼，需按实际情境调整。
export const EVENT_YONGSHEN_MAP = {
  '求财': '妻财',
  '功名': '官鬼',
  '婚姻': '妻财',
  '疾病': '官鬼'
};

// 这类事类不取固定六亲，以世爻自身旺衰吉凶为准
export const WORLD_LINE_EVENTS = ['出行'];

// 用神取法：按占问事类解析用神六亲，多现列出全部候选（不强行择一），不上卦转看伏神
export function resolveYongShen(eventType, board) {
  if (WORLD_LINE_EVENTS.includes(eventType)) {
    const shiYao = board.yaos.find(y => y.isShi);
    return {
      eventType,
      key: null,
      candidates: shiYao ? [{ index: shiYao.index, relative: shiYao.relative, branch: shiYao.branch }] : [],
      hiddenFallback: [],
      note: '此事类以世爻自身旺衰吉凶为准，非固定六亲用神'
    };
  }

  const key = EVENT_YONGSHEN_MAP[eventType] || null;
  if (!key) {
    return {
      eventType,
      key: null,
      candidates: [],
      hiddenFallback: [],
      note: '该占问事类未内置默认用神映射，需按具体情境人工判断（如占行人需先定何人、占天时需具体天象对象）'
    };
  }

  const candidates = board.yaos
    .filter(y => y.relative === key)
    .map(y => ({ index: y.index, relative: y.relative, branch: y.branch }));

  if (candidates.length > 0) {
    return {
      eventType,
      key,
      candidates,
      hiddenFallback: [],
      note: candidates.length > 1 ? '用神多现，需结合旺衰、临世应等情况取舍' : null
    };
  }

  const hiddenFallback = board.yaos
    .filter(y => y.hiddenSpirit && y.hiddenSpirit.relative === key)
    .map(y => ({ hostIndex: y.index, relative: y.hiddenSpirit.relative, stem_branch: y.hiddenSpirit.stem_branch, element: y.hiddenSpirit.element }));

  return {
    eventType,
    key,
    candidates: [],
    hiddenFallback,
    note: '用神不上卦，转看伏神'
  };
}

// 智能解析古籍实战案例并生成完整排盘看板数据
export function resolveCaseBoard(caseItem) {
  if (!caseItem) return null;

  // 1. 提取月将与日辰干支
  let monthBranch = '卯';
  if (caseItem.month) {
    const mMatch = caseItem.month.match(/([子丑寅卯辰巳午未申酉戌亥])/);
    if (mMatch) monthBranch = mMatch[1];
  }

  let dayStem = '戊';
  let dayBranch = '辰';
  if (caseItem.day) {
    const sMatch = caseItem.day.match(/([甲乙丙丁戊己庚辛壬癸])/);
    const bMatch = caseItem.day.match(/([子丑寅卯辰巳午未申酉戌亥])/);
    if (sMatch) dayStem = sMatch[1];
    if (bMatch) dayBranch = bMatch[1];
  }

  // 2. 匹配本卦与变卦：优先从 diagram 文本里的"X宫：Y"行直接读全名——这是原文自带、最可靠的来源。
  // 案例标题"得"X之Y""里的 X/Y 有时只是宫位简写（如"巽"实指本宫首卦"巽为风"），不能当全名直接查，
  // findHexagramByName 对这种简写找不到精确匹配时会静默兜底成 allHexagrams[0]（乾为天），
  // 所以这里不经过它，自己做"精确匹配→模糊匹配→兜底"三段式。
  let benHex = null;
  let bianHex = null;
  const palaceLineMatches = caseItem.diagram
    ? [...caseItem.diagram.matchAll(/(?:乾|坎|艮|震|巽|离|坤|兑)宫[：:]\s*([^\n（(]+)/g)]
    : [];
  if (palaceLineMatches.length > 0) {
    const benName = palaceLineMatches[0][1].trim();
    benHex = allHexagrams.find(h => h.name === benName || h.full_name === benName);
    if (palaceLineMatches.length > 1) {
      const bianName = palaceLineMatches[1][1].trim();
      bianHex = allHexagrams.find(h => h.name === bianName || h.full_name === bianName);
    }
  }

  if (!benHex) {
    const primaryName = caseItem.primary_gua || caseItem.gua_name || '';
    if (primaryName) {
      const clean = primaryName.replace(/之.*/, '').replace(/卦$/, '').trim();
      benHex = allHexagrams.find(h => h.name === clean || h.full_name === clean)
        || allHexagrams.find(h => h.name.includes(clean) || clean.includes(h.name) || h.full_name.includes(clean));
    }
  }
  if (!benHex) benHex = allHexagrams[0];

  if (!bianHex) {
    const changedName = caseItem.changed_gua || (caseItem.gua_name && caseItem.gua_name.includes('之') ? caseItem.gua_name.split('之')[1] : '');
    if (changedName) {
      const cleanChanged = changedName.replace(/卦$/, '').trim();
      bianHex = allHexagrams.find(h => h.name === cleanChanged || h.full_name === cleanChanged)
        || allHexagrams.find(h => h.name.includes(cleanChanged) || cleanChanged.includes(h.name) || h.full_name.includes(cleanChanged));
    }
  }

  // 3. 判定动爻：本卦与变卦阴阳不同之爻即为动爻，这是唯一可靠的判定方式。
  // 不再退回扫描 diagram 文本里的"○/×/动/→"符号——古籍"变出式"写法会把变卦全部六爻都
  // 写出来，只有真正发动的爻旁才有符号，但符号本身在扫描时经常连带命中相邻的六神/爻文字，
  // 产生假阳性，导致按这些误判的动爻反推出来的变卦跟 diagram 里明写的变卦对不上（曾在
  // case_019 上实测到：明明写的是"屯之震"，却被误判出多余动爻，反推成了"雷地豫"）。
  // 只有在完全没有 bianHex 可比对时（真正的静卦、无变卦），才用文本扫描兜底。
  const rawLines = benHex.lines.map((line, idx) => {
    let isMoving = false;
    if (bianHex) {
      const bianLine = bianHex.lines[idx];
      if (bianLine && bianLine.yin_yang !== line.yin_yang) {
        isMoving = true;
      }
    } else if (caseItem.diagram) {
      const diagLines = caseItem.diagram.split('\n');
      const reversedDiag = [...diagLines].reverse();
      const targetLineText = reversedDiag[idx] || '';
      if (targetLineText.includes('○') || targetLineText.includes('×') || targetLineText.includes('动') || targetLineText.includes('→')) {
        isMoving = true;
      }
    }

    return {
      yinYang: line.yin_yang,
      isMoving
    };
  });

  return assemblePaipanBoard({
    rawLines,
    monthBranch,
    dayStem,
    dayBranch,
    question: caseItem.question || caseItem.title || '古籍实战卦例',
    yongShenKey: '用神'
  });
}


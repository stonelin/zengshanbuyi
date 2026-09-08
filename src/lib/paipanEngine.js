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
      palaceName: palace.palace_name,
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

// 模拟摇 3 枚铜钱
// 规则：0 代表字/反面 (阴 2)，1 代表背/正面 (阳 3)
// 1背2字 = 3+2+2 = 7 (少阳，静)
// 2背1字 = 3+3+2 = 8 (少阴，静)
// 3背0字 = 3+3+3 = 9 (老阳，动 ◯)
// 0背3字 = 2+2+2 = 6 (老阴，动 ✕)
export function tossThreeCoins() {
  const c1 = Math.random() > 0.5 ? 1 : 0;
  const c2 = Math.random() > 0.5 ? 1 : 0;
  const c3 = Math.random() > 0.5 ? 1 : 0;
  const backCount = c1 + c2 + c3; // 背面数量 (0~3)
  
  let type = 'shao_yang'; // 7
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

  return {
    coins: [c1, c2, c3],
    backCount,
    score,
    yinYang,
    isMoving,
    changedYinYang,
    type
  };
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
  const liuShenList = getLiuShenList(dayStem);

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

      bianYao = {
        yinYang: targetBianLine.yin_yang,
        relative: targetBianLine.relative,
        ganzhi: targetBianLine.stem_branch,
        branch: targetBianLine.branch,
        element: targetBianLine.element,
        dynamicTrend
      };
    }

    // 状态标签
    const tags = [];
    if (yaoBranch === monthBroken) tags.push({ text: '月破', type: 'danger' });
    if (xunKong.includes(yaoBranch)) tags.push({ text: '旬空', type: 'warning' });
    if (bLine.is_shi) tags.push({ text: '世爻', type: 'primary' });
    if (bLine.is_ying) tags.push({ text: '应爻', type: 'info' });
    if (bLine.relative === yongShenKey) tags.push({ text: '用神', type: 'success' });
    if (isMoving) tags.push({ text: '发动', type: 'danger' });

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
      tags
    };
  });

  return {
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

  // 2. 匹配本卦与变卦
  let benHex = null;
  const primaryName = caseItem.primary_gua || caseItem.gua_name || '';
  if (primaryName) {
    benHex = findHexagramByName(primaryName);
    if (!benHex) {
      // 模糊匹配
      const clean = primaryName.replace(/之.*/, '').replace(/卦$/, '').trim();
      benHex = allHexagrams.find(h => h.name.includes(clean) || clean.includes(h.name) || h.full_name.includes(clean));
    }
  }
  if (!benHex) benHex = allHexagrams[0];

  let bianHex = null;
  const changedName = caseItem.changed_gua || (caseItem.gua_name && caseItem.gua_name.includes('之') ? caseItem.gua_name.split('之')[1] : '');
  if (changedName) {
    const cleanChanged = changedName.replace(/卦$/, '').trim();
    bianHex = allHexagrams.find(h => h.name.includes(cleanChanged) || cleanChanged.includes(h.name) || h.full_name.includes(cleanChanged));
  }

  // 3. 判定动爻
  const rawLines = benHex.lines.map((line, idx) => {
    let isMoving = false;
    if (bianHex) {
      // 变卦与本卦阴阳不同的爻为动爻
      const bianLine = bianHex.lines[idx];
      if (bianLine && bianLine.yin_yang !== line.yin_yang) {
        isMoving = true;
      }
    }
    // 检查 diagram 文本中是否有动爻指示 (○→ 或 ×→)
    if (caseItem.diagram) {
      const diagLines = caseItem.diagram.split('\n');
      // diagram 从上爻至初爻 或 初爻至上爻 检查
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


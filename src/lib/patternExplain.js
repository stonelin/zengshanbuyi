// 结论区格局标签 / 爻旺衰的悬浮解释文案生成。
// 纯展示层推导：只读 board（paipanEngine.assemblePaipanBoard 的输出），
// 不改动引擎的 board.patterns 字符串数组结构（卦例数据与回归测试都依赖它）。
import {
  SANHE_GROUPS,
  WUXING_RELATIONS,
  BRANCH_WUXING,
  CHANGSHENG_MAP,
  DI_WANG_MAP,
  MUKU_MAP,
  JUE_MAP,
  getClashBranch,
  getHeBranch,
  getGuiRen,
  getLuShen,
  getYiMa
} from './paipanEngine.js';

const YAO_POS_NAMES = ['', '初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];

export function yaoPosName(index) {
  return YAO_POS_NAMES[index] || `${index}爻`;
}

function describeYao(yao) {
  return `${yaoPosName(yao.index)}${yao.relative}${yao.ganzhi}${yao.element}`;
}

function describeBianYao(yao) {
  return `${yaoPosName(yao.index)}变${yao.bianYao.relative}${yao.bianYao.branch}${yao.bianYao.element}`;
}

// 该地支由盘面哪一处提供（本卦爻或变爻），用于三合局取象溯源
function findBranchProviders(board, branch) {
  const providers = [];
  board.yaos.forEach(y => {
    if (y.branch === branch) providers.push(describeYao(y));
    if (y.bianYao?.branch === branch) providers.push(describeBianYao(y));
  });
  return providers;
}

function yaosWithBianFlag(board, predicate, describe) {
  return board.yaos.filter(y => y.bianYao && predicate(y)).map(describe);
}

// 内卦=1~3爻，外卦=4~6爻，列出本卦与变卦逐爻地支对照
function trigramPairs(board, lineNumbers) {
  if (!board.bianGua) return [];
  return lineNumbers.map(n => {
    const benBranch = board.benGua.lines.find(l => l.line_number === n)?.branch ?? '?';
    const bianBranch = board.bianGua.lines.find(l => l.line_number === n)?.branch ?? '?';
    const relation = getClashBranch(benBranch) === bianBranch
      ? '相冲'
      : benBranch === bianBranch ? '纳支未变' : '—';
    return `${yaoPosName(n)} ${benBranch} → ${bianBranch}（${relation}）`;
  });
}

const GUA_CHANGE_RULES = {
  '比和': ['变卦宫五行与本卦宫五行相同，为比和。'],
  '化来': ['变卦宫五行克本卦宫五行，即变卦回头来克本卦，原著称"变克"。'],
  '化去': ['本卦宫五行克变卦宫五行，我去克他，原著案例明言不为凶。'],
  '变生': ['变卦宫五行生本卦宫五行，为变生。']
};

/**
 * 生成某个格局标签的悬浮解释。
 * @returns {{why: string, evidence: string[]}|null} 未收录的格局返回 null（UI 不挂提示）
 */
export function explainPattern(name, board) {
  if (!board) return null;
  const benName = board.benGua?.full_name ?? '本卦';
  const bianName = board.bianGua?.full_name ?? '变卦';

  // 三合局：申子辰水 / 寅午戌火 / 巳酉丑金 / 亥卯未木
  const sanHeMatch = /^三合(.)局$/.exec(name);
  if (sanHeMatch) {
    const group = SANHE_GROUPS.find(g => g.element === sanHeMatch[1]);
    if (!group) return null;
    return {
      why: `${group.branches.join('、')}三支齐现于盘面（本卦六爻与变爻合并取用），三支会齐即成三合${group.element}局，整体力量归于${group.element}。`,
      evidence: group.branches.map(b => {
        const providers = findBranchProviders(board, b);
        return `${b}：${providers.length ? providers.join('、') : '未见'}`;
      })
    };
  }

  switch (name) {
    case '六合':
      return { why: `本卦《${benName}》属六合卦，卦体六爻两两相合，主事缓、主聚。`, evidence: [`本卦：${benName}`] };
    case '六冲':
      return { why: `本卦《${benName}》属六冲卦，卦体六爻两两相冲，主事速、主散。`, evidence: [`本卦：${benName}`] };
    case '六冲变六合':
    case '六合变六冲':
    case '六合变六合':
    case '六冲变六冲':
      return {
        why: `本卦《${benName}》与变卦《${bianName}》的冲合属性构成"${name}"。《增删卜易》以此类卦变为断吉凶的关键格局，可不看用神径以此断。`,
        evidence: [
          `本卦：${benName}（${board.benGua.is_six_combine ? '六合' : board.benGua.is_six_clash ? '六冲' : '—'}）`,
          `变卦：${bianName}（${board.bianGua?.is_six_combine ? '六合' : board.bianGua?.is_six_clash ? '六冲' : '—'}）`
        ]
      };
    case '比和':
    case '化来':
    case '化去':
    case '变生':
      return {
        why: `${GUA_CHANGE_RULES[name][0]}此为宫位层面的整卦生克，与单一动爻的回头生/回头克不是同一层。`,
        evidence: [
          `本卦宫：${board.benGua.palace}（${board.benGua.palaceElement}）`,
          `变卦宫：${board.bianGua?.palace}（${board.bianGua?.palaceElement}）`
        ]
      };
    case '反吟(爻)': {
      const list = yaosWithBianFlag(board, y => y.bianYao.heChong === '化冲', y => `${describeYao(y)} → ${y.bianYao.branch}（相冲）`);
      return { why: '动爻与其变爻地支相冲，即"动而化冲"，为爻层面的反吟。', evidence: list };
    }
    case '反吟(内卦)':
    case '反吟(外卦)':
    case '反吟(内外)': {
      const scope = name === '反吟(内卦)' ? [1, 2, 3] : name === '反吟(外卦)' ? [4, 5, 6] : [1, 2, 3, 4, 5, 6];
      return {
        why: '本卦与变卦同爻位地支两两相冲，构成卦体反吟。此为本卦、变卦作为整体卦象的结构性比较，不以该爻是否发动为条件。',
        evidence: trigramPairs(board, scope)
      };
    }
    case '伏吟(内卦)':
    case '伏吟(外卦)':
    case '伏吟(内外)': {
      const scope = name === '伏吟(内卦)' ? [1, 2, 3] : name === '伏吟(外卦)' ? [4, 5, 6] : [1, 2, 3, 4, 5, 6];
      return {
        why: '本卦与变卦同爻位地支完全相同（阴阳虽换而纳支未变），构成卦体伏吟，主事伏而不动、呻吟难安。',
        evidence: trigramPairs(board, scope)
      };
    }
    case '化合':
      return {
        why: '动爻与其变爻地支相合，为化合。',
        evidence: yaosWithBianFlag(board, y => y.bianYao.heChong === '化合', y => `${describeYao(y)} → ${y.bianYao.branch}（相合）`)
      };
    case '化冲':
      return {
        why: '动爻与其变爻地支相冲，为化冲。',
        evidence: yaosWithBianFlag(board, y => y.bianYao.heChong === '化冲', y => `${describeYao(y)} → ${y.bianYao.branch}（相冲）`)
      };
    case '化空':
      return {
        why: `动爻所化之变爻落于本旬旬空（${board.dateGanzhi.xunKong.join('')}空），为化空。`,
        evidence: yaosWithBianFlag(board, y => y.bianYao.isKong, y => `${describeYao(y)} → ${describeBianYao(y)}`)
      };
    case '化墓':
      return {
        why: '动爻所化之变爻恰为本爻五行的墓库（金墓丑、木墓未、火墓戌、水土墓辰），为化墓。',
        evidence: yaosWithBianFlag(board, y => y.bianYao.isRuMu, y => `${describeYao(y)} → ${describeBianYao(y)}`)
      };
    default:
      return null;
  }
}

// 爻旺衰（以月建为准）的悬浮解释
export function explainWangShuai(yao, board) {
  const monthBranch = board?.dateGanzhi?.monthBranch;
  if (!yao?.wangShuai || !monthBranch) return null;
  const monthElement = BRANCH_WUXING[monthBranch];
  const match = /^(\S+)\s*(?:[(（](.*)[)）])?$/.exec(yao.wangShuai);
  const rule = match?.[2] || '';
  return {
    why: `旺相休囚死以月建为准：本爻${yao.branch}属${yao.element}，月建${monthBranch}属${monthElement}${rule ? `，${rule}` : ''}。`,
    evidence: [
      '同我为旺 · 生我为相 · 我生为休 · 我克为囚 · 克我为死',
      `${WUXING_RELATIONS[monthElement]?.sheng ?? ''}为月建所生，${WUXING_RELATIONS[monthElement]?.ke ?? ''}为月建所克`
    ]
  };
}

// 十二长生四项（长生/帝旺/墓/绝）在气泡里附一句口诀，便于对照
const CHANGSHENG_MNEMONIC = {
  长生: '金生巳 · 木生亥 · 火生寅 · 水土同生申',
  帝旺: '金旺酉 · 木旺卯 · 火旺午 · 水土同旺子',
  墓: '金墓丑 · 木墓未 · 火墓戌 · 水土同墓辰',
  绝: '金绝寅 · 木绝申 · 火绝亥 · 水土同绝巳'
};

/**
 * 生成爻行状态标签（月破/日合/暗动/发动……）的悬浮解释。
 * @returns {{why: string, evidence: string[]}|null} 未收录的标签返回 null（UI 不挂提示）
 */
export function explainYaoTag(tagText, yao, board) {
  if (!yao || !board) return null;
  const { monthBranch, monthBroken, dayStem, dayBranch, day, xunKong } = board.dateGanzhi;
  const self = `本爻${yao.ganzhi}${yao.element}`;

  switch (tagText) {
    case '月破':
      return {
        why: `月建${monthBranch}所冲之支为${monthBroken}，本爻地支${yao.branch}正当其冲，为月破。`,
        evidence: [`月建：${monthBranch}月，冲${monthBroken}`, `${self}，地支${yao.branch}`]
      };
    case '旬空':
      return {
        why: `日辰${day}所在一旬缺${xunKong.join('、')}两支，本爻${yao.branch}落其中，为旬空。`,
        evidence: [`日辰：${day}`, `本旬空亡：${xunKong.join('、')}`]
      };
    case '日破':
      return {
        why: `日辰${dayBranch}冲本爻${yao.branch}，为日破（日辰冲爻）。`,
        evidence: [`日辰：${day}，冲${getClashBranch(dayBranch)}`, `${self}，地支${yao.branch}`]
      };
    case '日合':
      return {
        why: `日辰${dayBranch}与本爻${yao.branch}地支六合，为日合。`,
        evidence: [`日辰：${day}，合${getHeBranch(dayBranch)}`, `${self}，地支${yao.branch}`]
      };
    case '暗动':
      return {
        why: '静爻被日辰冲、且不落旬空，谓之暗动——爻虽未摇出动象，实已暗中起用，与明动同论。',
        evidence: [`${self}未发动（静爻）`, `日辰${dayBranch}冲${yao.branch}`, `${yao.branch}不在旬空（${xunKong.join('、')}）`]
      };
    case '入墓(日墓)':
      return {
        why: `${yao.element}的墓库在${MUKU_MAP[yao.element]}，正是今日日支${dayBranch}，本爻入日墓。`,
        evidence: [`${self}`, `日辰：${day}`, CHANGSHENG_MNEMONIC['墓']]
      };
    case '长生(日)':
      return {
        why: `${yao.element}长生在${CHANGSHENG_MAP[yao.element]}，正是今日日支${dayBranch}。`,
        evidence: [`${self}`, `日辰：${day}`, CHANGSHENG_MNEMONIC['长生']]
      };
    case '帝旺(日)':
      return {
        why: `${yao.element}帝旺在${DI_WANG_MAP[yao.element]}，正是今日日支${dayBranch}。`,
        evidence: [`${self}`, `日辰：${day}`, CHANGSHENG_MNEMONIC['帝旺']]
      };
    case '绝(日)':
      return {
        why: `${yao.element}绝在${JUE_MAP[yao.element]}，正是今日日支${dayBranch}。`,
        evidence: [`${self}`, `日辰：${day}`, CHANGSHENG_MNEMONIC['绝']]
      };
    case '世爻':
      return {
        why: `世爻是占卜者自身之位，由本卦所属宫的世位定：${board.benGua.palace} ${board.benGua.generation}，世在${yaoPosName(yao.index)}。`,
        evidence: [`本卦：${board.benGua.full_name}（${board.benGua.palace}·${board.benGua.generation}）`, `${self}`]
      };
    case '应爻':
      return {
        why: `应爻是所占对方或事体之位，与世爻相隔三位，本卦应在${yaoPosName(yao.index)}。`,
        evidence: [`本卦：${board.benGua.full_name}（${board.benGua.palace}·${board.benGua.generation}）`, `${self}`]
      };
    case '用神':
      return {
        why: `本次所占取${board.yongShenKey}为用神，本爻六亲正是${yao.relative}，故为用神爻。`,
        evidence: [`用神六亲：${board.yongShenKey}`, `${yaoPosName(yao.index)}${yao.relative}${yao.ganzhi}${yao.element}`]
      };
    case '发动':
      return {
        why: `摇卦时该爻得老阳（◯）或老阴（✕），动而生变${yao.bianYao ? `，化出${yao.bianYao.relative}${yao.bianYao.branch}${yao.bianYao.element}` : ''}。`,
        evidence: [
          `${self}（${yao.yinYang}爻，${yao.yinYang === '阳' ? '老阳◯' : '老阴✕'}）`,
          yao.bianYao ? `变爻：${yao.bianYao.relative}${yao.bianYao.branch}${yao.bianYao.element}${yao.bianYao.dynamicTrend && yao.bianYao.dynamicTrend !== '变爻' ? `（${yao.bianYao.dynamicTrend}）` : ''}` : ''
        ].filter(Boolean)
      };
    case '贵人':
      return {
        why: `以日干${dayStem}起天乙贵人，贵人在${getGuiRen(dayStem).join('、')}，本爻${yao.branch}正在其位。`,
        evidence: [`日辰：${day}`, `${self}`]
      };
    case '禄神':
      return {
        why: `以日干${dayStem}起禄神，禄在${getLuShen(dayStem)}，与本爻${yao.branch}相同。`,
        evidence: [`日辰：${day}`, `${self}`]
      };
    case '驿马':
      return {
        why: `以日支${dayBranch}起驿马，马在${getYiMa(dayBranch)}，与本爻${yao.branch}相同。`,
        evidence: [`日辰：${day}`, `${self}`]
      };
    default:
      return null;
  }
}

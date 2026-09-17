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
  getYiMa,
  getTaoHua,
  getTianXi,
  FAN_YIN_PAIRS,
  FU_YIN_PAIRS
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

// 反吟/伏吟取证：列出本卦→变卦的八卦变化，并附该半边卦逐爻的纳甲地支对照
function trigramChangeEvidence(board, scope) {
  if (!board.bianGua) return [];
  const halves = [];
  if (scope !== 'outer') halves.push(['内卦', board.benGua.lower_trigram, board.bianGua.lower_trigram, [1, 2, 3]]);
  if (scope !== 'inner') halves.push(['外卦', board.benGua.upper_trigram, board.bianGua.upper_trigram, [4, 5, 6]]);

  return halves.flatMap(([label, benTri, bianTri, lineNumbers]) => {
    const branches = lineNumbers.map(n => {
      const benBranch = board.benGua.lines.find(l => l.line_number === n)?.branch ?? '?';
      const bianBranch = board.bianGua.lines.find(l => l.line_number === n)?.branch ?? '?';
      return `${yaoPosName(n)} ${benBranch}→${bianBranch}`;
    });
    return [`${label}：${benTri} 变 ${bianTri}`, `　纳甲：${branches.join('，')}`];
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
    const { dayBranch, monthBranch, day } = board.dateGanzhi;
    return {
      why: `${group.branches.join('、')}三支会齐，成三合${group.element}局，整体力量归于${group.element}。成局须有动爻发端，不足之支可由动爻所化之变爻或日辰月建补上，静爻不参与凑局。`,
      evidence: group.branches.map(b => {
        const providers = findBranchProviders(board, b);
        if (b === dayBranch) providers.push(`日辰${day}`);
        if (b === monthBranch) providers.push(`月建${monthBranch}月`);
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
      const scope = name === '反吟(内卦)' ? 'inner' : name === '反吟(外卦)' ? 'outer' : 'both';
      return {
        why: '《增删卜易·反伏章》："卦变反吟者，内外自相冲克。如乾变巽、巽变乾、坎变离、离变坎、震变兑、兑变震、坤变艮、艮变坤，皆谓之反吟。"判的是卦象对冲——恰为后天八卦方位相对（乾西北↔巽东南、坎北↔离南、震东↔兑西、坤西南↔艮东北），不看纳甲地支是否逐位相冲。反吟主往复反复、成败不定、有始无终。',
        evidence: [
          ...trigramChangeEvidence(board, scope),
          `反吟定式：${[...new Set(Object.entries(FAN_YIN_PAIRS).map(([a, b]) => [a, b].sort().join('↔')))].join('、')}`
        ]
      };
    }
    case '伏吟(内卦)':
    case '伏吟(外卦)':
    case '伏吟(内外)': {
      const scope = name === '伏吟(内卦)' ? 'inner' : name === '伏吟(外卦)' ? 'outer' : 'both';
      return {
        why: '《增删卜易·反伏章》的伏吟定式为乾变震、震变乾。成因是两卦纳甲完全相同（内卦同配子寅辰、外卦同配午申戌），阴阳换了而地支没换，所谓"动如不动"，主事伏而不动、呻吟难安。',
        evidence: [
          ...trigramChangeEvidence(board, scope),
          `伏吟定式：${[...new Set(Object.entries(FU_YIN_PAIRS).map(([a, b]) => [a, b].sort().join('↔')))].join('、')}`
        ]
      };
    }
    case '化合':
      return {
        why: '动爻与其变爻地支相合，为化合。地支相合者五行多有生克（如寅亥合而水生木），故化合可与回头生克并存，两者各判各的。',
        evidence: yaosWithBianFlag(board, y => y.bianYao.heChong === '化合', y => `${describeYao(y)} → ${y.bianYao.branch}（相合）`)
      };
    case '化冲':
      return {
        why: '动爻与其变爻地支相冲，为化冲，同时即构成爻层面的反吟。相冲六对除丑未、辰戌外皆为相克（子午、寅申、卯酉、巳亥），故化冲常与回头克并存，两者各判各的。',
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

  const dayElement = BRANCH_WUXING[dayBranch];
  const monthElement = BRANCH_WUXING[monthBranch];
  const linRi = yao.branch === dayBranch;
  const riSheng = WUXING_RELATIONS[dayElement]?.sheng === yao.element;

  switch (tagText) {
    case '月破':
      return {
        why: `月建${monthBranch}所冲之支为${monthBroken}，本爻地支${yao.branch}正当其冲，且无救助之力，为真月破。`,
        evidence: [
          `月建：${monthBranch}月，冲${monthBroken}`,
          `${self}，地支${yao.branch}`,
          '救助四途（动、临日、得日生扶、化回头生）一无所有，故不作假破论'
        ]
      };
    case '假破':
      return {
        why: `本爻${yao.branch}虽当月建${monthBranch}之冲，但另有救助之力，破而不破，谓之假破。`,
        evidence: [
          `月建：${monthBranch}月，冲${monthBroken}`,
          `${self}，地支${yao.branch}`,
          ...[
            yao.isMoving ? '本爻发动，动不为破' : null,
            linRi ? `临日辰（日支${dayBranch}与本爻同支）` : null,
            riSheng ? `得日生扶（日辰${dayBranch}属${dayElement}，生本爻${yao.element}）` : null,
            yao.bianYao?.dynamicTrend === '回头生' ? `化回头生（变爻${yao.bianYao.branch}${yao.bianYao.element}生本爻）` : null
          ].filter(Boolean)
        ]
      };
    case '旬空':
      return {
        why: `日辰${day}所在一旬缺${xunKong.join('、')}两支，本爻${yao.branch}落其中，为旬空。`,
        evidence: [`日辰：${day}`, `本旬空亡：${xunKong.join('、')}`]
      };
    case '日破':
      return {
        why: `日辰${dayBranch}冲本爻${yao.branch}。本爻为静爻，月令又${yao.wangShuai[0]}，本无根气，无力承冲，故为日破。`,
        evidence: [
          `日辰：${day}，冲${getClashBranch(dayBranch)}`,
          `${self}，地支${yao.branch}（静爻）`,
          `月令旺衰：${yao.wangShuai}`,
          '静爻逢日冲：旺相为暗动，休囚为日破——与动爻的冲起/冲散同用一把尺'
        ]
      };
    case '冲起':
      return {
        why: `《增删卜易·动散章》："旺相动爻，逢日冲为冲起；休囚动爻，逢日冲为冲散。"本爻已发动且月令${yao.wangShuai[0]}，逢日辰${dayBranch}相冲不但不散，反而力量倍增，谓之冲起。`,
        evidence: [
          `${self}，地支${yao.branch}（动爻）`,
          `日辰：${day}，冲${getClashBranch(dayBranch)}`,
          `月令旺衰：${yao.wangShuai}`
        ]
      };
    case '冲散':
      return {
        why: `《增删卜易·动散章》："旺相动爻，逢日冲为冲起；休囚动爻，逢日冲为冲散。"本爻虽已发动，然月令${yao.wangShuai[0]}，本无根气，逢日辰${dayBranch}一冲即散。`,
        evidence: [
          `${self}，地支${yao.branch}（动爻）`,
          `日辰：${day}，冲${getClashBranch(dayBranch)}`,
          `月令旺衰：${yao.wangShuai}`
        ]
      };
    case '临日':
      return {
        why: `本爻地支${yao.branch}与日辰日支相同，谓之临日。爻临日辰即得日辰之力，最为有气，月破亦可解。`,
        evidence: [`日辰：${day}，日支${dayBranch}`, `${self}，地支${yao.branch}`]
      };
    case '日生':
      return {
        why: `日辰${dayBranch}属${dayElement}，${dayElement}生${yao.element}，本爻得日辰生扶。日辰为六爻之主宰，得其生扶者虽衰不弱。`,
        evidence: [`日辰：${day}，日支${dayBranch}属${dayElement}`, `${self}`, `${dayElement}生${yao.element}`]
      };
    case '日合':
      return {
        why: `日辰${dayBranch}与本爻${yao.branch}地支六合，为日合。`,
        evidence: [`日辰：${day}，合${getHeBranch(dayBranch)}`, `${self}，地支${yao.branch}`]
      };
    case '暗动':
      return {
        why: `静爻被日辰冲，而本身月令${yao.wangShuai[0]}，有根气承冲，则冲而不破反被激发——爻虽未摇出动象，实已暗中起用，与明动同论，谓之暗动。`,
        evidence: [
          `${self}未发动（静爻）`,
          `日辰${dayBranch}冲${yao.branch}`,
          `月令旺衰：${yao.wangShuai}（月建${monthBranch}属${monthElement}）`,
          '静爻逢日冲：旺相为暗动，休囚为日破——与动爻的冲起/冲散同用一把尺'
        ]
      };
    case '入墓(月)':
    case '入墓(日)':
    case '长生(月)':
    case '长生(日)':
    case '帝旺(月)':
    case '帝旺(日)':
    case '绝(月)':
    case '绝(日)': {
      const [, label, scope] = /^(.+)\((.)\)$/.exec(tagText) ?? [];
      const map = { 入墓: MUKU_MAP, 长生: CHANGSHENG_MAP, 帝旺: DI_WANG_MAP, 绝: JUE_MAP }[label];
      const mnemonicKey = label === '入墓' ? '墓' : label;
      const isMonth = scope === '月';
      const refBranch = isMonth ? monthBranch : dayBranch;
      return {
        why: `${yao.element}${label === '入墓' ? '的墓库在' : label + '在'}${map[yao.element]}，正是${isMonth ? `月建${monthBranch}` : `今日日支${dayBranch}`}。生旺墓绝以月建为主、日辰为辅：月建上命中即以月论，月建不命中才退看日辰。`,
        evidence: [
          `${self}`,
          isMonth ? `月建：${monthBranch}月` : `日辰：${day}（月建${monthBranch}月不当此位）`,
          `${label}位：${map[yao.element]}，与${isMonth ? '月建' : '日支'}${refBranch}相同`,
          CHANGSHENG_MNEMONIC[mnemonicKey]
        ]
      };
    }
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
    case '桃花':
      return {
        why: `桃花（咸池）以日支所属三合局起：${dayBranch}属${SANHE_GROUPS.find(g => g.branches.includes(dayBranch))?.branches.join('') ?? ''}局，桃花在${getTaoHua(dayBranch)}，与本爻${yao.branch}相同。`,
        evidence: [
          `日辰：${day}`,
          `${self}`,
          '申子辰在酉 · 寅午戌在卯 · 巳酉丑在午 · 亥卯未在子'
        ]
      };
    case '天喜':
      return {
        why: `天喜以月建所属四季起：${monthBranch}月属${'寅卯辰'.includes(monthBranch) ? '春' : '巳午未'.includes(monthBranch) ? '夏' : '申酉戌'.includes(monthBranch) ? '秋' : '冬'}，天喜在${getTianXi(monthBranch)}，与本爻${yao.branch}相同。`,
        evidence: [
          `月建：${monthBranch}月`,
          `${self}`,
          '春戌 · 夏丑 · 秋辰 · 冬未'
        ]
      };
    default:
      return null;
  }
}

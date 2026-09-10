// 卦例记录（records）领域逻辑：由 board 派生标签、匹配 cases、localStorage 持久化。
// 落地方式：先用 localStorage（单浏览器，无后端），等后端接入后再迁移。

const STORAGE_KEY = 'yi-records-v1';
const YAO_ORDINALS = ['初', '二', '三', '四', '五', '上'];

// 动爻数量 → MOVING_COUNT 分类
export function classifyMovingCount(board) {
  const movingCount = board.yaos.filter(y => y.isMoving).length;
  if (movingCount === 0) return '静卦';
  if (movingCount === 1) return '独发';
  if (movingCount === 2) return '二爻动';
  if (movingCount === 6) return '六爻乱动';
  return '三爻以上';
}

// 世应位置描述，如 "世四应初"
export function describeShiYing(board) {
  const shi = board.yaos.find(y => y.isShi);
  const ying = board.yaos.find(y => y.isYing);
  if (!shi || !ying) return '';
  return `世${YAO_ORDINALS[shi.index - 1]}应${YAO_ORDINALS[ying.index - 1]}`;
}

// 用神状态：综合 resolveYongShen() 的结果与命中爻自身的 tags/wangShuai
export function deriveYongShenStatus(resolution, board) {
  const status = new Set();
  if (resolution.candidates.length > 1) status.add('多现');
  if (resolution.candidates.length === 0 && resolution.hiddenFallback.length > 0) status.add('伏藏');
  if (resolution.candidates.length === 0 && resolution.hiddenFallback.length === 0 && resolution.key) status.add('不上卦');

  resolution.candidates.forEach(c => {
    const yao = board.yaos.find(y => y.index === c.index);
    if (!yao) return;
    if (yao.wangShuai.startsWith('旺') || yao.wangShuai.startsWith('相')) status.add('旺相');
    if (yao.wangShuai.startsWith('休') || yao.wangShuai.startsWith('囚') || yao.wangShuai.startsWith('死')) status.add('休囚');
    if (yao.tags.some(t => t.text === '月破')) status.add('月破');
    if (yao.tags.some(t => t.text === '旬空')) status.add('旬空');
    if (yao.tags.some(t => t.text.startsWith('入墓'))) status.add('入墓');
  });

  return Array.from(status);
}

// 由 board + 占问事类 + 用神解析结果 派生 caseTagsSchema.partial() 形状的标签（D 组"盘面"+ 部分 C 组"取用"）
export function deriveTagsFromBoard(board, eventType, resolution) {
  return {
    eventType,
    yongShen: resolution.key || undefined,
    yongShenStatus: deriveYongShenStatus(resolution, board),
    guaName: board.benGua.name,
    guaPalace: board.benGua.palace,
    shiYingPosition: describeShiYing(board),
    movingCount: classifyMovingCount(board),
    patterns: board.patterns
  };
}

// 组装一条完整的 record（未持久化）
export function createRecord({ eventType, question, board, resolution, myJudgment, castAt }) {
  return {
    id: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    castAt: castAt || undefined,
    eventType,
    question: question || undefined,
    board,
    tags: deriveTagsFromBoard(board, eventType, resolution),
    myJudgment: myJudgment || undefined,
    actualOutcome: undefined,
    reflection: undefined
  };
}

// 按标签匹配书中实例，分组：同要点(优先) / 同事类+同用神状态 / 同格局
// casesData 传入 cases_v2.json（已校对实例，仍在持续录入中）；sameKeyPoint 恒为空——
// keyPoints 是人工提炼的要点文本，record 的 tags 由 board 派生，没有对应字段可比对，
// 这里仅对缺 tags 的条目做防御性跳过。
export function matchCasesForRecord(record, casesData) {
  const structuredCases = (casesData || []).filter(c => c.tags);
  const sameKeyPoint = [];
  const sameEventAndStatus = [];
  const samePatterns = [];

  structuredCases.forEach(c => {
    if (c.tags.eventType === record.tags.eventType) {
      const statusOverlap = (c.tags.yongShenStatus || []).some(s => (record.tags.yongShenStatus || []).includes(s));
      if (statusOverlap) sameEventAndStatus.push(c);
    }
    const patternOverlap = (c.tags.patterns || []).some(p => (record.tags.patterns || []).includes(p));
    if (patternOverlap) samePatterns.push(c);
  });

  return { sameKeyPoint, sameEventAndStatus, samePatterns };
}

// --- localStorage 持久化：读写均防御性 try/catch（隐私模式/存储被禁时会抛错）---

export function loadRecords() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistRecords(records) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return true;
  } catch {
    return false;
  }
}

export function saveRecord(record) {
  const records = loadRecords();
  records.unshift(record);
  persistRecords(records);
  return records;
}

export function updateRecord(id, patch) {
  const records = loadRecords();
  const next = records.map(r => (r.id === id ? { ...r, ...patch } : r));
  persistRecords(next);
  return next;
}

export function deleteRecord(id) {
  const records = loadRecords().filter(r => r.id !== id);
  persistRecords(records);
  return records;
}

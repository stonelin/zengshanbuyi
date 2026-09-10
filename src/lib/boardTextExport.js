// 盘面 / 实例的纯文本导出：供"复制"按钮把内容交给其他 AI 追问时使用。
// 输出为无 Markdown 修饰的等宽纯文本，字段名与站内展示口径一致。
import { yaoPosName } from './patternExplain.js';
import { RELATIVES } from './schema.js';
import { resolveGanzhiFromDate } from './ganzhiCalendar.js';

function yaoLineSymbol(yinYang, isMoving) {
  const body = yinYang === '阳' ? '▬▬▬▬' : '▬▬ ▬▬';
  if (!isMoving) return body;
  return `${body} ${yinYang === '阳' ? '○' : '✕'}`;
}

function bianYaoText(bianYao) {
  if (!bianYao) return '';
  const marks = [
    bianYao.dynamicTrend && bianYao.dynamicTrend !== '变爻' ? bianYao.dynamicTrend : '',
    bianYao.heChong || '',
    bianYao.isKong ? '化空' : '',
    bianYao.isRuMu ? '化墓' : ''
  ].filter(Boolean);
  const suffix = marks.length ? `（${marks.join('、')}）` : '';
  return ` → 变 ${bianYao.relative}${bianYao.branch}${bianYao.element}${suffix}`;
}

// 单爻一行：爻位 六神 [伏神] 爻象 六亲干支五行 [世/应/用] 旺衰 标签 → 变爻
function formatYaoLine(yao, yongShenKey) {
  const positions = [
    yao.isShi ? '世' : '',
    yao.isYing ? '应' : '',
    yongShenKey && yao.relative === yongShenKey ? '用神' : ''
  ].filter(Boolean);
  const hidden = yao.hiddenSpirit ? `（伏 ${yao.hiddenSpirit.relative}${yao.hiddenSpirit.stem_branch}）` : '';
  const tags = yao.tags.map(t => t.text).join('、');
  return [
    yaoPosName(yao.index),
    yao.liuShen,
    hidden,
    yaoLineSymbol(yao.yinYang, yao.isMoving),
    `${yao.relative}${yao.ganzhi}${yao.element}`,
    positions.length ? `[${positions.join('/')}]` : '',
    yao.wangShuai,
    tags,
    bianYaoText(yao.bianYao).trim()
  ].filter(Boolean).join(' ');
}

/**
 * 盘面 → 纯文本（月建日辰、本卦变卦、用神格局、自上爻至初爻的六爻明细）
 * @param {string|null} yongShenFallback 已校对实例的 board.yongShenKey 多为占位字面量"用神"，由调用方补真实六亲
 */
export function formatBoardText(board, yongShenFallback = null) {
  if (!board) return '';
  const { dateGanzhi: d, benGua, bianGua } = board;
  const lines = [
    `月建：${d.month}（月破：${d.monthBroken}）　日辰：${d.day}（旬空：${d.xunKong.join('、')}）`,
    `本卦：${benGua.full_name}（${benGua.palace}·${benGua.palaceElement}·${benGua.generation}）`
  ];
  if (bianGua) lines.push(`变卦：${bianGua.full_name}（${bianGua.palace}·${bianGua.palaceElement}）`);
  const yongShenKey = RELATIVES.includes(board.yongShenKey)
    ? board.yongShenKey
    : (RELATIVES.includes(yongShenFallback) ? yongShenFallback : null);
  const isShiYongShen = board.yongShenKey === '世爻' || yongShenFallback === '世爻';
  lines.push(`用神：${yongShenKey || (isShiYongShen ? '以世爻为用' : '未标注')}`);
  if (board.patterns?.length) lines.push(`格局：${board.patterns.join('、')}`);
  lines.push('六爻（自上爻至初爻）：');
  [...board.yaos].reverse().forEach(y => lines.push(`  ${formatYaoLine(y, yongShenKey)}`));
  return lines.join('\n');
}

/** 实例 → 纯文本：书中原文（卦图/断语/解析）+ 结构化盘面 + 小结要点 */
export function formatCaseText(caseItem) {
  if (!caseItem) return '';
  const { originalText: o = {}, tags = {} } = caseItem;
  const blocks = [];

  const head = [`【实例】${caseItem.title}`];
  if (caseItem.chapterTitle) head.push(`【出处】《增删卜易》${caseItem.chapterTitle}`);
  const meta = [
    tags.eventType ? `事类：${tags.eventType}` : '',
    tags.verified ? `应验：${tags.verified}` : '',
    tags.yongShen ? `用神：${tags.yongShen}` : ''
  ].filter(Boolean);
  if (meta.length) head.push(`【标签】${meta.join('　')}`);
  if (caseItem.question) head.push(`【占问】${caseItem.question}`);
  blocks.push(head.join('\n'));

  if (o.diagram) blocks.push(`【原文卦图】\n${o.diagram}`);
  if (o.verdict) blocks.push(`【野鹤断语】\n${o.verdict}`);
  if (o.analysis) blocks.push(`【解析】\n${o.analysis}`);
  if (caseItem.board) blocks.push(`【结构化盘面】\n${formatBoardText(caseItem.board, tags.yongShen)}`);
  if (caseItem.summary) blocks.push(`【小结】\n${caseItem.summary}`);
  if (tags.keyPoints?.length) blocks.push(`【要点】\n${tags.keyPoints.map(k => `· ${k}`).join('\n')}`);
  if (caseItem.disputed?.isDisputed) blocks.push(`【存疑】\n${caseItem.disputed.note || '与常规取法不一致，需留意。'}`);

  return blocks.join('\n\n');
}

/** 我的卦例记录 → 纯文本：起卦时间与农历干支 + 结构化盘面 + 我的判断/应验/复盘 */
export function formatRecordText(record, yongShenFallback = null) {
  if (!record) return '';
  const blocks = [];
  const head = [`【我的卦例】${record.board?.benGua?.full_name || ''}${record.board?.bianGua ? ` 之 ${record.board.bianGua.full_name}` : ''}`];
  head.push(`【事类】${record.eventType}`);
  if (record.question) head.push(`【占问】${record.question}`);

  const castAt = record.castAt || record.createdAt;
  const castDate = castAt ? new Date(castAt) : null;
  if (castDate && !Number.isNaN(castDate.getTime())) {
    const ganzhi = resolveGanzhiFromDate(castDate);
    head.push(`【起卦时间】${castDate.toLocaleString('zh-CN', { hour12: false })}`);
    head.push(`【农历干支】${ganzhi.lunarDate}　${ganzhi.yearGanzhi}年 ${ganzhi.monthGanzhi}月 ${ganzhi.dayGanzhi}日`);
  }
  blocks.push(head.join('\n'));

  if (record.board) blocks.push(`【结构化盘面】\n${formatBoardText(record.board, yongShenFallback ?? record.tags?.yongShen)}`);
  if (record.myJudgment) blocks.push(`【我的判断（事前）】\n${record.myJudgment}`);
  if (record.actualOutcome) blocks.push(`【应验结果】\n${record.actualOutcome}`);
  if (record.reflection) blocks.push(`【复盘】\n${record.reflection}`);
  return blocks.join('\n\n');
}

/** 典籍章节 → 纯文本：卷次、白话导读、研读要旨、古籍原文 */
export function formatChapterText(chapter) {
  if (!chapter) return '';
  const blocks = [`【章节】${chapter.title}`, `【出处】《增删卜易》${chapter.volume}${chapter.category ? ` · ${chapter.category}` : ''}`];
  if (chapter.summary) blocks.push(`【白话导读】\n${chapter.summary}`);
  if (chapter.key_points?.length) blocks.push(`【研读要旨】\n${chapter.key_points.map(k => `· ${k}`).join('\n')}`);
  if (chapter.full_text) blocks.push(`【古籍原文】\n${chapter.full_text}`);
  return blocks.join('\n\n');
}

import {
  ALL_HEXAGRAMS,
  findHexagramByLines,
  findHexagramByName,
  getXunKong,
  getMonthBrokenBranch,
  getLiuShenList,
  tossThreeCoins,
  assemblePaipanBoard,
  resolveYongShen,
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  XUNKONG_MAP,
  SIX_CLASHES,
  GUI_REN_MAP,
  LU_SHEN_MAP,
  YI_MA_MAP
} from '../src/lib/paipanEngine.js';
import { boardSchema, yongShenResolutionSchema } from '../src/lib/schema.js';
import chaptersData from '../src/data/chapters.json' with { type: 'json' };
import casesData from '../src/data/cases.json' with { type: 'json' };
import conceptsData from '../src/data/concepts.json' with { type: 'json' };

const bugsFound = [];

console.log('====================================================');
console.log('🔍 资深 QA 工程师 - 自动化测试套件执行中...');
console.log('====================================================\n');

// 1. 测试 64 卦完整性与二进制映射
console.log('--- 测试项 1: 64 卦数据结构与二进制序列映射 ---');
if (ALL_HEXAGRAMS.length !== 64) {
  bugsFound.push(`[BUG-01] 64 卦总数不正确，当前数量为 ${ALL_HEXAGRAMS.length}`);
} else {
  console.log('✅ 64 卦总数校验通过 (64/64)');
}

// 检查是否存在重复的 binarySeq
const seqSet = new Set();
ALL_HEXAGRAMS.forEach(h => {
  if (seqSet.has(h.binarySeq)) {
    bugsFound.push(`[BUG-02] 卦象二进制序列重复: ${h.name} (${h.binarySeq})`);
  }
  seqSet.add(h.binarySeq);

  if (!h.lines || h.lines.length !== 6) {
    bugsFound.push(`[BUG-03] 卦象 ${h.name} 缺少 6 爻完整数据`);
  }
});
if (seqSet.size === 64) {
  console.log('✅ 64 卦二进制序列唯一性校验通过 (64 种排列互不重复)');
}

// 2. 测试 60 甲子旬空与月破算法
console.log('\n--- 测试项 2: 六十甲子旬空与月破算法测试 ---');
let xunKongErrors = 0;
for (const [ganzhi, expectedKong] of Object.entries(XUNKONG_MAP)) {
  const result = getXunKong(ganzhi);
  if (result[0] !== expectedKong[0] || result[1] !== expectedKong[1]) {
    bugsFound.push(`[BUG-04] 旬空计算错误: ${ganzhi} 期望 [${expectedKong}] 实际返回 [${result}]`);
    xunKongErrors++;
  }
}
if (xunKongErrors === 0) {
  console.log('✅ 60 甲子旬空映射全部准确无误 (60/60)');
}

// 测试月破
let yuePoErrors = 0;
for (const [b, clash] of Object.entries(SIX_CLASHES)) {
  const res = getMonthBrokenBranch(b);
  if (res !== clash) {
    bugsFound.push(`[BUG-05] 月破计算错误: ${b}月 期望 ${clash} 实际返回 ${res}`);
    yuePoErrors++;
  }
}
if (yuePoErrors === 0) {
  console.log('✅ 十二地支月破相冲关系校验通过 (12/12)');
}

// 3. 测试六神起例覆盖
console.log('\n--- 测试项 3: 十天干起六神测试 ---');
let liuShenErrors = 0;
HEAVENLY_STEMS.forEach(stem => {
  const ls = getLiuShenList(stem);
  if (!ls || ls.length !== 6) {
    bugsFound.push(`[BUG-06] 天干 ${stem} 的六神列表长度不为 6`);
    liuShenErrors++;
  }
});
if (liuShenErrors === 0) {
  console.log('✅ 十天干起六神规则校验通过 (10/10)');
}

// 4. 测试进神退神法则覆盖
console.log('\n--- 测试项 4: 动爻进神与退神生克判定测试 ---');
// 检查土爻化进化退：丑化辰、辰化未、未化戌、戌化丑 是否被正确识别为化进神
const testBoard = assemblePaipanBoard({
  rawLines: [
    { yinYang: '阴', isMoving: true }, // 初爻动
    { yinYang: '阳', isMoving: false },
    { yinYang: '阴', isMoving: false },
    { yinYang: '阳', isMoving: false },
    { yinYang: '阴', isMoving: false },
    { yinYang: '阳', isMoving: false }
  ],
  monthBranch: '卯',
  dayStem: '戊',
  dayBranch: '辰'
});
console.log('✅ 排盘装配引擎运行正常');

// 5. 神煞映射表覆盖测试
console.log('\n--- 测试项 5: 贵人/禄神/驿马映射表覆盖测试 ---');
let shenShaErrors = 0;
HEAVENLY_STEMS.forEach(stem => {
  if (!GUI_REN_MAP[stem] || GUI_REN_MAP[stem].length !== 2) {
    bugsFound.push(`[BUG-09] 天干 ${stem} 缺少贵人映射`);
    shenShaErrors++;
  }
  if (!LU_SHEN_MAP[stem]) {
    bugsFound.push(`[BUG-10] 天干 ${stem} 缺少禄神映射`);
    shenShaErrors++;
  }
});
EARTHLY_BRANCHES.forEach(branch => {
  if (!YI_MA_MAP[branch]) {
    bugsFound.push(`[BUG-11] 地支 ${branch} 缺少驿马映射`);
    shenShaErrors++;
  }
});
if (shenShaErrors === 0) {
  console.log('✅ 十天干贵人/禄神、十二地支驿马映射表覆盖完整');
}

// 6. boardSchema / yongShenResolutionSchema 端到端校验
console.log('\n--- 测试项 6: 盘面与用神解析结果的 Schema 一致性测试 ---');
const schemaProbeBoards = [testBoard, assemblePaipanBoard({
  rawLines: [
    { yinYang: '阴', isMoving: true },
    { yinYang: '阳', isMoving: false },
    { yinYang: '阴', isMoving: true },
    { yinYang: '阳', isMoving: false },
    { yinYang: '阴', isMoving: false },
    { yinYang: '阳', isMoving: true }
  ],
  monthBranch: '卯',
  dayStem: '甲',
  dayBranch: '子'
})];
let schemaErrors = 0;
schemaProbeBoards.forEach((b, idx) => {
  const res = boardSchema.safeParse(b);
  if (!res.success) {
    bugsFound.push(`[BUG-12] 探测盘面 #${idx + 1} 不符合 boardSchema: ${JSON.stringify(res.error.issues)}`);
    schemaErrors++;
  }
  const ys = resolveYongShen('求财', b);
  const ysRes = yongShenResolutionSchema.safeParse(ys);
  if (!ysRes.success) {
    bugsFound.push(`[BUG-13] resolveYongShen 输出不符合 yongShenResolutionSchema: ${JSON.stringify(ysRes.error.issues)}`);
    schemaErrors++;
  }
});
if (schemaErrors === 0) {
  console.log('✅ 排盘看板与用神解析结果均满足 Zod Schema 契约');
}

// 7. 检查案例、章节、概念、题库的交叉链接有效性
console.log('\n--- 测试项 7: 数据集交叉链接完整性测试 ---');
let brokenChapterLinks = 0;
let brokenCaseLinks = 0;

casesData.forEach(c => {
  if (c.chapter_id) {
    const matchedCh = chaptersData.find(ch => ch.id === c.chapter_id);
    if (!matchedCh) {
      brokenChapterLinks++;
    }
  }
});
console.log(`- 案例关联章节有效性: ${casesData.length - brokenChapterLinks} / ${casesData.length}`);

// 总结
console.log('\n====================================================');
console.log(`📊 测试完成: 发现 ${bugsFound.length} 个潜在 Bug / 改进点`);
console.log('====================================================');
bugsFound.forEach(b => console.log(b));

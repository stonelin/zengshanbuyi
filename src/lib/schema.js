// 数据契约唯一可信源 (Zod)：terms / cases / records 三张表 + 排盘引擎输入输出。
// 参见 docs/architecture 军规 #2（单一数据可信源）。
import { z } from 'zod';

export const WUXING = ['木', '火', '土', '金', '水'];
export const RELATIVES = ['父母', '兄弟', '子孙', '妻财', '官鬼'];
export const LIU_SHEN = ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'];

// ---------------------------------------------------------------------------
// 排盘看板 (board)：paipanEngine.assemblePaipanBoard() 的输出契约。
// wangShuai/shenSha/patterns/yongShenCandidates 为 Step 3 待补全字段，先声明为可选。
// ---------------------------------------------------------------------------

const hiddenSpiritSchema = z.object({
  relative: z.enum(RELATIVES),
  stem_branch: z.string(),
  element: z.enum(WUXING)
});

const hexagramLineSchema = z.object({
  line_number: z.number().int().min(1).max(6),
  yin_yang: z.enum(['阳', '阴']),
  symbol: z.string(),
  stem_branch: z.string(),
  branch: z.string(),
  element: z.enum(WUXING),
  relative: z.enum(RELATIVES),
  is_shi: z.boolean(),
  is_ying: z.boolean(),
  hidden_spirit: hiddenSpiritSchema.optional()
});

export const hexagramSchema = z.object({
  hexagram_id: z.string(),
  name: z.string(),
  full_name: z.string(),
  palace: z.string(),
  element: z.enum(WUXING),
  order_in_palace: z.number().int(),
  generation: z.string(),
  shi_line: z.number().int(),
  ying_line: z.number().int(),
  is_six_clash: z.boolean(),
  is_six_combine: z.boolean(),
  is_youhun: z.boolean(),
  is_guihun: z.boolean(),
  upper_trigram: z.string(),
  lower_trigram: z.string(),
  lines: z.array(hexagramLineSchema).length(6),
  binarySeq: z.string(),
  palaceName: z.string(),
  palaceElement: z.enum(WUXING)
});

const yaoTagSchema = z.object({
  text: z.string(),
  type: z.enum(['danger', 'warning', 'primary', 'info', 'success'])
});

const bianYaoSchema = z
  .object({
    yinYang: z.enum(['阳', '阴']),
    relative: z.enum(RELATIVES),
    ganzhi: z.string(),
    branch: z.string(),
    element: z.enum(WUXING),
    dynamicTrend: z.string(), // '回头生' | '回头克' | '化进神' | '化退神' | '变爻'
    heChong: z.enum(['化合', '化冲']).nullable(), // 变爻与本爻的合冲关系（仅当 dynamicTrend 为'变爻'时可能命中）
    isKong: z.boolean(), // 化空：变爻地支落旬空
    isRuMu: z.boolean() // 化墓：变爻地支为其五行的日墓（仅金木水火四行判定）
  })
  .nullable();

const yaoSchema = z.object({
  index: z.number().int().min(1).max(6),
  yinYang: z.enum(['阳', '阴']),
  isMoving: z.boolean(),
  relative: z.enum(RELATIVES),
  ganzhi: z.string(),
  branch: z.string(),
  element: z.enum(WUXING),
  isShi: z.boolean(),
  isYing: z.boolean(),
  liuShen: z.enum(LIU_SHEN),
  hiddenSpirit: hiddenSpiritSchema.optional(),
  bianYao: bianYaoSchema,
  tags: z.array(yaoTagSchema),
  wangShuai: z.string(), // 该爻旺相休囚死判断（以月建为准）
  shenSha: z.array(z.enum(['贵人', '禄神', '驿马'])) // 本项目仅采用旬空/贵人/禄神/驿马；旬空走 tags，不重复放这里
});

const dateGanzhiSchema = z.object({
  month: z.string(),
  monthBranch: z.string(),
  monthBroken: z.string(),
  day: z.string(),
  dayStem: z.string(),
  dayBranch: z.string(),
  xunKong: z.tuple([z.string(), z.string()])
});

// 已实现的格局类型（不含反吟/伏吟——宫位对冲规则把握不足，留待用实例校对后再补）。
// 三合局按命中五行标注具体名称，故 patterns 不做严格 enum 校验，仅以此列表作为参考。
export const PATTERN_TYPES = ['六合', '六冲', '三合水局', '三合木局', '三合火局', '三合金局', '化空', '化墓', '化合', '化冲'];

export const boardSchema = z.object({
  question: z.string(),
  dateGanzhi: dateGanzhiSchema,
  benGua: hexagramSchema,
  bianGua: hexagramSchema.nullable(),
  yaos: z.array(yaoSchema).length(6),
  yongShenKey: z.string(), // 当前标注的用神六亲
  hasMoving: z.boolean(),
  patterns: z.array(z.string()) // 卦局整体格局判断，见 PATTERN_TYPES
});

// resolveYongShen() 的返回契约：按占问事类解析用神，多现列全部候选，不上卦转看伏神
const yaoRefSchema = z.object({
  index: z.number().int().min(1).max(6),
  relative: z.enum(RELATIVES),
  branch: z.string()
});

export const yongShenResolutionSchema = z.object({
  eventType: z.string(),
  key: z.enum(RELATIVES).nullable(), // 目标用神六亲；世爻类事类（如出行）为 null
  candidates: z.array(yaoRefSchema), // 用神在卦中出现的所有位置
  hiddenFallback: z.array(
    z.object({
      hostIndex: z.number().int().min(1).max(6),
      relative: z.enum(RELATIVES),
      stem_branch: z.string(),
      element: z.enum(WUXING)
    })
  ),
  note: z.string().nullable()
});

// ---------------------------------------------------------------------------
// 排盘引擎输入契约（4.1）：六次背数 + 起卦时间 + 占问事类
// ---------------------------------------------------------------------------

const coinTossSchema = z.object({
  backCount: z.number().int().min(0).max(3) // 三枚铜钱背面数：0=老阴 1=少阳 2=少阴 3=老阳
});

export const castInputSchema = z.object({
  eventType: z.string().min(1), // 占问事类，必填（取值见 CASE_EVENT_TYPES，可自定义手填）
  question: z.string().optional(), // 具体问题，仅作记录
  tosses: z.array(coinTossSchema).length(6), // 六次背数，初爻至上爻逐次输入
  castAt: z.string() // 起卦时间 ISO 字符串，默认当前，可手改
});

// ---------------------------------------------------------------------------
// 术语表 terms
// ---------------------------------------------------------------------------

export const TERM_CATEGORIES = ['基础', '结构', '判断', '综合'];

export const termSchema = z.object({
  id: z.string(),
  name: z.string(),
  aliases: z.array(z.string()).default([]), // 别名（古籍中同一概念多种写法，必须有，可为空数组）
  category: z.enum(TERM_CATEGORIES),
  relatedTermIds: z.array(z.string()).default([]), // 相关术语，双向跳转，不做严格前置依赖树
  sourceChapterId: z.string().optional(),
  originalText: z.string().optional(), // 【原文】
  literalTranslation: z.string().optional(), // 【直译】：只做字面白话转换，不加引申
  explanation: z.string().optional(), // 【讲解】：自己的理解、举例、辨析
  sectDisagreement: z.string().optional() // 门派分歧一句话说明，如"神煞取舍各家不同，此处只用旬空、驿马、贵人、禄神"
  // 关联实例不在此维护：由 cases 的标签反向查询生成
});

// ---------------------------------------------------------------------------
// 实例库 cases（书中实例）与卦例库 records（自己起的卦）共用的标签体系
// ---------------------------------------------------------------------------

export const CASE_EVENT_TYPES = ['求财', '功名', '婚姻', '疾病', '行人', '词讼', '天时', '出行'];
export const YONGSHEN_STATUS = ['旺相', '休囚', '月破', '旬空', '入墓', '伏藏', '多现', '不上卦'];
export const MOVING_COUNT = ['静卦', '独发', '二爻动', '三爻以上', '六爻乱动'];

const caseTagsSchema = z.object({
  // A. 出处与要点
  chapterId: z.string().optional(),
  volume: z.string().optional(),
  keyPoints: z.array(z.string()).min(1).max(3), // 本例要点，1~3 条，如"用神不上卦转看伏神"
  // B. 事类
  eventType: z.string(), // 与 CASE_EVENT_TYPES 共用同一套枚举，可自定义
  verified: z.enum(['应验', '不验']).optional(),
  // C. 取用
  yongShen: z.enum(RELATIVES).optional(),
  jiShen: z.enum(RELATIVES).optional(), // 忌神
  yuanShen: z.enum(RELATIVES).optional(), // 原神
  chouShen: z.enum(RELATIVES).optional(), // 仇神
  yongShenStatus: z.array(z.enum(YONGSHEN_STATUS)).optional(),
  // D. 盘面
  guaName: z.string().optional(),
  guaPalace: z.string().optional(),
  shiYingPosition: z.string().optional(),
  movingCount: z.enum(MOVING_COUNT).optional(),
  patterns: z.array(z.string()).optional() // 见 PATTERN_TYPES
});

export const caseSchema = z.object({
  id: z.string(),
  chapterId: z.string().optional(),
  chapterTitle: z.string().optional(),
  title: z.string(),
  question: z.string().optional(),
  originalText: z.object({
    diagram: z.string().optional(), // 原文卦图
    verdict: z.string().optional(), // 野鹤断语
    analysis: z.string().optional()
  }),
  board: boardSchema, // 盘面以原文为准；引擎只出草稿，不覆盖已校对结果
  tags: caseTagsSchema,
  summary: z.string(), // 小结：本例要点可迁移的一句话规则
  disputed: z
    .object({
      isDisputed: z.boolean(),
      note: z.string().optional() // 与常规取法不一致时的说明
    })
    .optional()
});

export const recordSchema = z.object({
  id: z.string(),
  createdAt: z.string(), // ISO 时间戳
  eventType: z.string(), // 占问事类，必填
  question: z.string().optional(), // 具体问题
  board: boardSchema, // 引擎生成的结构化盘面
  tags: caseTagsSchema.partial(), // 大部分由 board 派生，用于与 cases 做标签匹配
  myJudgment: z.string().optional(), // 我的判断（起卦当时写，事前）
  actualOutcome: z.string().optional(), // 应验结果（事后回填）
  reflection: z.string().optional() // 复盘：判断偏差在哪、哪条规则用错了
});

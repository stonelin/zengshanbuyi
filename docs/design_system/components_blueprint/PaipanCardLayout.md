# 组件蓝图：六爻卦象排盘看板 (PaipanCardLayout)

> **组件定位**：六爻排盘与动态生克推演的核心展示组件  
> **适用场景**：智能排盘工作台、案例盲推看板、典籍卦例复现

---

## 1. 组件 Props 与状态接口定义 (TypeScript)

```typescript
export interface YaoItem {
  index: number;              // 1 to 6 (初爻至上爻)
  yinYang: 'yang' | 'yin';    // 阴爻 (⚋) 或 阳爻 (⚊)
  isMoving: boolean;          // 是否为动爻 (◯ 或 ✕)
  relative: '父母' | '官鬼' | '兄弟' | '妻财' | '子孙'; // 六亲
  ganzhi: string;             // 如 '子水', '寅木', '戌土'
  wuxing: '木' | '火' | '土' | '金' | '水';
  isShi: boolean;             // 是否为世爻
  isYing: boolean;            // 是否为应爻
  liuShen: '青龙' | '朱雀' | '勾陈' | '螣蛇' | '白虎' | '玄武';
  fuShen?: {                  // 伏神信息 (若有)
    relative: string;
    ganzhi: string;
    wuxing: string;
    relationToFei: string;    // '飞来生伏', '飞来克伏', '伏克飞' 等
  };
  bianYao?: {                 // 变爻信息 (仅当 isMoving 时存在)
    yinYang: 'yang' | 'yin';
    relative: string;
    ganzhi: string;
    wuxing: string;
    dynamicTrend?: '回头生' | '回头克' | '化进神' | '化退神' | '化绝' | '化空';
  };
}

export interface PaipanCardProps {
  question: string;           // 占问事由
  dateGanzhi: {
    year: string;
    month: string;           // 月建 (如 '卯月')
    monthBroken: string;     // 月破地支 (如 '酉')
    day: string;             // 日辰 (如 '戊辰日')
    xunKong: [string, string]; // 旬空二支 (如 ['戌', '亥'])
  };
  benGua: {
    name: string;            // 如 '火地晋'
    palace: string;          // 如 '乾宫'
    type: '首卦' | '一世' | '二世' | '三世' | '四世' | '五世' | '游魂' | '归魂';
  };
  bianGua?: {
    name: string;            // 如 '火风鼎'
    palace: string;
  };
  yaos: YaoItem[];           // 6个爻 (从初爻 index=1 到上爻 index=6)
  yongShenKey?: string;      // 当前指定的用神 (如 '官鬼')
  onYaoClick?: (yao: YaoItem) => void;
  activeYaoIndex?: number;   // 当前选中的爻，用于触发底部生克显微镜
}
```

---

## 2. 视觉结构与 CSS 布局方案 (Tailwind 伪代码)

```html
<div class="rounded-xl border border-stone-200 bg-paper-canvas p-6 shadow-sm">
  <!-- 顶部天时与用神栏 -->
  <header class="flex flex-wrap items-center justify-between border-b border-stone-200 pb-4">
    <div>
      <h3 class="text-lg font-serif font-bold text-ink-primary">【事由】{question}</h3>
      <div class="mt-1 flex gap-3 text-xs text-stone-600">
        <span>📅 月建：<strong class="text-stone-900">{dateGanzhi.month}</strong> (破:{dateGanzhi.monthBroken})</span>
        <span>☀️ 日辰：<strong class="text-stone-900">{dateGanzhi.day}</strong> (空:{dateGanzhi.xunKong.join('')})</span>
      </div>
    </div>
    <div class="rounded-full bg-cinnabar-50 px-3 py-1 text-xs font-semibold text-cinnabar-700">
      用神：{yongShenKey || '未指定'}
    </div>
  </header>

  <!-- 六爻排盘核心表格 -->
  <div class="mt-4 flex flex-col-reverse gap-2">
    {yaos.map((yao) => (
      <div 
        key={yao.index}
        onClick={() => onYaoClick(yao)}
        class={`grid grid-cols-12 items-center rounded-lg p-2.5 transition-all cursor-pointer ${
          activeYaoIndex === yao.index ? 'bg-amber-50 ring-2 ring-amber-400' : 'hover:bg-stone-50'
        }`}
      >
        <!-- 六神列 (2 cols) -->
        <span class="col-span-2 text-xs font-medium text-stone-500">{yao.liuShen}</span>

        <!-- 伏神列 (2 cols) -->
        <span class="col-span-2 text-xs text-stone-400">
          {yao.fuShen ? `[伏] ${yao.fuShen.relative}${yao.fuShen.ganzhi}` : ''}
        </span>

        <!-- 本卦爻象与干支 (5 cols) -->
        <div class="col-span-5 flex items-center gap-3">
          <!-- 阴阳爻符号 -->
          <span class="font-mono text-base font-bold">
            {yao.yinYang === 'yang' ? '▅▅▅▅▅▅' : '▅▅　▅▅'}
          </span>
          <span class={`text-sm ${yao.isMoving ? 'font-bold text-cinnabar-600' : 'text-stone-800'}`}>
            {yao.relative} {yao.ganzhi}
          </span>
          {yao.isShi && <span class="rounded bg-cinnabar-100 px-1 text-[10px] font-bold text-cinnabar-800">世</span>}
          {yao.isYing && <span class="rounded bg-amber-100 px-1 text-[10px] font-bold text-amber-800">应</span>}
          {yao.isMoving && <span class="text-cinnabar-600 text-xs">{yao.yinYang === 'yang' ? '◯' : '✕'}</span>}
        </div>

        <!-- 变卦爻象 (3 cols) -->
        <div class="col-span-3 flex items-center gap-2 text-xs text-stone-600">
          {yao.bianYao ? (
            <>
              <span class="text-cinnabar-500 font-bold">➯</span>
              <span class="font-mono">{yao.bianYao.yinYang === 'yang' ? '▅▅▅' : '▅ ▅'}</span>
              <span>{yao.bianYao.relative}{yao.bianYao.ganzhi}</span>
              {yao.bianYao.dynamicTrend && (
                <span class="rounded bg-stone-100 px-1 text-[10px] text-stone-700">
                  {yao.bianYao.dynamicTrend}
                </span>
              )}
            </>
          ) : (
            <span class="text-stone-300">--</span>
          )}
        </div>
      </div>
    ))}
  </div>
</div>
```

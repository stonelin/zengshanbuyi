# 组件蓝图：六爻探案盲推交互流程状态机 (CaseDeductionFlow)

> **⚠️ 已废弃**：对应的 `CaseDeductionHub.jsx` 已删除，实例模块改按新数据模型（`cases`/`records`）与标签筛选界面重建，不再是答题状态机。本文档仅作历史存档保留。

> **组件定位**：案例研习馆“盲推探案”四步推演状态机与交互组件  
> **适用场景**：400+ 古籍实战卦例闯关研习、高阶模拟排盘考核

---

## 1. 状态机构建 (Finite State Machine)

```mermaid
stateDiagram-v2
    [*] --> STEP_BRIEF: 初始化加载卦例数据
    
    STEP_BRIEF --> STEP_SCAFFOLD: 用户点击“开始侦探推演”
    STEP_BRIEF --> STEP_EXPRESS: 用户选择“极速刷题模式(直接翻转)”

    state STEP_SCAFFOLD {
        Q1: 1. 勾选用神爻位
        Q2: 2. 勾选日月旺衰
        Q3: 3. 勾选动变影响
        Q4: 4. 判定吉凶与应期
        Q1 --> Q2
        Q2 --> Q3
        Q3 --> Q4
    }

    STEP_SCAFFOLD --> STEP_SUBMIT: 完成推演，点击提交
    STEP_EXPRESS --> STEP_REVEAL: 点击一键揭秘
    STEP_SUBMIT --> STEP_REVEAL: 自动计算得分并揭秘

    state STEP_REVEAL {
        MasterQuote: 展开野鹤老人原著断语
        Outcome: 展开历史真实应验
        RadarScore: 呈现四维能力得分雷达
        ConceptsLink: 提供本案关联的核心法则穿透
    }

    STEP_REVEAL --> STEP_NOTE: 记录个人复盘心得 / 加入错题本
    STEP_NOTE --> [*]: 进入下一案
```

---

## 2. 状态定义与 Types (TypeScript)

```typescript
export interface CaseItem {
  id: string;                 // 如 'case_042'
  title: string;              // 如 '卯月戊辰日占官运'
  chapterId: string;          // 关联章节 'ch_015'
  question: string;           // 占问事由
  dateGanzhi: {
    month: string;
    day: string;
    xunKong: string;
  };
  benGua: string;
  bianGua: string;
  movingYaos: number[];       // 动爻位置 [1, 4]
  yongShenExpected: string;   // 标准用神 '二爻官鬼卯木'
  originalMasterDeduction: string; // 野鹤老人原断语
  actualOutcome: string;      // 实际应验结果
  keyRuleTags: string[];      // ['进神', '月建生扶', '化绝']
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface UserDeductionInput {
  selectedYongShen: string;
  monthDayEffect: 'strong' | 'weak' | 'broken';
  movingTrend: string;
  predictedOutcome: 'auspicious' | 'inauspicious';
  predictedTiming?: string;
  notes?: string;
}
```

---

## 3. 交互设计要点与防挫败机制

1. **渐进式线索提示 (Progressive Clues)**：
   - 当用户在某一题停留超过 30 秒或点击【💡 寻求线索】时，弹出第一级微提示（如：“提示：占自身前程，以官鬼为用神，注意二爻与上爻的区别”）。
2. **非强制性应期输入 (Optional Timing)**：
   - 新手可跳过应期直接判定吉凶；中高级研习者填写应期将获得额外的“宗师神断”徽章加分。
3. **沉浸式展开动效 (View Transition & Card Flip)**：
   - 揭晓答案时，不进行整页刷新，而是以卡片翻转与柔和的光晕动效平滑呈现野鹤断语。

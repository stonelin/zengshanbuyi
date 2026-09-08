# 组件蓝图：术语即时穿透浮窗 (ConceptPopoverSpec)

> **组件定位**：古籍阅读、排盘看板、案例分析中全局通用的“术语穿透”轻量交互浮窗  
> **适用场景**：全局划词概念解析、生克法则即时释义、关联卦例与章节双向链接

---

## 1. 术语数据模型与 Props (TypeScript)

```typescript
export interface ConceptItem {
  id: string;                 // 如 'concept_yuepo'
  name: string;               // 如 '月破'
  category: '基础概念' | '动静生克' | '神煞辨析' | '高阶法则';
  definition: string;         // 通俗一句话极简定义
  poem: string;               // 核心断卦歌诀 (如 '月破之爻莫算强...')
  nature: '吉' | '凶' | '中性' | '辩证';
  practicalRules: string[];   // 实战关键判定要点 (如 ['月建相冲为破', '出月可救', '休囚逢冲为真空'])
  relatedChapterIds: string[];// 关联章节 ['ch_025']
  relatedCaseIds: string[];   // 关联原著卦例 ['case_012', 'case_088']
}

export interface ConceptPopoverProps {
  conceptId: string;
  triggerElement: HTMLElement | React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  showCaseLinks?: boolean;    // 是否显示关联案例直达按钮
}
```

---

## 2. 交互行为规范与边缘碰撞避让算法

```mermaid
flowchart TD
    Trigger[用户 Hover 或点击术语词] --> Detect[检测视口边缘距离 Viewport Boundary]
    
    Detect --> CheckSpace{空间充足?}
    CheckSpace -->|是| PlaceNormal[按默认方向放置 (如 top)]
    CheckSpace -->|否 (近屏幕边缘)| FlipPlacement[自动翻转方向 (Flip to bottom/left)]
    CheckSpace -->|移动端小屏| BottomDrawer[降级为自底部弹出的轻量半屏抽屉 Drawer]

    PlaceNormal --> RenderCard[渲染卡片: 定义 + 歌诀 + 典型卦例链接]
    FlipPlacement --> RenderCard
    BottomDrawer --> RenderCard
```

### 2.3 视觉细节与微动效规范
- **微交互延时**：Hover 触发延时 `150ms`（防止鼠标滑过时频繁误弹），移出关闭延时 `200ms`（允许用户平滑移动光标进入浮窗点击链接）。
- **材质质感**：背景采用白玉素宣质感（`bg-white/95 backdrop-blur-md`），边框采用极细古绢线（`border border-stone-200/80`），阴影采用新中式轻柔弥散阴影（`shadow-[0_10px_30px_rgba(0,0,0,0.08)]`）。
- **直达行动点**：浮窗底部固定放置两个行动胶囊按钮——【📖 读原著本章】与【🔍 练典型案例】。

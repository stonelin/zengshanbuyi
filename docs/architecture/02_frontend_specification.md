# 02. 前端工程与组件开发规范

## 1. 技术栈选型基线
- **框架与构建器**：React 19 + Vite 6 + TypeScript 5
- **样式体系**：Tailwind CSS v3/v4 + CSS Variables (支持新中式宣纸/墨黑主题自适应)
- **图标与特效**：`lucide-react` (现代几何线性图标) + `canvas-confetti` (通关轻量粒子反馈)
- **状态管理策略**：
  - **服务端状态 (Server Cache)**：TanStack Query (React Query)
  - **客户端 UI 状态 (Client UI State)**：Zustand (轻量 Hook 化全局存储)
  - **组件内部状态 (Local State)**：React `useState` / `useReducer`

## 2. 目录结构标准 (Feature-driven)

```
src/
├── assets/                  # 静态资源 (音频、字体、矢量纹理)
├── components/              # 全局通用 UI 原子组件
│   ├── ui/                  # 按钮、输入框、卡片、模态框、抽屉
│   └── icons/               # 阴阳爻、铜钱等专属 SVG 图标
├── features/                # 按业务领域组织的核心功能模块
│   ├── paipan/              # 排盘工作台 (起卦器、六爻看板、推演显微镜)
│   ├── cases/               # 实战卦例馆 (盲推探案工作流、案例检索)
│   ├── reader/              # 典籍阅读器 (卷分章节、双注排版、划词浮窗)
│   └── mastery/             # 认知进阶 (水墨技能树、闯关答题、错题本)
├── hooks/                   # 全局复用 Hook (useDebounce, useMediaQuery)
├── lib/                     # 工具库封装 (API Client, 格式化工具)
├── types/                   # 全局 TypeScript 类型定义
└── data/                    # 静态结构化数据集 (*.json)
```

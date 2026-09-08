# 中小网站与易学研习系统：架构总则与黄金十条军规

> **定位**：适合 2~15 人研发团队、日活 0~10 万、追求极低心智负担与高迭代效率的现代架构规范  
> **基调**：**模块化单体优先 (Modular Monolith First) + 契约驱动 (Contract-Driven)**

---

## 1. 架构黄金十条军规 (The Golden 10 Rules)

1. **单体优先，严禁过早微服务化**：除核心业务确实发生跨组织自治，坚决采用单进程部署的模块化单体架构。
2. **单一数据可信源**：API 契约与数据模型以 Zod / TypeScript / OpenAPI 为唯一源，全链路端到端类型推导。
3. **三层扁平架构**：严格遵守 `API Controller/Route` -> `Service` -> `DB/ORM Query`，严禁多层空转包装。
4. **状态双轨托管**：服务端数据（Server State）由 TanStack Query / SWR 托管缓存与失效；客户端 UI 状态使用轻量状态库（Zustand / Pinia）。
5. **基础设施极简（单机 < 50 美元/月）**：采用 Caddy 反代 + Docker Compose + PostgreSQL / SQLite 部署，开箱即支持一键本地起服。
6. **全链路防御性入参校验**：所有外部请求（HTTP Body/Query/Params）必须经过 Schema 强校验与无害化过滤。
7. **统一业务错误码与 HTTP 包装**：禁止返回非结构化字符串报错，全站统一采用 `{ code, data, message, timestamp }`。
8. **自动化代码守门员**：配置 Husky + Biome/ESLint + Commitlint，把 90% 的低级错误拦截在 Git Commit 阶段。
9. **无停机平滑发布与定时冷备**：数据库每日自动生成增量快照并加密同步至云存储（S3/R2）。
10. **架构演进逃生通道**：保持业务模块的高内聚低耦合，确保当单点流量突增 10 倍时，单模块可在 1 人天内独立拆出。

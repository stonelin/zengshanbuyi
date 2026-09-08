# 01. 系统总体架构与分层设计规范

## 1. 总体架构拓扑 (Modular Monolith)

```mermaid
graph TD
    Client["现代前端 (Vite + React 19 + Tailwind CSS)"]
    
    subgraph Host ["单机容器环境 (Caddy + Node/Go/Python Runtime)"]
        Caddy["Caddy (自动 HTTPS / HTTP/3 / 静态托管 / 反代)"]
        
        subgraph Monolith ["单体业务服务 (App Backend)"]
            Router["API 路由层 (Zod 强校验 + 契约解析)"]
            
            subgraph Modules ["高内聚业务模块 (Modules)"]
                ModPaipan["排盘推演模块 (浑天甲子/纳甲/飞伏神)"]
                ModCase["卦例研习模块 (400+案例/盲推探案)"]
                ModBook["典籍精读模块 (原著章节/概念穿透)"]
                ModQuiz["进阶考核模块 (知识树/测验/错题调度)"]
            end
            
            Router --> Modules
            Modules --> ServiceCommon["通用基础设施 (Auth/RBAC/Logger/Cache)"]
        end
        
        DB[("PostgreSQL / SQLite 嵌入式存储")]
    end

    Client --> Caddy
    Caddy --> Router
    ServiceCommon --> DB
```

## 2. 三层分层职责边界

| 分层 | 允许的职责 | 严禁的越权行为 |
| :--- | :--- | :--- |
| **API / Controller 层** | 接收请求、执行 Zod/Schema 强校验、解析 Session/Token、调用 Service、包装统一响应结构体。 | 严禁直接写 SQL、严禁编写复杂业务逻辑、严禁直接操作文件系统或外部下游。 |
| **Service 业务逻辑层** | 组合核心领域逻辑、执行事务（Transaction）、计算排盘干支生克、调用数据访问接口。 | 严禁依赖 HTTP Request/Response 对象（保持纯函数/可单测性）。 |
| **Data / Repository 层** | 封装 ORM（Prisma / Drizzle / TypeORM）查询、原生 SQL 优化、数据读写与映射。 | 严禁在此处做业务权限判定或复合业务分支判断。 |

# 04. 数据存储与演进规范

## 1. 数据库选型与演进路径
1. **中早期阶段（0~10万用户）**：PostgreSQL 单实例（或 SQLite WAL 模式用于全静态本地化场景）。
2. **Schema 变更管理**：必须使用版本化迁移工具（如 Prisma Migrate / Drizzle Kit / Flyway），严禁手动通过 Navicat/DBeaver 修改生产表结构。
3. **数据冷备机制**：
   - 每日凌晨 03:00 自动执行 `pg_dump`，通过 `gpg` 对称加密后同步至 Cloudflare R2 / AWS S3。
   - 保留周期：最近 7 天每日快照 + 最近 4 周每周快照 + 最近 12 月每月快照。

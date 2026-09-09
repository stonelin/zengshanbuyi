# 05. 极简 DevOps 与单机高可用部署规范

## 0. 当前实际部署（2026-09，个人自用阶段）

项目已从多人教学产品重定位为个人研习工具，目前**没有后端、没有数据库**——
排盘引擎与全部数据（chapters/cases_v2/terms）都在浏览器端，卦例记录用
localStorage 落地。第 1、2 节描述的 Docker + PostgreSQL 拓扑是最初面向
多人产品的规划，**当前未实施，暂不需要**，保留在下面供以后真的要引入
后端时参考。实际用的是纯静态站点部署：

```mermaid
graph TD
    User([浏览器]) -->|HTTP:80| Nginx["Nginx (yi.example.com)"]
    Nginx --> Static["REMOTE_PATH (vite build 产物)"]
```

- **服务器**：`REMOTE_HOST`（`~/.ssh/config` 里的别名），Ubuntu 22.04，已跑着
  其他几个站点（`liangyi.example.com`、`liuyao.example.com` 等），本项目
  与它们共用同一台 nginx，互不影响。
- **nginx 配置**：`/etc/nginx/conf.d/yi.conf`（服务器上，未纳入本仓库版
  本控制），`listen 80`，`server_name yi.example.com`，`root REMOTE_PATH`，
  SPA 路由用 `try_files $uri $uri/ /index.html` 回退，静态资源 30 天缓存，
  开 gzip。写法照抄同服务器上 `liangyi.conf` 的既有约定。只监听 80，
  暂未配 HTTPS（按需再加 certbot/Caddy）。
- **发布流程**：本地 `npm run build` 出 `dist/`，`rsync --delete` 全量
  同步到远程 `REMOTE_PATH/`，nginx 直接托管，不需要 reload（内容变了但
  server 配置没变）。已封装成 `Makefile`：

  ```bash
  make deploy   # = 跑 test_engine.js 回归 + npm run build + rsync 到服务器
  make check    # 只跑回归测试 + 构建，不发布，适合先本地验证
  make test     # 只跑 scripts/test_engine.js 回归测试
  ```

  依赖 `~/.ssh/config` 里已配置的 `REMOTE_HOST` 别名（含免密登录），以及远程
  `REMOTE_PATH` 目录归属运行 rsync 的用户所有（首次部署时手动
  `sudo mkdir -p REMOTE_PATH && sudo chown <user>:<user> REMOTE_PATH`
  建好，之后 rsync 不再需要 sudo）。
- **不支持的能力**：多设备同步（卦例记录只在起卦那台浏览器里）、自动
  备份（内容是静态构建产物，源头在 git，服务器上没有需要单独备份的
  用户数据）。如果以后要做账号系统/多端同步，才需要真正用到第 1、2 节
  的后端拓扑。

---

## 1. 50 美元/月高可用单机拓扑（原始多人产品规划，当前未实施）

```mermaid
graph TD
    User([终端用户]) -->|HTTPS / HTTP3| Caddy["Caddy (反向代理 / 自动证书申请)"]
    
    subgraph Host ["Linux VPS (2C4G, $10~$24/mo)"]
        Caddy --> FrontendStatic["前端静态文件 (/var/www/dist)"]
        Caddy --> APIContainer["Docker: App Backend (Port 3000)"]
        APIContainer --> PostgresContainer["Docker: PostgreSQL 16 (Volume 挂载)"]
    end

    PostgresContainer -.->|每日加密备份| R2[("Cloudflare R2 对象存储")]
```

## 2. Docker Compose 标准编排模板 (docker-compose.yml)

```yaml
version: '3.8'

services:
  app:
    build: .
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://yi_user:${DB_PASSWORD}@postgres:5432/yi_mastery?sslmode=disable
    depends_on:
      - postgres

  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=yi_mastery
      - POSTGRES_USER=yi_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}

volumes:
  pgdata:
```

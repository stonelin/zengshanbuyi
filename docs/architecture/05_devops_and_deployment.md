# 05. 极简 DevOps 与单机高可用部署规范

## 0. 当前实际部署（2026-09，个人自用阶段）

项目已从多人教学产品重定位为个人研习工具，目前**没有后端、没有数据库**——
排盘引擎与全部数据（chapters/cases_v2/terms）都在浏览器端，卦例记录用
localStorage 落地。第 1、2 节描述的 Docker + PostgreSQL 拓扑是最初面向
多人产品的规划，**当前未实施，暂不需要**，保留在下面供以后真的要引入
后端时参考。实际用的是纯静态站点部署：

```mermaid
graph TD
    User([浏览器]) -->|HTTP:80| Nginx["Nginx (SITE_URL)"]
    Nginx --> Static["REMOTE_PATH (vite build 产物)"]
```

- **部署参数**：主机、路径、站点地址都放在仓库根目录的 `.env`（不入库，
  见 `.env.example` 模板），`Makefile` 用 `-include .env` 读取：

  ```
  REMOTE=<ssh 目标：~/.ssh/config 里的主机别名，或 user@host>
  REMOTE_PATH=<远程站点根目录>
  SITE_URL=<站点地址，仅用于发布后打印>
  ```

- **服务器**：一台 Ubuntu 22.04 VPS，已跑着其他几个静态站点，本项目与
  它们共用同一台 nginx，互不影响。
- **nginx 配置**：`/etc/nginx/conf.d/<站点>.conf`（服务器上，未纳入本仓库
  版本控制），`listen 80`，`server_name` 与 `root` 对应 `SITE_URL` 与
  `REMOTE_PATH`，SPA 路由用 `try_files $uri $uri/ /index.html` 回退，
  静态资源 30 天缓存，开 gzip。只监听 80，暂未配 HTTPS（按需再加
  certbot/Caddy）。
- **发布流程**：本地 `npm run build` 出 `dist/`，`rsync --delete` 全量
  同步到远程 `REMOTE_PATH/`，nginx 直接托管，不需要 reload（内容变了但
  server 配置没变）。已封装成 `Makefile`：

  ```bash
  make deploy   # = 跑 test_engine.js 回归 + npm run build + rsync 到服务器
  make check    # 只跑回归测试 + 构建，不发布，适合先本地验证
  make test     # 只跑 scripts/test_engine.js 回归测试
  ```

  依赖 `.env` 里配置的 `REMOTE`（免密登录已配好），以及远程 `REMOTE_PATH`
  目录归属运行 rsync 的用户所有（首次部署时手动
  `sudo mkdir -p <REMOTE_PATH> && sudo chown <user>:<user> <REMOTE_PATH>`
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

# 05. 极简 DevOps 与单机高可用部署规范

## 1. 50 美元/月高可用单机拓扑

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

# 部署参数不入库：复制 .env.example 为 .env 并填写实际值
-include .env

.PHONY: test build check deploy

test:
	node scripts/test_engine.js

build:
	npm run build

check: test build

deploy: check
	@test -n "$(REMOTE)" -a -n "$(REMOTE_PATH)" || { \
		echo "缺少部署参数：请复制 .env.example 为 .env 并填写 REMOTE / REMOTE_PATH"; exit 1; }
	rsync -avz --delete dist/ $(REMOTE):$(REMOTE_PATH)/
	@echo "已发布：$(SITE_URL)"

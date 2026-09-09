REMOTE      ?= REMOTE_HOST
REMOTE_PATH ?= REMOTE_PATH
SITE_URL    := http://yi.example.com

.PHONY: test build check deploy

test:
	node scripts/test_engine.js

build:
	npm run build

check: test build

deploy: check
	rsync -avz --delete dist/ $(REMOTE):$(REMOTE_PATH)/
	@echo "已发布：$(SITE_URL)"

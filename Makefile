# Makefile for OSL_NMM_helper (Tauri + vanilla JS)
CANDIDATES := .
APP_DIR := $(shell \
  for d in $(CANDIDATES); do \
    if [ -f "$$d/src-tauri/Cargo.toml" ]; then echo $$d; exit 0; fi; \
  done; \
  echo .)

CARGO ?= cargo
TAURI := $(CARGO) tauri

.PHONY: help dev start build clean clean-all distclean clean-node clean-targets clean-zone

help:
	@echo "Targets:"
	@echo "  make dev        - Run tauri dev"
	@echo "  make start      - Alias for dev"
	@echo "  make build      - Build desktop app (release)"
	@echo "  make clean      - cargo clean for src-tauri + remove target dirs"
	@echo "  make clean-all  - clean + remove caches + strip zone identifiers"
	@echo "  make clean-node - Remove node_modules if present"
	@echo "  make distclean  - DANGEROUS: git clean -xfd"

dev:
	@cd "$(APP_DIR)" && $(TAURI) dev

start:
	@cd "$(APP_DIR)" && $(TAURI) dev

build:
	@cd "$(APP_DIR)" && $(TAURI) build

clean: clean-targets
	@echo "→ cargo clean (src-tauri)"
	@$(CARGO) clean --manifest-path "$(APP_DIR)/src-tauri/Cargo.toml" || true

clean-all: clean clean-zone
	@echo "→ removing extra artefacts"
	@rm -rf "$(APP_DIR)/dist" "$(APP_DIR)/out" "$(APP_DIR)/.tauri" "$(APP_DIR)/src-tauri/.tauri" || true

clean-node:
	@echo "→ removing node_modules if any"
	@rm -rf "$(APP_DIR)/node_modules" || true
	@find "$(APP_DIR)" -maxdepth 2 -type d -name node_modules -prune -exec rm -rf {} + 2>/dev/null || true

clean-targets:
	@echo "→ removing local target dirs"
	@rm -rf "$(APP_DIR)/target" "$(APP_DIR)/src-tauri/target" || true

# Remove Zone.Identifier artifacts & quarantine xattrs (Linux/mac), plus common cruft.
clean-zone:
	@echo "→ stripping Zone.Identifier & quarantine attributes"
	# Delete files literally named 'Zone.Identifier' or with NTFS ADS suffixes materialized as files
	@find . -type f \( -name 'Zone.Identifier' -o -name '*:Zone.Identifier' \) -print -delete 2>/dev/null || true
	# Remove macOS quarantine attribute if present
	@command -v xattr >/dev/null 2>&1 && xattr -r -d com.apple.quarantine . 2>/dev/null || true
	# Remove common extended attrs added by Linux desktops/browsers (ignore errors if tools missing)
	@command -v setfattr >/dev/null 2>&1 && setfattr -R -x user.xdg.origin.url . 2>/dev/null || true
	@command -v setfattr >/dev/null 2>&1 && setfattr -R -x user.xdg.referrer.url . 2>/dev/null || true
	# Bonus: delete common OS cruft
	@find . -type f \( -name '.DS_Store' -o -name 'Thumbs.db' -o -name 'desktop.ini' \) -print -delete 2>/dev/null || true

distclean:
	@echo "⚠️ git clean -xfd (untracked files will be deleted)"
	@git clean -xfd

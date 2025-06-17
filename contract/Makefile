# Simple Makefile for Secret Network contract
ARTIFACTS_DIR = artifacts
CONTRACT_NAME = battleships

.PHONY: build
build:
	@echo "Building WASM contract..."
	cargo build --release --target wasm32-unknown-unknown
	@mkdir -p $(ARTIFACTS_DIR)
	cp target/wasm32-unknown-unknown/release/*.wasm $(ARTIFACTS_DIR)/
	@echo "Contract built in $(ARTIFACTS_DIR)/"

.PHONY: clean
clean:
	@echo "Cleaning artifacts..."
	rm -rf $(ARTIFACTS_DIR)
	cargo clean
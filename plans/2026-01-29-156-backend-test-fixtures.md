# Backend: Test Fixtures

**Issue:** #156
**Domain:** backend
**Date:** 2026-01-29

## Goal

Centralize duplicate test fixtures in `tests/conftest.py` to eliminate duplication and improve test maintainability.

## Files to Modify

- **Modify:** `src/backend/tests/conftest.py` - Add shared fixtures
- **Modify:** `src/backend/tests/api/test_products.py` - Remove duplicate `sample_product_data`
- **Modify:** `src/backend/tests/api/test_configurations.py` - Remove duplicate `sample_product_data`
- **Modify:** `src/backend/tests/api/test_jobs.py` - Remove duplicate `sample_product_data`

## Steps

1. **Read existing test files** to identify all duplicate fixtures:
   - `tests/api/test_products.py:20-30`
   - `tests/api/test_configurations.py:13-20`
   - `tests/api/test_jobs.py:15-22`

2. **Read `tests/conftest.py`** to understand existing fixtures

3. **Add centralized fixtures to `conftest.py`:**
   - `client_id()` - Generate UUID for tests
   - `sample_product_data(client_id)` - Standard product data
   - `created_product(client, sample_product_data)` - Create product and return data

4. **Remove duplicate fixtures** from individual test files:
   - Remove from `test_products.py`
   - Remove from `test_configurations.py`
   - Remove from `test_jobs.py`

5. **Update test functions** to use the centralized fixtures (if needed)

6. **Run tests** to ensure nothing broke:
   ```bash
   cd src/backend && make test
   ```

## Verification

- [ ] All tests in `tests/api/test_products.py` pass
- [ ] All tests in `tests/api/test_configurations.py` pass
- [ ] All tests in `tests/api/test_jobs.py` pass
- [ ] No duplicate fixtures remain in individual test files
- [ ] `make test` passes with 100% success rate

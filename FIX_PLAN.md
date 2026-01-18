# Kế hoạch sửa lỗi Tests tồn đọng

## Tổng quan
- **Tổng số test files lỗi:** 18
- **Tổng số tests lỗi:** 181
- **Tổng số tests passed:** 1656

---

## Phase 1: Formula Engine Core (Ưu tiên cao - 16 tests)

### 1.1 FormulaParser.test.ts (4 tests)
| Test | Vấn đề | Giải pháp |
|------|--------|-----------|
| should handle lowercase letters | colLetterToNumber không xử lý lowercase | Thêm .toUpperCase() trong colLetterToNumber |
| should preserve position after whitespace | Token position không đúng sau whitespace | Fix tokenizer position tracking |
| should throw on unclosed string | Không throw error cho unclosed string | Thêm validation trong string tokenizer |
| should parse real-world formulas correctly | Complex formula parsing fails | Debug và fix parser edge cases |

### 1.2 FormulaEvaluator.test.ts (2 tests)
| Test | Vấn đề | Giải pháp |
|------|--------|-----------|
| should calculate modulo | MOD function không hoạt động | Implement/fix MOD function |
| should return #DIV/0! for modulo by zero | Không return error đúng | Add zero division check |

### 1.3 FormulaEngine.test.ts (5 tests)
| Test | Vấn đề | Giải pháp |
|------|--------|-----------|
| should sum with zero arguments | SUM() trả về undefined | Return 0 cho empty args |
| should calculate =10%3 = 1 | Modulo operator không work | Fix % operator |
| should evaluate ="abc"<>"ABC" = true | String comparison case-sensitive | Fix comparison logic |
| should evaluate =IFNA | IFNA function missing/broken | Implement IFNA |
| should clear source cells on cut paste | Cut/paste logic error | Fix workbook cut operation |

---

## Phase 2: Formula Functions (Ưu tiên cao - 77 tests)

### 2.1 math.test.ts (6 tests)
- MOD function: negative numbers handling
- ROUND: negative number rounding
- SUM: empty arguments

### 2.2 text.test.ts (5 tests)
- TEXT: number formatting với thousands separator
- TEXT: percentage formatting
- TEXT: leading zeros
- TEXT: currency formatting
- PROPER: punctuation handling

### 2.3 statistical.test.ts (12 tests)
- COVAR: covariance calculation
- NORM.DIST: normal distribution PDF
- COUNT: string numbers handling
- AVERAGE: TRUE/FALSE handling

### 2.4 financial.test.ts (23 tests)
- IPMT: interest portion calculation
- NPER: number of periods
- XIRR: IRR with dates
- PRICE/YIELD: bond calculations
- TBILLPRICE/TBILLYIELD/TBILLEQ: T-bill functions
- CUMIPMT/CUMPRINC: cumulative calculations
- MIRR: modified IRR
- DOLLARDE/DOLLARFR: fraction conversions

### 2.5 lookup.test.ts (18 tests)
- ROW/COLUMN: reference functions
- ADDRESS: absolute/relative reference creation
- INDIRECT: reference resolution
- OFFSET: cell offset calculation

### 2.6 logical.test.ts (6 tests)
- ISBLANK: empty string handling
- N function: type conversion
- COUNTA: value counting

### 2.7 date.test.ts (7 tests)
- Date parsing và calculation issues

---

## Phase 3: WebSocket/Collaboration (42 tests)

### 3.1 WebSocketClient.test.ts (21 tests)
**Root cause:** Mock WebSocket không đúng cách
- Connection lifecycle tests
- Message sending tests
- Reconnection logic tests
- Heartbeat tests

### 3.2 useWebSocket.test.ts (23 tests)
**Root cause:** Hook tests phụ thuộc WebSocketClient
- Sửa WebSocketClient trước
- Update hook tests sau

---

## Phase 4: AI Runtime (42 tests)

### 4.1 AIRuntime.test.ts (42 tests)
**Root cause:** Mock không match với actual implementation
- Conversation management (5 tests)
- Message handling (4 tests)
- Tool processing (4 tests)
- Context assembly (4 tests)
- Grounding system (25+ tests)

### 4.2 ContextAssembler.test.ts
- Import/mock issues

---

## Phase 5: Components & Others (4 tests)

### 5.1 FindReplaceDialog.test.tsx (3 tests)
- Button finding logic
- Options panel toggle

### 5.2 FormulaBar.test.tsx
- Mock store issues

### 5.3 workbookStore.test.ts (1 test)
- Cut/paste operation

### 5.4 OutlierDetector.test.ts (3 tests)
- Statistical calculation accuracy

---

## Thứ tự thực hiện

```
Week 1: Phase 1 + Phase 2 (Formula Engine)
├── Day 1-2: FormulaParser, FormulaEvaluator, FormulaEngine
├── Day 3-4: math, text, logical functions
└── Day 5: statistical, financial, lookup, date functions

Week 2: Phase 3 + Phase 4 (WebSocket & AI)
├── Day 1-2: WebSocketClient mock refactor
├── Day 3: useWebSocket hook tests
└── Day 4-5: AIRuntime tests refactor

Week 3: Phase 5 + Final testing
├── Day 1: Component tests
├── Day 2: Store tests
└── Day 3: Full regression testing
```

---

## Ước tính công việc

| Phase | Tests | Độ phức tạp | Thời gian |
|-------|-------|-------------|-----------|
| Phase 1 | 16 | Medium | 1-2 ngày |
| Phase 2 | 77 | High | 2-3 ngày |
| Phase 3 | 44 | High | 2 ngày |
| Phase 4 | 42 | High | 2 ngày |
| Phase 5 | 4 | Low | 0.5 ngày |

**Tổng:** ~8-10 ngày làm việc

---

## Chiến lược

1. **Fix root causes trước:** Nhiều test failures có chung root cause
2. **Batch similar fixes:** Group các functions cùng loại
3. **Test sau mỗi fix:** Chạy test ngay sau khi sửa để verify
4. **Document changes:** Ghi chú các thay đổi cho future reference

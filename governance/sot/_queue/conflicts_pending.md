# Conflicts pending · mâu thuẫn chờ người có thẩm quyền quyết
<!-- Mẫu một entry:
## CONF-01 · <một câu mô tả> · HIGH/MEDIUM/LOW
- Nguồn A nói: ... (file, dòng)
- Nguồn B nói: ... (file, dòng)
- Đề xuất: ...
- Người quyết: ...  · Deadline: ...
-->

## CONF-01 · “Production Ready” mâu thuẫn baseline kỹ thuật · HIGH
- Nguồn A nói: `PROJECT-STATUS.md` ghi “Production Ready”.
- Nguồn B nói: các gate ổn định P0 đã PASS nhưng AI cấu hình thật, realtime hai client và backend security/persistence chưa được nghiệm thu production.
- Đề xuất: giữ nhãn “NOT PRODUCTION READY” cho đến khi TIP-006/008/009 có bằng chứng và quyết định phát hành mới.
- Người quyết: nclamvn · Deadline: trước lần publish tiếp theo.

## CONF-02 · Badge “22 E2E passing” chưa tái lập được · HIGH
- Nguồn A nói: `README.md` hiển thị 22 E2E passing.
- Nguồn B nói: `vite.config.ts` chạy cổng 5174 còn `playwright.config.ts` chờ cổng 5173; verify suite timeout trước khi chạy test.
- Đề xuất: sửa một nguồn cấu hình, chạy lại toàn suite trên CI sạch rồi cập nhật badge từ artifact CI.
- Người quyết: ExcelAI maintainer · Deadline: TIP đầu tiên sau Blueprint approval.
- Trạng thái: RESOLVED 2026-09-01 — badge tĩnh đã bị gỡ; README và artifact CI lấy số từ SOT. Bộ critical 3/3 và regression 16/16 đã tái lập cục bộ, không chuyển thành tuyên bố “22 production tests”.

## CONF-03 · Owner SOT suy ra từ URL repository · MEDIUM
- Nguồn A nói: repository thuộc tài khoản `nclamvn`.
- Nguồn B: chưa có xác nhận trực tiếp trong cuộc trao đổi rằng `nclamvn` là người duyệt publish.
- Đề xuất: Chủ nhà xác nhận hoặc thay owner trong `PROJECT.yaml`.
- Người quyết: Chủ nhà · Deadline: trước khi cấp publish token chính thức.

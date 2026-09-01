# exports/

Thư mục này là **đích của publish gate**. Khi chạy `sot_publish.py`, tool sinh ra file thành phẩm (kèm token digest xác thực registry) tại đây.

- Không được sửa tay file trong này.
- Không được commit output có PII vào git.
- Mỗi lần publish tạo file mới có timestamp, không ghi đè.

Sau `sot_publish.py PASS`, tài liệu ở đây có audit trail truy được về thời điểm publish và trạng thái registry lúc đó.

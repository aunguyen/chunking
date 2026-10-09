#!/bin/bash
# Bấm đúp file này để tạo bài nghe (.m4a) cho tất cả các cụm — dùng giọng có sẵn của Mac.
# Có cụm thêm trên web? Bấm "Tải file sao lưu" ở cuối trang chủ trước khi chạy.
cd "$(dirname "$0")" || exit 1
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

echo "=== TẠO BÀI NGHE ==="
if ! command -v node >/dev/null 2>&1; then
  echo "Máy chưa có Node.js — tải tại https://nodejs.org rồi chạy lại."
else
  node tools/tao-bai-nghe.js "$@"
fi
echo
read -n 1 -s -r -p "Nhấn phím bất kỳ để đóng cửa sổ này…"
echo

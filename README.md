# Chunking Practice

Web app chạy local để luyện chunking tiếng Anh. Không cần cài đặt.

## Dùng trên iPhone (hoặc bất kỳ máy nào)

Mở **https://aunguyen.github.io/chunking/** bằng Safari → nút **Chia sẻ** → **Thêm vào MH chính** để có biểu tượng app.

- Tiến độ trên iPhone lưu riêng trong Safari của iPhone. Muốn chuyển dữ liệu từ Mac: trên Mac bấm **Tải file sao lưu** → AirDrop sang iPhone → trên iPhone bấm **Khôi phục từ file**.
- Không nghe thấy giọng đọc? Kiểm tra nút gạt im lặng và âm lượng.

## Mở app

**Cách 1 — nhanh nhất:** mở thẳng file `index.html` bằng Chrome / Safari / Edge (double-click).

**Cách 2 — qua local server** (nên dùng nếu cách 1 bị lỗi giọng đọc):

```bash
cd ~/VibeCoding/CHUNKING && python3 -m http.server 8765
```

Rồi mở http://localhost:8765

> Font **Be Vietnam Pro** tải từ Google Fonts khi có mạng; không có mạng thì app tự dùng font hệ thống, mọi thứ vẫn chạy bình thường.

## Trang chủ

- Thống kê: số cụm đã thành thạo, điểm dịch trung bình, số câu đã nghe – nhắc lại, **chuỗi ngày luyện liên tiếp**.
- Lọc theo trạng thái: **Chưa học / Đang luyện / Thành thạo** (thành thạo = điểm dịch cao nhất ≥ 85 và đã nghe hết ít nhất 1 lượt), tìm kiếm cụm.
- Cụm đang học dở được viền xanh với nút **Luyện tiếp**.

## Phần 1 · Dịch Việt → Anh

- Làm từng câu: câu đang làm được phóng to, câu đã làm thu gọn kèm điểm, câu chưa làm mờ đi. Thanh 10 đoạn phía trên tô màu theo điểm từng câu — bấm vào để nhảy tới câu đó.
- Trong lúc gõ, dòng nhỏ dưới ô nhập báo **đã có / chưa thấy cụm chunk**.
- **Enter** → chấm điểm và **dừng lại ở câu đó** để xem kết quả; **Enter lần nữa** (hoặc nút **Câu tiếp →**) mới sang câu tiếp. Câu cuối thì nút là **Xem kết quả**.
- **Luyện đến khi đúng** (công tắc đầu phần Dịch, mặc định bật): câu chưa được 10/10 thì ở lại — ô nhập được xoá, phần sửa lỗi hiện ra nhưng tự **mờ đi khi bạn bắt đầu gõ lại** (bấm để xem lại). Gõ lại đến khi đúng 100% mới sang câu tiếp; không nhảy tới câu chưa làm được.
  Mỗi câu ghi “Lần 1: 7/10 → Lần 3: 10/10”; tổng điểm tính theo **lần làm đầu tiên**, màn kết quả có thêm số câu đúng ngay lần đầu và số lần làm lại. Chế độ này không có nút “Câu của mình cũng đúng ý” — câu đúng mà app chưa nhận ra thì dùng **Từ tương đương**. Tắt công tắc để quay về cách cũ.
- Phần sửa lỗi hiện 2 dòng:
  - **Bạn viết**: chỗ sai / thừa **in đậm đỏ**, chỗ thiếu từ hiện `__` đỏ.
  - **Sửa lại**: câu đúng gần nhất, chữ được sửa / thêm **in đậm đỏ**.
  - Kèm "Cách khác" (các đáp án khác) và nút 🔊 nghe.
- Chưa nghĩ ra → bấm **Xem đáp án** (câu đó 0 điểm).
- **Nghỉ & ôn lại:** câu đúng 10/10 **ngay lần đầu** được nghỉ 2 ngày — hiện mờ với nhãn “Nghỉ đến T7, 10/10”, app bỏ qua (vẫn bấm xem lại được). Câu phải làm lại mới đúng thì **hôm sau** quay lại. Đến hạn, câu trở lại như mới với nhãn **Ôn lại**; trang chủ báo “N câu đến hạn ôn”, cụm mà mọi câu đang nghỉ thì hiện “Đã thuộc — ôn lại …”.
- Muốn sửa câu cũ → bấm vào câu đó, sửa, Enter để chấm lại.
- Xong 10 câu → **màn kết quả**: tổng điểm /100, điểm B1 / B2, số câu dùng đúng cụm, kỷ lục; nút **Làm lại các câu chưa tốt** (dưới 8 điểm) và **Sang phần Nghe**.

### Cách chấm (thang 10 / câu)

- **Dùng đúng cụm chunk: 4 điểm.** App tự nhận các dạng chia (feel → feels / felt / feeling, get → got / getting…). Không dùng cụm thì tối đa 4 điểm.
- **Giống đáp án gần nhất: 6 điểm.** So từng từ, bỏ qua viết hoa, dấu câu, viết tắt (don't = do not), chính tả Anh–Mỹ (centre = center). Gõ sai 1 ký tự chỉ bị trừ nhẹ.
- Máy chấm theo đáp án mẫu nên có thể chưa nhận ra câu đúng nhưng diễn đạt khác → bấm **"Câu của mình cũng đúng ý"** để tự tính 10/10.
- **Từ tương đương** (link ở cuối trang chủ, hoặc "Thêm từ tương đương" trong phần sửa lỗi):
  - **Bộ có sẵn** do Claude soạn và cập nhật theo chủ đề, bật / tắt từng chủ đề. Hiện có: *Cụm đi với will* (I'll = ill, we'll = well, won't = wont…).
  - **Danh sách của bạn**: tự khai báo thêm, mỗi dòng một nhóm, ví dụ `outside = outdoors`, `kids = children`. Lưu xong, các câu đã chấm tự chấm lại.

## Phần 2 · Nghe & nhắc lại

- Nhịp mỗi câu: **nghe 2 lần** (cách nhau 0,5 giây) → tiếng **“ting”** → **lượt bạn nói = độ dài câu + 2 giây** (có vòng đếm ngược) → câu tiếp.
- Bấm các chip hoặc **Tuỳ chỉnh** để đổi: tốc độ đọc, số lần nghe (1/2/3), lượt nói (câu +1s / +2s / +3s, 1,5× / 2× câu), số vòng mỗi câu, hiện chữ (luôn hiện / chỉ hiện khi nhắc lại / ẩn), giọng đọc, tiếng “ting”, nghĩa tiếng Việt, lặp cả danh sách.
- Câu nghe xong được đánh dấu ✓; nghe hết danh sách = 1 lượt.
- Phím tắt: `Space` phát / tạm dừng, `←` `→` chuyển câu.
- Giọng đọc lấy từ trình duyệt. Trên Mac nên chọn **Samantha** (Mỹ) hoặc **Daniel** (Anh). Muốn thêm giọng: *System Settings → Accessibility → Spoken Content → System Voice → Manage Voices*.

### Nghe trên iPhone khi tắt màn hình (Phần 2)

Trình duyệt dừng giọng đọc khi khoá màn hình, nên app tạo sẵn **file bài nghe** (.m4a) theo đúng nhịp trên:

1. (Có cụm thêm trên web?) Bấm **Tải file sao lưu** ở cuối trang chủ trước.
2. Bấm đúp file **`Tao-bai-nghe.command`** trong thư mục app. Mất khoảng 10 giây mỗi cụm; xong sẽ tự mở thư mục `audio/`
   (mỗi cụm 1 file + file **Tất cả các cụm.m4a**).
3. Chuột phải vào file → **Chia sẻ** → **AirDrop** → iPhone. Trên iPhone mở file trong app **Tệp**, bấm phát rồi khoá màn hình.
   Nếu bị dừng khi khoá, dùng app **VLC** (miễn phí).

Muốn đổi giọng / tốc độ / nhịp trong file: sửa phần `CONFIG` ở đầu file `tools/tao-bai-nghe.js` (hoặc nhờ Claude), rồi chạy lại bước 2.
Lần đầu bấm đúp, nếu macOS hỏi thì chọn **Mở**.

## Phần 3 · Gợi ý & nhắc lại

- Mỗi câu: nghe **đủ câu** → nghỉ 0,5 giây → nghe **gợi ý** (phần đầu câu + 1 chữ của phần sau) → “ting” → bạn nói lại **cả câu** (lượt nói = độ dài câu đầy đủ + 2 giây). Giúp nhớ câu dài.
- App tự cắt câu ở chỗ ngắt tự nhiên gần giữa câu (dấu phẩy, từ nối như *because, when, so that, without…*), không cắt ngang cụm chunk. Nhiều câu sẽ dừng ngay ở chữ đầu của cụm — bạn phải tự nhớ ra phần còn lại.
- Lúc gợi ý và lúc tới lượt nói, phần bị che được làm mờ (bấm vào để xem). Danh sách câu bên dưới: phần chữ nhạt là phần bị che.
- Dùng chung cài đặt với Phần 2 (tốc độ, lượt nói, số vòng, “ting”, giọng đọc); tiến độ tính riêng.

## Lưu cụm mới gặp trong lúc luyện

Gặp một cụm hay trong đáp án, “Cách khác” hay câu nghe → **bôi đen** nó (hoặc bấm đúp vào một từ). Một thanh nhỏ hiện ra:

- **Lưu để thêm sau** — cụm được **in đậm** ở mọi câu có nó và vào danh sách **Cụm mới đang chờ** ở trang chủ (kèm câu gốc). Khi rảnh bấm **Thêm cụm** ở đó.
- **Thêm cụm ngay** — mở trang Thêm cụm, điền sẵn cụm và câu gốc làm ngữ cảnh cho claude.ai.
- Bôi đen trúng cụm đã có → thanh báo “Đã có cụm này” kèm nút mở.

## Tổng kết

Bấm **Tổng kết** ở trang chủ:

- **Hôm nay**: số phút đã học (chia Dịch / Nghe), số câu dịch, điểm trung bình, số câu nghe – nhắc lại.
- Tổng thời gian, số ngày đã học, chuỗi ngày hiện tại và dài nhất — chọn xem **7 ngày / 30 ngày / Tất cả**.
- Biểu đồ thời gian học mỗi ngày (rê chuột vào cột để xem số phút, có nút **Xem dạng bảng**), lịch học 12 tuần, bảng theo từng cụm.
- **Cách tính giờ:** chỉ đếm khi đang ở phần Dịch / Nghe, trang đang hiện trên màn hình, và có thao tác trong 60 giây gần nhất hoặc đang phát audio. Để máy đó đi làm việc khác thì không bị tính.

## Thêm / sửa / xoá cụm ngay trên web

Bấm **Thêm cụm** ở trang chủ — miễn phí, nhờ claude.ai soạn câu:

1. Nhập cụm (nghĩa, chủ đề có thể để trống).
2. Bấm **Copy yêu cầu** → **Mở claude.ai** → dán vào khung chat và gửi.
3. Bấm nút Copy ở góc khối kết quả của Claude → quay lại dán vào ô số 3. App tự kiểm tra (đủ câu chưa, câu nào chưa dùng cụm).
4. **Xem trước & sửa** → **Lưu cụm**.

Hoặc bấm **tự nhập tay cả 10 câu**. Muốn **sửa / xoá** một cụm: bấm nút **⋯** ở góc thẻ cụm trên trang chủ → **Sửa cụm** / **Xoá cụm** (app hỏi lại trước khi xoá). Hoặc mở cụm → biểu tượng ✏️ cạnh tên cụm.

> Cụm thêm / sửa trên web, điểm và thời gian học được lưu **trong trình duyệt**. Thỉnh thoảng bấm **Tải file sao lưu** (cuối trang chủ) để giữ một bản; dùng **Khôi phục từ file** khi cần. Nhớ luôn mở app bằng cùng một trình duyệt.

## Thêm cụm bằng cách sửa file (cách cũ)

Mở file [`data/chunks.js`](data/chunks.js), copy một block có sẵn rồi sửa:

```js
{
  id: "look-forward-to",               // mã duy nhất, không dấu, không khoảng trắng
  chunk: "look forward to ...",        // dùng "..." / "sb" / "sth" cho chỗ trống
  meaning: "mong chờ điều gì",
  structure: "look forward to + V-ing", // tuỳ chọn — hiện thành công thức ở đầu trang
  sentences: [
    { level: "B1", vi: "Tôi rất mong được gặp bạn.",
      en: ["I look forward to meeting you.", "I'm looking forward to seeing you."] },
    // ... đủ 10 câu: 5 B1 + 5 B2
  ],
  // listen: ["Câu nghe riêng 1", { en: "Câu 2", vi: "Nghĩa câu 2" }]   // tuỳ chọn
}
```

Mẹo:
- `en` là **mảng** — càng ghi nhiều cách dịch đúng, chấm càng sát. Đáp án **đầu tiên** được dùng cho phần Nghe.
- `structure` tách bằng ` + `. Phần bắt đầu bằng `V`, `N`, `sb`, `sth`… hiện thành ô trống (viền đứt), phần còn lại tô vàng.
- Cụm có chỗ trống như `get sth done`, `make sb do sth` → app chấp nhận tối đa 4 từ ở chỗ trống.
- Từ sở hữu / đại từ (my, your, her…; me, him, them…) được coi là tương đương, nên `make up one's mind` khớp với `made up her mind`.
- Nếu app nhận diện cụm chưa đúng, thêm trường `match` với regex tự viết, ví dụ `match: ["look(s|ed|ing)? forward to"]`.
- Lưu file rồi tải lại trang (`⌘R`) là thấy.

Tiến độ học lưu trong trình duyệt (localStorage) — mở bằng trình duyệt khác sẽ là tiến độ riêng.

## Cấu trúc thư mục

```
index.html        trang chính
css/styles.css    giao diện (tự đổi theo chế độ sáng/tối của máy)
data/chunks.js    DỮ LIỆU — chỉ cần sửa file này
js/grader.js      chấm điểm + đánh dấu chỗ sai
js/speech.js      giọng đọc (Web Speech API)
js/app.js         trang chủ, phần Dịch, phần Nghe, Tổng kết, Thêm / sửa cụm, sao lưu
Tao-bai-nghe.command  bấm đúp để tạo file bài nghe cho iPhone
tools/tao-bai-nghe.js script tạo bài nghe (giọng macOS + afconvert)
audio/            file bài nghe (.m4a) + audio/index.js (tạo tự động)
```

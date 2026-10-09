/*
 * DỮ LIỆU CÁC CỤM CHUNKING
 * ------------------------------------------------------------------
 * Mỗi cụm là một object trong mảng CHUNKS. Thêm cụm mới bằng cách copy
 * một block bên dưới rồi sửa lại. Các trường:
 *
 *   id        : mã duy nhất, viết liền không dấu (dùng trong URL + lưu điểm)
 *   chunk     : cụm cần luyện. Có thể dùng "..." / "sb" / "sth" làm chỗ trống,
 *               ví dụ "get sth done", "make sb do sth", "without having to ..."
 *   meaning   : nghĩa tiếng Việt
 *   structure : (tuỳ chọn) ghi chú cấu trúc ngữ pháp
 *   match     : (tuỳ chọn) mảng regex tự viết để nhận diện cụm khi chấm.
 *               Bỏ trống thì app tự nhận các dạng chia động từ
 *               (feel → feels / felt / feeling, get → got / getting ...)
 *   sentences : 10 câu đề bài. Mỗi câu có:
 *                 level : "B1" hoặc "B2"
 *                 vi    : câu tiếng Việt
 *                 en    : MẢNG các đáp án tiếng Anh được chấp nhận
 *                         (càng nhiều cách diễn đạt đúng thì chấm càng sát)
 *   listen    : (tuỳ chọn) mảng câu riêng cho phần Nghe & nhắc lại.
 *               Bỏ trống thì app dùng: cụm chunk + đáp án đầu tiên của 10 câu.
 *               Mỗi phần tử là chuỗi tiếng Anh hoặc { en: "...", vi: "..." }
 */

window.CHUNKS = [
  {
    id: "feel-happy-to",
    chunk: "feel happy to ...",
    meaning: "cảm thấy vui khi (được) làm gì",
    structure: "feel happy to + V (nguyên mẫu)",
    sentences: [
      { level: "B1", vi: "Mình cảm thấy vui khi được giúp bạn.",
        en: ["I feel happy to help you.", "I feel happy to be able to help you."] },
      { level: "B1", vi: "Cô ấy cảm thấy vui khi được gặp lại người bạn cũ.",
        en: ["She feels happy to see her old friend again.", "She felt happy to meet her old friend again.", "She feels happy to meet her old friend again."] },
      { level: "B1", vi: "Bọn trẻ cảm thấy vui khi được chơi ngoài trời.",
        en: ["The kids feel happy to play outside.", "The children feel happy to play outdoors.", "Children feel happy to play outside."] },
      { level: "B1", vi: "Tôi cảm thấy vui khi được về nhà sau một ngày dài.",
        en: ["I feel happy to come home after a long day.", "I feel happy to be home after a long day.", "I feel happy to go home after a long day."] },
      { level: "B1", vi: "Anh ấy cảm thấy vui khi nhận được tin nhắn của bạn.",
        en: ["He felt happy to receive your message.", "He feels happy to get your message.", "He felt happy to get your message."] },

      { level: "B2", vi: "Tôi cảm thấy vui khi được làm việc với một đội ngũ nhiệt huyết như vậy.",
        en: ["I feel happy to work with such an enthusiastic team.", "I feel happy to be working with such a passionate team.", "I feel happy to work with such a passionate team."] },
      { level: "B2", vi: "Nhiều người cảm thấy vui khi được đóng góp cho cộng đồng, dù chỉ là những việc nhỏ.",
        en: ["Many people feel happy to contribute to their community, even if it is only in small ways.", "Many people feel happy to contribute to the community, even with small things.", "Many people feel happy to contribute to their community, even if it's just small things."] },
      { level: "B2", vi: "Sau nhiều năm cố gắng, cô ấy cảm thấy vui khi cuối cùng cũng đạt được mục tiêu của mình.",
        en: ["After years of effort, she felt happy to finally achieve her goal.", "After many years of trying, she felt happy to finally reach her goal.", "After many years of hard work, she felt happy to finally achieve her goal."] },
      { level: "B2", vi: "Khách hàng sẽ cảm thấy vui khi quay lại nếu họ được phục vụ chu đáo.",
        en: ["Customers will feel happy to come back if they are served attentively.", "Customers will feel happy to return if they receive good service.", "Customers will feel happy to come back if they are well looked after."] },
      { level: "B2", vi: "Tôi luôn cảm thấy vui khi được chia sẻ kinh nghiệm của mình với những người mới vào nghề.",
        en: ["I always feel happy to share my experience with newcomers to the profession.", "I always feel happy to share my experience with people who are new to the job.", "I always feel happy to share my experience with those who are new to the field."] }
    ]
  },

  {
    id: "get-everything-done",
    chunk: "get everything done",
    meaning: "làm xong / hoàn thành mọi việc",
    structure: "get + everything + done (V3)",
    sentences: [
      { level: "B1", vi: "Tôi cần làm xong mọi việc trước 5 giờ chiều.",
        en: ["I need to get everything done before 5 p.m.", "I need to get everything done by 5 p.m.", "I need to get everything done before 5 o'clock in the afternoon."] },
      { level: "B1", vi: "Cô ấy luôn làm xong mọi việc đúng hạn.",
        en: ["She always gets everything done on time."] },
      { level: "B1", vi: "Chúng ta có thể làm xong hết mọi thứ trong hôm nay không?",
        en: ["Can we get everything done today?", "Can we get everything done by today?"] },
      { level: "B1", vi: "Anh ấy đã làm xong mọi việc trước khi đi ngủ.",
        en: ["He got everything done before going to bed.", "He got everything done before he went to bed.", "He got everything done before bed."] },
      { level: "B1", vi: "Đừng lo, mình sẽ làm xong hết mọi thứ.",
        en: ["Don't worry, I will get everything done.", "Don't worry, I'm going to get everything done."] },

      { level: "B2", vi: "Với một kế hoạch rõ ràng, bạn có thể làm xong mọi việc mà không cảm thấy quá tải.",
        en: ["With a clear plan, you can get everything done without feeling overwhelmed.", "With a clear plan, you can get everything done without feeling overloaded."] },
      { level: "B2", vi: "Dù hạn chót rất gấp, cả nhóm vẫn xoay xở để làm xong mọi việc.",
        en: ["Although the deadline was very tight, the team still managed to get everything done.", "Despite the tight deadline, the whole team still managed to get everything done.", "Even though the deadline was really tight, the team still managed to get everything done."] },
      { level: "B2", vi: "Tôi thường dậy sớm để có thể làm xong mọi việc trước khi con thức dậy.",
        en: ["I usually get up early so that I can get everything done before my kids wake up.", "I often wake up early so I can get everything done before my children wake up.", "I usually wake up early so that I can get everything done before my child wakes up."] },
      { level: "B2", vi: "Nếu chúng ta chia nhỏ công việc, chúng ta sẽ làm xong mọi thứ nhanh hơn nhiều.",
        en: ["If we break the work down, we will get everything done much faster.", "If we divide the work into smaller tasks, we will get everything done much more quickly.", "If we break the work into smaller parts, we'll get everything done much faster."] },
      { level: "B2", vi: "Thật khó để làm xong mọi việc khi bạn liên tục bị làm phiền.",
        en: ["It's hard to get everything done when you are constantly interrupted.", "It is difficult to get everything done when you keep getting interrupted.", "It's hard to get everything done when you're constantly being disturbed."] }
    ]
  },

  {
    id: "without-having-to",
    chunk: "without having to ...",
    meaning: "mà không phải / không cần phải làm gì",
    structure: "without having to + V (nguyên mẫu)",
    sentences: [
      { level: "B1", vi: "Bạn có thể đặt vé online mà không phải xếp hàng.",
        en: ["You can book tickets online without having to queue.", "You can book tickets online without having to wait in line.", "You can book tickets online without having to stand in line."] },
      { level: "B1", vi: "Tôi có thể đi bộ đến trường mà không phải đi xe buýt.",
        en: ["I can walk to school without having to take the bus.", "I can walk to school without having to catch the bus."] },
      { level: "B1", vi: "Cô ấy học tiếng Anh ở nhà mà không cần phải đến trung tâm.",
        en: ["She learns English at home without having to go to a language center.", "She studies English at home without having to go to a center.", "She learns English at home without having to go to an English center."] },
      { level: "B1", vi: "Chúng tôi làm việc từ xa mà không phải đến văn phòng mỗi ngày.",
        en: ["We work remotely without having to go to the office every day.", "We work from home without having to go to the office every day."] },
      { level: "B1", vi: "Bạn có thể trả tiền bằng điện thoại mà không cần mang theo ví.",
        en: ["You can pay with your phone without having to carry your wallet.", "You can pay by phone without having to bring your wallet.", "You can pay with your phone without having to bring your wallet."] },

      { level: "B2", vi: "Ứng dụng này giúp bạn quản lý chi tiêu mà không phải ghi chép thủ công.",
        en: ["This app helps you manage your spending without having to write everything down by hand.", "This app helps you manage your expenses without having to keep records manually.", "This app helps you manage your spending without having to take notes manually."] },
      { level: "B2", vi: "Nhờ có máy rửa bát, tôi có thể dọn dẹp sau bữa tối mà không phải mất cả tiếng đồng hồ.",
        en: ["Thanks to the dishwasher, I can clean up after dinner without having to spend a whole hour.", "Thanks to the dishwasher, I can clean up after dinner without having to spend an hour on it.", "Thanks to the dishwasher, I can tidy up after dinner without having to spend a full hour."] },
      { level: "B2", vi: "Anh ấy muốn được thăng chức mà không phải làm thêm giờ mỗi tối.",
        en: ["He wants to get promoted without having to work overtime every evening.", "He wants to be promoted without having to work overtime every night."] },
      { level: "B2", vi: "Một người quản lý giỏi có thể giải quyết xung đột mà không cần phải lớn tiếng với ai.",
        en: ["A good manager can resolve conflicts without having to raise their voice at anyone.", "A good manager can solve conflicts without having to shout at anyone.", "A good manager can settle conflicts without having to raise their voice at anybody."] },
      { level: "B2", vi: "Tôi ước mình có thể đi du lịch vòng quanh thế giới mà không phải lo lắng về tiền bạc.",
        en: ["I wish I could travel around the world without having to worry about money.", "I wish I could travel the world without having to worry about money."] }
    ]
  }
];

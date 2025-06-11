// Input: "2025-04-28T10:23:27.844Z"
// Output: "10:23"
export function formatMessageTime(date) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit", // Hiển thị giờ dưới dạng 2 chữ số (ví dụ: 09 thay vì 9)
    minute: "2-digit", // Hiển thị phút dưới dạng 2 chữ số (ví dụ: 05 thay vì 5)
    hour12: false, // Sử dụng định dạng 24 giờ (ví dụ: 14:30 thay vì 2:30 PM)
  });
}

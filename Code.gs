// File này dùng để Deploy làm Web App trên Google Apps Script
// Hàm xử lý HTTP POST request
function doPost(e) {
  try {
    // Parser payload từ frontend
    var data = JSON.parse(e.postData.contents);
    
    // Mở Sheet hiện tại (Cần gán script này vào Google Sheet của bạn)
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Tạo mảng dữ liệu để chèn vào hàng mới
    // Thứ tự cột: Thời gian, Tên, SĐT, Email, Nguồn, Session ID, Thể Loại Quan Tâm, Mức Độ, Lịch Sử Chat
    var rowData = [
      data.timestamp || new Date().toLocaleString("vi-VN"),
      data.name || "",
      data.phone || "",
      data.email || "",
      data.source || "",
      data.sessionId || "",
      data.interest || "",
      data.level || "",
      data.chatHistory || ""
    ];
    
    // Thêm dòng mới vào Sheet
    sheet.appendRow(rowData);
    
    // Kiểm tra tính năng tự động cảnh báo
    if (data.level && data.level.toLowerCase() === "hot") {
      var salesEmail = "btkt.thoa@gmail.com";
      var subject = "📢 KHÁCH HÀNG NÓNG - CẦN LIÊN HỆ NGAY!";
      var body = "Tên: " + data.name + "\n" +
                 "SĐT: " + data.phone + "\n" +
                 "Email: " + (data.email || "Không có") + "\n" +
                 "Quan tâm: " + data.interest + "\n" +
                 "Thời gian: " + data.timestamp + "\n\n" +
                 "Vui lòng liên hệ khách hàng này trong vòng 30 phút!";
                 
      MailApp.sendEmail(salesEmail, subject, body);
    }
    
    // Trả về JSON thông báo thành công
    return ContentService.createTextOutput(JSON.stringify({"status": "success", "message": "Data logged successfully"}))
                         .setMimeType(ContentService.MimeType.JSON);
                         
  } catch (error) {
    // Xử lý lỗi
    return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": error.toString()}))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

// Bắt buộc phải có doGet để Web App hoạt động mà không bị lỗi (dành cho lúc test trực tiếp trên browser)
function doGet(e) {
  return ContentService.createTextOutput("Webhook is running...");
}
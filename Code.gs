// File này dùng để Deploy làm Web App trên Google Apps Script
// Hàm xử lý HTTP POST request
function doPost(e) {
  try {
    // Parser payload từ frontend. Nếu dùng "text/plain" hoặc "no-cors", payload vào dạng chuỗi trong contents.
    var data = JSON.parse(e.postData.contents);
    
    // Mở Sheet hiện tại (Cần gán script này vào Google Sheet của bạn)
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Tạo mảng dữ liệu để chèn vào hàng mới
    // Thứ tự cột: (A) Thời gian, (B) Tên, (C) SĐT, (D) Email, (E) Nguồn, (F) Session ID, (G) Thể Loại Quan Tâm, (H) Mức Độ, (I) Lịch Sử Chat
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
    
    // Tìm Cột Session ID (Cột F là cột số 6)
    var sessionIdIndex = 6; 
    var lastRow = sheet.getLastRow();
    var isUpdated = false;
    
    // Tìm hàng đã tồn tại dựa vào Session ID để update lịch sử chat thay vì tạo hàng mới
    if (lastRow > 0 && data.sessionId) {
      var sessionValues = sheet.getRange(1, sessionIdIndex, lastRow, 1).getValues();
      for (var i = 0; i < sessionValues.length; i++) {
        if (sessionValues[i][0] === data.sessionId) {
          // Update the row (i + 1 is the actual row index)
          sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
          isUpdated = true;
          break;
        }
      }
    }
    
    // Nếu chưa tồn tại Session ID này, tạo hàng mới
    if (!isUpdated) {
      sheet.appendRow(rowData);
    }
    
    // Kiểm tra tính năng tự động cảnh báo
    // Chỉ gửi cảnh báo một lần để tránh spam do cập nhật nhiều lần
    if (data.triggerAlert === true) {
      var salesEmail = "btkt.thoa@gmail.com";
      var subject = "📢 KHÁCH HÀNG NÓNG - CẦN LIÊN HỆ NGAY!";
      var body = "Khách hàng đã phát sinh nhu cầu CAO qua Chatbot.\n\n" +
                 "Tên: " + (data.name || "Ẩn danh") + "\n" +
                 "SĐT: " + (data.phone || "Không rõ") + "\n" +
                 "Email: " + (data.email || "Không rõ") + "\n" +
                 "Quan tâm: " + data.interest + "\n" +
                 "Thời gian: " + data.timestamp + "\n\n" +
                 "Lịch sử Chat:\n" + data.chatHistory + "\n\n" +
                 "Vui lòng liên hệ và chuẩn bị kịch bản tư vấn!";
                 
      MailApp.sendEmail(salesEmail, subject, body);
    }
    
    // Trả về JSON thông báo thành công
    return ContentService.createTextOutput(JSON.stringify({"status": "success"}))
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
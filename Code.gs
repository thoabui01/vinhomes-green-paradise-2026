// File này dùng để Deploy làm Web App trên Google Apps Script

function doPost(e) {
  try {
    // 1. Phân tích dữ liệu được gửi từ x-www-form-urlencoded
    // Sử dụng e.parameter để đọc trực tiếp các tham số
    var data = e.parameter;
    
    // Nếu không có e.parameter thì báo lỗi an toàn thay vì crash
    if (!data || Object.keys(data).length === 0) {
        return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": "No parameters received."}))
                             .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Mở Sheet hiện tại
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Tạo mảng dữ liệu để chèn
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
    
    var sessionIdIndex = 6; // Cột F (Session ID)
    var lastRow = sheet.getLastRow();
    var isUpdated = false;
    
    // Tìm hàng đã tồn tại dựa vào Session ID để update lịch sử chat
    if (lastRow > 0 && data.sessionId) {
      var sessionValues = sheet.getRange(1, sessionIdIndex, lastRow, 1).getValues();
      for (var i = 0; i < sessionValues.length; i++) {
        if (sessionValues[i][0] === data.sessionId) {
          // Update the row
          sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
          isUpdated = true;
          break;
        }
      }
    }
    
    // Nếu chưa tồn tại, tạo hàng mới
    if (!isUpdated) {
      sheet.appendRow(rowData);
    }
    
    // Khách hàng nóng
    if (data.triggerAlert === "true") {
      var salesEmail = "btkt.thoa@gmail.com";
      var subject = "📢 KHÁCH HÀNG NÓNG - CẦN LIÊN HỆ NGAY!";
      var body = "Khách hàng đã phát sinh nhu cầu CAO qua Chatbot.\n\n" +
                 "Tên: " + (data.name || "Ẩn danh") + "\n" +
                 "SĐT/Email: Chưa cập nhật\n" +
                 "Quan tâm: " + (data.interest || "Chưa rõ") + "\n" +
                 "Thời gian: " + (data.timestamp || "") + "\n\n" +
                 "Lịch sử Chat:\n" + (data.chatHistory || "Trống") + "\n\n" +
                 "Hãy theo dõi lịch sử chat trên Google Sheets!";
                 
      MailApp.sendEmail(salesEmail, subject, body);
    }
    
    return ContentService.createTextOutput(JSON.stringify({"status": "success"}))
                         .setMimeType(ContentService.MimeType.JSON);
                         
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": error.toString()}))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Webhook is properly online. Version 3.");
}
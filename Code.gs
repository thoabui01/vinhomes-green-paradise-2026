// File này dùng để Deploy làm Web App trên Google Apps Script
// QUAN TRỌNG: Sau khi paste code này, phải Deploy > Manage deployments > Edit > New version > Deploy

function doPost(e) {
  try {
    var data = e.parameter;
    
    if (!data || Object.keys(data).length === 0) {
      return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": "No data"}))
                           .setMimeType(ContentService.MimeType.JSON);
    }
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Dữ liệu theo đúng thứ tự cột: A-I (khớp header Google Sheets)
    var rowData = [
      data.timestamp || new Date().toLocaleString("vi-VN"),  // A: Thời gian
      data.name || "",                                        // B: Tên
      data.phone || "",                                       // C: SĐT
      data.email || "",                                       // D: Email
      data.source || "CHATBOT",                               // E: Nguồn
      data.sessionId || "",                                    // F: Session ID
      data.chatHistory || "",                                  // G: Lịch sử Chat
      data.interest || "",                                     // H: Quan tâm
      data.level || ""                                         // I: Mức độ
    ];
    
    var sessionIdCol = 6;  // Cột F = Session ID
    var lastRow = sheet.getLastRow();
    var isUpdated = false;
    
    // Tìm hàng có cùng Session ID để UPDATE (cập nhật chat mới nhất)
    // BẮT ĐẦU TỪ ROW 2 để bỏ qua header row
    if (lastRow > 1 && data.sessionId && data.sessionId.length > 0) {
      var sessionValues = sheet.getRange(2, sessionIdCol, lastRow - 1, 1).getValues();
      for (var i = 0; i < sessionValues.length; i++) {
        if (String(sessionValues[i][0]) === String(data.sessionId)) {
          // Tìm thấy → cập nhật dòng này (i+2 vì bắt đầu từ row 2)
          sheet.getRange(i + 2, 1, 1, rowData.length).setValues([rowData]);
          isUpdated = true;
          break;
        }
      }
    }
    
    // Không tìm thấy → TẠO DÒNG MỚI
    if (!isUpdated) {
      sheet.appendRow(rowData);
    }
    
    // GỬI EMAIL CẢNH BÁO KHÁCH HOT
    if (data.triggerAlert === "true") {
      try {
        var salesEmail = "btkt.thoa@gmail.com";
        var subject = "🔥 KHÁCH HÀNG HOT - " + (data.name || "Ẩn danh") + " - Cần liên hệ ngay!";
        var body = "━━━━━━━━━━━━━━━━━━━━━━\n" +
                   "🔥 KHÁCH HÀNG CÓ NHU CẦU CAO\n" +
                   "━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                   "👤 Tên: " + (data.name || "Chưa cung cấp") + "\n" +
                   "📞 SĐT: " + (data.phone || "Chưa cung cấp") + "\n" +
                   "📧 Email: " + (data.email || "Chưa cung cấp") + "\n" +
                   "🏡 Quan tâm: " + (data.interest || "Đang tìm hiểu") + "\n" +
                   "⏰ Thời gian: " + (data.timestamp || "") + "\n" +
                   "📊 Mức độ: " + (data.level || "HOT") + "\n\n" +
                   "━━━━━━━━ LỊCH SỬ CHAT ━━━━━━━━\n\n" +
                   (data.chatHistory || "Trống") + "\n\n" +
                   "━━━━━━━━━━━━━━━━━━━━━━\n" +
                   "Hãy liên hệ khách hàng này ngay lập tức!";
                   
        MailApp.sendEmail(salesEmail, subject, body);
        Logger.log("Email alert sent for session: " + data.sessionId);
      } catch (emailError) {
        Logger.log("Email error: " + emailError.toString());
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({"status": "success"}))
                         .setMimeType(ContentService.MimeType.JSON);
                         
  } catch (error) {
    Logger.log("doPost error: " + error.toString());
    return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": error.toString()}))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Webhook online. Version 5.");
}
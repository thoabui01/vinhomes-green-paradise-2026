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
    var lastRow = sheet.getLastRow();
    
    // ============================================================
    // ĐỌC HEADER ROW ĐỂ TÌM ĐÚNG CỘT (không phụ thuộc thứ tự)
    // ============================================================
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Mapping tên cột header → dữ liệu từ chatbot
    var fieldMapping = {
      "timestamp": data.timestamp || new Date().toLocaleString("vi-VN"),
      "name": data.name || "",
      "phone": data.phone || "",
      "email": data.email || "",
      "source": data.source || "CHATBOT",
      "sessionId": data.sessionId || "",
      "chatHistory": data.chatHistory || "",
      "interest": data.interest || "",
      "level": data.level || ""
    };
    
    // Header keywords → field key (tìm kiếm trong header text)
    var headerToField = [
      { keywords: ["thời gian", "thoi gian", "timestamp", "time"], field: "timestamp" },
      { keywords: ["tên", "ten", "name", "họ tên", "ho ten"], field: "name" },
      { keywords: ["sđt", "sdt", "số điện thoại", "so dien thoai", "phone", "điện thoại", "dien thoai"], field: "phone" },
      { keywords: ["email", "e-mail", "mail"], field: "email" },
      { keywords: ["nguồn", "nguon", "source"], field: "source" },
      { keywords: ["session", "session id", "sessionid", "phiên"], field: "sessionId" },
      { keywords: ["lịch sử", "lich su", "chat history", "nội dung", "noi dung", "lịch sử chat"], field: "chatHistory" },
      { keywords: ["quan tâm", "quan tam", "interest", "sản phẩm", "san pham", "thể loại", "the loai"], field: "interest" },
      { keywords: ["mức độ", "muc do", "level", "đánh giá", "danh gia"], field: "level" }
    ];
    
    // Tìm cột cho từng field dựa trên header text
    var colMap = {};
    
    for (var h = 0; h < headers.length; h++) {
      var headerText = String(headers[h]).toLowerCase().trim();
      if (!headerText) continue;
      
      for (var m = 0; m < headerToField.length; m++) {
        var mapping = headerToField[m];
        for (var k = 0; k < mapping.keywords.length; k++) {
          if (headerText.indexOf(mapping.keywords[k]) !== -1) {
            colMap[mapping.field] = h;
            break;
          }
        }
      }
    }
    
    // ============================================================
    // TẠO DÒNG DỮ LIỆU THEO ĐÚNG THỨ TỰ CỘT CỦA SHEET
    // ============================================================
    var numCols = headers.length;
    var rowData = [];
    
    for (var c = 0; c < numCols; c++) {
      var value = "";
      for (var fieldName in colMap) {
        if (colMap[fieldName] === c) {
          value = fieldMapping[fieldName] || "";
          break;
        }
      }
      rowData.push(value);
    }
    
    // ============================================================
    // TÌM SESSION ID ĐỂ UPDATE HOẶC TẠO DÒNG MỚI
    // ============================================================
    var sessionCol = (colMap["sessionId"] !== undefined) ? colMap["sessionId"] + 1 : -1;
    var isUpdated = false;
    
    if (lastRow > 1 && sessionCol > 0 && data.sessionId && data.sessionId.length > 0) {
      var sessionValues = sheet.getRange(2, sessionCol, lastRow - 1, 1).getValues();
      for (var i = 0; i < sessionValues.length; i++) {
        if (String(sessionValues[i][0]) === String(data.sessionId)) {
          sheet.getRange(i + 2, 1, 1, rowData.length).setValues([rowData]);
          isUpdated = true;
          break;
        }
      }
    }
    
    if (!isUpdated) {
      sheet.appendRow(rowData);
    }
    
    // ============================================================
    // GỬI EMAIL CẢNH BÁO KHÁCH HOT
    // ============================================================
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
    
    Logger.log("Received data: " + JSON.stringify(data));
    Logger.log("Column mapping: " + JSON.stringify(colMap));
    Logger.log("Row data: " + JSON.stringify(rowData));
    
    return ContentService.createTextOutput(JSON.stringify({"status": "success", "mapping": colMap}))
                         .setMimeType(ContentService.MimeType.JSON);
                         
  } catch (error) {
    Logger.log("doPost error: " + error.toString());
    return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": error.toString()}))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Webhook online. Version 6 - Dynamic column mapping.");
}
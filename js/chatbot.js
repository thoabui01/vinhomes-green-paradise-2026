document.addEventListener('DOMContentLoaded', () => {
    // FAILSAFE: Xóa modal cũ nếu còn sót trong cache
    const phantomModal = document.getElementById('leadModal');
    if (phantomModal) phantomModal.remove();

    const chatToggler = document.getElementById('chatToggler');
    const chatWindow = document.getElementById('chatWindow');
    const closeChat = document.getElementById('closeChat');
    const chatBody = document.getElementById('chatBody');
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    
    // Webhook URL
    const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzmfythugMx4lfU4SbWxeDhX4lAisr6vGh5WjCSOdGanrtKF5U5IGhbFrbaKiby_flq/exec';
    
    // Dữ liệu phiên chat
    let chatHistory = [];       // Mảng lưu lịch sử [{role, message}]
    let currentLevel = "COLD";
    let userInterest = "";
    let messageCount = 0;
    let chatStartTime = "";     // Thời gian bắt đầu chat

    // Thông tin khách hàng - trích xuất từ nội dung chat
    let customerName = "";
    let customerPhone = "";
    let customerEmail = "";

    // Toggle Chat Window
    chatToggler.addEventListener('click', () => {
        chatWindow.classList.toggle('d-none');
        chatToggler.querySelector('.chat-notification').classList.add('d-none');
    });

    closeChat.addEventListener('click', () => {
        chatWindow.classList.add('d-none');
    });

    // Handle Form Submit
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        var msg = chatInput.value.trim();
        if(!msg) return;

        // Ghi nhận thời gian bắt đầu chat (lần chat đầu tiên)
        if (!chatStartTime) {
            chatStartTime = new Date().toLocaleString("vi-VN");
        }

        appendMessage(msg, 'user-message');
        chatHistory.push({ role: 'Khách', message: msg });
        chatInput.value = '';
        messageCount++;

        // Phân tích thông tin khách từ tin nhắn
        extractCustomerInfo(msg);
        analyzeUserInput(msg);
        showTypingIndicator();
        
        setTimeout(function() {
            removeTypingIndicator();
            var aiReply = generateAIResponse(msg);
            appendMessage(aiReply, 'ai-message');
            chatHistory.push({ role: 'Bot', message: aiReply });
            
            // Gửi dữ liệu về Google Sheets
            sendDataViaForm();
            
        }, 1500);
    });

    function appendMessage(msg, className) {
        var div = document.createElement('div');
        div.className = 'message ' + className;
        div.innerHTML = '<div class="message-content">' + msg + '</div>';
        chatBody.appendChild(div);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function showTypingIndicator() {
        var div = document.createElement('div');
        div.className = 'message ai-message typing-indicator';
        div.id = 'typingIndicator';
        div.innerHTML = '<div class="message-content">...</div>';
        chatBody.appendChild(div);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function removeTypingIndicator() {
        var el = document.getElementById('typingIndicator');
        if(el) el.remove();
    }

    // ============================================================
    // TRÍCH XUẤT THÔNG TIN KHÁCH HÀNG TỪ NỘI DUNG CHAT
    // ============================================================
    function extractCustomerInfo(msg) {
        // --- Trích xuất TÊN ---
        if (!customerName) {
            var namePatterns = [
                /(?:tôi|em|mình|anh|chị|t)\s+(?:là|tên là|tên)\s+([A-ZÀ-Ỹa-zà-ỹ\s]{2,20})/i,
                /(?:tên|tên em|tên tôi|tên mình)\s+(?:là\s+)?([A-ZÀ-Ỹa-zà-ỹ\s]{2,20})/i,
                /(?:mình là|em là|tôi là|t là)\s+([A-ZÀ-Ỹa-zà-ỹ\s]{2,20})/i,
                /^(?:dạ\s+)?(?:em|anh|chị)\s+([A-ZÀ-Ỹ][a-zà-ỹ]+(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]+)*)\s+(?:đây|nè|ạ|nha)/i
            ];
            for (var i = 0; i < namePatterns.length; i++) {
                var nameMatch = msg.match(namePatterns[i]);
                if (nameMatch) {
                    customerName = nameMatch[1].trim();
                    break;
                }
            }
        }

        // --- Trích xuất SỐ ĐIỆN THOẠI ---
        if (!customerPhone) {
            var phoneMatch = msg.match(/(?:0|\+84|84)\d[\d\s.\-]{7,12}/);
            if (phoneMatch) {
                customerPhone = phoneMatch[0].replace(/[\s.\-]/g, '');
            }
        }

        // --- Trích xuất EMAIL ---
        if (!customerEmail) {
            var emailMatch = msg.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
            if (emailMatch) {
                customerEmail = emailMatch[0];
            }
        }
    }

    // ============================================================
    // PHÂN TÍCH Ý ĐỊNH & MỨC ĐỘ QUAN TÂM
    // ============================================================
    function analyzeUserInput(msg) {
        var text = msg.toLowerCase();
        
        if (text.indexOf('biệt thự') !== -1 || text.indexOf('villa') !== -1) {
            userInterest = addInterest(userInterest, "Biệt thự");
        }
        if (text.indexOf('shophouse') !== -1 || text.indexOf('shop house') !== -1 || text.indexOf('nhà phố') !== -1) {
            userInterest = addInterest(userInterest, "Shophouse");
        }
        if (text.indexOf('căn hộ') !== -1 || text.indexOf('chung cư') !== -1) {
            userInterest = addInterest(userInterest, "Căn hộ");
        }
        if (text.indexOf('đất nền') !== -1 || text.indexOf('đất') !== -1) {
            userInterest = addInterest(userInterest, "Đất nền");
        }

        if (text.indexOf('mua') !== -1 || text.indexOf('đặt cọc') !== -1 || 
            text.indexOf('xem nhà') !== -1 || text.indexOf('chiết khấu') !== -1 || 
            text.indexOf('tư vấn') !== -1 || text.indexOf('liên hệ') !== -1 ||
            text.indexOf('hẹn') !== -1 || text.indexOf('book') !== -1 ||
            customerPhone || customerEmail) {
            currentLevel = "HOT";
        }
        else if (text.indexOf('giá') !== -1 || text.indexOf('bảng giá') !== -1 || 
                 text.indexOf('thanh toán') !== -1 || text.indexOf('trả góp') !== -1 ||
                 text.indexOf('diện tích') !== -1 || text.indexOf('bao nhiêu') !== -1) {
            if (currentLevel === "COLD") currentLevel = "WARM";
        }
        
        if (messageCount > 4 && currentLevel === "COLD") {
            currentLevel = "WARM";
        }
    }

    function addInterest(current, newItem) {
        if (!current) return newItem;
        if (current.indexOf(newItem) !== -1) return current;
        return current + ", " + newItem;
    }

    // ============================================================
    // TẠO CÂU TRẢ LỜI AI
    // ============================================================
    function generateAIResponse(msg) {
        var text = msg.toLowerCase();
        if (text.indexOf('giá') !== -1 || text.indexOf('bảng giá') !== -1) {
            return "Hiện tại dự án Vinhomes Green Paradise Cần Giờ đang có chính sách giá rất ưu đãi cho đợt mở bán đầu tiên. Để nhận bảng giá chi tiết, anh/chị có thể cho em xin tên và SĐT để em hỗ trợ ngay nhé.";
        }
        if (text.indexOf('vị trí') !== -1 || text.indexOf('ở đâu') !== -1) {
            return "Dự án nằm tại vị trí kim cương huyện Cần Giờ, 1 mặt giáp rừng ngập mặn, 1 mặt giáp biển. Tương lai kết nối qua cầu Cần Giờ sẽ rất thuận tiện. Anh/chị cần xem bản đồ chi tiết không?";
        }
        if (text.indexOf('shophouse') !== -1) {
            return "Shophouse tại đây phục vụ lượng lớn khách du lịch, mặt tiền rộng, phù hợp kinh doanh nhà hàng, cafe hoặc thời trang. Anh/chị muốn kinh doanh mô hình nào ạ?";
        }
        if (text.indexOf('biệt thự') !== -1) {
            return "Dòng biệt thự biển là tinh hoa của dự án với thiết kế lấn biển độc bản và số lượng rất giới hạn. Anh/chị tìm biệt thự cho gia đình hay để đầu tư ạ?";
        }
        if (text.indexOf('thanh toán') !== -1 || text.indexOf('trả góp') !== -1) {
            return "Dự án hỗ trợ trả góp lên đến 70% giá trị, lãi suất 0% trong 24 tháng. Anh/chị muốn em gửi chi tiết phương thức thanh toán không ạ?";
        }
        return "Dạ vâng, tiện ích dự án vô cùng đa dạng với tổ hợp giải trí đêm, cụm hồ bơi vô cực, bến du thuyền... Anh/chị có thể cho em biết tên để tiện xưng hô nhé!";
    }

    // ============================================================
    // FORMAT LỊCH SỬ CHAT ĐỂ DỄ ĐỌC TRONG GOOGLE SHEETS
    // ============================================================
    function formatChatHistory() {
        var lines = [];
        for (var i = 0; i < chatHistory.length; i++) {
            var entry = chatHistory[i];
            lines.push(entry.role + ": " + entry.message);
        }
        return lines.join("\n");
    }

    // ============================================================
    // GỬI DỮ LIỆU QUA FORM + IFRAME ẨN (bypass CORS)
    // ============================================================
    function sendDataViaForm() {
        var sessionIdInput = document.getElementById('sessionId');
        var sessionId = sessionIdInput ? sessionIdInput.value : "Guest_" + Math.floor(Math.random()*10000);
        
        var triggerAlert = "false";
        if (currentLevel === "HOT" && !localStorage.getItem('vhgp_hot_alert_sent')) {
            triggerAlert = "true";
            localStorage.setItem('vhgp_hot_alert_sent', 'true');
        }

        var form = document.createElement('form');
        form.method = 'POST';
        form.action = WEBHOOK_URL;
        form.target = 'webhookFrame';
        form.style.display = 'none';

        var fields = {
            timestamp: chatStartTime || new Date().toLocaleString("vi-VN"),
            name: customerName || "",
            phone: customerPhone || "",
            email: customerEmail || "",
            source: "CHATBOT",
            sessionId: sessionId,
            chatHistory: formatChatHistory(),
            interest: userInterest || "Đang tìm hiểu",
            level: currentLevel,
            triggerAlert: triggerAlert
        };

        for (var key in fields) {
            var input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = fields[key];
            form.appendChild(input);
        }

        document.body.appendChild(form);
        form.submit();
        
        setTimeout(function() {
            document.body.removeChild(form);
        }, 2000);
        
        console.log("Data synced to Google Sheets. Name:", customerName, "| Phone:", customerPhone, "| Level:", currentLevel);
    }
});
document.addEventListener('DOMContentLoaded', () => {
    // Failsafe: If any cached HTML still has the lead modal, completely obliterate it from the DOM.
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
    
    let chatHistory = [];
    let currentLevel = "cold";
    let userInterest = "Đang tìm hiểu";
    let messageCount = 0;

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
        const msg = chatInput.value.trim();
        if(!msg) return;

        appendMessage(msg, 'user-message');
        chatHistory.push({ role: 'User', message: msg, time: new Date().toISOString() });
        chatInput.value = '';
        messageCount++;

        // Simulate AI Processing & Response
        analyzeUserInput(msg);
        showTypingIndicator();
        
        setTimeout(() => {
            removeTypingIndicator();
            const aiReply = generateAIResponse(msg);
            appendMessage(aiReply, 'ai-message');
            chatHistory.push({ role: 'AI', message: aiReply, time: new Date().toISOString() });
            
            // Send data to Google Sheets
            sendDataToWebhook();
            
        }, 1500);
    });

    function appendMessage(msg, className) {
        const div = document.createElement('div');
        div.className = `message ${className}`;
        div.innerHTML = `<div class="message-content">${msg}</div>`;
        chatBody.appendChild(div);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function showTypingIndicator() {
        const div = document.createElement('div');
        div.className = `message ai-message typing-indicator`;
        div.id = 'typingIndicator';
        div.innerHTML = `<div class="message-content">...</div>`;
        chatBody.appendChild(div);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function removeTypingIndicator() {
        const el = document.getElementById('typingIndicator');
        if(el) el.remove();
    }

    function analyzeUserInput(msg) {
        let text = msg.toLowerCase();
        
        if(text.includes('biệt thự') || text.includes('villa')) userInterest = "Biệt thự";
        else if(text.includes('shophouse') || text.includes('kinh doanh')) userInterest = "Shophouse";
        else if(text.includes('căn hộ') || text.includes('chung cư')) userInterest = "Căn hộ";
        
        if(text.includes('giá') || text.includes('bảng giá') || text.includes('thanh toán')) {
            currentLevel = currentLevel === "cold" ? "warm" : "hot";
        }
        if(text.includes('mua') || text.includes('xem nhà') || text.includes('chiết khấu') || text.includes('tư vấn')) {
            currentLevel = "hot";
        }
        
        if (messageCount > 4 && currentLevel === "cold") {
            currentLevel = "warm";
        }
    }

    function generateAIResponse(msg) {
        let text = msg.toLowerCase();
        if(text.includes('giá') || text.includes('bảng giá')) {
            return "Hiện tại dự án Vinhomes Green Paradise Cần Giờ đang có chính sách giá rất ưu đãi cho đợt mở bán đầu tiên. Để nhận bảng giá chi tiết từng dòng diện tích, anh/chị có thể để lại số SĐT hoặc Email để em hỗ trợ cung cấp ngay nhé.";
        }
        if(text.includes('vị trí') || text.includes('ở đâu')) {
            return "Dự án nằm tại vị trí kim cương huyện Cần Giờ, 1 mặt giáp rừng ngập mặn, 1 mặt giáp biển. Tương lai kết nối qua cầu Cần Giờ sẽ rất thuận tiện. Anh/chị cần em cung cấp sơ đồ vị trí chi tiết không?";
        }
        if(text.includes('shophouse')) {
            return "Shophouse tại đây có quy mô phục vụ lượng lớn khách du lịch, thiết kế mặt tiền rộng, rất phù hợp kinh doanh nhà hàng, cafe hoặc thời trang. Anh/chị đang muốn kinh doanh mô hình nào ạ?";
        }
        if(text.includes('biệt thự')) {
            return "Dòng biệt thự biển là tinh hoa của dự án với thiết kế lấn biển độc bản và số lượng rất giới hạn. Anh/chị đang tìm biệt thự nghỉ dưỡng cho gia đình hay để đầu tư ạ?";
        }
        return "Dạ vâng, hệ sinh thái tiện ích của dự án vô cùng đa dạng với tổ hợp giải trí đêm, cụm hồ bơi vô cực, bến du thuyền... Anh/chị có điều gì vướng mắc cần em hỗ trợ giải đáp cứ nhắn nhé!";
    }

    function sendDataToWebhook() {
        const sessionIdInput = document.getElementById('sessionId');
        const sessionId = sessionIdInput ? sessionIdInput.value : "Guest_" + Math.floor(Math.random()*10000);
        const isHot = (currentLevel === 'hot');
        
        // Setup local storage flag to only trigger hot email ONCE
        let triggerAlert = "false";
        if (isHot && !localStorage.getItem('vhgp_hot_alert_sent')) {
            triggerAlert = "true";
            localStorage.setItem('vhgp_hot_alert_sent', 'true');
        }

        // Dùng URL Search Params là cách chuẩn xác nhất để đẩy Web Apps Script với no-cors
        const params = new URLSearchParams({
            timestamp: new Date().toLocaleString("vi-VN"),
            name: "Ẩn danh (Qua Chatbot)",
            phone: "Trống",
            email: "Trống",
            source: window.location.href,
            sessionId: sessionId,
            chatHistory: JSON.stringify(chatHistory, null, 2),
            interest: userInterest,
            level: currentLevel,
            triggerAlert: triggerAlert 
        });

        if(WEBHOOK_URL) {
            fetch(WEBHOOK_URL, {
                method: "POST",
                mode: "no-cors",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: params.toString()
            }).then(() => {
                console.log("Chat history perfectly synced to Google Sheet.");
            }).catch(err => console.error("Webhook network error:", err));
        }
    }
});
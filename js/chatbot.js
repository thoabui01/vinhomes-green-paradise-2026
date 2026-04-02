document.addEventListener('DOMContentLoaded', () => {
    // FAILSAFE: Nếu trình duyệt cache HTML cũ vẫn còn modal, xóa nó khỏi DOM
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

        analyzeUserInput(msg);
        showTypingIndicator();
        
        setTimeout(() => {
            removeTypingIndicator();
            const aiReply = generateAIResponse(msg);
            appendMessage(aiReply, 'ai-message');
            chatHistory.push({ role: 'AI', message: aiReply, time: new Date().toISOString() });
            
            // Gửi dữ liệu về Google Sheets sau mỗi lượt chat
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

    function analyzeUserInput(msg) {
        var text = msg.toLowerCase();
        
        if(text.indexOf('biệt thự') !== -1 || text.indexOf('villa') !== -1) userInterest = "Biệt thự";
        else if(text.indexOf('shophouse') !== -1 || text.indexOf('kinh doanh') !== -1) userInterest = "Shophouse";
        else if(text.indexOf('căn hộ') !== -1 || text.indexOf('chung cư') !== -1) userInterest = "Căn hộ";
        
        if(text.indexOf('giá') !== -1 || text.indexOf('bảng giá') !== -1 || text.indexOf('thanh toán') !== -1) {
            currentLevel = currentLevel === "cold" ? "warm" : "hot";
        }
        if(text.indexOf('mua') !== -1 || text.indexOf('xem nhà') !== -1 || text.indexOf('chiết khấu') !== -1 || text.indexOf('tư vấn') !== -1) {
            currentLevel = "hot";
        }
        
        if (messageCount > 4 && currentLevel === "cold") {
            currentLevel = "warm";
        }
    }

    function generateAIResponse(msg) {
        var text = msg.toLowerCase();
        if(text.indexOf('giá') !== -1 || text.indexOf('bảng giá') !== -1) {
            return "Hiện tại dự án Vinhomes Green Paradise Cần Giờ đang có chính sách giá rất ưu đãi cho đợt mở bán đầu tiên. Để nhận bảng giá chi tiết, anh/chị có thể để lại SĐT hoặc Email để em hỗ trợ ngay nhé.";
        }
        if(text.indexOf('vị trí') !== -1 || text.indexOf('ở đâu') !== -1) {
            return "Dự án nằm tại vị trí kim cương huyện Cần Giờ, 1 mặt giáp rừng ngập mặn, 1 mặt giáp biển. Tương lai kết nối qua cầu Cần Giờ sẽ rất thuận tiện. Anh/chị cần xem bản đồ chi tiết không?";
        }
        if(text.indexOf('shophouse') !== -1) {
            return "Shophouse tại đây phục vụ lượng lớn khách du lịch, mặt tiền rộng, phù hợp kinh doanh nhà hàng, cafe hoặc thời trang. Anh/chị muốn kinh doanh mô hình nào ạ?";
        }
        if(text.indexOf('biệt thự') !== -1) {
            return "Dòng biệt thự biển là tinh hoa của dự án với thiết kế lấn biển độc bản và số lượng rất giới hạn. Anh/chị tìm biệt thự cho gia đình hay để đầu tư ạ?";
        }
        return "Dạ vâng, tiện ích dự án vô cùng đa dạng với tổ hợp giải trí đêm, cụm hồ bơi vô cực, bến du thuyền... Anh/chị có vướng mắc gì cần em hỗ trợ cứ nhắn nhé!";
    }

    // GỬi DỮ LIỆU QUA FORM + IFRAME ẨN
    // Cách này KHÔNG bị CORS chặn vì form submission không bị CORS policy ảnh hưởng
    function sendDataViaForm() {
        var sessionIdInput = document.getElementById('sessionId');
        var sessionId = sessionIdInput ? sessionIdInput.value : "Guest_" + Math.floor(Math.random()*10000);
        var isHot = (currentLevel === 'hot');
        
        var triggerAlert = "false";
        if (isHot && !localStorage.getItem('vhgp_hot_alert_sent')) {
            triggerAlert = "true";
            localStorage.setItem('vhgp_hot_alert_sent', 'true');
        }

        // Tạo form ẩn, target vào iframe ẩn, submit POST
        var form = document.createElement('form');
        form.method = 'POST';
        form.action = WEBHOOK_URL;
        form.target = 'webhookFrame';
        form.style.display = 'none';

        var fields = {
            timestamp: new Date().toLocaleString("vi-VN"),
            name: "Ẩn danh (Chatbot)",
            phone: "",
            email: "",
            source: window.location.href,
            sessionId: sessionId,
            chatHistory: JSON.stringify(chatHistory),
            interest: userInterest,
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
        
        // Xóa form sau khi submit
        setTimeout(function() {
            document.body.removeChild(form);
        }, 2000);
        
        console.log("Data sent to Google Sheets via form POST.");
    }
});
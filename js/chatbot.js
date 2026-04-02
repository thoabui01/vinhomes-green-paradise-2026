document.addEventListener('DOMContentLoaded', () => {
    const chatToggler = document.getElementById('chatToggler');
    const chatWindow = document.getElementById('chatWindow');
    const closeChat = document.getElementById('closeChat');
    const chatBody = document.getElementById('chatBody');
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    
    // Webhook URL (User should replace this with their Google Apps Script Webhook URL)
    const WEBHOOK_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEBHOOK_URL_HERE';
    
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
            
            // If interest gets 'hot', show lead modal to capture info
            if(currentLevel === 'hot' && !localStorage.getItem('vhgp_leadSent')) {
                setTimeout(() => {
                    document.getElementById('leadModal').classList.remove('d-none');
                }, 2000);
            }
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

    // Advanced but simulated keyword-based AI intent analysis
    function analyzeUserInput(msg) {
        let text = msg.toLowerCase();
        
        // Analyze Interest
        if(text.includes('biệt thự') || text.includes('villa')) userInterest = "Biệt thự";
        else if(text.includes('shophouse') || text.includes('kinh doanh')) userInterest = "Shophouse";
        else if(text.includes('căn hộ') || text.includes('chung cư')) userInterest = "Căn hộ";
        
        // Analyze Readiness (Cold -> Warm -> Hot)
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
            return "Hiện tại dự án Vinhomes Green Paradise Cần Giờ đang có chính sách giá rất ưu đãi cho đợt mở bán đầu tiên. Để nhận bảng giá chi tiết từng dòng diện tích, anh/chị có thể để lại số Zalo để em gửi ngay ạ.";
        }
        if(text.includes('vị trí') || text.includes('ở đâu')) {
            return "Dự án nằm tại vị trí kim cương huyện Cần Giờ, 1 mặt giáp rừng ngập mặn, 1 mặt giáp biển. Tương lai kết nối qua cầu Cần Giờ sẽ rất nhanh chóng. Anh/chị cần xem bản đồ chi tiết không?";
        }
        if(text.includes('shophouse')) {
            return "Shophouse tại đây có quy mô phục vụ lượng lớn khách du lịch, thiết kế mặt tiền rộng, rất phù hợp kinh doanh nhà hàng, cafe hoặc thời trang. Anh/chị đang muốn kinh doanh mảng nào ạ?";
        }
        if(text.includes('biệt thự')) {
            return "Dòng biệt thự biển là tinh hoa của dự án với thiết kế lấn biển độc bản và số lượng rất giới hạn. Anh/chị tìm biệt thự đơn lập hay song lập ạ?";
        }
        return "Dạ vâng, tiện ích của dự án vô cùng đa dạng với tổ hợp giải trí đêm, cụm hồ bơi vô cực, bến du thuyền... Anh/chị có muốn tham quan trực tiếp dự án để cảm nhận rõ hơn không?";
    }

    // Handle Lead Form
    const leadForm = document.getElementById('leadForm');
    const skipLead = document.getElementById('skipLead');
    const leadModal = document.getElementById('leadModal');

    skipLead.addEventListener('click', () => {
        leadModal.classList.add('d-none');
    });

    leadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('leadName').value;
        const phone = document.getElementById('leadPhone').value;
        const email = document.getElementById('leadEmail').value || "";
        const sessionId = document.getElementById('sessionId').value;
        
        const payload = {
            timestamp: new Date().toLocaleString("vi-VN"),
            name: name,
            phone: phone,
            email: email,
            source: window.location.href,
            sessionId: sessionId,
            chatHistory: JSON.stringify(chatHistory),
            interest: userInterest,
            level: currentLevel
        };

        // Send to Google Sheets Webhook
        if(WEBHOOK_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_WEBHOOK_URL_HERE') {
            fetch(WEBHOOK_URL, {
                method: "POST",
                mode: "no-cors",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            }).then(() => {
                console.log("Data sent to Google Sheets");
            }).catch(err => console.error("Error sending data:", err));
        } else {
            console.warn("WEBHOOK_URL is not set. Data logged to console: ", payload);
        }

        localStorage.setItem('vhgp_leadSent', 'true');
        leadModal.classList.add('d-none');
        appendMessage("Cảm ơn anh/chị. Chuyên viên sẽ liên hệ lại ngay để hỗ trợ anh/chị tốt nhất!", "ai-message");
        
        // Prevent further prompts
        currentLevel = "done"; 
    });
});
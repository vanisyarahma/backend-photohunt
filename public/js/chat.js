  const conversations = [
            {
                id: "chat_01",
                name: "Selfie Time, Cikarang",
                avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100",
                status: "Active 20m ago",
                preview: "Dengan senang hati kak, kami tung...",
                dateLabel: "Oct 13, 2025, 9:41 AM",
                messages: [
                    { sender: 'user', text: "Halo Admin, saya ingin reservasi" },
                    { sender: 'user', text: "Apakah tanggal 18 Oktober kosong?" },
                    { sender: 'vendor', text: "Halo kak!" },
                    { sender: 'vendor', text: "Selamat Pagi" },
                    { sender: 'vendor', text: "Untuk tanggal 18 kosong ya kak :)" },
                    { sender: 'user', text: "Okay admin, kosong di jam berapa ya?" },
                    { sender: 'vendor', text: "Untuk tanggal 18 di jam 11.00 - 15.00 kosong kak" },
                    { sender: 'vendor', text: "Apakah ada pertanyaan lagi kak?" },
                    { sender: 'user', text: "Okay admin" },
                    { sender: 'user', text: "Sudah cukup, terima kasih min!" },
                    { sender: 'vendor', text: "Dengan senang hati kak, kami tunggu ya! ^^" }
                ]
            },
        ];

        let currentChatId = "chat_01";

        const chatListContainer = document.getElementById('ph-chat-list-container');
        const messagesContainer = document.getElementById('ph-messages-container');
        const headerName = document.getElementById('ph-header-name');
        const headerStatus = document.getElementById('ph-header-status');
        const headerAvatar = document.getElementById('ph-header-avatar');
        const chatDate = document.getElementById('ph-chat-date');
        const messageInput = document.getElementById('ph-message-input');
        
        const profileName = document.getElementById('ph-profile-name');
        const profileStatus = document.getElementById('ph-profile-status');
        const profileAvatar = document.getElementById('ph-profile-avatar');
        
        const backButton = document.getElementById('ph-chat-back-button');

        backButton.addEventListener('click', function() {
           window.history.back(); 
            console.log("Back button clicked");
        });

        function init() {
            renderChatList();
            loadChat(currentChatId);

            messageInput.addEventListener('keypress', (e) => {
                if(e.key === 'Enter') sendMessage();
            });
        }

        function renderChatList() {
            chatListContainer.innerHTML = '';
            conversations.forEach(chat => {
                const item = document.createElement('div');
                const isActive = chat.id === currentChatId ? 'active' : '';
                item.className = `ph-chat-list-item ${isActive}`;
                item.onclick = () => switchChat(chat.id);

                item.innerHTML = `
                    <div class="ph-chat-avatar-md">
                        <img src="${chat.avatar}" alt="${chat.name}">
                    </div>
                    <div class="ph-chat-item-info">
                        <div class="ph-chat-item-name">${chat.name}</div>
                        <div class="ph-chat-item-preview">${chat.preview}</div>
                    </div>
                `;
                chatListContainer.appendChild(item);
            });
        }

        function switchChat(id) {
            currentChatId = id;
            renderChatList();
            loadChat(id);
        }

        function loadChat(id) {
            const data = conversations.find(c => c.id === id);
            if(!data) return;

            headerName.textContent = data.name;
            headerStatus.textContent = data.status;
            headerAvatar.src = data.avatar;
            chatDate.textContent = data.dateLabel;

            profileName.textContent = "Selfie Time";
            profileStatus.textContent = data.status;
            profileAvatar.src = data.avatar;

            messagesContainer.querySelectorAll('.ph-chat-msg-row').forEach(el => el.remove());
            
            data.messages.forEach(msg => {
                const row = document.createElement('div');
                const type = msg.sender === 'user' ? 'sent' : 'received';
                row.className = `ph-chat-msg-row ${type}`;
                
                row.innerHTML = `
                    <div class="ph-chat-bubble ${type}">
                        ${msg.text}
                    </div>
                `;
                messagesContainer.appendChild(row);
            });

            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function sendMessage() {
            const text = messageInput.value.trim();
            if(!text) return;

            const chatIndex = conversations.findIndex(c => c.id === currentChatId);
            if(chatIndex !== -1) {
                conversations[chatIndex].messages.push({
                    sender: 'user',
                    text: text
                });
                
                conversations[chatIndex].preview = text;

                messageInput.value = '';
                loadChat(currentChatId);
                renderChatList();
            }
        }

        init();

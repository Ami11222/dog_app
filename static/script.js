document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const screens = document.querySelectorAll('.screen');
    const petInfoForm = document.getElementById('petInfoForm');
    const chatInput = document.getElementById('chatInput');
    const sendMessageButton = document.getElementById('sendMessageButton');
    const chatMessages = document.getElementById('chatMessages');
    const profileImageInput = document.getElementById('profile-image-input'); // 追加
    const profileImagePreview = document.getElementById('profile-image-preview'); // 追加
    const userChatIcon = document.getElementById('userChatIcon'); // 追加
    const loadingSpinner = document.getElementById('loading-spinner'); // 追加

    // --- 画面切り替えロジック ---
    function showScreen(screenId) {
        screens.forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.screen === screenId) {
                item.classList.add('active');
            }
        });
        
        // Chat画面に切り替わったときに最新のMyPET情報をチャットに表示
        if (screenId === 'chatScreen') {
            displayInitialChatGreeting();
            // Chat画面のスクロールを一番下にする
            chatMessages.scrollTop = chatMessages.scrollHeight;
            // Chat画面でユーザーアイコンを更新
            updateUserChatIcon();
        }
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            showScreen(item.dataset.screen);
        });
    });

    // 初期表示はMyPET画面
    showScreen('myPetScreen');

    // --- MyPET情報保存・読み込みロジック ---
    const PET_INFO_KEY = 'myPetInfo';
    const PROFILE_IMAGE_KEY = 'profileImage'; // プロフィール画像用のキーを追加

    function savePetInfo() {
        const formData = new FormData(petInfoForm);
        const petInfo = {};
        for (const [key, value] of formData.entries()) {
            // ラジオボタンの値を正しく取得するために、name属性でループ
            if (['dog_interaction', 'human_interaction'].includes(key)) {
                const checkedRadio = document.querySelector(`input[name="${key}"]:checked`);
                if (checkedRadio) {
                    petInfo[key] = checkedRadio.value;
                }
            } else {
                petInfo[key] = value;
            }
        }
        localStorage.setItem(PET_INFO_KEY, JSON.stringify(petInfo));
        alert('わんちゃんの情報を保存しました！');
    }

    function loadPetInfo() {
        const savedInfo = localStorage.getItem(PET_INFO_KEY);
        if (savedInfo) {
            const petInfo = JSON.parse(savedInfo);
            for (const key in petInfo) {
                const element = document.getElementById(key);
                if (element) {
                    if (element.type === 'radio') {
                        // ラジオボタンの処理
                        const radioButtons = document.querySelectorAll(`input[name="${key}"]`);
                        radioButtons.forEach(radio => {
                            if (radio.value === petInfo[key]) {
                                radio.checked = true;
                            }
                        });
                    } else if (element.tagName === 'SELECT') {
                        element.value = petInfo[key];
                    } else {
                        element.value = petInfo[key];
                    }
                }
            }
        }
    }

    // プロフィール画像の読み込みと表示
    function loadProfileImage() {
        const savedImage = localStorage.getItem(PROFILE_IMAGE_KEY);
        if (savedImage) {
            profileImagePreview.src = savedImage;
        } else {
            profileImagePreview.src = '/static/default-user.png'; // デフォルト画像
        }
    }

    // プロフィール画像の更新と保存
    profileImageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                profileImagePreview.src = e.target.result;
                localStorage.setItem(PROFILE_IMAGE_KEY, e.target.result); // Base64として保存
                updateUserChatIcon(); // チャットアイコンも更新
            };
            reader.readAsDataURL(file);
        }
    });

    petInfoForm.addEventListener('submit', (event) => {
        event.preventDefault(); // フォームのデフォルト送信を防ぐ
        savePetInfo();
    });

    // ページ読み込み時に保存された情報をフォームに反映
    loadPetInfo();
    loadProfileImage(); // プロフィール画像も読み込む

    // --- チャットロジック ---

    // ユーザーアイコンをチャット入力欄の横に表示
    function updateUserChatIcon() {
        const savedImage = localStorage.getItem(PROFILE_IMAGE_KEY);
        if (savedImage) {
            userChatIcon.src = savedImage;
        } else {
            userChatIcon.src = '/static/default-user.png'; // デフォルト画像
        }
    }

    function addMessage(text, sender, imageUrl = null) { // imageUrl引数を追加
        const messageWrapper = document.createElement('div'); // アイコンとメッセージをラップする要素
        messageWrapper.classList.add('chat-message-wrapper', sender);

        if (sender === 'user') {
            const userIcon = document.createElement('img');
            userIcon.classList.add('chat-message-icon', 'user');
            userIcon.src = imageUrl || '/static/default-user.png'; // ユーザーアイコン
            userIcon.alt = 'ユーザーアイコン';
            messageWrapper.appendChild(userIcon);
        } else { // AIの場合
            const aiIcon = document.createElement('img');
            aiIcon.classList.add('chat-message-icon', 'ai');
            aiIcon.src = '/static/ai-icon.png'; // AIのアイコン (別途用意)
            aiIcon.alt = 'AIアイコン';
            messageWrapper.appendChild(aiIcon);
        }

        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', sender);
        // 改行を<br>タグに変換して表示
        messageElement.innerHTML = text.replace(/\n/g, '<br>');
        messageWrapper.appendChild(messageElement);

        chatMessages.appendChild(messageWrapper);

        // 最新メッセージが見えるようにスクロール
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function getPetSummaryForGreeting() {
        const petInfo = JSON.parse(localStorage.getItem(PET_INFO_KEY)) || {};
        const name = petInfo.dog_name || 'あなたの愛犬';
        const breed = petInfo.breed ? `(${petInfo.breed})` : '';
        const age = petInfo.age ? `, ${petInfo.age}歳` : '';
        const personality = petInfo.personality ? `性格は「${petInfo.personality}」` : '特に指定なし';
        const ownerResidence = petInfo.owner_residence || '不明な場所';

        return `${name}${breed}${age}、${personality}。\n飼い主さんは${ownerResidence}にお住まいですね。`;
    }

    function displayInitialChatGreeting() {
        // Chat画面がアクティブになったときに一度だけ挨拶を表示
        if (!chatMessages.dataset.greeted) {
            const petSummary = getPetSummaryForGreeting();
            addMessage(`こんにちは！${petSummary}\nどんなお出かけプランをお探しですか？`, 'ai', '/static/ai-icon.png'); // AIアイコンを指定
            chatMessages.dataset.greeted = 'true'; // 挨拶済みフラグ
        }
    }

    async function sendChatMessage() {
        const userMessage = chatInput.value.trim();
        if (!userMessage) return;

        const userIconUrl = localStorage.getItem(PROFILE_IMAGE_KEY) || '/static/default-user.png';
        addMessage(userMessage, 'user', userIconUrl); // ユーザーアイコンを渡す
        chatInput.value = '';

        // APIリクエスト中は送信ボタンを無効化し、UIを更新
        sendMessageButton.disabled = true;
        chatInput.disabled = true;
        
        // ローディングスピナーを表示
        loadingSpinner.style.display = 'flex';
        chatMessages.scrollTop = chatMessages.scrollHeight; // スピナーが見えるようにスクロール

        const petInfo = JSON.parse(localStorage.getItem(PET_INFO_KEY)) || {};

        try {
            const response = await fetch('/chat', { // Flaskの /chat エンドポイントを呼び出す
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    petInfo: petInfo,
                    message: userMessage
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            addMessage(data.response, 'ai', '/static/ai-icon.png'); // AIアイコンを指定

        } catch (error) {
            console.error('チャットメッセージ送信エラー:', error);
            addMessage('AIとの通信中にエラーが発生しました。時間を置いて再度お試しください。', 'ai', '/static/ai-icon.png');
        } finally {
            // APIリクエスト完了後、ボタンと入力欄を有効化
            sendMessageButton.disabled = false;
            chatInput.disabled = false;
            chatInput.focus(); // 入力欄にフォーカスを戻す
            // ローディングスピナーを非表示
            loadingSpinner.style.display = 'none';
        }
    }

    sendMessageButton.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendChatMessage();
        }
    });

    // 初期化時にAIアイコンのパスをセットする (もしAIアイコンも動的に変更するなら)
    // 例えば、AIアイコンが静的な画像なら、addMessageで直接指定でOK
});
document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const screens = document.querySelectorAll('.screen');
    const petInfoForm = document.getElementById('petInfoForm');
    const chatInput = document.getElementById('chatInput');
    const sendMessageButton = document.getElementById('sendMessageButton');
    const chatMessages = document.getElementById('chatMessages');

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

    petInfoForm.addEventListener('submit', (event) => {
        event.preventDefault(); // フォームのデフォルト送信を防ぐ
        savePetInfo();
    });

    // ページ読み込み時に保存された情報をフォームに反映
    loadPetInfo();

    // --- チャットロジック ---

    function addMessage(text, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', sender);
        // 改行を<br>タグに変換して表示
        messageElement.innerHTML = text.replace(/\n/g, '<br>');
        chatMessages.appendChild(messageElement);
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
            addMessage(`こんにちは！${petSummary}\nどんなお出かけプランをお探しですか？`, 'ai');
            chatMessages.dataset.greeted = 'true'; // 挨拶済みフラグ
        }
    }

    async function sendChatMessage() {
        const userMessage = chatInput.value.trim();
        if (!userMessage) return;

        addMessage(userMessage, 'user');
        chatInput.value = '';

        // APIリクエスト中は送信ボタンを無効化し、UIを更新
        sendMessageButton.disabled = true;
        chatInput.disabled = true;
        // 例: ローディング表示
        // addMessage('AIが考え中...', 'ai temporary-loading'); 

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
            // 一時的なローディングメッセージがあれば削除
            // const loadingMessage = document.querySelector('.temporary-loading');
            // if (loadingMessage) loadingMessage.remove();
            
            addMessage(data.response, 'ai');

        } catch (error) {
            console.error('チャットメッセージ送信エラー:', error);
            addMessage('AIとの通信中にエラーが発生しました。時間を置いて再度お試しください。', 'ai');
        } finally {
            // APIリクエスト完了後、ボタンと入力欄を有効化
            sendMessageButton.disabled = false;
            chatInput.disabled = false;
            chatInput.focus(); // 入力欄にフォーカスを戻す
        }
    }

    sendMessageButton.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendChatMessage();
        }
    });
});
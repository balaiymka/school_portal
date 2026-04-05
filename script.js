// 1. Деректер мен айнымалылар
let newsData = null; // loaded from API

let isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
// Use relative API paths so the server can serve frontend and API from same origin
const API_BASE = '';

// 2. Бет жүктелгенде орындалатын негізгі функция
document.addEventListener("DOMContentLoaded", () => {
    renderNews();
    updateLoginUI();
    setupLoginForm();
    renderTeachers(); // Төмендегі функцияны шақыру

    // --- Кесте тексерісі (DOM дайын болғаннан кейін) ---
    const isLoggedInStatus = localStorage.getItem('isLoggedIn') === 'true';
    const lockScreenElement = document.getElementById('lock-screen');

    if (window.location.pathname.includes('schedule.html')) {
        if (!isLoggedInStatus) {
            if (lockScreenElement) {
                lockScreenElement.style.display = 'flex';
            } else {
                alert("Рұқсат жоқ! Басты бетке қайтарыласыз.");
                window.location.href = 'index.html';
            }
        }
    }

    if (lockScreenElement && !isLoggedInStatus) {
        lockScreenElement.style.display = 'flex';
    }
});

// 3. Жаңалықтарды шығару
async function renderNews() {
    const container = document.getElementById('news-container');
    if (!container) return;
    container.innerHTML = '';
    try {
        const res = await fetch(`${API_BASE}/api/news`);
        if (res.ok) {
            const data = await res.json();
            newsData = data;
        } else {
            newsData = [
                { title: 'Спорттық жарыс', date: '20 сәуір 2025', image: 'photo/news.jpg' },
                { title: 'Ғылыми апталық', date: '18 ақпан 2026', image: 'photo/gylym.png' },
                { title: 'Мектеп концерті', date: '5 наурыз 2026', image: 'photo/consert.png' }
            ];
        }
    } catch (e) {
        console.warn('Failed to load news from API, falling back to local', e);
        newsData = [
            { title: 'Спорттық жарыс', date: '20 сәуір 2025', image: 'photo/news.jpg' },
            { title: 'Ғылыми апталық', date: '18 ақпан 2026', image: 'photo/gylym.png' },
            { title: 'Мектеп концерті', date: '5 наурыз 2026', image: 'photo/consert.png' }
        ];
    }

    newsData.forEach(item => {
        const card = document.createElement('div');
        card.className = 'news-card';
        card.innerHTML = `
            <img src="${item.image}" alt="${item.title}" style="width:100%; height:150px; object-fit:cover; border-radius:10px;">
            <div style="padding: 10px;">
                <h3>${item.title}</h3>
                <p style="color: gray; font-size: 14px;">${item.date}</p>
            </div>
        `;
        container.appendChild(card);
    });
}

// 4. Логин интерфейсін жаңарту
function updateLoginUI() {
    // read latest login status from storage (page may have changed it)
    isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const navBtn = document.querySelector(".btn-login-nav");
    if (navBtn) {
        if (isLoggedIn) {
            navBtn.innerText = "Шығу";
            navBtn.onclick = logout;
        } else {
            navBtn.innerText = "Кіру";
            navBtn.onclick = openLogin;
        }
    }
}

// --- ЖАҢАРТЫЛҒАН ПАЙДАЛАНУШЫЛАР БАЗАСЫ ---
const users = [
    { email: "admin@test.com", password: "123", name: "Жүйе әкімшісі", role: "admin" },
    { email: "balaiym@test.com", password: "123", name: "Жамауқұл Балайым", role: "student", class: "11 А" },
    { email: "aigul@test.com", password: "777", name: "Айгүл Төлеубекова", role: "teacher", subject: "Қазақ тілі" }
];

// 5. Сервер арқылы логин тексеру
function setupLoginForm() {
    const loginForm = document.getElementById("loginForm");
    const errorMsg = document.getElementById("errorMessage");

    if (loginForm) {
        // Ескі event listener-лерді болдырмау үшін:
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            
            const email = document.getElementById("loginEmail").value.trim();
            const password = document.getElementById("loginPassword").value.trim();
            const btn = loginForm.querySelector('button');

            try {
                const response = await fetch(`${API_BASE}/api/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    isLoggedIn = true;
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('currentUser', JSON.stringify(data.user));
                    if (data.token) localStorage.setItem('authToken', data.token);
                    
                    btn.style.background = '#27ae60';
                    btn.innerText = 'Кіруде...';

                    setTimeout(() => {
                        if (data.user.role === 'teacher') window.location.href = "mugalim.html";
                        else if (data.user.role === 'admin') window.location.href = "admin.html";
                        else window.location.href = "profile.html"; 
                    }, 1000);
                } else {
                    if (errorMsg) {
                        errorMsg.style.display = "flex";
                        errorMsg.querySelector('span').innerText = data.error || 'Кіру қатесі';
                    }
                }
            } catch (error) {
                console.error("Сервер қатесі:", error);
                if (errorMsg) {
                    errorMsg.style.display = "flex";
                    errorMsg.querySelector('span').innerText = "Сервермен байланыс жоқ!";
                }
            }
        };
    }
}

function getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return token ? { 'Authorization': 'Bearer ' + token } : {};
}

// 6. Модальді терезе функциялары
function openLogin() {
    const modal = document.getElementById("loginModal");
    if (modal) modal.style.display = "block";
}

function closeLogin() {
    const modal = document.getElementById("loginModal");
    if (modal) modal.style.display = "none";
    const err = document.getElementById('errorMessage');
    if (err) err.style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById("loginModal");
    if (event.target == modal) {
        closeLogin();
    }
};

// 7. Навигация және Шығу
function logout() {
    isLoggedIn = false;
    // Remove only our app keys to avoid clearing unrelated data
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    alert("Жүйеден шықтыңыз.");
    window.location.href = "index.html";
}

function goToPage(url) {
    if (url === 'news.html') {
        window.location.href = url;
    } else {
        checkAuthAndGo(url);
    }
}

function checkAuthAndGo(targetPage) {
    if (isLoggedIn) {
        window.location.href = targetPage;
    } else {
        alert("Бұл бөлімді көру үшін алдымен жүйеге кіріңіз!");
        openLogin();
    }
}


function sendMessage() {
    const input = document.getElementById('messageInput');
    const container = document.getElementById('chatMessages');
    
    if (input.value.trim() !== "") {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message outgoing';
        msgDiv.innerHTML = `
            <div class="message-bubble">
                ${input.value}
                <span class="time">қазір</span>
            </div>
        `;
        container.appendChild(msgDiv);
        input.value = "";
        container.scrollTop = container.scrollHeight; 
    }
}


function showDay(dayId) {
    const contents = document.querySelectorAll('.day-content');
    contents.forEach(content => content.classList.remove('active'));

    const buttons = document.querySelectorAll('.day-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    document.getElementById(dayId).classList.add('active');
    // If caller passed an event, add active class to its currentTarget. Otherwise, try to find a matching button.
    try {
        const ev = arguments[1];
        if (ev && ev.currentTarget) ev.currentTarget.classList.add('active');
        else {
            const maybeBtn = document.querySelector(`.day-btn[data-day="${dayId}"]`);
            if (maybeBtn) maybeBtn.classList.add('active');
        }
    } catch (e) {
        // ignore any errors here
    }
}

// МҰҒАЛІМДЕР ДЕРЕКТЕРІ
const teachersData = [
    { name: "Айгүл Төлеубекова", pos: "Директордың оқу ісі жөніндегі орынбасары", sub: "Қазақ тілі мен әдебиеті", img: "photo/apai1.png" },
    { name: "Ержан Бекжанов", pos: "Жоғары санатты мұғалім", sub: "Физика", img: "photo/apai2.png" },
    { name: "Алма Смаилова", pos: "Педагог-зерттеуші", sub: "Математика", img: "photo/1.jpeg" },
    { name: "Жанна Омарова", pos: "Педагог-сарапшы", sub: "Химия", img: "photo/3.jpeg" },
    { name: "Қайрат Болатов", pos: "Бірінші санатты ұстаз", sub: "Тарих", img: "photo/2.jpeg" },
    { name: "Меруерт Грей", pos: "Халықаралық маман", sub: "Ағылшын тілі", img: "photo/4.jpeg" },
    { name: "Дәурен Оспанов", pos: "IT-маман", sub: "Информатика", img: "photo/5.jpeg" },
    { name: "Серік Қанат", pos: "Спорт шебері", sub: "Дене шынықтыру", img: "photo/6.jpeg" },
    { name: "Ләззат Нұртас", pos: "Педагог-ұйымдастырушы", sub: "Өзін-өзі тану", img: "photo/7.jpeg" },
    { name: "Бақыт Искаков", pos: "Жоғары санат", sub: "География", img: "photo/8.jpeg" },
    { name: "Гүлнар Сапарова", pos: "Екінші санат", sub: "Биология", img: "photo/9.jpeg" },
    { name: "Арман Төлеуов", pos: "Педагог", sub: "Алғашқы әскери дайындық", img: "photo/10.jpeg" },
    { name: "Динара Әлиева", pos: "Магистр", sub: "Орыс тілі", img: "photo/11.jpeg" },
    { name: "Бауыржан Мұрат", pos: "Педагог-модератор", sub: "Көркем еңбек", img: "photo/12.jpeg" },
    { name: "Әлия Сұлтанова", pos: "Бірінші санат", sub: "Бастауыш сынып", img: "photo/13.jpeg" },
    { name: "Марат Әбенов", pos: "Педагог", sub: "Музыка", img: "photo/14.jpeg" },
    { name: "Сәуле Ибраева", pos: "Жоғары санат", sub: "Математика", img: "photo/15.jpeg" },
    { name: "Тимур Кәрімов", pos: "Педагог-зерттеуші", sub: "Геометрия", img: "photo/16.jpeg" },
    { name: "Жанар Исаева", pos: "Бірінші санат", sub: "Қазақ тілі", img: "photo/17.jpeg" },
    { name: "Нұрлан Сәдуақас", pos: "Мастер", sub: "Дене шынықтыру", img: "photo/18.jpeg" },
    { name: "Анар Бақытова", pos: "Екінші санат", sub: "Ағылшын тілі", img: "photo/19.jpeg" },
    { name: "Берік Жүнісов", pos: "Педагог", sub: "Физика", img: "photo/20.jpeg" },
    { name: "Айжан Қасымова", pos: "Магистр", sub: "Химия", img: "photo/21.jpeg" },
    { name: "Қанат Серіков", pos: "Педагог-модератор", sub: "Тарих", img: "photo/22.jpeg" },
    { name: "Меруерт Асанова", pos: "Жоғары санат", sub: "Биология", img: "photo/23.jpeg" },
    { name: "Асхат Омаров", pos: "Педагог", sub: "Информатика", img: "photo/24.jpeg" },
    { name: "Зарина Ахметова", pos: "Екінші санат", sub: "Орыс тілі", img: "photo/25.jpeg" },
    { name: "Руслан Бектеміров", pos: "Бірінші санат", sub: "География", img: "photo/26.jpeg" },
    { name: "Ботагөз Сатпаева", pos: "Педагог-зерттеуші", sub: "Қазақ әдебиеті", img: "photo/27.jpeg" },
    { name: "Елдос Смайылов", pos: "Магистр", sub: "Құқық негіздері", img: "photo/28.jpeg" }
];

// МҰҒАЛІМДЕРДІ АРНАЛАЙТУ ФУНКЦИЯСЫ
function renderTeachers() {
    const container = document.getElementById('teachers-grid');
    if (!container) return;

    console.log('🏫 Мұғалімдерді арналайтуда...', teachersData.length, 'мұғалім');

    container.innerHTML = '';

    teachersData.forEach(teacher => {
        const card = document.createElement('div');
        card.className = 'teacher-card-full';
        
        card.innerHTML = `
            <div style="flex: 1;">
                <img src="${teacher.img}" alt="${teacher.name}" 
                     onerror="this.src='https://via.placeholder.com/120?text=${teacher.name.charAt(0)}'"
                     style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 3px solid #f0f7ff; margin-bottom: 15px;">
                
                <h3 style="color: #001f3f; font-weight: 700; margin: 10px 0; font-size: 16px;">${teacher.name}</h3>
                
                <p style="color: #3498db; font-size: 12px; font-weight: 600; margin: 5px 0; text-transform: uppercase;">${teacher.pos}</p>
                
                <span class="teacher-subject" style="background: #eef5ff; color: #3498db; padding: 8px 12px; border-radius: 15px; font-size: 13px; font-weight: 600; display: inline-block; margin: 10px 0;">
                    ${teacher.sub}
                </span>
            </div>
            
            <div class="teacher-contact" style="display: flex; gap: 10px; justify-content: center; margin-top: 15px;">
                <a href="mailto:${teacher.name.toLowerCase().replace(/ /g, '')}@school.kz" 
                   style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: #f0f3f6; color: #3498db; text-decoration: none; transition: 0.3s; font-size: 18px;"
                   onmouseover="this.style.background='#3498db'; this.style.color='white';"
                   onmouseout="this.style.background='#f0f3f6'; this.style.color='#3498db';">
                    <i class="fas fa-envelope"></i>
                </a>
                
                <a href="https://wa.me/77715284665" target="_blank"
                   style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: #f0f3f6; color: #27ae60; text-decoration: none; transition: 0.3s; font-size: 18px;"
                   onmouseover="this.style.background='#27ae60'; this.style.color='white';"
                   onmouseout="this.style.background='#f0f3f6'; this.style.color='#27ae60';">
                    <i class="fas fa-whatsapp"></i>
                </a>
            </div>
        `;
        
        container.appendChild(card);
    });

    console.log('Мұғалімдер сәтті арналайтылды');
}

// DOMContentLoaded-де renderTeachers() шақыру
document.addEventListener("DOMContentLoaded", () => {
    renderNews();
    updateLoginUI();
    setupLoginForm();
    renderTeachers();  // ← МҰҒАЛІМДЕРДІ ЖҮКТЕУ
});

function exportGradeToExcel() {
    try {
        if (typeof XLSX === 'undefined') {
            alert('XLSX кітапханасы табылмады. Excel экспортын қолдану үшін SheetJS (XLSX) кітапханасын қосыңыз.');
            return;
        }
        const studentName = "Балайым Жамауқұл";
        const studentClass = '11 "А"';

        const excelData = [
            ["САРЫШАҒАН ЖАЛПЫ ОРТА БІЛІМ БЕРЕТІН МЕКТЕБІ"],
            ["ОҚУШЫНЫҢ ЖЫЛДЫҚ ҮЛГЕРІМ ЕСЕБІ"],
            [],
            ["Аты-жөні:", studentName],
            ["Сыныбы:", studentClass],
            ["Оқу жылы:", "2025-2026"],
            [],
            ["Пән атауы", "1-тоқсан", "2-тоқсан", "3-тоқсан", "4-тоқсан", "Жылдық баға"],
            ["Алгебра", 5, 4, 5, 5, 5],
            ["Геометрия", 4, 4, 4, 5, 4],
            ["Физика", 5, 5, 5, 5, 5],
            ["Қазақ тілі", 5, 5, 5, 5, 5],
            ["Орыс тілі", 4, 4, 5, 4, 4],
            ["Ағылшын тілі", 5, 5, 4, 5, 5],
            ["Тарих", 4, 4, 4, 4, 4],
            ["Биология", 5, 5, 5, 4, 5],
            ["География", 4, 5, 4, 5, 5],
            ["Информатика", 5, 5, 5, 5, 5]
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(excelData);

        ws['!cols'] = [
            { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }
        ];

        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, 
            { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } } 
        ];

        XLSX.utils.book_append_sheet(wb, ws, "Жылдық бағалар");
        XLSX.writeFile(wb, `Jyldyq_Esep_${studentName.replace(' ', '_')}.xlsx`);

        alert("4 тоқсандық Excel есебі жүктелді!");
    } catch (error) {
        console.error(error);
        alert("Қате: Excel файлын жасау мүмкін болмады.");
    }
}

function restrictedAccess(event, targetPage) {
    event.preventDefault();
    const isLoggedInLocal = localStorage.getItem('isLoggedIn') === 'true';

    if (isLoggedInLocal) {
        window.location.href = targetPage;
    } else {
        alert("Бұл бөлімді көру үшін алдымен жүйеге кіріңіз!");
        if (typeof openLogin === "function") {
            openLogin();
        }
    }
}

// Кесте тексерісі
const isLoggedInStatus = localStorage.getItem('isLoggedIn') === 'true';
const lockScreenElement = document.getElementById('lock-screen');

if (window.location.pathname.includes('schedule.html')) {
    if (!isLoggedInStatus) {
        if (lockScreenElement) {
            lockScreenElement.style.display = 'flex';
        } else {
            alert("Рұқсат жоқ! Басты бетке қайтарыласыз.");
            window.location.href = 'index.html';
        }
    }
}

if (lockScreenElement && !isLoggedInStatus) {
    lockScreenElement.style.display = 'flex';
}

function toggleAIChat() {
    const chatContainer = document.getElementById('ai-chat-container');
    if (chatContainer) {
        chatContainer.classList.toggle('chat-hidden');
        const badge = document.querySelector('.notification-badge');
        if (badge) badge.style.display = 'none';
    }
}

function handleChatKey(e) {
    if (e.key === 'Enter') sendAiMessage();
}

async function sendAiMessage() {
    const input = document.getElementById('ai-chat-input');
    const body = document.getElementById('chat-body');
    if (!input || !body) return;

    const text = input.value.trim();
    if (!text) return;

    body.innerHTML += `<div class="message user-msg">${text}</div>`;
    input.value = '';
    body.scrollTop = body.scrollHeight;

    const typingId = 'typing-' + Date.now();
    body.innerHTML += `<div class="message bot-msg" id="${typingId}">Жауап дайындалуда...</div>`;
    body.scrollTop = body.scrollHeight;

    setTimeout(() => {
        const typingElem = document.getElementById(typingId);
        let response = "Кешіріңіз, мен бұл сұраққа әзірге жауап бере алмаймын. Бірақ оны әкімшілікке жеткізе аламын.";

        const lowText = text.toLowerCase();
        if (lowText.includes("сәлем") || lowText.includes("привет")) {
            response = "Сәлем! Қалың қалай? Саған қалай көмектесе аламын?";
        } else if (lowText.includes("кесте")) {
            response = "Сабақ кестесін сол жақ мәзірдегі 'Сабақ кестесі' бөлімінен көре аласыз. Ол күн сайын жаңартылып тұрады.";
        } else if (lowText.includes("экспорт") || lowText.includes("ексел")) {
            response = "Есепті жүктеу үшін сол жақ мәзірдегі 'Excel есеп' батырмасын басыңыз.";
        } else if (lowText.includes("баға")) {
            response = "Сіздің ағымдағы бағаларыңыз 'Бағалар' бөлімінде сақтаулы.";
        }

        if (typingElem) typingElem.innerText = response;
        body.scrollTop = body.scrollHeight;
    }, 1500);
}


// Тіркелу функциясының мысалы
async function registerUser(email, password) {
    try {
        const response = await fetch(`${API_BASE}/api/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const result = await response.json();
        if (response.ok) {
            alert("Дерекқорға сәтті сақталды!");
        } else {
            alert("Қате: " + result.error);
        }
    } catch (error) {
        console.error("Сервермен байланыс үзілді:", error);
    }
}

// Backwards-compatible alias used in some HTML (keeps old onclick names working)
function toggleChat() {
    if (typeof toggleAIChat === 'function') toggleAIChat();
}


// Админ панелінде жаңалық қосу функциясы
const adminNewsForm = document.getElementById('adminNewsForm');

if (adminNewsForm) {
    adminNewsForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Беттің қайта жүктелуін тоқтатамыз

        // Инпуттардан мәліметтерді аламыз
        const title = document.getElementById('newsTitle').value.trim();
        const date = document.getElementById('newsDate').value.trim();
        const image = document.getElementById('newsImage').value.trim();

        if (!title || !date) {
            alert("Тақырып пен күнді толтыру міндетті!");
            return;
        }

        const newNews = { title, date, image: image || 'photo/news.jpg' };

        try {
            // СЕРВЕРГЕ ЖІБЕРУ (API арқылы)
            const response = await fetch(`${API_BASE}/api/news`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newNews)
            });

            if (response.ok) {
                alert("Жаңалық сәтті қосылды!");
                adminNewsForm.reset(); // Форманы тазалау
                // Егер кестені бірден жаңартқыңыз келсе, осы жерде renderAdminNews() шақыруға болады
            } else {
                // Егер сервер қосулы болмаса, жай ғана кестеге қосып көрейік (Frontend тексеру)
                addToAdminTable(newNews);
            }
        } catch (error) {
            console.warn("Сервермен байланыс жоқ, жаңалық тек уақытша қосылды.");
            addToAdminTable(newNews);
        }
    });
}

// Кестеге жаңа жол қосу (Көмекші функция)
function addToAdminTable(item) {
    const tbody = document.getElementById('admin-news-list');
    if (!tbody) return;

    const row = document.createElement('tr');
    row.innerHTML = `
        <td>#</td>
        <td>${item.title}</td>
        <td>${item.date}</td>
        <td><button class="action-btn" style="background:red" onclick="this.closest('tr').remove()">Өшіру</button></td>
    `;
    tbody.appendChild(row);
    adminNewsForm.reset();
}
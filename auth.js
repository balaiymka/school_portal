// ========== ЛОГИН ФУНКЦИОНАЛЫ ==========

const API_BASE = 'http://localhost:5001';

// Логин формасын орнату
function setupLoginForm() {
    const loginForm = document.getElementById("loginForm");
    const errorMsg = document.getElementById("errorMessage");

    if (!loginForm) return;

    loginForm.onsubmit = async (e) => {
        e.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value.trim();
        const btn = loginForm.querySelector('button');

        // Client-side уәлеулік
        if (!email || !password) {
            showLoginError(errorMsg, 'Email және пароль қажет');
            return;
        }

        if (email.length < 5 || !email.includes('@')) {
            showLoginError(errorMsg, 'Email формасы дұрыс емес');
            return;
        }

        if (password.length < 3) {
            showLoginError(errorMsg, 'Пароль кемінде 3 символ болуы тиіс');
            return;
        }

        // Сервер API-ге сұрау
        try {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Жүктелуде...';

            const response = await fetch(`${API_BASE}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                showLoginError(errorMsg, data.error || 'Логин сәтсіз');
                btn.disabled = false;
                btn.innerHTML = 'Кіру';
                return;
            }

            // Тіркелгі дәлелі сохраняется
            isLoggedIn = true;
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            localStorage.setItem('authToken', data.token);

            btn.style.background = '#27ae60';
            btn.innerHTML = '<i class="fas fa-check"></i> Кіруде...';

            // Рөлге қарай бетке итеру
            setTimeout(() => {
                if (data.user.role === 'teacher') {
                    window.location.href = "mugalim.html";
                } else if (data.user.role === 'admin') {
                    window.location.href = "admin.html";
                } else {
                    window.location.href = "profile.html";
                }
            }, 1000);

        } catch (error) {
            console.error('Сервер қатес��:', error);
            showLoginError(errorMsg, 'Сервермен байланыс орнатылмады. Сервер іске қосылынды ба?');
            btn.disabled = false;
            btn.innerHTML = 'Кіру';
        }
    };
}

// Логин қатесін көрсету
function showLoginError(errorMsg, message) {
    if (!errorMsg) return;
    errorMsg.style.display = "flex";
    const errorText = errorMsg.querySelector('span');
    if (errorText) errorText.innerText = message;
}

// ========== ЛОГИН МОДАЛЫН АШУ/ЖАБУ ==========

function openLogin() {
    const modal = document.getElementById("loginModal");
    if (modal) {
        modal.style.display = "block";
        // Форманы тазалау
        const form = document.getElementById("loginForm");
        if (form) form.reset();
    }
}

function closeLogin() {
    const modal = document.getElementById("loginModal");
    if (modal) modal.style.display = "none";
    const err = document.getElementById('errorMessage');
    if (err) err.style.display = 'none';
}

// Модаль сыртында басса жабу
window.onclick = function (event) {
    const modal = document.getElementById("loginModal");
    if (event.target == modal) {
        closeLogin();
    }
};

// Бетті жүктегенде форманы орнату
document.addEventListener("DOMContentLoaded", () => {
    setupLoginForm();
    updateLoginUI();
});

// Логин интерфейсін жаңарту
function updateLoginUI() {
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

// Шығу
function logout() {
    if (!confirm('Жүйеден шықтыңыз ба?')) return;
    
    isLoggedIn = false;
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    alert('Жүйеден шықтыңыз');
    updateLoginUI();
    window.location.href = 'index.html';
}

// Авторизацияны тексеру
function checkAuthAndGo(targetPage) {
    if (localStorage.getItem('isLoggedIn') === 'true') {
        window.location.href = targetPage;
    } else {
        alert("Бұл бөлімді көру үшін алдымен жүйеге кіріңіз!");
        openLogin();
    }
}

function getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return token ? { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}


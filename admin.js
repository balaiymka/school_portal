document.addEventListener("DOMContentLoaded", () => {
    // 1. КІРУ РҰҚСАТЫН ТЕКСЕРУ
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // Тексеруді сәл жұмсарттық (role кіші әріппен немесе бас әріппен келуі мүмкін)
    if (!currentUser || currentUser.role.toLowerCase() !== 'admin') {
        alert("Бұл бетке тек админ кіре алады!");
        window.location.href = "index.html";
        return;
    }

    // 2. ЭКРАНҒА ДЕРЕКТЕРДІ ШЫҒАРУ
    const displayNameElem = document.getElementById('admin-display-name');
    const welcomeElem = document.getElementById('admin-welcome');
    
    if (displayNameElem) displayNameElem.innerText = currentUser.name;
    if (welcomeElem) welcomeElem.innerText = `Қайырлы күн, ${currentUser.name}!`;

    // 3. БАСТАПҚЫ ФУНКЦИЯЛАРДЫ ІСКЕ ҚОСУ
    refreshAdminPage();
});

// ПАЙДАЛАНУШЫЛАРДЫ LOCALSTORAGE-ДАН АЛУ (Егер бос болса, бастапқы тізімді жасау)
function getUsersFromStorage() {
    let storedUsers = JSON.parse(localStorage.getItem('allUsers'));
    if (!storedUsers) {
        // Бастапқы деректер (скриншоттағыдай)
        storedUsers = [
            { name: "Болат Ибрагим", username: "bolat", role: "Student", status: "Активті" },
            { name: "Айгүл Төлеубекова", username: "aigul", role: "Teacher", status: "Активті" },
            { name: "Жүйе әкімшісі", username: "admin", role: "Admin", status: "Активті" }
        ];
        localStorage.setItem('allUsers', JSON.stringify(storedUsers));
    }
    return storedUsers;
}

// БЕТТІ ТОЛЫҚ ЖАҢАРТУ (Кесте + Статистика)
function refreshAdminPage() {
    const users = getUsersFromStorage();
    renderAdminUsers(users);
    updateStats(users);
}

// 4. КЕСТЕНІ СЫЗУ
function renderAdminUsers(users) {
    const userListContainer = document.getElementById('admin-user-list');
    if (!userListContainer) return;

    userListContainer.innerHTML = users.map((u, index) => `
        <tr>
            <td>${u.name}</td>
            <td>${u.username}</td>
            <td><span class="role-badge ${u.role.toLowerCase()}">${u.role}</span></td>
            <td><span class="status-active">Активті</span></td>
            <td>
                <div class="action-btns">
                    <button class="action-btn edit" onclick="editUser(${index})"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete" onclick="deleteUser(${index})"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

// 5. СТАТИСТИКАНЫ ЖАҢАРТУ (150, 30, 24 сандары)
function updateStats(users) {
    const studentCount = users.filter(u => u.role.toLowerCase() === 'student').length;
    const teacherCount = users.filter(u => u.role.toLowerCase() === 'teacher').length;

    // Скриншоттағы сандарды негізге ала отырып (динамикалық қосу)
    if (document.getElementById('count-students')) {
        document.getElementById('count-students').innerText = 147 + studentCount;
    }
    if (document.getElementById('count-teachers')) {
        document.getElementById('count-teachers').innerText = 28 + teacherCount;
    }
}

// 6. ЖАҢА ҚОЛДАНУШЫ ҚОСУ (Prompt арқылы тез жасау нұсқасы)
function openAddUser() {
    // 1. Пайдаланушыдан мәліметтерді сұрау
    const name = prompt("Аты-жөнін енгізіңіз:");
    const username = prompt("Логин енгізіңіз:");
    const password = prompt("Құпия сөз ойлап табыңыз:", "123"); // Әдепкі бойынша 123
    const role = prompt("Рөлі (Student/Teacher/Admin):", "Student");

    // 2. Егер есім мен логин жазылса ғана жұмыс істейді
    if (name && username) {
        // Қазіргі бар пайдаланушыларды жадтан аламыз
        let allUsers = JSON.parse(localStorage.getItem('allUsers')) || [];
        
        // Жаңа объект жасау
        const newUser = {
            name: name,
            username: username,
            password: password,
            role: role,
            status: "Активті"
        };

        // Тізімге қосу
        allUsers.push(newUser);

        // Қайтадан жадқа (localStorage) сақтау
        localStorage.setItem('allUsers', JSON.stringify(allUsers));

        // Экрандағы кестені және статистиканы жаңарту
        if (typeof refreshAdminPage === "function") {
            refreshAdminPage();
        } else {
            // Егер refresh функциясы болмаса, бетті жай ғана қайта жүктеу
            location.reload();
        }

        alert("Пайдаланушы сәтті қосылды!");
    } else {
        alert("Толық толтырылмады!");
    }
}

// 7. ӨШІРУ ФУНКЦИЯСЫ
function deleteUser(index) {
    let users = getUsersFromStorage();
    if (confirm(`${users[index].name} пайдаланушысын өшіруді растайсыз ба?`)) {
        users.splice(index, 1);
        localStorage.setItem('allUsers', JSON.stringify(users));
        refreshAdminPage();
        // Load server-backed content (news, teachers) if token present
        if (typeof loadAdminContent === 'function') loadAdminContent();
    }

    // Helper: get auth headers from localStorage
    function getAdminAuthHeaders() {
        const token = localStorage.getItem('authToken');
        return token ? { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
    }

    // Load news and teachers from API and render
    async function loadAdminContent() {
        try {
            const newsRes = await fetch('/api/news');
            const news = newsRes.ok ? await newsRes.json() : [];
            renderNewsList(news);
        } catch (e) { console.warn('Could not load news', e); renderNewsList([]); }

        try {
            const tRes = await fetch('/api/teachers');
            const teachers = tRes.ok ? await tRes.json() : [];
            renderTeachersList(teachers);
        } catch (e) { console.warn('Could not load teachers', e); renderTeachersList([]); }

        // attach form handlers
        const nf = document.getElementById('adminNewsForm');
        if (nf) nf.onsubmit = handleNewsSubmit;
        const tf = document.getElementById('adminTeacherForm');
        if (tf) tf.onsubmit = handleTeacherSubmit;
    }

    function renderNewsList(news) {
        const tbody = document.getElementById('admin-news-list');
        if (!tbody) return;
        tbody.innerHTML = (news || []).map(n => `
            <tr>
                <td>${n.id}</td>
                <td>${n.title}</td>
                <td>${n.date || ''}</td>
                <td>
                    <button onclick="deleteNews(${n.id})" class="action-btn delete">Өшіру</button>
                </td>
            </tr>
        `).join('');
    }

    async function handleNewsSubmit(e) {
        e.preventDefault();
        const title = document.getElementById('newsTitle').value.trim();
        const date = document.getElementById('newsDate').value.trim();
        const image = document.getElementById('newsImage').value.trim();
        if (!title) return alert('Тақырып қажет');
        try {
            const res = await fetch('/api/news', { method: 'POST', headers: getAdminAuthHeaders(), body: JSON.stringify({ title, date, image }) });
            if (!res.ok) {
                const err = await res.json();
                return alert('Қате: ' + (err.error||res.statusText));
            }
            document.getElementById('newsTitle').value = '';
            document.getElementById('newsDate').value = '';
            document.getElementById('newsImage').value = '';
            loadAdminContent();
            alert('Жаңалық қосылды');
        } catch (err) { console.error(err); alert('Сервер қате'); }
    }

    async function deleteNews(id) {
        if (!confirm('Жаңалықты өшіргіңіз келе ме?')) return;
        try {
            const res = await fetch(`/api/news/${id}`, { method: 'DELETE', headers: getAdminAuthHeaders() });
            if (!res.ok) { const e = await res.json(); return alert('Қате: ' + (e.error||res.statusText)); }
            loadAdminContent();
        } catch (err) { console.error(err); alert('Сервер қате'); }
    }

    function renderTeachersList(teachers) {
        const tbody = document.getElementById('admin-teachers-list');
        if (!tbody) return;
        tbody.innerHTML = (teachers || []).map(t => `
            <tr>
                <td>${t.id}</td>
                <td>${t.name}</td>
                <td>${t.subject || ''}</td>
                <td><button onclick="deleteTeacher(${t.id})" class="action-btn delete">Өшіру</button></td>
            </tr>
        `).join('');
    }

    async function handleTeacherSubmit(e) {
        e.preventDefault();
        const name = document.getElementById('teacherName').value.trim();
        const subject = document.getElementById('teacherSubject').value.trim();
        const img = document.getElementById('teacherImg').value.trim();
        if (!name) return alert('Аты-жөні қажет');
        try {
            const res = await fetch('/api/teachers', { method: 'POST', headers: getAdminAuthHeaders(), body: JSON.stringify({ name, position: '', subject, img, contact: '' }) });
            if (!res.ok) { const e = await res.json(); return alert('Қате: ' + (e.error||res.statusText)); }
            document.getElementById('teacherName').value = '';
            document.getElementById('teacherSubject').value = '';
            document.getElementById('teacherImg').value = '';
            loadAdminContent();
            alert('Мұғалім қосылды');
        } catch (err) { console.error(err); alert('Сервер қате'); }
    }

    async function deleteTeacher(id) {
        if (!confirm('Мұғалімді өшіргіңіз келе ме?')) return;
        try {
            const res = await fetch(`/api/teachers/${id}`, { method: 'DELETE', headers: getAdminAuthHeaders() });
            if (!res.ok) { const e = await res.json(); return alert('Қате: ' + (e.error||res.statusText)); }
            loadAdminContent();
        } catch (err) { console.error(err); alert('Сервер қате'); }
    }
}

// 8. ӨҢДЕУ ФУНКЦИЯСЫ (Атын өзгерту)
function editUser(index) {
    let users = getUsersFromStorage();
    const newName = prompt("Жаңа есім енгізіңіз:", users[index].name);
    if (newName) {
        users[index].name = newName;
        localStorage.setItem('allUsers', JSON.stringify(users));
        refreshAdminPage();
    }
}

// 9. ШЫҒУ
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    window.location.href = "index.html";
}

// 1. Пайдаланушылар тізімі (Осы жерге жаңаларын қоса аласың)
let allUsers = JSON.parse(localStorage.getItem('allUsers')) || [
    { name: "Жүйе әкімшісі", username: "admin", password: "123", role: "admin" },
    { name: "Болат Ибрагим", username: "bolat", password: "123", role: "student" }
];

document.addEventListener("DOMContentLoaded", () => {
    // Бет жүктелгенде орындалатын функциялар
    setupLoginForm();
    setupSidebarNavigation();
});

// 2. ЛОГИН ФУНКЦИЯСЫ (Скриншот 1 бойынша)
function setupLoginForm() {
    const loginForm = document.getElementById("loginForm");
    const errorMsg = document.getElementById("errorMessage"); // Қызыл жазу блогы

    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const userVal = document.getElementById("username").value.trim();
            const passVal = document.getElementById("password").value.trim();

            // Пайдаланушыны базадан іздеу
            const user = allUsers.find(u => u.username === userVal && u.password === passVal);

            if (user) {
                // Сәтті кіру
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('currentUser', JSON.stringify(user));
                
                if (user.role === 'admin') {
                    window.location.href = "admin.html";
                } else {
                    window.location.href = "profile.html";
                }
            } else {
                // Скриншоттағыдай қызыл қате шығару
                if (errorMsg) {
                    errorMsg.style.display = "flex"; // Көрсету
                } else {
                    alert("Логин немесе құпия сөз қате!");
                }
            }
        });
    }
}

// 3. БҮЙІРЛІК МӘЗІР (Скриншот 2 бойынша навигация)
function setupSidebarNavigation() {
    const menuItems = document.querySelectorAll('.sidebar-menu li');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            // Активті класты ауыстыру
            menuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            // Бетке бағыттау (data-page атрибуты арқылы)
            const page = this.getAttribute('data-page');
            if (page) {
                window.location.href = page;
            }
        });
    });
}

// 4. ЖАҢА ҚОЛДАНУШЫ ҚОСУ (Админге арналған функция)
function openAddUser() {
    const name = prompt("Аты-жөні:");
    const login = prompt("Логин:");
    const pass = prompt("Құпия сөз:", "123");
    const role = prompt("Рөлі (admin/student/teacher):", "student");

    if (name && login) {
        allUsers.push({ name, username: login, password: pass, role });
        localStorage.setItem('allUsers', JSON.stringify(allUsers));
        
        // Егер кесте болса, оны жаңарту
        if (typeof renderAdminTable === "function") renderAdminTable();
        alert("Қолданушы қосылды!");
    }
}
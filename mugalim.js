document.addEventListener("DOMContentLoaded", () => {
    const teacherData = JSON.parse(localStorage.getItem('currentUser'));
    
    if (teacherData && teacherData.role === 'teacher') {
        document.getElementById('teacher-display-name').innerText = teacherData.name;
        document.getElementById('teacher-welcome').innerText = `Қайырлы күн, ${teacherData.name}!`;
    } else {
        // Егер мұғалім емес адам кірсе, кері айдау
        // window.location.href = 'index.html';
    }
});

document.addEventListener("DOMContentLoaded", () => {
    // 1. Пайдаланушы атын автоматты түрде қою
    const teacherData = JSON.parse(localStorage.getItem('currentUser')) || { name: "Айгүл Төлеубекова" };
    const nameDisplay = document.querySelector('.admin-user-info span');
    const welcomeTitle = document.querySelector('h2');

    if (nameDisplay) nameDisplay.innerText = teacherData.name;
    if (welcomeTitle) welcomeTitle.innerText = `Қайырлы күн, ${teacherData.name.split(' ')[0]}!`;

    // 2. Сабақтардың статусын басқару (Интерактивтілік)
    const statusBadges = document.querySelectorAll('.status-badge');
    statusBadges.forEach(badge => {
        badge.addEventListener('click', () => {
            if (badge.innerText === "Күтілуде") {
                badge.innerText = "Басталды";
                badge.className = "status-badge active"; // Көк түске бояу
            } else if (badge.innerText === "Басталды") {
                badge.innerText = "Аяқталды";
                badge.className = "status-badge finished"; // Жасыл түс
            }
        });
    });

    // 3. "Тексеру" батырмасының функциясы
    const checkBtn = document.querySelector('.action-btn-small');
    if (checkBtn) {
        checkBtn.addEventListener('click', () => {
            const taskName = document.querySelector('.task-item p').innerText;
            alert(`${taskName} бойынша оқушылардың жұмыстары жүктелуде...`);
            // Осы жерде басқа бетке жіберуге болады:
            // window.location.href = "check-tasks.html";
        });
    }
});

// Teacher: helper to get auth headers
function getTeacherAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return token ? { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

document.addEventListener('DOMContentLoaded', () => {
    // attach teacher form handlers if present
    const hwForm = document.getElementById('teacherHomeworkForm');
    if (hwForm) hwForm.onsubmit = async (e) => {
        e.preventDefault();
        const title = document.getElementById('hwTitle').value.trim();
        const due = document.getElementById('hwDue').value.trim();
        if (!title) return alert('Тақырып қажет');
        try {
            const res = await fetch('/api/homework', { method: 'POST', headers: getTeacherAuthHeaders(), body: JSON.stringify({ title, description: '', due_date: due }) });
            if (!res.ok) { const err = await res.json(); return alert('Қате: ' + (err.error||res.statusText)); }
            document.getElementById('hwTitle').value=''; document.getElementById('hwDue').value='';
            loadTeacherContent();
        } catch (err) { console.error(err); alert('Сервер қате'); }
    };

    const gradeForm = document.getElementById('teacherGradeForm');
    if (gradeForm) gradeForm.onsubmit = async (e) => {
        e.preventDefault();
        const student_email = document.getElementById('gradeStudent').value.trim();
        const subject = document.getElementById('gradeSubject').value.trim();
        const grade = document.getElementById('gradeValue').value.trim();
        const term = (document.getElementById('gradeTerm') || {}).value || 'year';
        if (!student_email || !subject) return alert('Қажетті өрістерді толтырыңыз');
        try {
            const res = await fetch('/api/grades', { method: 'POST', headers: getTeacherAuthHeaders(), body: JSON.stringify({ student_email, subject, grade, term }) });
            if (!res.ok) { const err = await res.json(); return alert('Қате: ' + (err.error||res.statusText)); }
            document.getElementById('gradeStudent').value=''; document.getElementById('gradeSubject').value=''; document.getElementById('gradeValue').value='';
            loadTeacherContent();
        } catch (err) { console.error(err); alert('Сервер қате'); }
    };

    const journalForm = document.getElementById('teacherJournalForm');
    if (journalForm) journalForm.onsubmit = async (e) => {
        e.preventDefault();
        const student_email = document.getElementById('journalStudent').value.trim();
        const note = document.getElementById('journalNote').value.trim();
        if (!student_email || !note) return alert('Қажетті өрістерді толтыруыңыз қажет');
        try {
            const res = await fetch('/api/journal', { method: 'POST', headers: getTeacherAuthHeaders(), body: JSON.stringify({ student_email, note, date: new Date().toISOString() }) });
            if (!res.ok) { const err = await res.json(); return alert('Қате: ' + (err.error||res.statusText)); }
            document.getElementById('journalStudent').value=''; document.getElementById('journalNote').value='';
            loadTeacherContent();
        } catch (err) { console.error(err); alert('Сервер қате'); }
    };

    // load lists
    loadTeacherContent();
});

async function loadTeacherContent() {
    try {
        const h = await fetch('/api/homework');
        const homework = h.ok ? await h.json() : [];
        const hwList = document.getElementById('teacher-homework-list');
        if (hwList) hwList.innerHTML = (homework || []).map(x => `<li>${x.id}: ${x.title} — ${x.due_date || ''}</li>`).join('');
    } catch (e) { console.warn('hw load', e); }

    try {
        const g = await fetch('/api/grades');
        const grades = g.ok ? await g.json() : [];
        const gl = document.getElementById('teacher-grades-list');
        if (gl) gl.innerHTML = (grades || []).map(x => `<li>${x.id}: ${x.student_email} — ${x.subject}: ${x.grade}</li>`).join('');
    } catch (e) { console.warn('grades load', e); }

    try {
        const j = await fetch('/api/journal');
        const journal = j.ok ? await j.json() : [];
        const jl = document.getElementById('teacher-journal-list');
        if (jl) jl.innerHTML = (journal || []).map(x => `<li>${x.id}: ${x.student_email} — ${x.note}</li>`).join('');
    } catch (e) { console.warn('journal load', e); }
}
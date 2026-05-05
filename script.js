// 1. Сразу объявляем данные, чтобы списки в админке не были пустыми
const modesList = ['vanilla', 'uhc', 'pot', 'netherop', 'smp', 'sword', 'axe', 'mace'];
const modeIcons = {
    'vanilla': 'icons/vanilla.svg', 'uhc': 'icons/uhc.svg', 'pot': 'icons/pot.svg',
    'netherop': 'icons/nethop.svg', 'smp': 'icons/smp.svg', 'sword': 'icons/sword.svg',
    'axe': 'icons/axe.svg', 'mace': 'icons/mace.svg'
};
const pointsMapping = { 'HT1': 60, 'LT1': 45, 'HT2': 30, 'LT2': 20, 'HT3': 10, 'LT3': 6, 'HT4': 4, 'LT4': 3, 'HT5': 5, 'LT5': 1, 'NONE': 0 };
const tierOrder = { 'HT1': 1, 'LT1': 2, 'HT2': 3, 'LT2': 4, 'HT3': 5, 'LT3': 6, 'HT4': 7, 'LT4': 8, 'HT5': 9, 'LT5': 10, 'NONE': 11 };

let players = [];
let currentMode = 'overall';
let isAdmin = sessionStorage.getItem('isAdminAuth') === 'true';

// 2. Инициализация Firebase с проверкой
function initFirebase() {
    const firebaseConfig = {
        apiKey: "AIzaSyB8ESTmHczPwlj7ZQRFDbM2larnkmiEJXE",
        authDomain: "://firebaseapp.com",
        databaseURL: "https://firebaseio.com",
        projectId: "eutiers",
        storageBucket: "eutiers.firebasestorage.app",
        messagingSenderId: "702553921523",
        appId: "1:702553921523:web:49f526b38bfbe62f776486"
    };

    if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        window.db = firebase.database();
        console.log("✅ Firebase Connected");

        window.db.ref('players').on('value', (snapshot) => {
            const data = snapshot.val();
            players = data ? Object.values(data) : [];
            renderTable();
        });
    } else {
        console.log("🔄 Waiting for SDK...");
        setTimeout(initFirebase, 500);
    }
}

// 3. Наполнение админки и навигации (Запускаем сразу!)
function setupUI() {
    const navCont = document.getElementById('modesNav');
    if (navCont) {
        let html = `<button class="mode-btn active" onclick="switchMode('overall')">🏆<br>Overall</button>`;
        modesList.forEach(m => {
            const label = m === 'netherop' ? 'NethOP' : m.charAt(0).toUpperCase() + m.slice(1);
            html += `<button class="mode-btn" onclick="switchMode('${m}')"><img src="${modeIcons[m]}">${label}</button>`;
        });
        navCont.innerHTML = html;
    }

    const modeSelect = document.getElementById('mode-select');
    if (modeSelect && modeSelect.options.length === 0) {
        modesList.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m; opt.textContent = m.toUpperCase();
            modeSelect.appendChild(opt);
        });
    }
}

// Запуск при старте
setupUI();
initFirebase();

// --- ОСТАЛЬНЫЕ ФУНКЦИИ (Save, Delete, Render и т.д. - оставь как были раньше) ---
// Убедись, что в savePlayer используется window.db

function savePlayer(e) {
    if (e) e.preventDefault();
    if (!isAdmin || !window.db) { alert("Ошибка: База не готова или нет прав!"); return; }
    const nick = document.getElementById('nickname').value.trim();
    if (!nick) return;

    let p = players.find(x => x.nick.toLowerCase() === nick.toLowerCase());
    if (!p) {
        p = { nick: nick, region: document.getElementById('region-select').value, tiers: {} };
        modesList.forEach(m => p.tiers[m] = 'NONE');
    }
    p.tiers[document.getElementById('mode-select').value] = document.getElementById('tier-select').value;
    p.region = document.getElementById('region-select').value;

    window.db.ref('players/' + nick.toLowerCase()).set(p).then(() => {
        document.getElementById('nickname').value = '';
    });
}

function renderTable() {
    const tbody = document.getElementById('leaderboardBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const searchVal = document.getElementById('searchBar').value.toLowerCase();
    let display = players.filter(p => p.nick.toLowerCase().includes(searchVal));

    if (currentMode === 'overall') {
        display.sort((a,b) => (calculatePlayerPoints(b) || 0) - (calculatePlayerPoints(a) || 0));
    } else {
        display = display.filter(p => p.tiers[currentMode] !== 'NONE');
        display.sort((a,b) => tierOrder[a.tiers[currentMode]] - tierOrder[b.tiers[currentMode]]);
    }

    display.forEach((p, i) => {
        const tr = document.createElement('tr');
        const pts = calculatePlayerPoints(p);
        const lower = p.nick.toLowerCase();
        let tHTML = currentMode === 'overall' ? `<div class="tiers-row">` + modesList.map(m => (p.tiers && p.tiers[m] !== 'NONE') ? `<span class="tier-badge ${p.tiers[m]}">${p.tiers[m]}</span>` : '').join('') + `</div>` : `<span class="tier-badge ${p.tiers[currentMode]}">${p.tiers[currentMode]}</span>`;

        tr.innerHTML = `<td>${i+1}</td><td><div class="player-cell" onclick="openProfile('${p.nick}')"><div class="css-head" style="background-image: url('${lower}.png'), url('steve.png');"></div><div><span class="player-name">${p.nick}</span><span class="player-title">${getRankTitle(pts)} (${pts} pts)</span></div></div></td><td><span class="region-badge">${p.region || 'EU'}</span></td><td>${tHTML}</td>`;
        tbody.appendChild(tr);
    });
}

function calculatePlayerPoints(p) {
    let t = 0;
    if (!p.tiers) return 0;
    modesList.forEach(m => t += pointsMapping[p.tiers[m]] || 0);
    return t;
}

function getRankTitle(pts) {
    if (pts >= 400) return 'Combat Grandmaster';
    if (pts >= 250) return 'Combat Master';
    return 'Rookie';
}

function switchMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b.innerHTML.toLowerCase().includes(mode) || (mode === 'overall' && b.innerHTML.includes('Overall'))));
    renderTable();
}

function tryLogin() {
    const u = document.getElementById('adminUser').value;
    const p = document.getElementById('adminPass').value;
    if (u === 'legendgaymer92' && p === 'skibididemon999') {
        isAdmin = true; sessionStorage.setItem('isAdminAuth', 'true');
        closeLoginDirect();
        document.getElementById('adminPanel').style.display = 'block';
    } else { alert('Wrong password!'); }
}

function deletePlayerFromAdmin() {
    if (!isAdmin || !window.db) return;
    const nick = document.getElementById('nickname').value.trim();
    if (nick) window.db.ref('players/' + nick.toLowerCase()).remove();
}

function closeLoginDirect() { document.getElementById('loginModal').style.display = 'none'; }
function logoutAdmin() { isAdmin = false; sessionStorage.removeItem('isAdminAuth'); document.getElementById('adminPanel').style.display = 'none'; }

document.addEventListener('keydown', (e) => {
    if (e.code === 'Backquote') {
        if (!isAdmin) { document.getElementById('loginModal').style.display = 'flex'; }
        else { document.getElementById('adminPanel').style.display = document.getElementById('adminPanel').style.display === 'none' ? 'block' : 'none'; }
    }
});

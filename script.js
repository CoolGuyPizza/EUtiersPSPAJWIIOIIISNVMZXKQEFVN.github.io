let players = [];
let currentMode = 'overall';
let isAdmin = sessionStorage.getItem('isAdminAuth') === 'true';

const modesList = ['vanilla', 'uhc', 'pot', 'netherop', 'smp', 'sword', 'axe', 'mace'];
const modeIcons = {
    'vanilla': 'icons/vanilla.svg', 'uhc': 'icons/uhc.svg', 'pot': 'icons/pot.svg',
    'netherop': 'icons/nethop.svg', 'smp': 'icons/smp.svg', 'sword': 'icons/sword.svg',
    'axe': 'icons/axe.svg', 'mace': 'icons/mace.svg'
};
const pointsMapping = { 'HT1': 60, 'LT1': 45, 'HT2': 30, 'LT2': 20, 'HT3': 10, 'LT3': 6, 'HT4': 4, 'LT4': 3, 'HT5': 5, 'LT5': 1, 'NONE': 0 };
const tierOrder = { 'HT1': 1, 'LT1': 2, 'HT2': 3, 'LT2': 4, 'HT3': 5, 'LT3': 6, 'HT4': 7, 'LT4': 8, 'HT5': 9, 'LT5': 10, 'NONE': 11 };

// --- 1. ПРИНУДИТЕЛЬНЫЙ UI (Запуск немедленно) ---
function initStaticUI() {
    const navCont = document.getElementById('modesNav');
    if (navCont) {
        let html = `<button class="mode-btn active" onclick="switchMode('overall')">🏆<br>Overall</button>`;
        modesList.forEach(m => {
            const label = m === 'netherop' ? 'NethOP' : m.charAt(0).toUpperCase() + m.slice(1);
            html += `<button class="mode-btn" onclick="switchMode('${m}')"><img src="${modeIcons[m]}" alt="">${label}</button>`;
        });
        navCont.innerHTML = html;
    }
    const modeSelect = document.getElementById('mode-select');
    if (modeSelect) {
        modesList.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m; opt.textContent = m.toUpperCase();
            modeSelect.appendChild(opt);
        });
    }
}
initStaticUI();

// --- 2. FIREBASE (Запуск с ожиданием загрузки) ---
function startCloud() {
    const config = {
        apiKey: "AIzaSyB8ESTmHczPwlj7ZQRFDbM2larnkmiEJXE",
        authDomain: "://firebaseapp.com",
        databaseURL: "https://firebaseio.com",
        projectId: "eutiers",
        storageBucket: "eutiers.firebasestorage.app",
        messagingSenderId: "702553921523",
        appId: "1:702553921523:web:49f526b38bfbe62f776486"
    };

    if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) firebase.initializeApp(config);
        window.db = firebase.database();
        console.log("✅ База готова!");

        window.db.ref('players').on('value', (snap) => {
            players = snap.val() ? Object.values(snap.val()) : [];
            renderTable();
        });
    } else {
        console.log("🔄 Поиск базы...");
        setTimeout(startCloud, 500);
    }
}
startCloud();

// --- 3. СКИНЫ (ПОЛНАЯ ОТРИСОВКА) ---
function drawSkinToCanvas(imgSource, container) {
    const canvas = document.createElement('canvas');
    canvas.width = 16; canvas.height = 32;
    canvas.style.width = '100px'; canvas.style.height = '180px';
    canvas.style.imageRendering = 'pixelated';
    canvas.className = 'modal-skin';
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imgSource;
    img.onload = () => {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 8, 8, 8, 8, 4, 0, 8, 8); // Head
        ctx.drawImage(img, 40, 8, 8, 8, 4, 0, 8, 8); // Layer 2
        ctx.drawImage(img, 20, 20, 8, 12, 4, 8, 8, 12); // Body
        ctx.drawImage(img, 20, 36, 8, 12, 4, 8, 8, 12); // Layer 2
        ctx.drawImage(img, 44, 20, 4, 12, 0, 8, 4, 12); // Arm L
        if (img.height > 32) ctx.drawImage(img, 36, 52, 4, 12, 12, 8, 4, 12); // Arm R
        ctx.drawImage(img, 4, 20, 4, 12, 4, 20, 4, 12); // Leg L
        if (img.height > 32) ctx.drawImage(img, 20, 52, 4, 12, 8, 20, 4, 12); // Leg R
        container.appendChild(canvas);
    };
    img.onerror = () => { if (imgSource !== 'steve.png') drawSkinToCanvas('steve.png', container); };
}

// --- 4. ОСНОВНЫЕ ФУНКЦИИ ---
function getRankTitle(pts) {
    if (pts >= 400) return 'Combat Grandmaster';
    if (pts >= 250) return 'Combat Master';
    if (pts >= 100) return 'Combat Ace';
    if (pts >= 50) return 'Combat Specialist';
    return 'Rookie';
}

function calculatePlayerPoints(p) {
    let t = 0; if(!p.tiers) return 0;
    modesList.forEach(m => t += pointsMapping[p.tiers[m]] || 0);
    return t;
}

function renderTable() {
    const tbody = document.getElementById('leaderboardBody');
    if (!tbody) return; tbody.innerHTML = '';
    const searchVal = document.getElementById('searchBar').value.toLowerCase();
    let display = players.filter(p => p.nick.toLowerCase().includes(searchVal));

    if (currentMode === 'overall') {
        display.sort((a,b) => calculatePlayerPoints(b) - calculatePlayerPoints(a));
    } else {
        display = display.filter(p => p.tiers && p.tiers[currentMode] !== 'NONE');
        display.sort((a,b) => tierOrder[a.tiers[currentMode]] - tierOrder[b.tiers[currentMode]]);
    }

    display.forEach((p, i) => {
        const tr = document.createElement('tr');
        const pts = calculatePlayerPoints(p);
        const lower = p.nick.toLowerCase();
        let tHTML = currentMode === 'overall' ? `<div class="tiers-row">` + modesList.map(m => (p.tiers && p.tiers[m] !== 'NONE') ? `<span class="tier-badge ${p.tiers[m]}">${p.tiers[m]}</span>` : '').join('') + `</div>` : `<span class="tier-badge ${p.tiers[currentMode]}">${p.tiers[currentMode]}</span>`;
        tr.innerHTML = `<td>${i+1}</td><td><div class="player-cell" onclick="openProfile('${p.nick}')"><div class="css-head" style="background-image: url('${lower}.png'), url('steve.png');"></div><div><span class="player-name">${p.nick}</span><span class="player-title" style="color:var(--text-gray); font-size:11px">${getRankTitle(pts)} (${pts} pts)</span></div></div></td><td><span class="region-badge">${p.region || 'EU'}</span></td><td>${tHTML}</td>`;
        tbody.appendChild(tr);
    });
}

function openProfile(nick) {
    const p = players.find(x => x.nick === nick); if (!p) return;
    const pts = calculatePlayerPoints(p);
    const sorted = [...players].sort((a,b) => calculatePlayerPoints(b) - calculatePlayerPoints(a));
    document.getElementById('modalNick').textContent = p.nick;
    document.getElementById('modalRole').textContent = getRankTitle(pts);
    document.getElementById('modalRank').textContent = (sorted.findIndex(x => x.nick === nick) + 1) + '.';
    document.getElementById('modalPoints').textContent = `(${pts} points)`;
    document.getElementById('modalRegion').textContent = p.region || 'EU';
    const skinC = document.getElementById("skin_container");
    skinC.innerHTML = ''; drawSkinToCanvas(p.nick.toLowerCase() + '.png', skinC);
    const grid = document.getElementById('modalTiersGrid'); grid.innerHTML = '';
    modesList.forEach(m => { if (p.tiers && p.tiers[m] !== 'NONE') grid.innerHTML += `<div class="modal-tier-item"><img src="${modeIcons[m]}" width="14" style="margin-right:5px"><span class="tier-badge ${p.tiers[m]}">${p.tiers[m]}</span></div>`; });
    document.getElementById('profileModal').style.display = 'flex';
}

// --- 5. АДМИНКА ---
function savePlayer(e) {
    e.preventDefault(); if (!isAdmin || !window.db) { alert("Ошибка базы!"); return; }
    const nick = document.getElementById('nickname').value.trim(); if (!nick) return;
    let p = players.find(x => x.nick.toLowerCase() === nick.toLowerCase()) || { nick: nick, tiers: {} };
    p.tiers[document.getElementById('mode-select').value] = document.getElementById('tier-select').value;
    p.region = document.getElementById('region-select').value;
    window.db.ref('players/' + nick.toLowerCase()).set(p).then(() => { document.getElementById('nickname').value = ''; });
}

function tryLogin() {
    if (document.getElementById('adminUser').value === 'legendgaymer92' && document.getElementById('adminPass').value === 'skibididemon999') {
        isAdmin = true; sessionStorage.setItem('isAdminAuth', 'true');
        document.getElementById('loginModal').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
    } else alert('Error!');
}

function deletePlayerFromAdmin() {
    if (isAdmin && window.db) {
        const nick = document.getElementById('nickname').value.trim();
        if (nick) window.db.ref('players/' + nick.toLowerCase()).remove();
    }
}

function switchMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.toggle('active', btn.innerHTML.toLowerCase().includes(mode) || (mode==='overall' && btn.innerHTML.includes('Overall'))));
    renderTable();
}

function closeLoginDirect() { document.getElementById('loginModal').style.display = 'none'; }
function logoutAdmin() { isAdmin = false; sessionStorage.removeItem('isAdminAuth'); document.getElementById('adminPanel').style.display = 'none'; }
function closeModalDirect() { document.getElementById('profileModal').style.display = 'none'; }
document.addEventListener('keydown', (e) => { if (e.code === 'Backquote') { if (!isAdmin) document.getElementById('loginModal').style.display = 'flex'; else document.getElementById('adminPanel').style.display = document.getElementById('adminPanel').style.display === 'none' ? 'block' : 'none'; } });
document.getElementById('searchBar').addEventListener('input', renderTable);

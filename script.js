// Ждем полной загрузки страницы и всех библиотек
window.addEventListener('load', function() {
    if (typeof firebase !== 'undefined') {
        const firebaseConfig = {
            apiKey: "AIzaSyB8ESTmHczPwlj7ZQRFDbM2larnkmiEJXE",
            authDomain: "://firebaseapp.com",
            databaseURL: "https://firebaseio.com",
            projectId: "eutiers",
            storageBucket: "eutiers.firebasestorage.app",
            messagingSenderId: "702553921523",
            appId: "1:702553921523:web:49f526b38bfbe62f776486"
        };
        
        firebase.initializeApp(firebaseConfig);
        window.db = firebase.database();
        console.log("Firebase подключен успешно!");

        // Запускаем синхронизацию данных
        window.db.ref('players').on('value', (snapshot) => {
            const data = snapshot.val();
            players = data ? Object.values(data) : [];
            renderTable();
        });
    } else {
        console.error("Firebase не загрузился. Проверь интернет или ссылки на SDK.");
    }
});

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

// --- FIREBASE SYNC ---
if (window.db) {
    window.db.ref('players').on('value', (snapshot) => {
        const data = snapshot.val();
        players = data ? Object.values(data) : [];
        renderTable();
    });
}

// --- INITIALIZE UI ---
const navCont = document.getElementById('modesNav');
if (navCont) {
    let html = `<button class="mode-btn active" data-mode="overall" onclick="switchMode('overall')">🏆<br>Overall</button>`;
    modesList.forEach(m => {
        const label = m === 'netherop' ? 'NethOP' : m.charAt(0).toUpperCase() + m.slice(1);
        html += `<button class="mode-btn" data-mode="${m}" onclick="switchMode('${m}')"><img src="${modeIcons[m]}">${label}</button>`;
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

// --- ADMIN CONTROLS ---
document.addEventListener('keydown', (e) => {
    if (e.code === 'Backquote') {
        if (!isAdmin) {
            const m = document.getElementById('loginModal');
            m.style.display = 'flex'; setTimeout(() => m.classList.add('active'), 10);
        } else {
            const p = document.getElementById('adminPanel');
            p.style.display = (p.style.display === 'none') ? 'block' : 'none';
        }
    }
});

function tryLogin() {
    const u = document.getElementById('adminUser').value;
    const p = document.getElementById('adminPass').value;
    if (u === 'legendgaymer92' && p === 'skibididemon999') {
        isAdmin = true; sessionStorage.setItem('isAdminAuth', 'true');
        closeLoginDirect();
        document.getElementById('adminPanel').style.display = 'block';
    } else { alert('Wrong password!'); }
}

function savePlayer(e) {
    e.preventDefault();
    if (!isAdmin || !window.db) return;
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

function deletePlayerFromAdmin() {
    if (!isAdmin || !window.db) return;
    const nick = document.getElementById('nickname').value.trim();
    if (nick) window.db.ref('players/' + nick.toLowerCase()).remove();
}

// --- RENDER LOGIC ---
function renderTable() {
    const tbody = document.getElementById('leaderboardBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    const searchVal = document.getElementById('searchBar').value.toLowerCase();
    let display = players.filter(p => p.nick.toLowerCase().includes(searchVal));

    if (currentMode === 'overall') {
        display.sort((a,b) => calculatePlayerPoints(b) - calculatePlayerPoints(a));
    } else {
        display = display.filter(p => p.tiers[currentMode] !== 'NONE');
        display.sort((a,b) => tierOrder[a.tiers[currentMode]] - tierOrder[b.tiers[currentMode]]);
    }

    display.forEach((p, i) => {
        const tr = document.createElement('tr');
        const pts = calculatePlayerPoints(p);
        const lower = p.nick.toLowerCase();
        let tiersHTML = currentMode === 'overall' ? 
            `<div class="tiers-row">` + modesList.map(m => p.tiers[m] !== 'NONE' ? `<span class="tier-badge ${p.tiers[m]}">${p.tiers[m]}</span>` : '').join('') + `</div>` : 
            `<span class="tier-badge ${p.tiers[currentMode]}">${p.tiers[currentMode]}</span>`;

        tr.innerHTML = `<td>${i+1}</td><td><div class="player-cell" onclick="openProfile('${p.nick}')"><div class="css-head" style="background-image: url('${lower}.png'), url('steve.png');"></div><div><span class="player-name">${p.nick}</span><span class="player-title">${getRankTitle(pts)} (${pts} pts)</span></div></div></td><td><span class="region-badge">${p.region || 'EU'}</span></td><td>${tiersHTML}</td>`;
        tbody.appendChild(tr);
    });
}

function calculatePlayerPoints(p) {
    let t = 0;
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
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b.getAttribute('onclick').includes(mode)));
    document.getElementById('tier-header-title').textContent = (mode === 'overall') ? 'ALL TIERS' : 'TIER';
    renderTable();
}

function openProfile(nick) {
    const p = players.find(x => x.nick === nick);
    if (!p) return;
    const pts = calculatePlayerPoints(p);
    document.getElementById('modalNick').textContent = p.nick;
    document.getElementById('modalRole').textContent = getRankTitle(pts);
    document.getElementById('modalPoints').textContent = `(${pts} points)`;
    document.getElementById('modalRegion').textContent = p.region || 'EU';
    
    const skinC = document.getElementById("skin_container");
    skinC.innerHTML = ''; drawSkinToCanvas(p.nick.toLowerCase() + '.png', skinC);

    const m = document.getElementById('profileModal');
    m.style.display = 'flex'; setTimeout(() => m.classList.add('active'), 10);
}

function drawSkinToCanvas(imgSource, container) {
    const canvas = document.createElement('canvas');
    canvas.width = 16; canvas.height = 32;
    canvas.style.width = '100px'; canvas.style.height = '180px';
    canvas.style.imageRendering = 'pixelated';
    canvas.className = 'modal-skin';
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = imgSource;
    img.onload = () => {
        ctx.drawImage(img, 8, 8, 8, 8, 4, 0, 8, 8); // Head
        ctx.drawImage(img, 20, 20, 8, 12, 4, 8, 8, 12); // Body
        container.appendChild(canvas);
    };
    img.onerror = () => { if (imgSource !== 'steve.png') drawSkinToCanvas('steve.png', container); };
}

function closeLoginDirect() {
    const m = document.getElementById('loginModal');
    m.classList.remove('active'); setTimeout(() => m.style.display = 'none', 200);
}

function closeModalDirect() {
    const m = document.getElementById('profileModal');
    m.classList.remove('active'); setTimeout(() => m.style.display = 'none', 200);
}

document.getElementById('searchBar').addEventListener('input', renderTable);

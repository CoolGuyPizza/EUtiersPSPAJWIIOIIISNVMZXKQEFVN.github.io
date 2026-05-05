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
db.ref('players').on('value', (snapshot) => {
    const data = snapshot.val();
    players = data ? Object.values(data) : [];
    renderTable();
});

// --- NAVIGATION & SELECTS ---
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
if (modeSelect) {
    modesList.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m; opt.textContent = m.toUpperCase();
        modeSelect.appendChild(opt);
    });
}

// --- ADMIN FUNCTIONS ---
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
    if (!isAdmin) return;
    const nick = document.getElementById('nickname').value.trim();
    if (!nick) return;

    let p = players.find(x => x.nick.toLowerCase() === nick.toLowerCase());
    if (!p) {
        p = { nick: nick, region: document.getElementById('region-select').value, tiers: {} };
        modesList.forEach(m => p.tiers[m] = 'NONE');
    }
    p.tiers[document.getElementById('mode-select').value] = document.getElementById('tier-select').value;
    p.region = document.getElementById('region-select').value;

    db.ref('players/' + nick.toLowerCase()).set(p).then(() => {
        document.getElementById('nickname').value = '';
    });
}

function deletePlayerFromAdmin() {
    if (!isAdmin) return;
    const nick = document.getElementById('nickname').value.trim();
    if (nick) db.ref('players/' + nick.toLowerCase()).remove();
}

function logoutAdmin() {
    isAdmin = false; sessionStorage.removeItem('isAdminAuth');
    document.getElementById('adminPanel').style.display = 'none';
}

// --- CORE LOGIC ---
function calculatePlayerPoints(p) {
    let total = 0;
    modesList.forEach(m => total += pointsMapping[p.tiers[m]] || 0);
    return total;
}

function getRankTitle(pts) {
    if (pts >= 400) return 'Combat Grandmaster';
    if (pts >= 250) return 'Combat Master';
    if (pts >= 100) return 'Combat Ace';
    return 'Rookie';
}

function switchMode(mode) {
    currentMode = mode;
    const btns = document.querySelectorAll('.mode-btn');
    btns.forEach(b => b.classList.remove('active'));
    if (event) event.currentTarget.classList.add('active');
    document.getElementById('tier-header-title').textContent = (mode === 'overall') ? 'ALL TIERS' : 'TIER';
    renderTable();
}

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

// --- SKIN DRAWING ---
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
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 8, 8, 8, 8, 4, 0, 8, 8); // Head
        ctx.drawImage(img, 20, 20, 8, 12, 4, 8, 8, 12); // Body
        ctx.drawImage(img, 44, 20, 4, 12, 0, 8, 4, 12); // L Arm
        ctx.drawImage(img, 36, 52, 4, 12, 12, 8, 4, 12); // R Arm
        ctx.drawImage(img, 4, 20, 4, 12, 4, 20, 4, 12); // L Leg
        ctx.drawImage(img, 20, 52, 4, 12, 8, 20, 4, 12); // R Leg
        container.appendChild(canvas);
    };
    img.onerror = () => { if (imgSource !== 'steve.png') drawSkinToCanvas('steve.png', container); };
}

function openProfile(nick) {
    const p = players.find(x => x.nick === nick);
    if (!p) return;
    const pts = calculatePlayerPoints(p);
    const sorted = [...players].sort((a,b) => calculatePlayerPoints(b) - calculatePlayerPoints(a));

    document.getElementById('modalNick').textContent = p.nick;
    document.getElementById('modalRole').textContent = getRankTitle(pts);
    document.getElementById('modalRank').textContent = (sorted.findIndex(x => x.nick === nick) + 1) + '.';
    document.getElementById('modalPoints').textContent = `(${pts} points)`;
    document.getElementById('modalRegion').textContent = p.region || 'EU';
    
    const skinC = document.getElementById("skin_container");
    skinC.innerHTML = ''; drawSkinToCanvas(p.nick.toLowerCase() + '.png', skinC);

    const grid = document.getElementById('modalTiersGrid');
    grid.innerHTML = '';
    modesList.forEach(m => {
        if (p.tiers[m] !== 'NONE') {
            grid.innerHTML += `<div class="modal-tier-item"><img src="${modeIcons[m]}" width="14"><span class="tier-badge ${p.tiers[m]}">${p.tiers[m]}</span></div>`;
        }
    });
    
    const m = document.getElementById('profileModal');
    m.style.display = 'flex'; setTimeout(() => m.classList.add('active'), 10);
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

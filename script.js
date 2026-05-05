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

// --- ЗАГРУЗКА ---
async function loadData() {
    try {
        const response = await fetch('players.json');
        if (response.ok) { players = await response.json(); }
        else { players = JSON.parse(localStorage.getItem('mcTiersData')) || []; }
    } catch (e) { players = JSON.parse(localStorage.getItem('mcTiersData')) || []; }
    renderTable();
}
loadData();

// --- ИНИЦИАЛИЗАЦИЯ ИНТЕРФЕЙСА ---
const navCont = document.getElementById('modesNav');
if (navCont) {
    navCont.innerHTML = `<button class="mode-btn active" onclick="switchMode('overall', event)">🏆<br>Overall</button>`;
    modesList.forEach(m => {
        const label = m === 'netherop' ? 'NethOP' : m.charAt(0).toUpperCase() + m.slice(1);
        navCont.innerHTML += `<button class="mode-btn" onclick="switchMode('${m}', event)"><img src="${modeIcons[m]}" alt="">${label}</button>`;
    });
}

const modeSelect = document.getElementById('mode-select');
if (modeSelect) {
    modesList.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m; opt.textContent = m.toUpperCase();
        modeSelect.appendChild(opt);
    });
}

// --- ТАБЛИЦА И АНИМАЦИЯ ---
function switchMode(mode, event) {
    currentMode = mode;
    const tbody = document.getElementById('leaderboardBody');
    
    // Кнопки
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    if (event) event.currentTarget.classList.add('active');
    
    // Заголовок
    document.getElementById('tier-header-title').textContent = (mode === 'overall') ? 'ALL TIERS' : mode.toUpperCase();

    if (tbody) {
        tbody.classList.remove('fade-in-up');
        renderTable();
        void tbody.offsetWidth; // Хак для перезапуска анимации
        tbody.classList.add('fade-in-up');
    }
}

function renderTable() {
    const tbody = document.getElementById('leaderboardBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const searchVal = document.getElementById('searchBar').value.toLowerCase();
    let display = players.filter(p => p.nick.toLowerCase().includes(searchVal));

    if (currentMode === 'overall') {
        display.sort((a, b) => calculatePlayerPoints(b) - calculatePlayerPoints(a));
    } else {
        display = display.filter(p => p.tiers[currentMode] !== 'NONE');
        display.sort((a, b) => tierOrder[a.tiers[currentMode]] - tierOrder[b.tiers[currentMode]]);
    }

    display.forEach((p, i) => {
        const tr = document.createElement('tr');
        const pts = calculatePlayerPoints(p);
        const tCell = currentMode === 'overall' 
            ? `<div class="tiers-row">` + modesList.map(m => p.tiers[m] !== 'NONE' ? `<span class="tier-badge ${p.tiers[m]}">${p.tiers[m]}</span>` : '').join('') + `</div>` 
            : `<span class="tier-badge ${p.tiers[currentMode]}">${p.tiers[currentMode]}</span>`;
        
        tr.innerHTML = `<td>${i+1}</td><td><div class="player-cell" onclick="openProfile('${p.nick}')"><div class="css-head" style="background-image: url('${p.nick.toLowerCase()}.png'), url('steve.png');"></div><div><span class="player-name">${p.nick}</span><span class="player-title">${getRankTitle(pts)} (${pts} pts)</span></div></div></td><td><span class="region-badge">${p.region || 'NA'}</span></td><td>${tCell}</td>`;
        tbody.appendChild(tr);
    });
}

// --- ВСПОМОГАТЕЛЬНЫЕ ---
function calculatePlayerPoints(p) { let t = 0; modesList.forEach(m => t += pointsMapping[p.tiers[m]] || 0); return t; }
function getRankTitle(pts) { if(pts>=400) return 'Grandmaster'; if(pts>=250) return 'Master'; if(pts>=100) return 'Ace'; return 'Rookie'; }

// Админка, Модалки, Сохранение (те же функции)
document.addEventListener('keydown', (e) => {
    if (e.code === 'Backquote') {
        if (!isAdmin) { document.getElementById('loginModal').style.display = 'flex'; setTimeout(() => document.getElementById('loginModal').classList.add('active'), 10); }
        else { let p = document.getElementById('adminPanel'); p.style.display = (p.style.display==='none') ? 'block' : 'none'; }
    }
});

function tryLogin() {
    if(document.getElementById('adminUser').value === 'legendgaymer92' && document.getElementById('adminPass').value === 'skibididemon999') {
        isAdmin = true; sessionStorage.setItem('isAdminAuth', 'true'); closeLoginDirect(); document.getElementById('adminPanel').style.display='block';
    } else { alert('Error!'); }
}
function closeLoginDirect() { document.getElementById('loginModal').classList.remove('active'); setTimeout(() => document.getElementById('loginModal').style.display='none', 200); }
function closeLoginModal(e) { if(e.target.id === 'loginModal') closeLoginDirect(); }
function logoutAdmin() { isAdmin=false; sessionStorage.removeItem('isAdminAuth'); document.getElementById('adminPanel').style.display='none'; }

function savePlayer(e) {
    if(e) e.preventDefault();
    const nick = document.getElementById('nickname').value.trim();
    if(!nick) return;
    let p = players.find(x => x.nick.toLowerCase() === nick.toLowerCase());
    if(!p) { p = {nick: nick, region: document.getElementById('region-select').value, tiers: {}}; modesList.forEach(m => p.tiers[m]='NONE'); players.push(p); }
    p.tiers[document.getElementById('mode-select').value] = document.getElementById('tier-select').value;
    p.region = document.getElementById('region-select').value;
    localStorage.setItem('mcTiersData', JSON.stringify(players));
    renderTable();
}

function deletePlayerFromAdmin() {
    const nick = document.getElementById('nickname').value.trim();
    players = players.filter(p => p.nick.toLowerCase() !== nick.toLowerCase());
    localStorage.setItem('mcTiersData', JSON.stringify(players));
    renderTable();
}

function downloadJSON() {
    const blob = new Blob([JSON.stringify(players, null, 4)], {type: 'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'players.json'; a.click();
}

// Профиль
function openProfile(nick) {
    const p = players.find(x => x.nick === nick);
    if(!p) return;
    const pts = calculatePlayerPoints(p);
    document.getElementById('modalNick').textContent = p.nick;
    document.getElementById('modalRole').textContent = getRankTitle(pts);
    document.getElementById('modalRegion').textContent = p.region || 'NA';
    document.getElementById('modalPoints').textContent = `(${pts} points)`;
    
    const skinCont = document.getElementById('skin_container');
    skinCont.innerHTML = '';
    drawSkinToCanvas(`${p.nick.toLowerCase()}.png`, skinCont);
    
    const grid = document.getElementById('modalTiersGrid');
    grid.innerHTML = '';
    modesList.forEach(m => { if(p.tiers[m]!=='NONE') grid.innerHTML += `<div class="modal-tier-item"><img src="${modeIcons[m]}"><span class="tier-badge ${p.tiers[m]}">${p.tiers[m]}</span></div>`; });

    const m = document.getElementById('profileModal');
    m.style.display = 'flex'; setTimeout(() => m.classList.add('active'), 10);
}
function closeModalDirect() { const m = document.getElementById('profileModal'); m.classList.remove('active'); setTimeout(() => m.style.display='none', 200); }
function closeModal(e) { if(e.target.className.includes('modal-overlay')) closeModalDirect(); }

function drawSkinToCanvas(src, cont) {
    const cvs = document.createElement('canvas'); cvs.width=16; cvs.height=32; cvs.style.width='100px'; cvs.style.height='200px'; cvs.style.imageRendering='pixelated';
    const ctx = cvs.getContext('2d'); const img = new Image(); img.src=src;
    img.onload = () => {
        ctx.imageSmoothingEnabled=false;
        ctx.drawImage(img,8,8,8,8,4,0,8,8); ctx.drawImage(img,40,8,8,8,4,0,8,8); // Head
        ctx.drawImage(img,20,20,8,12,4,8,8,12); // Body
        ctx.drawImage(img,44,20,4,12,12,8,4,12); // L-Arm
        ctx.drawImage(img,44,20,4,12,0,8,4,12); // R-Arm
        ctx.drawImage(img,4,20,4,12,8,20,4,12); // L-Leg
        ctx.drawImage(img,4,20,4,12,4,20,4,12); // R-Leg
        cont.appendChild(cvs);
    };
    img.onerror = () => { if(src!=='steve.png') drawSkinToCanvas('steve.png', cont); };
}

document.getElementById('searchBar').addEventListener('input', renderTable);

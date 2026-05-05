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

// --- ЗАГРУЗКА ДАННЫХ ---
async function loadData() {
    try {
        const response = await fetch('players.json');
        if (response.ok) {
            players = await response.json();
            console.log("Loaded from players.json");
        } else {
            players = JSON.parse(localStorage.getItem('mcTiersData')) || [];
            console.log("players.json not found, using localStorage");
        }
    } catch (e) {
        players = JSON.parse(localStorage.getItem('mcTiersData')) || [];
        console.error("Load error:", e);
    }
    renderTable();
}
loadData();

// --- ИНИЦИАЛИЗАЦИЯ ИНТЕРФЕЙСА ---
const navCont = document.getElementById('modesNav');
if (navCont) {
    navCont.innerHTML = `<button class="mode-btn active" onclick="switchMode('overall')">🏆<br>Overall</button>`;
    modesList.forEach(m => {
        const label = m === 'netherop' ? 'NethOP' : m.charAt(0).toUpperCase() + m.slice(1);
        navCont.innerHTML += `<button class="mode-btn" onclick="switchMode('${m}')"><img src="${modeIcons[m]}" alt="">${label}</button>`;
    });
}

const modeSelect = document.getElementById('mode-select');
if (modeSelect) {
    modesList.forEach(m => {
        const option = document.createElement('option');
        option.value = m; option.textContent = m.toUpperCase();
        modeSelect.appendChild(option);
    });
}

// --- АДМИН ПАНЕЛЬ ---
document.addEventListener('keydown', function(e) {
    if (e.code === 'Backquote') {
        const panel = document.getElementById('adminPanel');
        const loginModal = document.getElementById('loginModal');
        if (!isAdmin) {
            if (loginModal) {
                loginModal.style.display = 'flex';
                setTimeout(() => { loginModal.classList.add('active'); }, 10);
            }
        } else {
            if (panel) panel.style.display = (panel.style.display === 'none' || panel.style.display === '') ? 'block' : 'none';
        }
    }
});

function tryLogin() {
    const user = document.getElementById('adminUser').value;
    const pass = document.getElementById('adminPass').value;
    if (user === 'legendgaymer92' && pass === 'skibididemon999') {
        isAdmin = true;
        sessionStorage.setItem('isAdminAuth', 'true');
        closeLoginDirect();
        document.getElementById('adminPanel').style.display = 'block';
        alert('Welcome Admin!');
    } else {
        alert('Wrong credentials!');
    }
}

function logoutAdmin() {
    isAdmin = false;
    sessionStorage.removeItem('isAdminAuth');
    document.getElementById('adminPanel').style.display = 'none';
    alert('Logged out.');
}

function closeLoginDirect() {
    const modal = document.getElementById('loginModal');
    if (modal) { modal.classList.remove('active'); setTimeout(() => { modal.style.display = 'none'; }, 200); }
}

function closeLoginModal(e) { if (e.target.id === 'loginModal') closeLoginDirect(); }

// --- ЛОГИКА ИГРОКОВ ---
function calculatePlayerPoints(player) {
    let total = 0;
    modesList.forEach(m => { total += pointsMapping[player.tiers[m]] || 0; });
    return total;
}

function getRankTitle(points) {
    if (points >= 400) return 'Combat Grandmaster';
    if (points >= 250) return 'Combat Master';
    if (points >= 100) return 'Combat Ace';
    if (points >= 50) return 'Combat Specialist';
    if (points >= 20) return 'Combat Cadet';
    if (points >= 10) return 'Combat Novice';
    return 'Rookie';
}

function savePlayer(event) {
    if (event) event.preventDefault();
    if (!isAdmin) return;
    
    const nickInput = document.getElementById('nickname');
    const nick = nickInput.value.trim();
    if (!nick) return;

    let player = players.find(p => p.nick.toLowerCase() === nick.toLowerCase());
    if (!player) {
        player = { nick: nick, region: document.getElementById('region-select').value, tiers: {} };
        modesList.forEach(m => player.tiers[m] = 'NONE');
        players.push(player);
    }
    
    player.tiers[document.getElementById('mode-select').value] = document.getElementById('tier-select').value;
    player.region = document.getElementById('region-select').value;
    
    localStorage.setItem('mcTiersData', JSON.stringify(players));
    renderTable();
    alert(`Updated ${nick}. Don't forget to download JSON!`);
}

function deletePlayerFromAdmin() {
    if (!isAdmin) return;
    const nick = document.getElementById('nickname').value.trim();
    players = players.filter(p => p.nick.toLowerCase() !== nick.toLowerCase());
    localStorage.setItem('mcTiersData', JSON.stringify(players));
    renderTable();
    alert('Deleted!');
}

// --- ЭКСПОРТ ДЛЯ GITHUB ---
function downloadJSON() {
    if (!isAdmin) return;
    const dataStr = JSON.stringify(players, null, 4);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'players.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// --- ВИЗУАЛИЗАЦИЯ (ТАБЛИЦА И ПРОФИЛЬ) ---
function switchMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    if (event) event.currentTarget.classList.add('active');
    document.getElementById('tier-header-title').textContent = (mode === 'overall') ? 'ALL TIERS' : 'TIER';
    renderTable();
}

function renderTable() {
    const tbody = document.getElementById('leaderboardBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    const searchVal = document.getElementById('searchBar').value.toLowerCase();
    let displayPlayers = players.filter(p => p.nick.toLowerCase().includes(searchVal));

    if (currentMode === 'overall') { 
        displayPlayers.sort((a, b) => calculatePlayerPoints(b) - calculatePlayerPoints(a)); 
    } else { 
        displayPlayers = displayPlayers.filter(p => p.tiers[currentMode] !== 'NONE'); 
        displayPlayers.sort((a, b) => tierOrder[a.tiers[currentMode]] - tierOrder[b.tiers[currentMode]]); 
    }

    displayPlayers.forEach((player, index) => {
    const tr = document.createElement('tr');
    const points = calculatePlayerPoints(player);
    let tierCellHTML = currentMode === 'overall' ? `<div class="tiers-row">` + modesList.map(m => player.tiers[m] !== 'NONE' ? `<span class="tier-badge ${player.tiers[m]}">${player.tiers[m]}</span>` : '').join('') + `</div>` : `<span class="tier-badge ${player.tiers[currentMode]}">${player.tiers[currentMode]}</span>`;
            
    const lowerNick = player.nick.toLowerCase();
    const skinUrl = `${lowerNick}.png`;

    // Важно: задаем ОДИНАКОВЫЙ URL дважды (для лица и для шлема)
    const headStyle = `background-image: url('${skinUrl}'), url('${skinUrl}'), url('steve.png');`;

    tr.innerHTML = `
        <td>${index + 1}</td>
        <td>
            <div class="player-cell" onclick="openProfile('${player.nick}')">
                <div class="css-head" style="${headStyle}"></div>
                <div>
                    <span class="player-name">${player.nick}</span>
                    <span class="player-title">${getRankTitle(points)} (${points} pts)</span>
                </div>
            </div>
        </td>
        <td><span class="region-badge">${player.region || 'NA'}</span></td>
        <td>${tierCellHTML}</td>
    `;
    
    tbody.appendChild(tr);
});
}

function openProfile(nick) {
    const player = players.find(p => p.nick === nick);
    if (!player) return;
    const points = calculatePlayerPoints(player);
    const sorted = [...players].sort((a, b) => calculatePlayerPoints(b) - calculatePlayerPoints(a));

    document.getElementById('modalNick').textContent = player.nick;
    document.getElementById('modalRole').textContent = getRankTitle(points);
    document.getElementById('modalRank').textContent = (sorted.findIndex(p => p.nick === nick) + 1) + '.';
    document.getElementById('modalPoints').textContent = `(${points} points)`;
    document.getElementById('modalRegion').textContent = player.region || 'NA';

    const skinContainer = document.getElementById("skin_container");
    skinContainer.innerHTML = '';
    drawSkinToCanvas(`${player.nick.toLowerCase()}.png`, skinContainer);

    const grid = document.getElementById('modalTiersGrid');
    grid.innerHTML = '';
    modesList.forEach(m => {
        if (player.tiers[m] !== 'NONE') {
            grid.innerHTML += `<div class="modal-tier-item"><div class="modal-mode-icon"><img src="${modeIcons[m]}" alt=""></div><span class="tier-badge ${player.tiers[m]}">${player.tiers[m]}</span></div>`;
        }
    });

    const overlay = document.getElementById('profileModal');
    overlay.style.display = 'flex';
    setTimeout(() => { overlay.classList.add('active'); }, 10);
}

function closeModalDirect() {
    const overlay = document.getElementById('profileModal');
    overlay.classList.remove('active');
    setTimeout(() => { overlay.style.display = 'none'; }, 200);
}

function closeModal(e) { if (e.target.className.includes('modal-overlay')) closeModalDirect(); }

function drawSkinToCanvas(imgSource, container) {
    const canvas = document.createElement('canvas');
    // Устанавливаем четкие пропорции 1:2
    canvas.width = 16;
    canvas.height = 32;
    canvas.style.width = '120px'; // Можно подправить размер под дизайн
    canvas.style.height = '240px';
    canvas.style.imageRendering = 'pixelated';
    canvas.className = 'modal-skin';
    
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = imgSource;
    
    img.onload = function() {
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Очистка перед отрисовкой
        
        // --- ГОЛОВА ---
        ctx.drawImage(img, 8, 8, 8, 8, 4, 0, 8, 8); // Основа
        ctx.drawImage(img, 40, 8, 8, 8, 4, 0, 8, 8); // Слой шлема
        
        // --- ТЕЛО ---
        ctx.drawImage(img, 20, 20, 8, 12, 4, 8, 8, 12); // Основа
        ctx.drawImage(img, 20, 36, 8, 12, 4, 8, 8, 12); // Слой одежды
        
        // --- ПРАВАЯ РУКА ---
        ctx.drawImage(img, 44, 20, 4, 12, 12, 8, 4, 12);
        if (img.height === 64) ctx.drawImage(img, 44, 36, 4, 12, 12, 8, 4, 12);
        
        // --- ЛЕВАЯ РУКА ---
        if (img.height === 64) {
            ctx.drawImage(img, 36, 52, 4, 12, 0, 8, 4, 12);
            ctx.drawImage(img, 36, 68, 4, 12, 0, 8, 4, 12);
        } else {
            // Зеркалим правую для старых скинов
            ctx.save(); ctx.scale(-1, 1);
            ctx.drawImage(img, 44, 20, 4, 12, -4, 8, 4, 12);
            ctx.restore();
        }
        
        // --- ПРАВАЯ НОГА ---
        ctx.drawImage(img, 4, 20, 4, 12, 8, 20, 4, 12);
        if (img.height === 64) ctx.drawImage(img, 4, 36, 4, 12, 8, 20, 4, 12);
        
        // --- ЛЕВАЯ НОГА ---
        if (img.height === 64) {
            ctx.drawImage(img, 20, 52, 4, 12, 4, 20, 4, 12);
            ctx.drawImage(img, 20, 68, 4, 12, 4, 20, 4, 12);
        } else {
            // Зеркалим правую для старых скинов
            ctx.save(); ctx.scale(-1, 1);
            ctx.drawImage(img, 4, 20, 4, 12, -8, 20, 4, 12);
            ctx.restore();
        }
        
        container.appendChild(canvas);
    };
    
    img.onerror = function() {
        if (imgSource !== 'steve.png') {
            container.innerHTML = '';
            drawSkinToCanvas('steve.png', container);
        }
    };
}

const sBar = document.getElementById('searchBar');
if (sBar) sBar.addEventListener('input', renderTable);

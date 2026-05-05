// --- 1. ГЛОБАЛЬНЫЕ ДАННЫЕ И НАСТРОЙКИ ---
let players = [];
let currentMode = 'overall';
let isAdmin = sessionStorage.getItem('isAdminAuth') === 'true';

const modesList = ['vanilla', 'uhc', 'pot', 'netherop', 'smp', 'sword', 'axe', 'mace'];

const modeIcons = {
    'vanilla': 'icons/vanilla.svg', 'uhc': 'icons/uhc.svg', 'pot': 'icons/pot.svg',
    'netherop': 'icons/nethop.svg', 'smp': 'icons/smp.svg', 'sword': 'icons/sword.svg',
    'axe': 'icons/axe.svg', 'mace': 'icons/mace.svg'
};

const pointsMapping = { 
    'HT1': 60, 'LT1': 45, 'HT2': 30, 'LT2': 20, 'HT3': 10, 
    'LT3': 6, 'HT4': 4, 'LT4': 3, 'HT5': 5, 'LT5': 1, 'NONE': 0 
};

const tierOrder = { 
    'HT1': 1, 'LT1': 2, 'HT2': 3, 'LT2': 4, 'HT3': 5, 
    'LT3': 6, 'HT4': 7, 'LT4': 8, 'HT5': 9, 'LT5': 10, 'NONE': 11 
};

// --- 2. ИНИЦИАЛИЗАЦИЯ ИНТЕРФЕЙСА (Выполняется сразу) ---
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

// --- 3. ПОДКЛЮЧЕНИЕ FIREBASE (С циклом ожидания) ---
function startCloudSync() {
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
        console.log("✅ Firebase connected successfully!");

        window.db.ref('players').on('value', (snapshot) => {
            const data = snapshot.val();
            players = data ? Object.values(data) : [];
            renderTable();
        });
    } else {
        console.log("🔄 Waiting for Firebase SDK to load...");
        setTimeout(startCloudSync, 500);
    }
}
startCloudSync();

// --- 4. ЛОГИКА РАНГОВ И ОЧКОВ ---
function calculatePlayerPoints(player) {
    let total = 0;
    if (!player.tiers) return 0;
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

// --- 5. ОТРИСОВКА СКИНА НА CANVAS (ПОЛНЫЙ КОД) ---
function drawSkinToCanvas(imgSource, container) {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 32;
    canvas.style.width = '100px';
    canvas.style.height = '180px';
    canvas.style.imageRendering = 'pixelated';
    canvas.className = 'modal-skin';
    
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imgSource;
    
    img.onload = function() {
        ctx.imageSmoothingEnabled = false;
        // Голова (Head)
        ctx.drawImage(img, 8, 8, 8, 8, 4, 0, 8, 8);
        ctx.drawImage(img, 40, 8, 8, 8, 4, 0, 8, 8); // Шлем/Слой 2
        
        // Туловище (Body)
        ctx.drawImage(img, 20, 20, 8, 12, 4, 8, 8, 12);
        ctx.drawImage(img, 20, 36, 8, 12, 4, 8, 8, 12); // Слой 2
        
        // Левая рука (Left Arm)
        ctx.drawImage(img, 44, 20, 4, 12, 0, 8, 4, 12);
        ctx.drawImage(img, 52, 52, 4, 12, 0, 8, 4, 12); // Слой 2
        
        // Правая рука (Right Arm)
        if (img.height === 32) { // Старый формат скинов
            ctx.save(); ctx.translate(16, 0); ctx.scale(-1, 1);
            ctx.drawImage(img, 44, 20, 4, 12, 0, 8, 4, 12); ctx.restore();
        } else {
            ctx.drawImage(img, 36, 52, 4, 12, 12, 8, 4, 12);
            ctx.drawImage(img, 52, 68, 4, 12, 12, 8, 4, 12); // Слой 2
        }
        
        // Левая нога (Left Leg)
        ctx.drawImage(img, 4, 20, 4, 12, 4, 20, 4, 12);
        ctx.drawImage(img, 4, 36, 4, 12, 4, 20, 4, 12); // Слой 2
        
        // Правая нога (Right Leg)
        if (img.height === 32) {
            ctx.save(); ctx.translate(16, 0); ctx.scale(-1, 1);
            ctx.drawImage(img, 4, 20, 4, 12, 4, 20, 4, 12); ctx.restore();
        } else {
            ctx.drawImage(img, 20, 52, 4, 12, 8, 20, 4, 12);
            ctx.drawImage(img, 4, 68, 4, 12, 8, 20, 4, 12); // Слой 2
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

// --- 6. РЕНДЕР ТАБЛИЦЫ ---
function renderTable() {
    const tbody = document.getElementById('leaderboardBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    const searchVal = document.getElementById('searchBar').value.toLowerCase();
    let displayPlayers = players.filter(p => p.nick.toLowerCase().includes(searchVal));

    if (currentMode === 'overall') { 
        displayPlayers.sort((a, b) => calculatePlayerPoints(b) - calculatePlayerPoints(a)); 
    } else { 
        displayPlayers = displayPlayers.filter(p => p.tiers && p.tiers[currentMode] !== 'NONE'); 
        displayPlayers.sort((a, b) => tierOrder[a.tiers[currentMode]] - tierOrder[b.tiers[currentMode]]); 
    }

    displayPlayers.forEach((player, index) => {
        const tr = document.createElement('tr');
        const points = calculatePlayerPoints(player);
        const lowerNick = player.nick.toLowerCase();

        let tierCellHTML = '';
        if (currentMode === 'overall') {
            tierCellHTML = `<div class="tiers-row">` + 
                modesList.map(m => (player.tiers && player.tiers[m] !== 'NONE') ? `<span class="tier-badge ${player.tiers[m]}">${player.tiers[m]}</span>` : '').join('') + 
            `</div>`;
        } else {
            tierCellHTML = `<span class="tier-badge ${player.tiers[currentMode]}">${player.tiers[currentMode]}</span>`;
        }

        tr.innerHTML = `
            <td class="rank-num">${index + 1}</td>
            <td>
                <div class="player-cell" onclick="openProfile('${player.nick}')">
                    <div class="css-head" style="background-image: url('${lowerNick}.png'), url('steve.png');"></div>
                    <div>
                        <span class="player-name">${player.nick}</span>
                        <span class="player-title">${getRankTitle(points)} (${points} pts)</span>
                    </div>
                </div>
            </td>
            <td><span class="region-badge">${player.region || 'EU'}</span></td>
            <td>${tierCellHTML}</td>
        `;
        tbody.appendChild(tr);
    });
}

// --- 7. ПРОФИЛЬ И МОДАЛКИ ---
function openProfile(nick) {
    const player = players.find(p => p.nick === nick);
    if (!player) return;

    const sorted = [...players].sort((a, b) => calculatePlayerPoints(b) - calculatePlayerPoints(a));
    const points = calculatePlayerPoints(player);

    document.getElementById('modalNick').textContent = player.nick;
    document.getElementById('modalRole').textContent = getRankTitle(points);
    document.getElementById('modalRank').textContent = (sorted.findIndex(p => p.nick === nick) + 1) + '.';
    document.getElementById('modalPoints').textContent = `(${points} points)`;
    document.getElementById('modalRegion').textContent = player.region || 'EU';

    const skinContainer = document.getElementById("skin_container");
    if (skinContainer) {
        skinContainer.innerHTML = '';
        drawSkinToCanvas(player.nick.toLowerCase() + '.png', skinContainer);
    }

    const grid = document.getElementById('modalTiersGrid');
    if (grid) {
        grid.innerHTML = '';
        modesList.forEach(m => {
            const t = player.tiers ? player.tiers[m] : 'NONE';
            if (t !== 'NONE') {
                grid.innerHTML += `
                    <div class="modal-tier-item">
                        <div class="modal-mode-icon"><img src="${modeIcons[m]}" alt=""></div>
                        <span class="tier-badge ${t}">${t}</span>
                    </div>`;
            }
        });
    }

    const overlay = document.getElementById('profileModal');
    overlay.style.display = 'flex';
    setTimeout(() => overlay.classList.add('active'), 10);
}

function closeLoginDirect() { document.getElementById('loginModal').style.display = 'none'; }
function closeModalDirect() {
    const o = document.getElementById('profileModal');
    o.classList.remove('active');
    setTimeout(() => o.style.display = 'none', 200);
}

// --- 8. АДМИН-ПАНЕЛЬ (УПРАВЛЕНИЕ) ---
function tryLogin() {
    const user = document.getElementById('adminUser').value;
    const pass = document.getElementById('adminPass').value;
    if (user === 'legendgaymer92' && pass === 'skibididemon999') {
        isAdmin = true;
        sessionStorage.setItem('isAdminAuth', 'true');
        closeLoginDirect();
        document.getElementById('adminPanel').style.display = 'block';
    } else { alert('Access Denied!'); }
}

function logoutAdmin() {
    isAdmin = false;
    sessionStorage.removeItem('isAdminAuth');
    document.getElementById('adminPanel').style.display = 'none';
}

function savePlayer(e) {
    if (e) e.preventDefault();
    if (!isAdmin || !window.db) return;
    
    const nickInput = document.getElementById('nickname');
    const nick = nickInput.value.trim();
    if (!nick) return;

    let player = players.find(p => p.nick.toLowerCase() === nick.toLowerCase());
    if (!player) {
        player = { nick: nick, region: document.getElementById('region-select').value, tiers: {} };
        modesList.forEach(m => player.tiers[m] = 'NONE');
    }
    
    player.tiers[document.getElementById('mode-select').value] = document.getElementById('tier-select').value;
    player.region = document.getElementById('region-select').value;
    
    window.db.ref('players/' + nick.toLowerCase()).set(player).then(() => {
        nickInput.value = '';
    });
}

function deletePlayerFromAdmin() {
    if (!isAdmin || !window.db) return;
    const nick = document.getElementById('nickname').value.trim();
    if (nick) window.db.ref('players/' + nick.toLowerCase()).remove();
}

function switchMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.currentTarget) event.currentTarget.classList.add('active');
    document.getElementById('tier-header-title').textContent = (mode === 'overall') ? 'ALL TIERS' : 'TIER';
    renderTable();
}

// --- 9. ОБРАБОТЧИКИ СОБЫТИЙ ---
document.addEventListener('keydown', (e) => {
    if (e.code === 'Backquote') {
        if (!isAdmin) {
            document.getElementById('loginModal').style.display = 'flex';
        } else {
            const p = document.getElementById('adminPanel');
            p.style.display = (p.style.display === 'none') ? 'block' : 'none';
        }
    }
});

const sBar = document.getElementById('searchBar');
if (sBar) sBar.addEventListener('input', renderTable);

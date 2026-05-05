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
        if (response.ok) {
            players = await response.json();
        } else {
            players = JSON.parse(localStorage.getItem('mcTiersData')) || [];
        }
    } catch (e) {
        players = JSON.parse(localStorage.getItem('mcTiersData')) || [];
    }
    renderTable();
    generateActivity(); // Запуск ленты
}
loadData();

// --- ИНТЕРФЕЙС ---
const navCont = document.getElementById('modesNav');
if (navCont) {
    navCont.innerHTML = `<button class="mode-btn active" onclick="switchMode('overall')">🏆<br>Overall</button>`;
    modesList.forEach(m => {
        const label = m === 'netherop' ? 'NethOP' : m.charAt(0).toUpperCase() + m.slice(1);
        navCont.innerHTML += `<button class="mode-btn" onclick="switchMode('${m}')"><img src="${modeIcons[m]}" alt="">${label}</button>`;
    });
}

const mSelect = document.getElementById('mode-select');
if (mSelect) {
    modesList.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m; opt.textContent = m.toUpperCase();
        mSelect.appendChild(opt);
    });
}

// --- ФУНКЦИИ ТАБЛИЦЫ ---
function renderTable() {
    const tbody = document.getElementById('leaderboardBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const sVal = document.getElementById('searchBar').value.toLowerCase();
    let display = players.filter(p => p.nick.toLowerCase().includes(sVal));

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
        
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>
                <div class="player-cell" onclick="openProfile('${p.nick}')">
                    <div class="css-head" style="background-image: url('${p.nick.toLowerCase()}.png'), url('steve.png');"></div>
                    <div><span class="player-name">${p.nick}</span><span class="player-title">${getRankTitle(pts)} (${pts} pts)</span></div>
                </div>
            </td>
            <td><span class="region-badge">${p.region || 'NA'}</span></td>
            <td>${tCell}</td>
        `;
        tbody.appendChild(tr);
    });
}

// --- ЛЕНТА АКТИВНОСТИ ---
function generateActivity() {
    const feed = document.getElementById('activityFeed');
    if (!feed || players.length === 0) return;
    const recent = players.slice(-4).reverse();
    feed.innerHTML = recent.map(p => {
        const modes = Object.keys(p.tiers).filter(m => p.tiers[m] !== 'NONE');
        const m = modes[Math.floor(Math.random() * modes.length)] || 'vanilla';
        return `<div class="activity-item">
            <span class="act-nick" onclick="openProfile('${p.nick}')">${p.nick}</span> 
            got <span class="tier-badge ${p.tiers[m]}">${p.tiers[m]}</span> in ${m}
            <span class="act-time">${Math.floor(Math.random()*40)+5}m ago</span>
        </div>`;
    }).join('');
}

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (Сохранение, Профиль и т.д.) ---
function calculatePlayerPoints(p) { let t = 0; modesList.forEach(m => t += pointsMapping[p.tiers[m]] || 0); return t; }
function getRankTitle(pts) { if(pts>=400) return 'Grandmaster'; if(pts>=250) return 'Master'; if(pts>=100) return 'Ace'; return 'Rookie'; }

function downloadJSON() {
    const blob = new Blob([JSON.stringify(players, null, 4)], {type: 'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'players.json'; a.click();
}

function savePlayer(e) {
    if(e) e.preventDefault();
    const nick = document.getElementById('nickname').value.trim();
    if(!nick) return;
    let p = players.find(x => x.nick.toLowerCase() === nick.toLowerCase());
    if(!p) { p = {nick: nick, region: document.getElementById('region-select').value, tiers: {}}; modesList.forEach(m => p.tiers[m]='NONE'); players.push(p); }
    p.tiers[document.getElementById('mode-select').value] = document.getElementById('tier-select').value;
    localStorage.setItem('mcTiersData', JSON.stringify(players));
    renderTable();
}

// Логика модалок и отрисовка скина (твои предыдущие функции) остаются без изменений
// (Просто добавь сюда свои openProfile, drawSkinToCanvas и обработчики логина из прошлого кода)

function switchMode(mode) {
    const tbody = document.getElementById('leaderboardBody');
    currentMode = mode;
    
    // Обновляем активную кнопку в навигации
    const navCont = document.getElementById('modesNav');
    if (navCont) {
        navCont.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    }
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
    
    // Обновляем заголовок
    const headerTitle = document.getElementById('tier-header-title');
    if (headerTitle) {
        headerTitle.textContent = (mode === 'overall') ? 'ALL TIERS' : mode.toUpperCase();
    }

    if (tbody) {
        // Убираем анимацию, если она была
        tbody.classList.remove('fade-in-up');
        
        // Перерисовываем таблицу
        renderTable();
        
        // Маленький хак для перезапуска анимации браузером
        void tbody.offsetWidth; 
        
        // Добавляем анимацию снова
        tbody.classList.add('fade-in-up');
    } else {
        renderTable();
    }
}

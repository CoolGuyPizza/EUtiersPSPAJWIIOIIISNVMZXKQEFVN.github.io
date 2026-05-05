let players = [];
let currentMode = 'overall';
let isAdmin = sessionStorage.getItem('isAdminAuth') === 'true';

const modesList = ['vanilla', 'uhc', 'pot', 'netherop', 'smp', 'sword', 'axe', 'mace'];
const modeIcons = { 'vanilla': 'icons/vanilla.svg', 'uhc': 'icons/uhc.svg', 'pot': 'icons/pot.svg', 'netherop': 'icons/nethop.svg', 'smp': 'icons/smp.svg', 'sword': 'icons/sword.svg', 'axe': 'icons/axe.svg', 'mace': 'icons/mace.svg' };

// --- 1. ЗАГРУЗКА ---
async function init() {
    try {
        const res = await fetch('players.json?v=' + Date.now());
        players = await res.json();
    } catch (e) {
        players = JSON.parse(localStorage.getItem('backup_players')) || [];
    }
    renderTable();
}

// --- 2. ИНТЕРФЕЙС ---
const nav = document.getElementById('modesNav');
nav.innerHTML = `<button class="mode-btn active" onclick="switchMode('overall')">🏆<br>Overall</button>`;
modesList.forEach(m => { nav.innerHTML += `<button class="mode-btn" onclick="switchMode('${m}')"><img src="${modeIcons[m]}">${m.toUpperCase()}</button>`; });

const sel = document.getElementById('mode-select');
modesList.forEach(m => { const o = document.createElement('option'); o.value = m; o.textContent = m.toUpperCase(); sel.appendChild(o); });

// --- 3. ФУНКЦИИ ---
function renderTable() {
    const tbody = document.getElementById('leaderboardBody');
    tbody.innerHTML = '';
    let display = players.filter(p => p.nick.toLowerCase().includes(document.getElementById('searchBar').value.toLowerCase()));
    
    display.forEach((p, i) => {
        const tr = document.createElement('tr');
        const lower = p.nick.toLowerCase();
        let tHTML = `<div class="tiers-row">` + modesList.map(m => p.tiers[m] && p.tiers[m] !== 'NONE' ? `<span class="tier-badge ${p.tiers[m]}">${p.tiers[m]}</span>` : '').join('') + `</div>`;
        tr.innerHTML = `<td>${i+1}</td><td><div class="player-cell" onclick="openProfile('${p.nick}')"><div class="css-head" style="background-image: url('${lower}.png'), url('steve.png');"></div><span class="player-name">${p.nick}</span></div></td><td><span class="region-badge">${p.region || 'EU'}</span></td><td>${tHTML}</td>`;
        tbody.appendChild(tr);
    });
}

function savePlayer(e) {
    e.preventDefault();
    const nick = document.getElementById('nickname').value.trim();
    if (!nick) return;
    let p = players.find(x => x.nick.toLowerCase() === nick.toLowerCase()) || { nick: nick, tiers: {} };
    p.tiers[document.getElementById('mode-select').value] = document.getElementById('tier-select').value;
    p.region = document.getElementById('region-select').value;
    if (!players.includes(p)) players.push(p);
    localStorage.setItem('backup_players', JSON.stringify(players));
    renderTable();
}

function exportJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(players, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", "players.json");
    dlAnchor.click();
}

function switchMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b.innerHTML.toLowerCase().includes(mode)));
    renderTable();
}

function openProfile(nick) {
    const p = players.find(x => x.nick === nick);
    document.getElementById('modalNick').textContent = p.nick;
    const grid = document.getElementById('modalTiersGrid');
    grid.innerHTML = modesList.map(m => p.tiers[m] && p.tiers[m] !== 'NONE' ? `<div class="modal-tier-item"><span class="tier-badge ${p.tiers[m]}">${p.tiers[m]}</span></div>` : '').join('');
    document.getElementById('profileModal').style.display = 'flex';
}

document.addEventListener('keydown', (e) => { if (e.code === 'Backquote') document.getElementById('adminPanel').style.display = document.getElementById('adminPanel').style.display === 'none' ? 'block' : 'none'; });
document.getElementById('searchBar').addEventListener('input', renderTable);
init();

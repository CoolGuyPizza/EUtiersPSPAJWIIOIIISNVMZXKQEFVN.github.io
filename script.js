let players = JSON.parse(localStorage.getItem('mcTiersData')) || [];
let currentMode = 'overall';

const modesList = ['vanilla', 'uhc', 'pot', 'netherop', 'smp', 'sword', 'axe', 'mace'];

const modeIcons = {
    'vanilla': 'icons/vanilla.svg',
    'uhc': 'icons/uhc.svg',
    'pot': 'icons/pot.svg',
    'netherop': 'icons/nethop.svg',
    'smp': 'icons/smp.svg',
    'sword': 'icons/sword.svg',
    'axe': 'icons/axe.svg',
    'mace': 'icons/mace.svg'
};

const pointsMapping = { 'HT1': 60, 'LT1': 45, 'HT2': 30, 'LT2': 20, 'HT3': 10, 'LT3': 6, 'HT4': 4, 'LT4': 3, 'HT5': 5, 'LT5': 1, 'NONE': 0 };
const tierOrder = { 'HT1': 1, 'LT1': 2, 'HT2': 3, 'LT2': 4, 'HT3': 5, 'LT3': 6, 'HT4': 7, 'LT4': 8, 'HT5': 9, 'LT5': 10, 'NONE': 11 };

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
        option.value = m;
        option.textContent = m.toUpperCase();
        modeSelect.appendChild(option);
    });
}

document.addEventListener('keydown', function(e) {
    if (e.key === '`' || e.key === '~' || e.key === 'ё' || e.key === 'Ё') {
        const panel = document.getElementById('adminPanel');
        if (panel) {
            panel.style.display = (panel.style.display === 'none' || panel.style.display === '') ? 'block' : 'none';
        }
    }
});

function getRankTitle(points) {
    if (points >= 400) return 'Combat Grandmaster';
    if (points >= 250) return 'Combat Master';
    if (points >= 100) return 'Combat Ace';
    if (points >= 50) return 'Combat Specialist';
    if (points >= 20) return 'Combat Cadet';
    if (points >= 10) return 'Combat Novice';
    return 'Rookie';
}

function calculatePlayerPoints(player) {
    let total = 0;
    modesList.forEach(m => { total += pointsMapping[player.tiers[m]] || 0; });
    return total;
}

function switchMode(mode) {
    currentMode = mode;
    if (navCont) {
        navCont.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    }
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
    const headerTitle = document.getElementById('tier-header-title');
    if (headerTitle) {
        headerTitle.textContent = (mode === 'overall') ? 'ALL TIERS' : 'TIER';
    }
    renderTable();
}

function savePlayer(event) {
    if (event) event.preventDefault(); 
    
    const nickInput = document.getElementById('nickname');
    const modeSelectEl = document.getElementById('mode-select');
    const tierSelectEl = document.getElementById('tier-select');
    const regionSelectEl = document.getElementById('region-select');
    
    const nick = nickInput.value.trim();
    const mode = modeSelectEl.value;
    const tier = tierSelectEl.value;
    const region = regionSelectEl.value;
    
    if (!nick) { alert('Введите ник!'); return; }

    let player = players.find(p => p.nick.toLowerCase() === nick.toLowerCase());
    
    if (!player) {
        player = { nick: nick, region: region, tiers: {} };
        modesList.forEach(m => player.tiers[m] = 'NONE');
        players.push(player);
    }
    
    player.tiers[mode] = tier;
    player.region = region;
    
    localStorage.setItem('mcTiersData', JSON.stringify(players));
    nickInput.value = '';
    renderTable();
    alert(`Игрок ${nick} успешно добавлен!`);
}

function deletePlayerFromAdmin() {
    const nickInput = document.getElementById('nickname');
    const nick = nickInput.value.trim();
    if (!nick) { alert('Введите ник игрока для удаления!'); return; }
    players = players.filter(p => p.nick.toLowerCase() !== nick.toLowerCase());
    localStorage.setItem('mcTiersData', JSON.stringify(players));
    nickInput.value = '';
    renderTable();
}

function openProfile(nick) {
    const player = players.find(p => p.nick === nick);
    if (!player) return;

    const sorted = [...players].sort((a, b) => calculatePlayerPoints(b) - calculatePlayerPoints(a));
    const rankIndex = sorted.findIndex(p => p.nick === nick) + 1;
    const points = calculatePlayerPoints(player);

    document.getElementById('modalNick').textContent = player.nick;
    document.getElementById('modalRole').textContent = getRankTitle(points);
    document.getElementById('modalRank').textContent = rankIndex + '.';
    document.getElementById('modalPoints').textContent = `(${points} points)`;
    document.getElementById('modalRegion').textContent = player.region || 'NA';
    
    const skinImg = document.getElementById('modalImg');
    
    if (skinImg) {
        skinImg.src = 'https://mc-heads.net' + player.nick + '/180';
        skinImg.onerror = function() {
            skinImg.onerror = null;
            skinImg.src = 'https://mc-heads.netSteve/180';
        };
    }

    const grid = document.getElementById('modalTiersGrid');
    if (grid) {
        grid.innerHTML = '';
        modesList.forEach(m => {
            const t = player.tiers[m];
            if (t !== 'NONE') {
                const item = document.createElement('div');
                item.className = 'modal-tier-item';
                item.innerHTML = `
                    <div class="modal-mode-icon"><img src="${modeIcons[m]}" alt=""></div>
                    <span class="tier-badge ${t}">${t}</span>
                `;
                grid.appendChild(item);
            }
        });
        
        if (grid.innerHTML === '') {
            grid.innerHTML = '<span style="color: #7b8394; font-size: 13px; font-weight: 700;">У игрока нет выданных тиров</span>';
        }
    }

    const overlay = document.getElementById('profileModal');
    if (overlay) {
        overlay.style.display = 'flex';
        setTimeout(() => { overlay.classList.add('active'); }, 10);
    }
}

function closeModalDirect() {
    const overlay = document.getElementById('profileModal');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => { overlay.style.display = 'none'; }, 200);
    }
}

function closeModal(e) { if (e.target.className.includes('modal-overlay')) { closeModalDirect(); } }

function renderTable() {
    const tbody = document.getElementById('leaderboardBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    const searchBar = document.getElementById('searchBar');
    const searchVal = searchBar ? searchBar.value.toLowerCase() : '';
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
        
        let tierCellHTML = '';
        if (currentMode === 'overall') {
            tierCellHTML = `<div class="tiers-row">`;
            modesList.forEach(m => {
                const t = player.tiers[m];
                if (t !== 'NONE') tierCellHTML += `<span class="tier-badge ${t}">${t}</span>`;
            });
            tierCellHTML += `</div>`;
        } else {
            const t = player.tiers[currentMode];
            tierCellHTML = `<span class="tier-badge ${t}">${t}</span>`;
        }

        tr.innerHTML = '<td>' + (index + 1) + '</td><td><div class="player-cell" onclick="openProfile(\'' + player.nick + '\')"><img src="https://mc-heads.net' + player.nick + '/32" alt="' + player.nick + '" onerror="this.onerror=null;this.src=\'https://mc-heads.netSteve/32\';"><div><span class="player-name">' + player.nick + '</span><span class="player-title">' + getRankTitle(points) + ' (' + points + ' pts)</span></div></div></td><td><span class="region-badge">' + (player.region || 'NA') + '</span></td><td>' + tierCellHTML + '</td>';
        
        tbody.appendChild(tr);
    });
}

const searchBarEl = document.getElementById('searchBar');
if (searchBarEl) {
    searchBarEl.addEventListener('input', renderTable);
}

renderTable();

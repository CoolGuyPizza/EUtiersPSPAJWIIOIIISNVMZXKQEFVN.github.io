// --- 1. ТВОИ ДАННЫЕ (УЖЕ ЗАПОЛНЕНЫ ТОБОЙ) ---
const GH_TOKEN = "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"; 
const GH_OWNER = "CoolGuyPizza";
const GH_REPO = "EUTIERSPSPAJWIIOIIISNVMZXKQEFVN.github.io";
const GH_PATH = "players.json";

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

// --- 2. ЗАГРУЗКА И СИНХРОНИЗАЦИЯ С GITHUB ---

// Загрузка данных при старте
async function loadData() {
    try {
        // Используем обратные кавычки `` для правильной подстановки переменных
        const url = `https://githubusercontent.com{GH_OWNER}/${GH_REPO}/main/${GH_PATH}?v=${new Date().getTime()}`;
        const response = await fetch(url);
        if (response.ok) {
            players = await response.json();
            console.log("✅ Данные загружены:", players);
            renderTable();
        } else {
            console.error("❌ Файл players.json не найден или пуст.");
        }
    } catch (e) {
        console.error("❌ Ошибка сети при загрузке:", e);
    }
}

// Сохранение в GitHub
async function syncToGitHub() {
    try {
        // Получаем текущую версию файла (SHA), чтобы GitHub разрешил обновление
        const getUrl = `https://github.com{GH_OWNER}/${GH_REPO}/contents/${GH_PATH}`;
        const res = await fetch(getUrl, {
            headers: { "Authorization": `token ${GH_TOKEN}` }
        });
        const fileInfo = await res.json();

        // Кодируем данные в Base64 (требование GitHub API)
        const content = btoa(unescape(encodeURIComponent(JSON.stringify(players, null, 2))));

        const putResponse = await fetch(getUrl, {
            method: "PUT",
            headers: {
                "Authorization": `token ${GH_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: "Update leaderboard",
                content: content,
                sha: fileInfo.sha
            })
        });

        if (putResponse.ok) {
            console.log("✅ GitHub обновлен успешно!");
        } else {
            const errData = await putResponse.json();
            alert("Ошибка сохранения: " + errData.message);
        }
    } catch (e) {
        console.error("❌ Критическая ошибка синхронизации:", e);
    }
}

// --- 3. ИНИЦИАЛИЗАЦИЯ ИНТЕРФЕЙСА ---

function initUI() {
    const nav = document.getElementById('modesNav');
    if (nav) {
        let html = `<button class="mode-btn active" onclick="switchMode('overall')">🏆<br>Overall</button>`;
        modesList.forEach(m => {
            const label = m === 'netherop' ? 'NethOP' : m.charAt(0).toUpperCase() + m.slice(1);
            html += `<button class="mode-btn" onclick="switchMode('${m}')"><img src="${modeIcons[m]}">${label}</button>`;
        });
        nav.innerHTML = html;
    }
    const sel = document.getElementById('mode-select');
    if (sel) {
        modesList.forEach(m => {
            const o = document.createElement('option');
            o.value = m; o.textContent = m.toUpperCase();
            sel.appendChild(o);
        });
    }
    loadData(); // Загружаем данные сразу после создания UI
}

// --- 4. ОСНОВНЫЕ ФУНКЦИИ ---

function renderTable() {
    const tbody = document.getElementById('leaderboardBody');
    if (!tbody) return;
    tbody.innerHTML = '';
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
    const p = players.find(x => x.nick === nick);
    if (!p) return; // Защита от зависания: если игрока нет, ничего не делаем

    const pts = calculatePlayerPoints(p);
    const sorted = [...players].sort((a,b) => calculatePlayerPoints(b) - calculatePlayerPoints(a));

    document.getElementById('modalNick').textContent = p.nick;
    document.getElementById('modalRole').textContent = getRankTitle(pts);
    document.getElementById('modalRank').textContent = (sorted.findIndex(x => x.nick === nick) + 1) + '.';
    document.getElementById('modalPoints').textContent = `(${pts} points)`;
    document.getElementById('modalRegion').textContent = p.region || 'EU';
    
    const skinC = document.getElementById("skin_container");
    if (skinC) {
        skinC.innerHTML = ''; 
        drawSkinToCanvas(p.nick.toLowerCase() + '.png', skinC);
    }

    const grid = document.getElementById('modalTiersGrid');
    grid.innerHTML = '';
    modesList.forEach(m => { if (p.tiers && p.tiers[m] !== 'NONE') grid.innerHTML += `<div class="modal-tier-item"><img src="${modeIcons[m]}" width="14"><span class="tier-badge ${p.tiers[m]}">${p.tiers[m]}</span></div>`; });

    document.getElementById('profileModal').style.display = 'flex';
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
        players.push(p);
    }
    p.tiers[document.getElementById('mode-select').value] = document.getElementById('tier-select').value;
    p.region = document.getElementById('region-select').value;

    renderTable();
    syncToGitHub(); // Отправляем изменения в GitHub
    document.getElementById('nickname').value = '';
}

// --- 5. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

function calculatePlayerPoints(p) {
    let t = 0; if(!p.tiers) return 0;
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
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.toggle('active', btn.innerHTML.toLowerCase().includes(mode) || (mode==='overall' && btn.innerHTML.includes('Overall'))));
    renderTable();
}

function drawSkinToCanvas(imgSource, container) {
    const canvas = document.createElement('canvas');
    canvas.width = 16; canvas.height = 32;
    canvas.style.width = '100px'; canvas.style.height = '180px';
    canvas.style.imageRendering = 'pixelated';
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imgSource;
    img.onload = () => {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 8, 8, 8, 8, 4, 0, 8, 8); // Head
        ctx.drawImage(img, 20, 20, 8, 12, 4, 8, 8, 12); // Body
        container.appendChild(canvas);
    };
    img.onerror = () => { if (imgSource !== 'steve.png') drawSkinToCanvas('steve.png', container); };
}

function tryLogin() {
    if (document.getElementById('adminUser').value === 'legendgaymer92' && document.getElementById('adminPass').value === 'skibididemon999') {
        isAdmin = true; sessionStorage.setItem('isAdminAuth', 'true');
        document.getElementById('loginModal').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
    } else alert('Wrong password!');
}

function closeLoginDirect() { document.getElementById('loginModal').style.display = 'none'; }
function closeModalDirect() { document.getElementById('profileModal').style.display = 'none'; }

document.addEventListener('keydown', (e) => {
    if (e.code === 'Backquote') {
        if (!isAdmin) document.getElementById('loginModal').style.display = 'flex';
        else document.getElementById('adminPanel').style.display = document.getElementById('adminPanel').style.display === 'none' ? 'block' : 'none';
    }
});

document.getElementById('searchBar').addEventListener('input', renderTable);

// ЗАПУСК
initUI();

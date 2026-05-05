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

// --- 1. ПРИНУДИТЕЛЬНОЕ ЗАПОЛНЕНИЕ UI (СРАЗУ) ---
function initUI() {
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
}
initUI();

// --- 2. FIREBASE (ПОДКЛЮЧЕНИЕ) ---
function startCloud() {
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
        console.log("✅ Firebase Ready!");

        window.db.ref('players').on('value', (snapshot) => {
            const data = snapshot.val();
            players = data ? Object.values(data) : [];
            renderTable();
        });
    } else {
        console.log("🔄 Waiting for Firebase SDK...");
        setTimeout(startCloud, 500);
    }
}
startCloud();

// --- 3. ФУНКЦИИ УПРАВЛЕНИЯ ---
function savePlayer(e) {
    if (e) e.preventDefault();
    if (!isAdmin || !window.db) return;
    const nick = document.getElementById('nickname').value.trim();
    if (!nick) return;

    let p = players.find(x => x.nick.toLowerCase() === nick.toLowerCase()) || { nick: nick, region: document.getElementById('region-select').value, tiers: {} };
    modesList.forEach(m => { if(!p.tiers[m]) p.tiers[m] = 'NONE'; });
    

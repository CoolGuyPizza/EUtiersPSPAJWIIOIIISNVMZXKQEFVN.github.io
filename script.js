// Ждем полной загрузки страницы
window.onload = function() {
    const tbody = document.getElementById('leaderboardBody');
    
    if (tbody) {
        tbody.innerHTML = ''; // Очищаем таблицу
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="rank-num">1</td>
            <td>
                <div class="player-cell"> 
                    <!-- Запрос 3D головы игрока janekv -->
                    <img src="https://mc-heads.net" alt="janekv">
                    <div>
                        <span class="player-name">janekv</span>
                        <span class="player-title">Combat Ace (245 pts)</span>
                    </div>
                </div>
            </td>
            <td><span class="region-badge">EU</span></td>
            <td><span class="tier-badge HT2">HT2</span></td>
        `;
        tbody.appendChild(tr);
    } else {
        alert('Ошибка: Не найден элемент с id="leaderboardBody" в HTML!');
    }
};

const apiUrl = 'https://script.google.com/macros/s/AKfycbw0V2iYm5m1Uw_1sX39rtq5CgG9XFAZwsYvV6pdnb-346KtOE6D_ndSikqbN0GZjioe/exec';
const kanbanBoard = document.getElementById('kanban-board');

const columns = {
    "Planejamento da Contratação": [],
    "Seleção de Fornecedor": [],
    "Gestão do Contrato": []
};

const columnDetails = {
    "Planejamento da Contratação": { emoji: '📝', className: 'kanban-column-planejamento' },
    "Seleção de Fornecedor": { emoji: '🤝', className: 'kanban-column-selecao' },
    "Gestão do Contrato": { emoji: '📄', className: 'kanban-column-gestao' }
};

async function fetchData() {
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        renderBoard(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        kanbanBoard.innerHTML = '<p>Erro ao carregar dados. Tente novamente mais tarde.</p>';
    }
}

function formatProcesso(processo) {
    if (!processo) return '';
    const s = String(processo);
    // Remove first 6 characters then trim leading zeros
    const formatted = s.length > 6 ? s.substring(6) : s;
    return formatted.replace(/^0+/, '');
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date)) return dateString; // Return original string if invalid
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function formatCurrency(value) {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
}

function getStatusClass(status) {
    if (!status) return 'status-default';
    const normalizedStatus = status.toLowerCase().replace(/\s+/g, '-');
    switch (normalizedStatus) {
        case 'concluída':
        case 'contratado':
            return 'status-contratado';
        case 'em-andamento':
            return 'status-em-andamento';
        case 'em-planejamento':
            return 'status-planejamento';
        case 'deserto':
            return 'status-deserto';
        case 'fracassado':
            return 'status-fracassado';
        case 'suspenso':
            return 'status-suspenso';
        default:
            return 'status-default';
    }
}

function isCurrency(key) {
    const lowerKey = key.toLowerCase();
    return lowerKey.includes('valor') || lowerKey.includes('investimento') || lowerKey.includes('estimativa') || lowerKey.includes('empenhado') || lowerKey.includes('custeio');
}

function renderBoard(data) {
    // Clear existing columns data
    for (const column in columns) {
        columns[column] = [];
    }

    // Group data into columns
    if (Array.isArray(data)) {
        data.forEach(item => {
            if (columns.hasOwnProperty(item["Fase Atual"])) {
                columns[item["Fase Atual"]].push(item);
            }
        });
    }

    // Clear the board
    kanbanBoard.innerHTML = '';

    // Render columns and cards
    for (const columnName in columns) {
        const columnEl = document.createElement('div');
        const details = columnDetails[columnName];
        columnEl.className = `kanban-column ${details.className}`;

    const titleEl = document.createElement('h2');
    titleEl.innerHTML = `<span class="icon">${details.emoji}</span> <span class="col-title">${columnName}</span>`;
        columnEl.appendChild(titleEl);

        columns[columnName].forEach(item => {
            const cardEl = document.createElement('div');
            cardEl.className = 'kanban-card';

            const processoOriginal = item["Processo Administrativo"];
            // Handle multiple processo values: sanitize each (remove first 6 chars + leading zeros)
            // and create a link for each one using the sanitized number in the id parameter.
            let sanitizedParts = [];
            let processoLinksHtml = '';
            if (processoOriginal) {
                const parts = String(processoOriginal).trim().split(/\s+/);
                sanitizedParts = parts.map(p => formatProcesso(p)).filter(Boolean);
                processoLinksHtml = sanitizedParts.map(sp => {
                    const url = `https://proad-v2.tjgo.jus.br/proad/processo/cadastro?id=${encodeURIComponent(sp)}`;
                    return `<a href="${url}" target="_blank"><strong>${sp}</strong></a>`;
                }).join('<br>');
            }

            const dataFormatada = formatDate(item["Data Contrato"]);
            const statusClass = getStatusClass(item["Status"]);
            const duracao = item["Duração (dias)"] && item["Duração (dias)"] >= 0 ? `${item["Duração (dias)"]} dias` : '';

            // Create details list
            const excludedKeys = ["Processo Administrativo", "Andamento - Objeto resumido", "Data Contrato", "Status", "Duração (dias)", "Fase Atual"];
            let detailsHtml = '';
            for (const key in item) {
                if (!excludedKeys.includes(key) && item[key]) {
                    let value = item[key];
                    if (key.toLowerCase().includes('data')) {
                        value = formatDate(value);
                    } else if (isCurrency(key)) {
                        value = formatCurrency(value);
                    }
                    detailsHtml += `<div class="detail-item"><span class="detail-key">${key}</span><span class="detail-value">${value}</span></div>`;
                }
            }

            cardEl.innerHTML = `
                <div class="kanban-card-header">
                    ${processoLinksHtml ? `<div class="processo-links">${processoLinksHtml}</div>` : ''}
                    ${duracao ? `<span class="duration-badge">${duracao}</span>` : ''}
                </div>
                <div class="kanban-card-body">
                    ${item["Andamento - Objeto resumido"]}
                </div>
                <div class="kanban-card-footer">
                    <span>${dataFormatada}</span>
                    <span class="status-badge ${statusClass}">${item["Status"]}</span>
                </div>
                <div class="kanban-card-details">${detailsHtml}</div>
                <div class="expand-btn">Ver mais</div>
            `;
            const expandedKey = item['Item no Plano de Contratações'] || (sanitizedParts && sanitizedParts.length ? sanitizedParts.join(' / ') : processoOriginal) || '';
            if (expandedKey) cardEl.dataset.expandedKey = expandedKey;
            columnEl.appendChild(cardEl);
        });

        kanbanBoard.appendChild(columnEl);
    }
    restoreExpandState();
    addExpandListeners();
}

function addExpandListeners() {
    const expandBtns = document.querySelectorAll('.expand-btn');
    expandBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const details = btn.previousElementSibling;
            const card = btn.closest('.kanban-card');
            const key = card ? card.dataset.expandedKey : null;
            if (details.style.display === 'grid') {
                details.style.display = 'none';
                btn.textContent = 'Ver mais';
                if (key) localStorage.setItem('expanded::' + key, 'false');
            } else {
                details.style.display = 'grid';
                btn.textContent = 'Ver menos';
                if (key) localStorage.setItem('expanded::' + key, 'true');
            }
        });
    });
}

// Persist expand/collapse state using localStorage
function restoreExpandState() {
    const cards = document.querySelectorAll('.kanban-card');
    cards.forEach(card => {
        const key = card.dataset.expandedKey;
        const details = card.querySelector('.kanban-card-details');
        const btn = card.querySelector('.expand-btn');
        if (!key || !details || !btn) return;
        const saved = localStorage.getItem('expanded::' + key);
        if (saved === 'true') {
            details.style.display = 'grid';
            btn.textContent = 'Ver menos';
        } else {
            details.style.display = 'none';
            btn.textContent = 'Ver mais';
        }
    // Do not attach click handler here to avoid duplicates; addExpandListeners will manage persistence
    });
}

// Initial fetch
fetchData();

// Fetch data every 30 seconds
setInterval(fetchData, 30000);

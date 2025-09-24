const apiUrl = 'https://script.google.com/macros/s/AKfycbw0V2iYm5m1Uw_1sX39rtq5CgG9XFAZwsYvV6pdnb-346KtOE6D_ndSikqbN0GZjioe/exec';
const kanbanBoard = document.getElementById('kanban-board');

const columns = {
    "1 - CCA / Gestor - Planejamento/Diligência": [],
    "1.1 - Financeira - Apuração Índice Reajuste": [],
    "2 - Geral - Atesto - Conveniência / Oportunidade": [],
    "3 - Contratações - Orçamento / Mapa Estimativo": [],
    "4 - Contratações/Geral - Relatório da Contratação": [],
    "5 - Financeira - Disponibilidade orçamentária": [],
    "6 - Elaboração Editais - Minuta do Edital": [],
    "7 - Geral - Parecer / Autorização": [],
    "8 - Licitação - Seleção de Fornecedor": [],
    "9 - Financeira - Emissão Empenho": [],
    "10 - Geral/Financeira - Assinatura Contrato / Publicação Extrato / Cadastro Contratosgov": []
};

const columnDetails = {
    "1 - CCA / Gestor - Planejamento/Diligência": { title: "<h5>CCA / Gestor</h5>Planejamento<br>Diligência", icon: 'bi-clipboard-check', className: 'kanban-column-default-0' },
    "1.1 - Financeira - Apuração Índice Reajuste": { title: "<h5>Financeira</h5>Apuração<br>Índice Reajuste", icon: 'bi-calculator', className: 'kanban-column-default-1' },
    "2 - Geral - Atesto - Conveniência / Oportunidade": { title: "<h5>Geral</h5>Atesto<br>Conv/Oport", icon: 'bi-file-earmark-text', className: 'kanban-column-default-2' },
    "3 - Contratações - Orçamento / Mapa Estimativo": { title: "<h5>Contratações</h5>Orçamento<br>Mapa Estimativo", icon: 'bi-cash-stack', className: 'kanban-column-default-3' },
    "4 - Contratações/Geral - Relatório da Contratação": { title: "<h5>Geral</h5>Relatório<br>Contratação", icon: 'bi-journal-text', className: 'kanban-column-default-4' },
    "5 - Financeira - Disponibilidade orçamentária": { title: "<h5>Financeira</h5>Disponibilidade<br>Orçamentária", icon: 'bi-bank', className: 'kanban-column-default-5' },
    "6 - Elaboração Editais - Minuta do Edital": { title: "<h5>Editais</h5>Minuta<br>Edital", icon: 'bi-pencil-square', className: 'kanban-column-default-6' },
    "7 - Geral - Parecer / Autorização": { title: "<h5>Geral</h5>Parecer/<br>Autorização", icon: 'bi-check2-square', className: 'kanban-column-default-7' },
    "8 - Licitação - Seleção de Fornecedor": { title: "<h5>Licitação</h5>Seleção<br>Fornecedor", icon: 'bi-trophy', className: 'kanban-column-default-8' },
    "9 - Financeira - Emissão Empenho": { title: "<h5>Financeira</h5>Emissão<br>Empenho", icon: 'bi-receipt', className: 'kanban-column-default-9' },
    "10 - Geral/Financeira - Assinatura Contrato / Publicação Extrato / Cadastro Contratosgov": { title: "<h5>Geral/Financeira</h5>Contrato/Extrato<br>ContratosGOV", icon: 'bi-pen', className: 'kanban-column-default-10' }
};

async function fetchData(isInitialLoad = false) {
    const cachedData = localStorage.getItem('kanbanData');

    if (isInitialLoad && cachedData) {
        try {
            // Render cached data immediately on initial load to avoid "loading" flash
            renderBoard(JSON.parse(cachedData));
        } catch (e) {
            console.error("Error parsing cached data:", e);
            localStorage.removeItem('kanbanData'); // Clear potentially corrupted cache
        }
    }

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const dataString = JSON.stringify(data);

        // Update cache and re-render only if data has changed
        if (cachedData !== dataString) {
            localStorage.setItem('kanbanData', dataString);
            renderBoard(data);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        // Only show the error message in the UI if there's no cached data to display
        if (!localStorage.getItem('kanbanData')) {
            kanbanBoard.innerHTML = '<p>Erro ao carregar dados. Tente novamente mais tarde.</p>';
        }
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
    return `status-${status.toLowerCase().replace(/\s+/g, '-')}`;
}

function isCurrency(key) {
    const lowerKey = key.toLowerCase();
    return lowerKey.includes('valor') || lowerKey.includes('investimento') || lowerKey.includes('estimativa') || lowerKey.includes('empenhado') || lowerKey.includes('custeio');
}

function renderBoard(data) {
    // Use a DocumentFragment to build the board in memory, avoiding multiple DOM updates.
    const fragment = document.createDocumentFragment();
    // Clear existing columns data
    for (const column in columns) {
        columns[column] = [];
    }

    // Group data into columns
    if (Array.isArray(data)) {
        data.forEach(item => {
            if (columns.hasOwnProperty(item["SAMPA - Categoria/Etapa"])) {
                columns[item["SAMPA - Categoria/Etapa"]].push(item);
            }
        });
    }

    // Sort cards within each column by process number
    for (const columnName in columns) {
        columns[columnName].sort((a, b) => {
            const getFirstSanitizedProcessNumber = (item) => {
                const processoOriginal = item["Processo Administrativo"];
                if (!processoOriginal) return Infinity; // Itens sem processo vão para o final

                const firstPart = String(processoOriginal).trim().split(/\s+/)[0];
                const sanitized = formatProcesso(firstPart);

                // Converte para número para garantir a ordenação numérica correta
                const num = parseInt(sanitized, 10);
                return isNaN(num) ? Infinity : num;
            };

            const numA = getFirstSanitizedProcessNumber(a);
            const numB = getFirstSanitizedProcessNumber(b);

            return numA - numB;
        });
    }

    // Render columns and cards
    for (const columnName in columns) {
        const columnEl = document.createElement('div');
        const details = columnDetails[columnName];
        if (!details) {
            console.warn(`Column details not found for: ${columnName}`);
            continue;
        }
        columnEl.className = `kanban-column ${details.className}`;

        const titleEl = document.createElement('h2');
        titleEl.innerHTML = `<span class="icon"><i class="bi ${details.icon}"></i></span> <span class="col-title">${details.title}</span>`;
        columnEl.appendChild(titleEl);

        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'kanban-cards-container';
        columnEl.appendChild(cardsContainer);

        columns[columnName].forEach(item => {
            const cardEl = document.createElement('div');
            cardEl.className = 'kanban-card';

            const processoOriginal = item["Processo Administrativo"];
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

            const duracao = item["Duração (dias)"] && item["Duração (dias)"] >= 0 ? `${item["Duração (dias)"]} dias` : '';

            const summary = item["Andamento - Objeto resumido"] || '';
            const parts = summary.split(' - ');
            const displaySummary = parts.length > 1 ? parts.slice(1).join(' - ') : summary;

            cardEl.innerHTML = `
                <div class="kanban-card-header">
                    ${processoLinksHtml ? `<div class="processo-links">${processoLinksHtml}</div>` : ''}
                    ${duracao ? `<span class="duration-badge">${duracao}</span>` : ''}
                </div>
                <div class="kanban-card-body">
                    ${displaySummary}
                </div>
            `;
            cardsContainer.appendChild(cardEl);
        });

        fragment.appendChild(columnEl);
    }

    // Perform a single, efficient DOM update.
    kanbanBoard.innerHTML = '';
    kanbanBoard.appendChild(fragment);
}

function setupEventListeners() {
    // No event listeners needed for now.
}

document.addEventListener('DOMContentLoaded', () => {
    const themeToggleButton = document.getElementById('theme-toggle');
    const body = document.body;

    const applyTheme = (theme) => {
        if (theme === 'dark') {
            body.classList.add('dark-theme');
        } else {
            body.classList.remove('dark-theme');
        }
    };

    const toggleTheme = () => {
        const newTheme = body.classList.contains('dark-theme') ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    };

    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', toggleTheme);
    }

    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    applyTheme(initialTheme);

    // Initial data load and setup periodic refresh
    fetchData(true);
    setInterval(() => fetchData(false), 30000);
});

const apiUrl = 'https://script.google.com/macros/s/AKfycbw0V2iYm5m1Uw_1sX39rtq5CgG9XFAZwsYvV6pdnb-346KtOE6D_ndSikqbN0GZjioe/exec';
const kanbanBoard = document.getElementById('kanban-board');

let allData = []; // To store all fetched data

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
            const data = JSON.parse(cachedData);
            allData = data;
            renderBoard(data);
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
        allData = data;
        const dataString = JSON.stringify(data);

        if (cachedData !== dataString) {
            localStorage.setItem('kanbanData', dataString);
            renderBoard(data);
            renderAtividades();
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        if (!localStorage.getItem('kanbanData')) {
            kanbanBoard.innerHTML = '<p>Erro ao carregar dados. Tente novamente mais tarde.</p>';
        }
    }
}

function formatProcesso(processo) {
    if (!processo) return '';
    const s = String(processo);
    const formatted = s.length > 6 ? s.substring(6) : s;
    return formatted.replace(/^0+/, '');
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
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
    const fragment = document.createDocumentFragment();
    for (const column in columns) {
        columns[column] = [];
    }

    if (Array.isArray(data)) {
        data.forEach(item => {
            if (columns.hasOwnProperty(item["SAMPA - Categoria/Etapa"])) {
                columns[item["SAMPA - Categoria/Etapa"]].push(item);
            }
        });
    }

    for (const columnName in columns) {
        columns[columnName].sort((a, b) => {
            const getFirstSanitizedProcessNumber = (item) => {
                const processoOriginal = item["Processo Administrativo"];
                if (!processoOriginal) return Infinity;
                const firstPart = String(processoOriginal).trim().split(/\s+/)[0];
                const sanitized = formatProcesso(firstPart);
                const num = parseInt(sanitized, 10);
                return isNaN(num) ? Infinity : num;
            };
            const numA = getFirstSanitizedProcessNumber(a);
            const numB = getFirstSanitizedProcessNumber(b);
            return numA - numB;
        });
    }

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

    kanbanBoard.innerHTML = '';
    kanbanBoard.appendChild(fragment);
}

function renderAtividades() {
    const atividadesList = document.getElementById('atividades-list');
    const fragment = document.createDocumentFragment();

    if (Array.isArray(allData)) {
        allData.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'atividades-item';

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

            const itemPlanoContratacoes = item["Item no Plano de Contratações"] || '';

            const summary = item["Andamento - Objeto resumido"] || '';
            const parts = summary.split(' - ');
            const displaySummary = parts.length > 1 ? parts.slice(1).join(' - ') : summary;
            const demanda = item["Demanda"] || '';

            const od = item["SAMPA - OD"] || '';
            const etp = item["SAMPA - ETP"] || '';
            const ar = item["SAMPA - AR"] || '';
            const tr = item["SAMPA - TR"] || '';
            const am = item["SAMPA - AM"] || '';

            const percentage = 50; // Placeholder

            const previsaoConclusao = item["Data Prevista Contratação"];
            const integrantes = item["SAMPA - Integrantes"];


            itemEl.innerHTML = `
                <div class="atividade-item-left">
                    <div class="atividade-item-square">
                        <div class="atividade-item-square-top">
                            <div class="atividade-item-square-title">Processo Proad</div>
                            ${processoLinksHtml}
                        </div>
                        <div class="atividade-item-square-bottom">
                            <div class="atividade-item-square-title">ID - PCA</div>
                            ${itemPlanoContratacoes}
                        </div>
                    </div>
                </div>
                <div class="atividade-item-middle-left">
                    <div class="atividade-item-summary">${displaySummary}</div>
                    <div class="atividade-item-demanda">${demanda}</div>
                </div>
                <div class="atividade-item-middle-right">
                    <div class="atividade-item-progress-bar">
                        <div class="atividade-item-progress" style="width: ${percentage}%;">
                            <span>${percentage}%</span>
                        </div>
                    </div>
                    <div class="atividade-item-fields">
                        <hr><div>Oficialização de Demanda: ${od}</div>
                        <div>Estudo Técnico Preliminar: ${etp}</div>
                        <div>Mapa de Riscos: ${ar}</div>
                        <div>Termo de Referência: ${tr}</div>
                        <div>Análise de Mercado: ${am}</div>
                    </div>
                </div>
                <div class="atividade-item-right">
                    <div class="atividade-item-square">
                        <div class="atividade-item-square-top">
                            <div class="atividade-item-square-title">Previsão / Conclusão</div>
                            <div>${previsaoConclusao}</div>
                        </div>
                        <div class="atividade-item-square-bottom">
                            <div class="atividade-item-square-title">Integrantes</div>
                            <div>${integrantes}</div>
                        </div>
                    </div>
                </div>
            `;
            fragment.appendChild(itemEl);
        });
    }

    atividadesList.innerHTML = '';
    atividadesList.appendChild(fragment);
}

function setupEventListeners() {
    const andamentosView = document.getElementById('andamentos-view');
    const atividadesView = document.getElementById('atividades-view');
    const andamentosTab = document.getElementById('andamentos-tab');
    const atividadesTab = document.getElementById('atividades-tab');

    andamentosTab.addEventListener('click', () => {
        andamentosView.style.display = 'flex';
        atividadesView.style.display = 'none';
        andamentosTab.classList.add('active');
        atividadesTab.classList.remove('active');
    });

    atividadesTab.addEventListener('click', () => {
        andamentosView.style.display = 'none';
        atividadesView.style.display = 'flex';
        atividadesTab.classList.add('active');
        andamentosTab.classList.remove('active');
        renderAtividades(); // Render the list when tab is clicked
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const andamentosView = document.getElementById('andamentos-view');
    const atividadesView = document.getElementById('atividades-view');
    andamentosView.style.display = 'flex';
    atividadesView.style.display = 'none';

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

    setupEventListeners();
    fetchData(true);
    setInterval(() => fetchData(false), 30000);
});


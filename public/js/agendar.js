// Variáveis globais para armazenar as escolhas do cliente
let barbeiro_id = null;
let servico_id = null;
let servico_nome = null;
let servico_preco = null;
let data_agendamento = null;
let hora_agendamento = null;
let metodo_pagamento = null;
let barbearia_nome = null;

// =============================
// ETAPA 1: BUSCAR BARBEARIA
// =============================
document.getElementById('btn-buscar').addEventListener('click', async () => {
    const nome = document.getElementById('busca-barbearia').value.trim();

    if (!nome) {
        alert('Digite o nome da barbearia.');
        return;
    }

    try {
        const response = await fetch(`/cliente/buscar-barbearia?nome=${encodeURIComponent(nome)}`);
        const barbearias = await response.json();

        const container = document.getElementById('resultados-barbearia');
        container.innerHTML = '';

        if (barbearias.length === 0) {
            container.innerHTML = '<p>Nenhuma barbearia encontrada.</p>';
            return;
        }

        // Exibe a lista de barbearias encontradas
        barbearias.forEach(b => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = `${b.barbearia} — ${b.endereco}`;
            btn.setAttribute('aria-label', `Selecionar barbearia ${b.barbearia}`);

            btn.addEventListener('click', () => selecionarBarbearia(b));
            container.appendChild(btn);
        });

    } catch (err) {
        console.error('Erro ao buscar barbearia:', err);
        alert('Erro ao buscar barbearia. Tente novamente.');
    }
});

// =============================
// ETAPA 2: SELECIONAR SERVIÇO
// =============================
async function selecionarBarbearia(b) {
    barbeiro_id = b.id;
    barbearia_nome = b.barbearia;

    try {
        const response = await fetch(`/cliente/servicos/${barbeiro_id}`);
        const servicos = await response.json();

        const select = document.getElementById('select-servico');
        select.innerHTML = '<option value="">Selecione um serviço</option>';

        // Preenche o select com os serviços da barbearia
        servicos.forEach(s => {
            const option = document.createElement('option');
            option.value = s.id;
            option.textContent = `${s.nome} — R$ ${Number(s.preco).toFixed(2)}`;
            option.dataset.nome = s.nome;
            option.dataset.preco = s.preco;
            select.appendChild(option);
        });

        // Exibe a etapa de serviço
        document.getElementById('etapa-servico').removeAttribute('hidden');

    } catch (err) {
        console.error('Erro ao buscar serviços:', err);
        alert('Erro ao buscar serviços. Tente novamente.');
    }
}

// Quando o cliente seleciona um serviço, exibe a etapa de data
document.getElementById('select-servico').addEventListener('change', () => {
    const select = document.getElementById('select-servico');
    const opcao = select.options[select.selectedIndex];

    if (!select.value) return;

    servico_id = select.value;
    servico_nome = opcao.dataset.nome;
    servico_preco = opcao.dataset.preco;

    // Exibe a etapa de data
    document.getElementById('etapa-data').removeAttribute('hidden');
});

// =============================
// ETAPA 3: SELECIONAR DATA
// =============================

// Define a data mínima como hoje
document.getElementById('input-data').min = new Date().toISOString().split('T')[0];

document.getElementById('btn-buscar-horarios').addEventListener('click', async () => {
    const data = document.getElementById('input-data').value;

    if (!data) {
        alert('Selecione uma data.');
        return;
    }

    data_agendamento = data;

    try {
        const response = await fetch(`/cliente/horarios/${barbeiro_id}?data=${data}`);
        const horarios = await response.json();

        const select = document.getElementById('select-horario');
        select.innerHTML = '<option value="">Selecione um horário</option>';

        if (horarios.length === 0) {
            select.innerHTML = '<option value="">Nenhum horário disponível</option>';
            document.getElementById('etapa-horario').removeAttribute('hidden');
            return;
        }

        // Preenche o select com os horários disponíveis
        horarios.forEach(h => {
            const option = document.createElement('option');
            option.value = h;
            option.textContent = h;
            select.appendChild(option);
        });

        // Exibe a etapa de horário
        document.getElementById('etapa-horario').removeAttribute('hidden');

    } catch (err) {
        console.error('Erro ao buscar horários:', err);
        alert('Erro ao buscar horários. Tente novamente.');
    }
});

// =============================
// ETAPA 4: SELECIONAR HORÁRIO
// =============================

// Quando o cliente seleciona um horário, exibe a etapa de pagamento
document.getElementById('select-horario').addEventListener('change', () => {
    const select = document.getElementById('select-horario');

    if (!select.value) return;

    hora_agendamento = select.value;

    // Exibe a etapa de pagamento
    document.getElementById('etapa-pagamento').removeAttribute('hidden');
});

// =============================
// ETAPA 5: FORMA DE PAGAMENTO
// =============================

// Quando o cliente seleciona a forma de pagamento, exibe o resumo
document.getElementById('select-pagamento').addEventListener('change', () => {
    const select = document.getElementById('select-pagamento');

    if (!select.value) return;

    metodo_pagamento = select.value;

    // Preenche o resumo
    document.getElementById('resumo-barbearia').textContent = barbearia_nome;
    document.getElementById('resumo-servico').textContent = servico_nome;
    document.getElementById('resumo-preco').textContent = `R$ ${Number(servico_preco).toFixed(2)}`;
    document.getElementById('resumo-data').textContent = new Date(data_agendamento + 'T00:00:00').toLocaleDateString('pt-BR');
    document.getElementById('resumo-horario').textContent = hora_agendamento;
    document.getElementById('resumo-pagamento').textContent = select.options[select.selectedIndex].textContent;

    // Preenche os campos ocultos do formulário
    document.getElementById('hidden-barbeiro').value = barbeiro_id;
    document.getElementById('hidden-servico').value = servico_id;
    document.getElementById('hidden-data').value = data_agendamento;
    document.getElementById('hidden-horario').value = hora_agendamento;
    document.getElementById('hidden-pagamento').value = metodo_pagamento;

    // Exibe a etapa de resumo
    document.getElementById('etapa-resumo').removeAttribute('hidden');
});
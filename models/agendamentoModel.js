const pool = require('../config/db');

async function buscarProximo(cliente_id) {
    const result = await pool.query(
        `SELECT a.id, b.barbearia, s.nome AS servico,
                a.data_agendamento, a.hora_agendamento, a.status
         FROM agendamentos a
         JOIN barbeiros b ON a.barbeiro_id = b.id
         JOIN servicos s ON a.servico_id = s.id
         WHERE a.cliente_id = $1
           AND a.data_agendamento >= CURRENT_DATE
           AND a.status != 'cancelado'
         ORDER BY a.data_agendamento, a.hora_agendamento
         LIMIT 1`,
        [cliente_id]
    );
    return result.rows[0] || null;
}

async function buscarHistorico(cliente_id) {
    const result = await pool.query(
        `SELECT a.id, b.barbearia, s.nome AS servico,
                a.data_agendamento, a.hora_agendamento, a.status
         FROM agendamentos a
         JOIN barbeiros b ON a.barbeiro_id = b.id
         JOIN servicos s ON a.servico_id = s.id
         WHERE a.cliente_id = $1
         ORDER BY a.data_agendamento DESC, a.hora_agendamento DESC`,
        [cliente_id]
    );
    return result.rows;
}

async function horarioOcupado(barbeiro_id, data, hora) {
    const result = await pool.query(
        `SELECT id FROM agendamentos
         WHERE barbeiro_id = $1
           AND data_agendamento = $2
           AND hora_agendamento = $3
           AND status != 'cancelado'`,
        [barbeiro_id, data, hora]
    );
    return result.rows.length > 0;
}

async function clienteJaTemNessaHora(cliente_id, data, hora) {
    const result = await pool.query(
        `SELECT id FROM agendamentos
         WHERE cliente_id = $1
           AND data_agendamento = $2
           AND hora_agendamento = $3
           AND status != 'cancelado'`,
        [cliente_id, data, hora]
    );
    return result.rows.length > 0;
}

async function criar(cliente_id, barbeiro_id, servico_id, data, hora) {
    const result = await pool.query(
        `INSERT INTO agendamentos
         (cliente_id, barbeiro_id, servico_id, data_agendamento, hora_agendamento)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [cliente_id, barbeiro_id, servico_id, data, hora]
    );
    return result.rows[0];
}

async function inserirPagamento(agendamento_id, metodo) {
    await pool.query(
        'INSERT INTO formas_pagamento (agendamento_id, metodo) VALUES ($1, $2)',
        [agendamento_id, metodo]
    );
}

async function buscarConfirmacao(agendamento_id, cliente_id) {
    const result = await pool.query(
        `SELECT a.id, b.barbearia, b.endereco, u.nome AS barbeiro,
                s.nome AS servico, s.preco,
                a.data_agendamento, a.hora_agendamento, a.status,
                fp.metodo AS pagamento
         FROM agendamentos a
         JOIN barbeiros b ON a.barbeiro_id = b.id
         JOIN usuarios u ON b.usuario_id = u.id
         JOIN servicos s ON a.servico_id = s.id
         LEFT JOIN formas_pagamento fp ON fp.agendamento_id = a.id
         WHERE a.id = $1
           AND a.cliente_id = $2`,
        [agendamento_id, cliente_id]
    );
    return result.rows[0] || null;
}

async function buscarAgendamentosHoje(barbeiro_id) {
    const result = await pool.query(
        `SELECT a.id, u.nome AS cliente, s.nome AS servico,
                a.hora_agendamento, a.status
         FROM agendamentos a
         JOIN clientes c ON a.cliente_id = c.id
         JOIN usuarios u ON c.usuario_id = u.id
         JOIN servicos s ON a.servico_id = s.id
         WHERE a.barbeiro_id = $1
           AND a.data_agendamento = CURRENT_DATE
           AND a.status != 'cancelado'
         ORDER BY a.hora_agendamento`,
        [barbeiro_id]
    );
    return result.rows;
}

async function buscarTotalMes(barbeiro_id) {
    const result = await pool.query(
        `SELECT COUNT(*) AS total FROM agendamentos
         WHERE barbeiro_id = $1
           AND EXTRACT(MONTH FROM data_agendamento) = EXTRACT(MONTH FROM CURRENT_DATE)
           AND EXTRACT(YEAR FROM data_agendamento) = EXTRACT(YEAR FROM CURRENT_DATE)`,
        [barbeiro_id]
    );
    return result.rows[0].total;
}

async function buscarFaturamentoMes(barbeiro_id) {
    const result = await pool.query(
        `SELECT COALESCE(SUM(s.preco), 0) AS total
         FROM agendamentos a
         JOIN servicos s ON a.servico_id = s.id
         WHERE a.barbeiro_id = $1
           AND a.status = 'concluido'
           AND EXTRACT(MONTH FROM a.data_agendamento) = EXTRACT(MONTH FROM CURRENT_DATE)
           AND EXTRACT(YEAR FROM a.data_agendamento) = EXTRACT(YEAR FROM CURRENT_DATE)`,
        [barbeiro_id]
    );
    return result.rows[0].total;
}

async function buscarAgendaFutura(barbeiro_id) {
    const result = await pool.query(
        `SELECT a.id, u.nome AS cliente, s.nome AS servico,
                a.data_agendamento, a.hora_agendamento, a.status
         FROM agendamentos a
         JOIN clientes c ON a.cliente_id = c.id
         JOIN usuarios u ON c.usuario_id = u.id
         JOIN servicos s ON a.servico_id = s.id
         WHERE a.barbeiro_id = $1
           AND a.data_agendamento >= CURRENT_DATE
         ORDER BY a.data_agendamento, a.hora_agendamento`,
        [barbeiro_id]
    );
    return result.rows;
}

async function atualizarStatus(agendamento_id, status) {
    await pool.query(
        'UPDATE agendamentos SET status = $1 WHERE id = $2',
        [status, agendamento_id]
    );
}

async function remarcar(agendamento_id, data, hora) {
    await pool.query(
        `UPDATE agendamentos
         SET data_agendamento = $1, hora_agendamento = $2, status = 'confirmado'
         WHERE id = $3`,
        [data, hora, agendamento_id]
    );
}

module.exports = {
    buscarProximo, buscarHistorico, horarioOcupado,
    clienteJaTemNessaHora, criar, inserirPagamento, buscarConfirmacao,
    buscarAgendamentosHoje, buscarTotalMes, buscarFaturamentoMes,
    buscarAgendaFutura, atualizarStatus, remarcar
};
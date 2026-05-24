const pool = require('../config/db');

async function buscarPorUsuarioId(usuario_id) {
    const result = await pool.query(
        'SELECT id FROM clientes WHERE usuario_id = $1',
        [usuario_id]
    );
    return result.rows[0] || null;
}

async function criar(usuario_id) {
    await pool.query(
        'INSERT INTO clientes (usuario_id) VALUES ($1)',
        [usuario_id]
    );
}

async function buscarBarbearia(nome) {
    const result = await pool.query(
        `SELECT b.id, b.barbearia, b.endereco, u.nome AS barbeiro
         FROM barbeiros b
         JOIN usuarios u ON b.usuario_id = u.id
         WHERE b.barbearia ILIKE $1
         ORDER BY b.barbearia`,
        [`%${nome.trim()}%`]
    );
    return result.rows;
}

async function buscarServicos(barbeiro_id) {
    const result = await pool.query(
        `SELECT id, nome, preco
         FROM servicos
         WHERE barbeiro_id = $1
         ORDER BY nome`,
        [barbeiro_id]
    );
    return result.rows;
}

async function buscarHorarioFuncionamento(barbeiro_id, diaSemana) {
    const result = await pool.query(
        `SELECT hora_inicio, hora_fim, intervalo_minutos
         FROM horarios_disponiveis
         WHERE barbeiro_id = $1
           AND dia_semana = $2
           AND ativo = true`,
        [barbeiro_id, diaSemana]
    );
    return result.rows[0] || null;
}

async function buscarHorariosOcupados(barbeiro_id, data) {
    const result = await pool.query(
        `SELECT hora_agendamento
         FROM agendamentos
         WHERE barbeiro_id = $1
           AND data_agendamento = $2
           AND status != 'cancelado'`,
        [barbeiro_id, data]
    );
    return result.rows.map(a => a.hora_agendamento.slice(0, 5));
}

async function verificarBarbeiroExiste(barbeiro_id) {
    const result = await pool.query(
        'SELECT id FROM barbeiros WHERE id = $1',
        [barbeiro_id]
    );
    return result.rows.length > 0;
}

async function verificarServicoDoBarbeiro(servico_id, barbeiro_id) {
    const result = await pool.query(
        `SELECT id FROM servicos
         WHERE id = $1 AND barbeiro_id = $2`,
        [servico_id, barbeiro_id]
    );
    return result.rows.length > 0;
}

module.exports = {
    buscarPorUsuarioId, criar, buscarBarbearia, buscarServicos,
    buscarHorarioFuncionamento, buscarHorariosOcupados,
    verificarBarbeiroExiste, verificarServicoDoBarbeiro
};
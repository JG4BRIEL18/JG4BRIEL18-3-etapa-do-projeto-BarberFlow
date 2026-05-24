const pool = require('../config/db');

async function buscarPorUsuarioId(usuario_id) {
    const result = await pool.query(
        'SELECT id, barbearia FROM barbeiros WHERE usuario_id = $1',
        [usuario_id]
    );
    return result.rows[0] || null;
}

async function buscarDadosBarbearia(usuario_id) {
    const result = await pool.query(
        'SELECT barbearia, endereco FROM barbeiros WHERE usuario_id = $1',
        [usuario_id]
    );
    return result.rows[0] || null;
}

async function criar(usuario_id, barbearia, endereco) {
    await pool.query(
        `INSERT INTO barbeiros (usuario_id, barbearia, endereco)
         VALUES ($1, $2, $3)`,
        [usuario_id, barbearia, endereco]
    );
}

async function atualizarDados(usuario_id, barbearia, endereco) {
    await pool.query(
        'UPDATE barbeiros SET barbearia = $1, endereco = $2 WHERE usuario_id = $3',
        [barbearia, endereco, usuario_id]
    );
}

// ── SERVIÇOS ──────────────────────────────────────────

async function buscarServicos(barbeiro_id) {
    const result = await pool.query(
        'SELECT id, nome, preco FROM servicos WHERE barbeiro_id = $1 ORDER BY nome',
        [barbeiro_id]
    );
    return result.rows;
}

async function adicionarServico(barbeiro_id, nome, preco) {
    await pool.query(
        'INSERT INTO servicos (barbeiro_id, nome, preco) VALUES ($1, $2, $3)',
        [barbeiro_id, nome, preco]
    );
}

async function editarServico(servico_id, nome, preco) {
    await pool.query(
        'UPDATE servicos SET nome = $1, preco = $2 WHERE id = $3',
        [nome, preco, servico_id]
    );
}

async function removerServico(servico_id) {
    await pool.query(
        'DELETE FROM servicos WHERE id = $1',
        [servico_id]
    );
}

// ── HORÁRIOS ──────────────────────────────────────────

async function buscarHorarios(barbeiro_id) {
    const result = await pool.query(
        `SELECT id, dia_semana, hora_inicio, hora_fim, intervalo_minutos, ativo
         FROM horarios_disponiveis
         WHERE barbeiro_id = $1
         ORDER BY CASE dia_semana
           WHEN 'segunda' THEN 1
           WHEN 'terca'   THEN 2
           WHEN 'quarta'  THEN 3
           WHEN 'quinta'  THEN 4
           WHEN 'sexta'   THEN 5
           WHEN 'sabado'  THEN 6
           WHEN 'domingo' THEN 7
         END`,
        [barbeiro_id]
    );
    return result.rows;
}

async function adicionarHorario(barbeiro_id, dia_semana, hora_inicio, hora_fim, intervalo_minutos) {
    await pool.query(
        `INSERT INTO horarios_disponiveis
         (barbeiro_id, dia_semana, hora_inicio, hora_fim, intervalo_minutos)
         VALUES ($1, $2, $3, $4, $5)`,
        [barbeiro_id, dia_semana, hora_inicio, hora_fim, intervalo_minutos]
    );
}

async function editarHorario(horario_id, hora_inicio, hora_fim, intervalo_minutos, ativo) {
    await pool.query(
        `UPDATE horarios_disponiveis
         SET hora_inicio = $1, hora_fim = $2, intervalo_minutos = $3, ativo = $4
         WHERE id = $5`,
        [hora_inicio, hora_fim, intervalo_minutos, ativo, horario_id]
    );
}

module.exports = {
    buscarPorUsuarioId, buscarDadosBarbearia, criar, atualizarDados,
    buscarServicos, adicionarServico, editarServico, removerServico,
    buscarHorarios, adicionarHorario, editarHorario
};
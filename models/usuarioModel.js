const pool = require('../config/db');

async function buscarPorEmail(email) {
    const result = await pool.query(
        'SELECT * FROM usuarios WHERE email = $1',
        [email]
    );
    return result.rows[0] || null;
}

async function buscarPorId(id) {
    const result = await pool.query(
        'SELECT nome, email, senha FROM usuarios WHERE id = $1',
        [id]
    );
    return result.rows[0] || null;
}

async function emailJaExiste(email, excluirId = null) {
    const result = await pool.query(
        'SELECT id FROM usuarios WHERE email = $1 AND id != $2',
        [email, excluirId || 0]
    );
    return result.rows.length > 0;
}

async function criar(nome, email, senhaHash, tipo) {
    const result = await pool.query(
        `INSERT INTO usuarios (nome, email, senha, tipo)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [nome, email, senhaHash, tipo]
    );
    return result.rows[0];
}

async function atualizarNomeEmail(id, nome, email) {
    await pool.query(
        'UPDATE usuarios SET nome = $1, email = $2 WHERE id = $3',
        [nome, email, id]
    );
}

async function atualizarSenha(id, senhaHash) {
    await pool.query(
        'UPDATE usuarios SET senha = $1 WHERE id = $2',
        [senhaHash, id]
    );
}

async function deletar(id) {
    await pool.query(
        'DELETE FROM usuarios WHERE id = $1',
        [id]
    );
}

module.exports = {
    buscarPorEmail, buscarPorId, emailJaExiste,
    criar, atualizarNomeEmail, atualizarSenha, deletar
};
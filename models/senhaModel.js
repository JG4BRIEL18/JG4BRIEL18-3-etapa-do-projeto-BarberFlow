const pool = require('../config/db');

async function buscarPorEmail(email) {
    const result = await pool.query(
        'SELECT id FROM usuarios WHERE email = $1',
        [email]
    );
    return result.rows[0] || null;
}

async function salvarToken(usuario_id, token, expira) {
    await pool.query(
        `UPDATE usuarios
         SET reset_token = $1, reset_token_expira = $2
         WHERE id = $3`,
        [token, expira, usuario_id]
    );
}

async function buscarPorToken(token) {
    const result = await pool.query(
        `SELECT id, reset_token_expira
         FROM usuarios
         WHERE reset_token = $1`,
        [token]
    );
    return result.rows[0] || null;
}

async function atualizarSenhaELimparToken(usuario_id, senhaHash) {
    await pool.query(
        `UPDATE usuarios
         SET senha = $1, reset_token = NULL, reset_token_expira = NULL
         WHERE id = $2`,
        [senhaHash, usuario_id]
    );
}

module.exports = {
    buscarPorEmail, salvarToken,
    buscarPorToken, atualizarSenhaELimparToken
};
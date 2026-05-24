const crypto = require('crypto');
const bcrypt = require('bcrypt');
const transporter = require('../config/mailer');
const senhaModel = require('../models/senhaModel');

// ── ESQUECI SENHA ─────────────────────────────────────

function exibirEsqueciSenha(req, res) {
    res.render('esqueci_senha', { erro: null, sucesso: null });
}

async function enviarLink(req, res) {
    const { email } = req.body;

    try {
        if (!email)
            return res.render('esqueci_senha', { erro: 'Digite seu email', sucesso: null });

        const usuario = await senhaModel.buscarPorEmail(email);

        // Sempre mostra sucesso, mesmo se email não existir (segurança)
        if (!usuario) {
            return res.render('esqueci_senha', {
                erro: null,
                sucesso: 'Se este email estiver cadastrado, você receberá o link em breve.'
            });
        }

        // Gera token único
        const token = crypto.randomBytes(32).toString('hex');

        // Expira em 1 hora
        const expira = new Date(Date.now() + 1000 * 60 * 60);

        await senhaModel.salvarToken(usuario.id, token, expira);

        const link = `http://localhost:3000/redefinir-senha?token=${token}`;

        // Envia email
        await transporter.sendMail({
            from: '"BarberFlow" <noreply@barberflow.com>',
            to: email,
            subject: 'Redefinição de senha - BarberFlow',
            html: `
                <h2>Redefinição de senha</h2>
                <p>Clique no link abaixo para redefinir sua senha:</p>
                <a href="${link}">${link}</a>
                <p>Este link expira em 1 hora.</p>
                <p>Se você não solicitou a redefinição, ignore este email.</p>
            `
        });

        res.render('esqueci_senha', {
            erro: null,
            sucesso: 'Se este email estiver cadastrado, você receberá o link em breve.'
        });

    } catch (err) {
        console.error('Erro ao enviar link:', err);
        res.render('esqueci_senha', { erro: 'Erro ao enviar o link', sucesso: null });
    }
}

// ── REDEFINIR SENHA ───────────────────────────────────

async function exibirRedefinirSenha(req, res) {
    const { token } = req.query;

    if (!token)
        return res.redirect('/login');

    const usuario = await senhaModel.buscarPorToken(token);

    if (!usuario || new Date() > new Date(usuario.reset_token_expira))
        return res.render('esqueci_senha', { erro: 'Link inválido ou expirado', sucesso: null });

    res.render('redefinir_senha', { token, erro: null });
}

async function redefinirSenha(req, res) {
    const { token, novaSenha, confirmarSenha } = req.body;

    try {
        if (!novaSenha || !confirmarSenha)
            return res.render('redefinir_senha', { token, erro: 'Preencha todos os campos' });

        if (novaSenha.length < 6)
            return res.render('redefinir_senha', { token, erro: 'A senha deve ter pelo menos 6 caracteres' });

        if (novaSenha !== confirmarSenha)
            return res.render('redefinir_senha', { token, erro: 'As senhas não coincidem' });

        const usuario = await senhaModel.buscarPorToken(token);

        if (!usuario || new Date() > new Date(usuario.reset_token_expira))
            return res.render('esqueci_senha', { erro: 'Link inválido ou expirado', sucesso: null });

        const senhaHash = await bcrypt.hash(novaSenha, 10);
        await senhaModel.atualizarSenhaELimparToken(usuario.id, senhaHash);

        res.redirect('/login');

    } catch (err) {
        console.error('Erro ao redefinir senha:', err);
        res.render('redefinir_senha', { token, erro: 'Erro ao redefinir a senha' });
    }
}

module.exports = { exibirEsqueciSenha, enviarLink, exibirRedefinirSenha, redefinirSenha };
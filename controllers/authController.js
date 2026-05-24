const bcrypt = require('bcrypt');
const usuarioModel = require('../models/usuarioModel');

// ── LOGIN ─────────────────────────────────────────────

function exibirLogin(req, res) {
    res.render('login', { erro: null });
}

async function login(req, res) {
    const { email, senha } = req.body;

    try {
        if (!email || !senha)
            return res.render('login', { erro: 'Preencha todos os campos' });

        const user = await usuarioModel.buscarPorEmail(email);

        if (!user)
            return res.render('login', { erro: 'Usuário não encontrado' });

        const senhaValida = await bcrypt.compare(senha, user.senha);

        if (!senhaValida)
            return res.render('login', { erro: 'Senha incorreta' });

        req.session.user = { id: user.id, nome: user.nome, tipo: user.tipo };

        if (user.tipo === 'cliente')  return res.redirect('/cliente/dashboard_cliente');
        if (user.tipo === 'barbeiro') return res.redirect('/barbeiro/dashboard_barb');

        return res.redirect('/');

    } catch (err) {
        console.error('Erro no login:', err);
        return res.render('login', { erro: 'Erro interno no servidor' });
    }
}

// ── LOGOUT ────────────────────────────────────────────

function logout(req, res) {
    req.session.destroy((err) => {
        if (err) {
            console.error('Erro ao sair da conta:', err);
            return res.send('Erro ao sair da conta');
        }
        res.redirect('/');
    });
}

// ── EXCLUIR CONTA ─────────────────────────────────────

async function excluirConta(req, res) {
    if (!req.session.user) return res.redirect('/login');

    try {
        await usuarioModel.deletar(req.session.user.id);

        req.session.destroy((err) => {
            if (err) console.error('Erro ao encerrar sessão:', err);
            res.redirect('/');
        });

    } catch (err) {
        console.error('Erro ao excluir conta:', err);
        res.send('Erro ao excluir conta');
    }
}

// ── PÁGINAS COMUNS ────────────────────────────────────

function configuracoes(req, res) {
    if (!req.session.user) return res.redirect('/login');
    res.render('comum/configuracoes', { session: req.session });
}

function termos(req, res)         { res.render('comum/termos',          { session: req.session }); }
function privacidade(req, res)    { res.render('comum/privacidade',      { session: req.session }); }
function acessibilidade(req, res) { res.render('comum/acessibilidade',   { session: req.session }); }
function suporte(req, res)        { res.render('comum/suporte',          { session: req.session }); }

module.exports = {
    exibirLogin, login, logout, excluirConta,
    configuracoes, termos, privacidade, acessibilidade, suporte
};
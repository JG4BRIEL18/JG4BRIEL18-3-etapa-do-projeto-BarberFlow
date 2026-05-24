const express = require('express');
const router = express.Router();
const c = require('../controllers/clienteController');

// Cadastro
router.get('/cadastro/cliente',  c.exibirCadastro);
router.post('/cadastro/cliente', c.cadastrar);

// Dashboard
router.get('/cliente/dashboard_cliente', c.dashboard);

// Perfil
router.get('/cliente/perfil',            c.exibirPerfil);
router.post('/cliente/perfil/atualizar', c.atualizarPerfil);
router.post('/cliente/perfil/senha',     c.atualizarSenha);

// Agendamento
router.get('/cliente/agendar',               c.exibirAgendar);
router.get('/cliente/buscar-barbearia',      c.buscarBarbearia);
router.get('/cliente/servicos/:barbeiro_id', c.buscarServicos);
router.get('/cliente/horarios/:barbeiro_id', c.buscarHorarios);
router.post('/cliente/agendar',              c.confirmarAgendamento);
router.get('/cliente/confirmacao/:id',       c.exibirConfirmacao);

// Tutorial
router.get('/cliente/tutorial', (req, res) => {
    if (!req.session.user || req.session.user.tipo !== 'cliente')
        return res.redirect('/login');
    res.render('cliente/tutorial_cliente');
});

module.exports = router;

const express = require('express');
const router = express.Router();
const c = require('../controllers/barbeiroController');

// Cadastro
router.get('/cadastro/barbeiro',  c.exibirCadastro);
router.post('/cadastro/barbeiro', c.cadastrar);

// Dashboard
router.get('/barbeiro/dashboard_barb', c.dashboard);

// Perfil
router.get('/barbeiro/perfil',            c.exibirPerfil);
router.post('/barbeiro/perfil/atualizar', c.atualizarPerfil);
router.post('/barbeiro/perfil/senha',     c.atualizarSenha);

// Serviços
router.get('/barbeiro/servicos',               c.exibirServicos);
router.post('/barbeiro/servicos/adicionar',    c.adicionarServico);
router.post('/barbeiro/servicos/editar/:id',   c.editarServico);
router.post('/barbeiro/servicos/remover/:id',  c.removerServico);

// Horários
router.post('/barbeiro/horarios/adicionar',   c.adicionarHorario);
router.post('/barbeiro/horarios/editar/:id',  c.editarHorario);

// Agenda
router.get('/barbeiro/agenda',                    c.exibirAgenda);
router.post('/barbeiro/agenda/confirmar/:id',     c.confirmarAgendamento);
router.post('/barbeiro/agenda/cancelar/:id',      c.cancelarAgendamento);
router.post('/barbeiro/agenda/concluir/:id',      c.concluirAgendamento);
router.post('/barbeiro/agenda/remarcar/:id',      c.remarcarAgendamento);

// Tutorial
router.get('/barbeiro/tutorial', (req, res) => {
    if (!req.session.user || req.session.user.tipo !== 'barbeiro')
        return res.redirect('/login');
    res.render('barbeiro/tutorial_barb');
});

module.exports = router;

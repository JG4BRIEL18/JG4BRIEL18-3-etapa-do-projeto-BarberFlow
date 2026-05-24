const express = require('express');
const router = express.Router();
const c = require('../controllers/authController');
const s = require('../controllers/senhaController');

// Login
router.get('/login',  c.exibirLogin);
router.post('/login', c.login);

// Logout
router.get('/logout', c.logout);

// Excluir conta
router.post('/excluir-conta', c.excluirConta);

// Esqueci senha
router.get('/esqueci-senha',   s.exibirEsqueciSenha);
router.post('/esqueci-senha',  s.enviarLink);
router.get('/redefinir-senha', s.exibirRedefinirSenha);
router.post('/redefinir-senha', s.redefinirSenha);

// Páginas comuns
router.get('/comum/configuracoes',  c.configuracoes);
router.get('/comum/termos',         c.termos);
router.get('/comum/privacidade',    c.privacidade);
router.get('/comum/acessibilidade', c.acessibilidade);
router.get('/comum/suporte',        c.suporte);

module.exports = router;

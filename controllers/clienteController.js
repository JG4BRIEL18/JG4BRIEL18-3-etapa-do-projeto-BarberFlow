const bcrypt = require('bcrypt');
const usuarioModel    = require('../models/usuarioModel');
const clienteModel    = require('../models/clienteModel');
const agendamentoModel = require('../models/agendamentoModel');

const DIAS_SEMANA = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
const METODOS_VALIDOS = ['dinheiro', 'pix', 'cartao'];

function verificarCliente(req, res) {
    if (!req.session.user || req.session.user.tipo !== 'cliente') {
        res.redirect('/login');
        return false;
    }
    return true;
}

// ── CADASTRO ──────────────────────────────────────────

function exibirCadastro(req, res) {
    res.render('cadastro_cliente', { erro: null });
}

async function cadastrar(req, res) {
    const { nome, email, senha, confirmarSenha } = req.body;

    try {
        if (!nome || !email || !senha || !confirmarSenha)
            return res.render('cadastro_cliente', { erro: 'Preencha todos os campos' });

        if (senha.length < 6)
            return res.render('cadastro_cliente', { erro: 'A senha deve ter pelo menos 6 caracteres' });

        if (senha !== confirmarSenha)
            return res.render('cadastro_cliente', { erro: 'As senhas não coincidem' });

        if (await usuarioModel.emailJaExiste(email))
            return res.render('cadastro_cliente', { erro: 'Este email já está cadastrado' });

        const senhaHash = await bcrypt.hash(senha, 10);
        const usuario = await usuarioModel.criar(nome, email, senhaHash, 'cliente');
        await clienteModel.criar(usuario.id);

        res.redirect('/login');

    } catch (err) {
        console.error('Erro ao cadastrar cliente:', err);
        res.render('cadastro_cliente', { erro: 'Erro ao cadastrar cliente' });
    }
}

// ── DASHBOARD ─────────────────────────────────────────

async function dashboard(req, res) {
    if (!verificarCliente(req, res)) return;

    try {
        const cliente = await clienteModel.buscarPorUsuarioId(req.session.user.id);
        if (!cliente) return res.send('Cliente não encontrado');

        const proximo  = await agendamentoModel.buscarProximo(cliente.id);
        const historico = await agendamentoModel.buscarHistorico(cliente.id);

        res.render('cliente/dashboard_cliente', {
            nome: req.session.user.nome,
            proximo,
            historico
        });

    } catch (err) {
        console.error('Erro no dashboard do cliente:', err);
        res.send('Erro ao carregar o dashboard');
    }
}

// ── PERFIL ────────────────────────────────────────────

async function exibirPerfil(req, res) {
    if (!verificarCliente(req, res)) return;

    try {
        const usuario = await usuarioModel.buscarPorId(req.session.user.id);
        if (!usuario) return res.send('Usuário não encontrado');

        res.render('cliente/perfil_cliente', { usuario, erro: null });

    } catch (err) {
        console.error('Erro ao carregar perfil:', err);
        res.send('Erro ao carregar o perfil');
    }
}

async function atualizarPerfil(req, res) {
    if (!verificarCliente(req, res)) return;

    const usuario_id = req.session.user.id;
    const { nome, email } = req.body;

    try {
        if (!nome || !email) {
            const usuario = await usuarioModel.buscarPorId(usuario_id);
            return res.render('cliente/perfil_cliente', { usuario, erro: 'Preencha todos os campos' });
        }

        if (await usuarioModel.emailJaExiste(email, usuario_id)) {
            const usuario = await usuarioModel.buscarPorId(usuario_id);
            return res.render('cliente/perfil_cliente', { usuario, erro: 'Este email já está em uso' });
        }

        await usuarioModel.atualizarNomeEmail(usuario_id, nome, email);
        req.session.user.nome = nome;
        res.redirect('/cliente/perfil');

    } catch (err) {
        console.error('Erro ao atualizar perfil:', err);
        res.send('Erro ao atualizar o perfil');
    }
}

async function atualizarSenha(req, res) {
    if (!verificarCliente(req, res)) return;

    const usuario_id = req.session.user.id;
    const { senhaAtual, novaSenha, confirmarSenha } = req.body;

    try {
        const usuario = await usuarioModel.buscarPorId(usuario_id);

        if (!senhaAtual || !novaSenha || !confirmarSenha)
            return res.render('cliente/perfil_cliente', { usuario, erro: 'Preencha todos os campos da senha' });

        if (novaSenha.length < 6)
            return res.render('cliente/perfil_cliente', { usuario, erro: 'A nova senha deve ter pelo menos 6 caracteres' });

        if (novaSenha !== confirmarSenha)
            return res.render('cliente/perfil_cliente', { usuario, erro: 'As senhas não coincidem' });

        const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha);
        if (!senhaValida)
            return res.render('cliente/perfil_cliente', { usuario, erro: 'Senha atual incorreta' });

        const senhaHash = await bcrypt.hash(novaSenha, 10);
        await usuarioModel.atualizarSenha(usuario_id, senhaHash);
        res.redirect('/cliente/perfil');

    } catch (err) {
        console.error('Erro ao atualizar senha:', err);
        res.send('Erro ao atualizar a senha');
    }
}

// ── AGENDAMENTO ───────────────────────────────────────

function exibirAgendar(req, res) {
    if (!verificarCliente(req, res)) return;
    res.render('cliente/agendar', { erro: null, sucesso: null });
}

async function buscarBarbearia(req, res) {
    if (!req.session.user || req.session.user.tipo !== 'cliente')
        return res.status(401).json({ erro: 'Não autorizado' });

    try {
        const { nome } = req.query;
        if (!nome || nome.trim() === '') return res.json([]);

        const resultado = await clienteModel.buscarBarbearia(nome);
        res.json(resultado);

    } catch (err) {
        console.error('Erro ao buscar barbearia:', err);
        res.status(500).json({ erro: 'Erro ao buscar barbearia' });
    }
}

async function buscarServicos(req, res) {
    if (!req.session.user || req.session.user.tipo !== 'cliente')
        return res.status(401).json({ erro: 'Não autorizado' });

    try {
        const resultado = await clienteModel.buscarServicos(req.params.barbeiro_id);
        res.json(resultado);

    } catch (err) {
        console.error('Erro ao buscar serviços:', err);
        res.status(500).json({ erro: 'Erro ao buscar serviços' });
    }
}

async function buscarHorarios(req, res) {
    if (!req.session.user || req.session.user.tipo !== 'cliente')
        return res.status(401).json({ erro: 'Não autorizado' });

    try {
        const { barbeiro_id } = req.params;
        const { data } = req.query;

        if (!data) return res.json([]);

        const diaSemana = DIAS_SEMANA[new Date(data).getDay()];
        const horario = await clienteModel.buscarHorarioFuncionamento(barbeiro_id, diaSemana);
        if (!horario) return res.json([]);

        const ocupados = await clienteModel.buscarHorariosOcupados(barbeiro_id, data);

        const { hora_inicio, hora_fim, intervalo_minutos } = horario;
        const slots = [];
        let [h, m] = hora_inicio.split(':').map(Number);
        const [hFim, mFim] = hora_fim.split(':').map(Number);

        while (h < hFim || (h === hFim && m < mFim)) {
            const slot = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            if (!ocupados.includes(slot)) slots.push(slot);
            m += intervalo_minutos;
            if (m >= 60) { h += Math.floor(m / 60); m = m % 60; }
        }

        res.json(slots);

    } catch (err) {
        console.error('Erro ao buscar horários:', err);
        res.status(500).json({ erro: 'Erro ao buscar horários' });
    }
}

async function confirmarAgendamento(req, res) {
    if (!verificarCliente(req, res)) return;

    const { barbeiro_id, servico_id, data_agendamento, hora_agendamento, metodo_pagamento } = req.body;

    try {
        const hoje = new Date().toISOString().split('T')[0];
        const horaAtual = new Date().toTimeString().slice(0, 5);

        if (data_agendamento < hoje)
            return res.render('cliente/agendar', { erro: 'Não é possível agendar em datas passadas' });

        if (data_agendamento === hoje && hora_agendamento <= horaAtual)
            return res.render('cliente/agendar', { erro: 'Este horário já passou' });

        if (!barbeiro_id || !servico_id || !data_agendamento || !hora_agendamento || !metodo_pagamento)
            return res.render('cliente/agendar', { erro: 'Preencha todos os campos' });

        if (!METODOS_VALIDOS.includes(metodo_pagamento))
            return res.render('cliente/agendar', { erro: 'Método de pagamento inválido' });

        if (!await clienteModel.verificarBarbeiroExiste(barbeiro_id))
            return res.render('cliente/agendar', { erro: 'Barbeiro inválido' });

        const cliente = await clienteModel.buscarPorUsuarioId(req.session.user.id);
        if (!cliente)
            return res.render('cliente/agendar', { erro: 'Cliente não encontrado' });

        if (!await clienteModel.verificarServicoDoBarbeiro(servico_id, barbeiro_id))
            return res.render('cliente/agendar', { erro: 'Serviço inválido' });

        if (await agendamentoModel.horarioOcupado(barbeiro_id, data_agendamento, hora_agendamento))
            return res.render('cliente/agendar', { erro: 'Este horário já foi agendado' });

        if (await agendamentoModel.clienteJaTemNessaHora(cliente.id, data_agendamento, hora_agendamento))
            return res.render('cliente/agendar', { erro: 'Você já possui um agendamento neste horário' });

        const agendamento = await agendamentoModel.criar(
            cliente.id, barbeiro_id, servico_id, data_agendamento, hora_agendamento
        );
        await agendamentoModel.inserirPagamento(agendamento.id, metodo_pagamento);

        res.redirect(`/cliente/confirmacao/${agendamento.id}`);

    } catch (err) {
        console.error('Erro ao confirmar agendamento:', err);
        res.render('cliente/agendar', { erro: 'Erro ao confirmar agendamento', sucesso: null });
    }
}

async function exibirConfirmacao(req, res) {
    if (!verificarCliente(req, res)) return;

    try {
        const cliente = await clienteModel.buscarPorUsuarioId(req.session.user.id);
        if (!cliente) return res.send('Cliente não encontrado');

        const agendamento = await agendamentoModel.buscarConfirmacao(req.params.id, cliente.id);
        if (!agendamento) return res.send('Agendamento não encontrado');

        res.render('cliente/confirmacao', { agendamento });

    } catch (err) {
        console.error('Erro ao carregar confirmação:', err);
        res.send('Erro ao carregar a confirmação');
    }
}

module.exports = {
    exibirCadastro, cadastrar,
    dashboard,
    exibirPerfil, atualizarPerfil, atualizarSenha,
    exibirAgendar, buscarBarbearia, buscarServicos,
    buscarHorarios, confirmarAgendamento, exibirConfirmacao
};

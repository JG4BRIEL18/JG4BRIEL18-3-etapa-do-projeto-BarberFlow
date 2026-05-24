const bcrypt = require('bcrypt');
const usuarioModel   = require('../models/usuarioModel');
const barbeiroModel  = require('../models/barbeiroModel');
const agendamentoModel = require('../models/agendamentoModel');

function verificarBarbeiro(req, res) {
    if (!req.session.user || req.session.user.tipo !== 'barbeiro') {
        res.redirect('/login');
        return false;
    }
    return true;
}

// ── CADASTRO ──────────────────────────────────────────

function exibirCadastro(req, res) {
    res.render('cadastro_barbeiro', { erro: null });
}

async function cadastrar(req, res) {
    const { nome, barbearia, endereco, email, senha, confirmarSenha } = req.body;

    if (!nome || !barbearia || !endereco || !email || !senha || !confirmarSenha)
        return res.render('cadastro_barbeiro', { erro: 'Preencha todos os campos' });

    if (senha !== confirmarSenha)
        return res.render('cadastro_barbeiro', { erro: 'As senhas não coincidem' });

    try {
        if (await usuarioModel.emailJaExiste(email))
            return res.render('cadastro_barbeiro', { erro: 'Este email já está cadastrado' });

        const senhaHash = await bcrypt.hash(senha, 10);
        const usuario = await usuarioModel.criar(nome, email, senhaHash, 'barbeiro');
        await barbeiroModel.criar(usuario.id, barbearia, endereco);

        res.redirect('/login');

    } catch (err) {
        console.error('Erro ao cadastrar barbeiro:', err);
        res.render('cadastro_barbeiro', { erro: 'Erro ao cadastrar barbeiro' });
    }
}

// ── DASHBOARD ─────────────────────────────────────────

async function dashboard(req, res) {
    if (!verificarBarbeiro(req, res)) return;

    try {
        const barbeiro = await barbeiroModel.buscarPorUsuarioId(req.session.user.id);

        const agendamentosHoje = await agendamentoModel.buscarAgendamentosHoje(barbeiro.id);
        const totalMes         = await agendamentoModel.buscarTotalMes(barbeiro.id);
        const faturamento      = await agendamentoModel.buscarFaturamentoMes(barbeiro.id);

        res.render('barbeiro/dashboard_barb', {
            nome: req.session.user.nome,
            barbearia: barbeiro.barbearia,
            agendamentosHoje,
            totalMes,
            faturamento
        });

    } catch (err) {
        console.error('Erro no dashboard do barbeiro:', err);
        res.send('Erro ao carregar o dashboard');
    }
}

// ── PERFIL ────────────────────────────────────────────

async function exibirPerfil(req, res) {
    if (!verificarBarbeiro(req, res)) return;

    try {
        const usuario_id = req.session.user.id;
        const usuario   = await usuarioModel.buscarPorId(usuario_id);
        const barbearia = await barbeiroModel.buscarDadosBarbearia(usuario_id);

        res.render('barbeiro/perfil_barbeiro', { usuario, barbearia, erro: null });

    } catch (err) {
        console.error('Erro ao carregar perfil:', err);
        res.send('Erro ao carregar o perfil');
    }
}

async function atualizarPerfil(req, res) {
    if (!verificarBarbeiro(req, res)) return;

    const usuario_id = req.session.user.id;
    const { nome, email, barbearia, endereco } = req.body;

    try {
        await usuarioModel.atualizarNomeEmail(usuario_id, nome, email);
        await barbeiroModel.atualizarDados(usuario_id, barbearia, endereco);
        req.session.user.nome = nome;

        res.redirect('/barbeiro/perfil');

    } catch (err) {
        console.error('Erro ao atualizar perfil:', err);
        res.send('Erro ao atualizar o perfil');
    }
}

async function atualizarSenha(req, res) {
    if (!verificarBarbeiro(req, res)) return;

    const usuario_id = req.session.user.id;
    const { senhaAtual, novaSenha, confirmarSenha } = req.body;

    try {
        if (novaSenha !== confirmarSenha)
            return res.send('As senhas não coincidem');

        const usuario = await usuarioModel.buscarPorId(usuario_id);
        const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha);

        if (!senhaValida)
            return res.send('Senha atual incorreta');

        const senhaHash = await bcrypt.hash(novaSenha, 10);
        await usuarioModel.atualizarSenha(usuario_id, senhaHash);

        res.redirect('/barbeiro/perfil');

    } catch (err) {
        console.error('Erro ao atualizar senha:', err);
        res.send('Erro ao atualizar a senha');
    }
}

// ── SERVIÇOS ──────────────────────────────────────────

async function exibirServicos(req, res) {
    if (!verificarBarbeiro(req, res)) return;

    try {
        const barbeiro = await barbeiroModel.buscarPorUsuarioId(req.session.user.id);
        const servicos = await barbeiroModel.buscarServicos(barbeiro.id);
        const horarios = await barbeiroModel.buscarHorarios(barbeiro.id);

        res.render('barbeiro/servicos', { servicos, horarios, erro: null, sucesso: null });

    } catch (err) {
        console.error('Erro ao carregar serviços:', err);
        res.send('Erro ao carregar a página de serviços');
    }
}

async function adicionarServico(req, res) {
    if (!verificarBarbeiro(req, res)) return;

    try {
        const barbeiro = await barbeiroModel.buscarPorUsuarioId(req.session.user.id);
        await barbeiroModel.adicionarServico(barbeiro.id, req.body.nome, req.body.preco);

        res.redirect('/barbeiro/servicos');

    } catch (err) {
        console.error('Erro ao adicionar serviço:', err);
        res.send('Erro ao adicionar serviço');
    }
}

async function editarServico(req, res) {
    if (!verificarBarbeiro(req, res)) return;

    try {
        await barbeiroModel.editarServico(req.params.id, req.body.nome, req.body.preco);
        res.redirect('/barbeiro/servicos');

    } catch (err) {
        console.error('Erro ao editar serviço:', err);
        res.send('Erro ao editar serviço');
    }
}

async function removerServico(req, res) {
    if (!verificarBarbeiro(req, res)) return;

    try {
        await barbeiroModel.removerServico(req.params.id);
        res.redirect('/barbeiro/servicos');

    } catch (err) {
        console.error('Erro ao remover serviço:', err);
        res.send('Erro ao remover serviço');
    }
}

// ── HORÁRIOS ──────────────────────────────────────────

async function adicionarHorario(req, res) {
    if (!verificarBarbeiro(req, res)) return;

    try {
        const barbeiro = await barbeiroModel.buscarPorUsuarioId(req.session.user.id);
        const { dia_semana, hora_inicio, hora_fim, intervalo_minutos } = req.body;

        await barbeiroModel.adicionarHorario(
            barbeiro.id, dia_semana, hora_inicio, hora_fim, intervalo_minutos
        );

        res.redirect('/barbeiro/servicos');

    } catch (err) {
        console.error('Erro ao adicionar horário:', err);
        res.send('Erro ao adicionar horário');
    }
}

async function editarHorario(req, res) {
    if (!verificarBarbeiro(req, res)) return;

    try {
        const { hora_inicio, hora_fim, intervalo_minutos, ativo } = req.body;
        const ativoValor = ativo === 'on';

        await barbeiroModel.editarHorario(
            req.params.id, hora_inicio, hora_fim, intervalo_minutos, ativoValor
        );

        res.redirect('/barbeiro/servicos');

    } catch (err) {
        console.error('Erro ao editar horário:', err);
        res.send('Erro ao editar horário');
    }
}

// ── AGENDA ────────────────────────────────────────────

async function exibirAgenda(req, res) {
    if (!verificarBarbeiro(req, res)) return;

    try {
        const barbeiro = await barbeiroModel.buscarPorUsuarioId(req.session.user.id);
        const agendamentos = await agendamentoModel.buscarAgendaFutura(barbeiro.id);

        res.render('barbeiro/agenda', { agendamentos });

    } catch (err) {
        console.error('Erro ao carregar agenda:', err);
        res.send('Erro ao carregar a agenda');
    }
}

async function confirmarAgendamento(req, res) {
    if (!verificarBarbeiro(req, res)) return;

    try {
        await agendamentoModel.atualizarStatus(req.params.id, 'confirmado');
        res.redirect('/barbeiro/agenda');

    } catch (err) {
        console.error('Erro ao confirmar agendamento:', err);
        res.send('Erro ao confirmar agendamento');
    }
}

async function cancelarAgendamento(req, res) {
    if (!verificarBarbeiro(req, res)) return;

    try {
        await agendamentoModel.atualizarStatus(req.params.id, 'cancelado');
        res.redirect('/barbeiro/agenda');

    } catch (err) {
        console.error('Erro ao cancelar agendamento:', err);
        res.send('Erro ao cancelar agendamento');
    }
}

async function concluirAgendamento(req, res) {
    if (!verificarBarbeiro(req, res)) return;

    try {
        await agendamentoModel.atualizarStatus(req.params.id, 'concluido');
        res.redirect('/barbeiro/agenda');

    } catch (err) {
        console.error('Erro ao concluir agendamento:', err);
        res.send('Erro ao concluir agendamento');
    }
}

async function remarcarAgendamento(req, res) {
    if (!verificarBarbeiro(req, res)) return;

    try {
        const { data_agendamento, hora_agendamento } = req.body;
        await agendamentoModel.remarcar(req.params.id, data_agendamento, hora_agendamento);
        res.redirect('/barbeiro/agenda');

    } catch (err) {
        console.error('Erro ao remarcar agendamento:', err);
        res.send('Erro ao remarcar agendamento');
    }
}

module.exports = {
    exibirCadastro, cadastrar,
    dashboard,
    exibirPerfil, atualizarPerfil, atualizarSenha,
    exibirServicos, adicionarServico, editarServico, removerServico,
    adicionarHorario, editarHorario,
    exibirAgenda, confirmarAgendamento, cancelarAgendamento,
    concluirAgendamento, remarcarAgendamento
};
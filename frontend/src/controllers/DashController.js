// =================================================================
// PARTE 1 DE 4: ARQUITETURA BASE, CONSTRUTOR E MAPEAMENTO DO DOM
// =================================================================

class DashController {
  constructor(apiService) {
    this.api = apiService;

    // Elementos do DOM mapeados para gerenciamento de prioridade
    this.selectPrioridadeCadastro = document.getElementById('nova-tarefa-prioridade');
    this.selectFiltroPrioridade = document.getElementById('filtrar-prioridade');

    // Mapeamento de nós globais do DOM corporativo
    this.formTarefa = document.getElementById('form-tarefa');
    this.inputTarefa = document.getElementById('input-tarefa');
    this.listaTarefas = document.getElementById('lista-tarefas');
    this.inputBusca = document.getElementById('input-busca');
    this.selectLimite = document.getElementById('select-limite');
    this.numerosPaginasContainer = document.getElementById('numeros-paginas-container');
    this.textoContador = document.getElementById('texto-contador');
    this.fillBarraProgresso = document.getElementById('fill-barra-progresso');

    // Estados internos da instância de controle SaaS
    this.paginaAtual = 1;
    this.filtroStatusAtivo = 'todas';
    this.filtroPrioridadeAtiva = ''; 
    this.termoBuscaGlobal = '';
    this.limitePorPagina = 5;

    this.TIMER_DELETAR = 5000;
    this.TIMER_EDITAR = 12000;

    this.ICONE_EDITAR = `<svg viewBox="0 0 24 24" class="svg-icon"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>`;
    this.ICONE_DELETAR = `<svg viewBox="0 0 24 24" class="svg-icon"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>`;
    this.ICONE_CONFIRMAR = `<svg viewBox="0 0 24 24" class="svg-icon"><path d="M20 6 9 17l-5-5"/></svg>`;
    this.ICONE_CANCELAR = `<svg viewBox="0 0 24 24" class="svg-icon"><path d="M18 6 6 18M6 6l12 12"/></svg>`;
  }

  inicializar() {
    this.exibirNomeTecnicoLogado();
    this.renderizarPainelCompleto();
    this.inicializarControlesAbasEPaginacao(); 
    this.configurarEventosGlobais();
    this.configurarMotorBuscaLocal();
    
    if (this.inputTarefa) {
      this.configurarLimpezaDeErro(this.inputTarefa);
    }
  }

  exibirNomeTecnicoLogado() {
    const nomeTecnico = localStorage.getItem('saas_user_name') || 'Tech Lead SaaS';
    const tagNome = document.getElementById('nome-tecnico-logado');
    if (tagNome) tagNome.innerText = nomeTecnico;
  }

  async renderizarPainelCompleto() {
    await this.listarTarefasPaginadas();
    await this.atualizarContadorEBarraProgresso();
  }
// =================================================================
// PARTE 2 DE 4: MOTOR DE INTEGRAÇÃO API, SPRINT CONTROLS E PAGINAÇÃO
// =================================================================

  async listarTarefasPaginadas() {
    const endpoint = `/tarefas?page=${this.paginaAtual}&limit=${this.limitePorPagina}&status=${this.filtroStatusAtivo}&search=${encodeURIComponent(this.termoBuscaGlobal)}&prioridade=${this.filtroPrioridadeAtiva}`;

    try {
      const dados = await this.api.get(endpoint);
      if (!this.listaTarefas) return;
      this.listaTarefas.innerHTML = '';
      
      if (dados.tarefas && dados.tarefas.length > 0) {
        dados.tarefas.forEach(tarefa => {
          const li = document.createElement('li');
          li.className = 'todo-item-wrapper';
          li.id = `tarefa-${tarefa.id}`;
          this.renderizarCardPadrao(li, tarefa);
          this.listaTarefas.appendChild(li);
        });
      }
      
      this.construirBlocosNumericosPaginacao(dados.paginacao.paginaAtual, dados.paginacao.totalPaginas);
      
      const btnAnt = document.getElementById('btn-pag-anterior');
      const btnProx = document.getElementById('btn-pag-proxima');
      if (btnAnt) btnAnt.disabled = this.paginaAtual <= 1;
      if (btnProx) btnProx.disabled = this.paginaAtual >= dados.paginacao.totalPaginas;
    } catch (erro) {
      console.error("Falha ao sincronizar dados da listagem SaaS:", erro);
    }
  }

  construirBlocosNumericosPaginacao(atual, total) {
    if (!this.numerosPaginasContainer) return;
    this.numerosPaginasContainer.innerHTML = '';
    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= atual - 1 && i <= atual + 1)) {
        const btn = document.createElement('button');
        btn.className = `btn-pagina-numero ${i === atual ? 'ativa' : ''}`;
        btn.innerText = i;
        btn.addEventListener('click', () => { 
          this.paginaAtual = i; 
          this.renderizarPainelCompleto(); 
        });
        this.numerosPaginasContainer.appendChild(btn);
      }
    }
  }

  async atualizarContadorEBarraProgresso() {
    try {
      const dados = await this.api.get('/tarefas/contador');
      if (this.textoContador) this.textoContador.innerText = `${dados.concluidas} de ${dados.total} concluídas`;
      if (this.fillBarraProgresso) {
        const porcentagem = dados.total > 0 ? (dados.concluidas / dados.total) * 100 : 0;
        this.fillBarraProgresso.style.width = `${porcentagem}%`;
      }
    } catch (erro) {
      console.error("Erro na leitura de contadores:", erro);
    }
  }

  inicializarControlesAbasEPaginacao() {
    const btnAnt = document.getElementById('btn-pag-anterior');
    if (btnAnt) {
      btnAnt.addEventListener('click', () => {
        if (this.paginaAtual > 1) {
          this.paginaAtual--;
          this.renderizarPainelCompleto();
        }
      });
    }

    const btnProx = document.getElementById('btn-pag-proxima');
    if (btnProx) {
      btnProx.addEventListener('click', () => {
        this.paginaAtual++;
        this.renderizarPainelCompleto();
      });
    }
  }
// =================================================================
// PARTE 3 DE 4: RENDERIZADOR DE CARDS E SALVAMENTO INLINE (CRUD CORRIGIDO)
// =================================================================

  renderizarCardPadrao(li, tarefa) {
    this.limparTimerInatividade(li);
    const id = tarefa.id;
    const checkStatusClass = tarefa.concluida ? 'checked' : '';
    const isCheckedAttr = tarefa.concluida ? 'checked' : '';
    
    let prioridadeExibida = tarefa.prioridade === 'Media' ? 'Média' : tarefa.prioridade;
    let prioridadeClass = 'tag-prioridade-media';
    if (tarefa.prioridade === 'Baixa') prioridadeClass = 'tag-prioridade-baixa';
    if (tarefa.prioridade === 'Alta') prioridadeClass = 'tag-prioridade-alta';

    let stringAuditoria = `Início: ${Formatter.formatarGDHMilitar(tarefa.criado_em) || 'N/A'} por <span class="tecnico-tag">${tarefa.criador_nome || 'Admin'}</span>`;
    if (tarefa.concluida && tarefa.concluido_em) {
      stringAuditoria += ` | Fim: ${Formatter.formatarGDHMilitar(tarefa.concluido_em)}`;
    }

    li.innerHTML = `
      <div class="todo-content-front ${checkStatusClass}" data-id="${id}">
        <div class="custom-checkbox-wrapper">
          <input type="checkbox" id="check-${id}" class="checkbox-input-oculto" ${isCheckedAttr}>
          <label for="check-${id}" class="custom-checkbox-visual"></label>
        </div>
        <div class="container-texto-meta">
          <span class="texto-tarefa">${tarefa.descricao}</span>
          <span class="meta-auditoria">
            ${stringAuditoria}
            <span class="badge-prioridade ${prioridadeClass}">
                ${prioridadeExibida || 'Média'}
            </span>
          </span>
        </div>
        <div class="botoes-acao-fixos">
          <button class="edit-btn-fixo" title="Editar">${this.ICONE_EDITAR}</button>
          <button class="delete-btn-fixo" title="Deletar">${this.ICONE_DELETAR}</button>
        </div>
      </div>
    `;

    li.querySelector(`#check-${id}`).addEventListener('change', async (e) => {
      const novoEstado = e.target.checked ? 1 : 0;
      const usuarioIdLogado = localStorage.getItem('saas_user_id') || 3;
      
      try {
        // PAYLOAD CORRIGIDO: Removido o campo redundante 'prioridade' do update
        await this.api.put(`/tarefas/${id}`, {
          descricao: tarefa.descricao,
          concluida: novoEstado,
          atualizado_por: usuarioIdLogado
        });
        
        tarefa.concluida = novoEstado; 
        this.renderizarPainelCompleto();
      } catch (erro) {
        console.error("Erro ao atualizar estado do checkbox:", erro);
        e.target.checked = !e.target.checked;
      }
    });

    li.querySelector('.edit-btn-fixo').addEventListener('click', () => { this.habilitarEdicaoInline(li, tarefa); });
    li.querySelector('.delete-btn-fixo').addEventListener('click', () => { this.solicitarConfirmacaoDelecao(li, tarefa); });
  }

   async salvarEdicaoInline(li, tarefa) {
    const input = document.getElementById(`input-edit-${tarefa.id}`);
    if (!input || input.value.trim() === '') return;
    const novoTexto = input.value.trim();
    const usuarioIdLogado = localStorage.getItem('saas_user_id') || 3;
    
    try {
      const resposta = await this.api.put(`/tarefas/${tarefa.id}`, {
        descricao: novoTexto,
        concluida: tarefa.concluida ? 1 : 0,
        atualizado_por: usuarioIdLogado
      });
      
      // BLINDAGEM COMPLETA: Fecha se houver qualquer resposta positiva ou mensagem de sucesso do backend
      if (resposta && (resposta.message || resposta.error === undefined)) {
        this.limparTimerInatividade(li);
        tarefa.descricao = novoTexto; 
        
        // Força o card a voltar para o estado padrão (fechando os inputs e botões verdes)
        this.renderizarCardPadrao(li, tarefa);
        await this.atualizarContadorEBarraProgresso();
      }
    } catch (erro) {
      console.error("Falha ao processar edição inline:", erro);
    }
  }
// =================================================================
// PARTE 4 DE 4: LISTENERS DE CADASTRO, EXCLUSÃO E INICIALIZAÇÃO SPA
// =================================================================

  configurarEventosGlobais() {
    const btnLogout = document.getElementById('btn-sair');
    if (btnLogout) {
      btnLogout.addEventListener('click', (e) => { 
        e.preventDefault();
        localStorage.removeItem('saas_user_id');
        localStorage.removeItem('saas_user_name');
        localStorage.removeItem('saas_user_token'); // Limpa também o token para evitar bypass involuntário
        sessionStorage.clear();

        if (typeof authController !== 'undefined' && authController.executarLogout) {
          authController.executarLogout(); 
        } else {
          window.location.href = 'index.html'; 
        }
      });
    }

    if (this.formTarefa) {
      this.formTarefa.addEventListener('submit', async (e) => {
        e.preventDefault();

        // VALIDAÇÃO 1: Testa campo vazio localmente antes de enviar
        const { val, inputValido } = this.obterEValidarTexto(this.inputTarefa);
        if (!inputValido) return;

        const usuarioIdLogado = localStorage.getItem('saas_user_id') || 3;
        const seletorAtalhado = this.formTarefa.querySelector('.select-prioridade-form') || document.getElementById('nova-tarefa-prioridade');
        
        let prioridadeSelecionada = 'Media';
        if (seletorAtalhado) {
          const valorBruto = seletorAtalhado.value;
          prioridadeSelecionada = valorBruto === 'Média' ? 'Media' : valorBruto;
        }

        try {
          const resposta = await this.api.post('/tarefas', { 
            descricao: val, 
            usuario_id: usuarioIdLogado,
            prioridade: prioridadeSelecionada 
          });
          
          // VALIDAÇÃO 2: Captura erro de duplicidade ou restrição vinda do banco (ex: Status 400)
          if (resposta && resposta.error) {
            this.mostrarErroNoInput(this.inputTarefa, resposta.error);
            return;
          }
          
          this.inputTarefa.value = '';
          if (seletorAtalhado) seletorAtalhado.value = 'Media'; 
          this.renderizarPainelCompleto();
        } catch (erro) {
          console.error("Falha ao registrar tarefa técnica:", erro);
          // Alerta genérico em caso de falha de conexão com a API
          this.mostrarErroNoInput(this.inputTarefa, "Erro de comunicação com o servidor.");
        }
      });
    }


    if (this.selectFiltroPrioridade) {
        this.selectFiltroPrioridade.addEventListener('change', (e) => {
            this.filtroPrioridadeAtiva = e.target.value;
            this.paginaAtual = 1; 
            this.renderizarPainelCompleto();
        });
    }

    if (this.selectLimite) {
      this.selectLimite.addEventListener('change', (e) => {
        this.limitePorPagina = parseInt(e.target.value) || 5;
        this.paginaAtual = 1;
        this.renderizarPainelCompleto();
      });
    }

    document.querySelectorAll('.aba-btn').forEach(botao => {
      botao.addEventListener('click', (e) => {
        document.querySelectorAll('.aba-btn').forEach(b => b.classList.remove('ativa'));
        e.target.classList.add('ativa');
        this.filtroStatusAtivo = e.target.dataset.status;
        this.paginaAtual = 1;
        this.renderizarPainelCompleto();
      });
    });
  }
 
  habilitarEdicaoInline(li, tarefa) {
    this.limparTimerInatividade(li);
    const id = tarefa.id;
    li.innerHTML = `
      <div class="todo-content-front em-edicao">
        <div class="container-input-validacao">
          <input type="text" class="input-edicao" value="${tarefa.descricao}" id="input-edit-${id}">
        </div>
        <div class="botoes-edicao-rapida">
          <button class="btn-salvar-inline" title="Salvar">${this.ICONE_CONFIRMAR}</button>
          <button class="btn-cancelar-inline" title="Cancelar">${this.ICONE_CANCELAR}</button>
        </div>
        <div class="barra-progresso-timeout linear-edit"></div>
      </div>
    `;
    const input = document.getElementById(`input-edit-${id}`);
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
    this.configurarLimpezaDeErro(input);

    const reiniciarTimerEdicao = () => {
      this.limparTimerInatividade(li);
      const barra = li.querySelector('.barra-progresso-timeout');
      if (barra) {
        barra.style.animation = 'none';
        barra.offsetHeight; 
        barra.style.animation = `decrementarBarra ${this.TIMER_EDITAR}ms linear forwards`;
      }
      li.timerInatividade = setTimeout(() => { this.renderizarCardPadrao(li, tarefa); }, this.TIMER_EDITAR);
    };

    reiniciarTimerEdicao();
    input.addEventListener('input', reiniciarTimerEdicao);

    li.querySelector('.btn-salvar-inline').addEventListener('click', () => this.salvarEdicaoInline(li, tarefa));
    li.querySelector('.btn-cancelar-inline').addEventListener('click', () => this.renderizarCardPadrao(li, tarefa));
  }

  solicitarConfirmacaoDelecao(li, tarefa) {
    this.limparTimerInatividade(li);
    li.innerHTML = `
      <div class="todo-content-front em-deletar">
        <span class="aviso-excluir">Excluir tarefa?</span>
        <div class="botoes-edicao-rapida">
          <button class="btn-confirmar-delete" title="Confirmar">${this.ICONE_CONFIRMAR}</button>
          <button class="btn-cancelar-inline" title="Voltar">${this.ICONE_CANCELAR}</button>
        </div>
        <div class="barra-progresso-timeout linear-delete"></div>
      </div>
    `;
    const barra = li.querySelector('.barra-progresso-timeout');
    if (barra) barra.style.animation = `decrementarBarra ${this.TIMER_DELETAR}ms linear forwards`;

    li.querySelector('.btn-confirmar-delete').addEventListener('click', async () => {
      this.limparTimerInatividade(li);
      try {
        await this.api.delete(`/tarefas/${tarefa.id}`);
        li.remove(); 
        await this.atualizarContadorEBarraProgresso();
      } catch (erro) {
        console.error("Erro ao deletar item de forma isolada:", erro);
      }
    });
    li.querySelector('.btn-cancelar-inline').addEventListener('click', () => this.renderizarCardPadrao(li, tarefa));
    li.timerInatividade = setTimeout(() => { this.renderizarCardPadrao(li, tarefa); }, this.TIMER_DELETAR);
  }

  configurarMotorBuscaLocal() {
    if (!this.inputBusca) return;
    this.inputBusca.addEventListener('input', (e) => { 
      this.termoBuscaGlobal = e.target.value; 
      this.paginaAtual = 1; 
      this.renderizarPainelCompleto(); 
    });
  }

  configurarLimpezaDeErro(inputElement) {
    inputElement.addEventListener('input', () => {
      const err = inputElement.parentElement.querySelector('.balao-erro');
      if (err) err.remove();
      inputElement.classList.remove('borda-erro-fixa');
    });
  }

  mostrarErroNoInput(inputElement, msg) {
    const container = inputElement.parentElement;
    const err = container.querySelector('.balao-erro');
    if (err) err.remove();
    inputElement.classList.add('borda-erro-fixa');
    const balao = document.createElement('div');
    balao.className = 'balao-erro'; 
    balao.innerText = msg;
    container.appendChild(balao);
  }

  obterEValidarTexto(inputElement) {
    const val = inputElement.value.trim();
    if (val === '') {
      this.mostrarErroNoInput(inputElement, 'Preencha este campo.');
      return { val: '', inputValido: false };
    }
    return { val, inputValido: true };
  }

  limparTimerInatividade(li) {
    if (li.timerInatividade) { clearTimeout(li.timerInatividade); li.timerInatividade = null; }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('lista-tarefas')) {
    const dashController = new DashController(apiService);
    dashController.inicializar();
  }
});

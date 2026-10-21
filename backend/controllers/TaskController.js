// =================================================================
// PARTE 1: ARQUITETURA BASE E MÉTODO DE LISTAGEM STRATÉGICA (GET)
// =================================================================

class TaskController {
  constructor(dbConnection) {
    this.db = dbConnection;
  }

  // LISTAR: Listar tarefas com paginação, busca e ordenação de prioridade
  async list(req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;
    const status = req.query.status || 'todas';
    const prioridade = req.query.prioridade || '';
    const busca = req.query.search ? `%${req.query.search.trim()}%` : null;

    let condicoes = [];
    let queryParams = [];

    // Filtro por Status da Aba
    if (status === 'pendentes') condicoes.push('t.concluida = 0');
    else if (status === 'concluidas') condicoes.push('t.concluida = 1');

    // FILTRO DE PRIORIDADE: Removido o acento para casar com o banco de dados (Media)
    if (prioridade && ['Baixa', 'Media', 'Alta'].includes(prioridade)) {
      condicoes.push('t.prioridade = ?');
      queryParams.push(prioridade);
    }

    // Filtro pelo Termo de Busca
    if (busca) {
      condicoes.push('t.descricao LIKE ?');
      queryParams.push(busca);
    }

    const sqlFiltro = condicoes.length > 0 ? `WHERE ${condicoes.join(' AND ')}` : '';
    
    // QUERY AJUSTADA: Mudado 'Média' para 'Media' na função FIELD
    const mainSql = `
      SELECT t.*, u.nome AS criador_nome 
      FROM tarefas t 
      LEFT JOIN usuarios u ON t.usuario_id = u.id 
      ${sqlFiltro} 
      ORDER BY FIELD(t.prioridade, 'Alta', 'Media', 'Baixa'), t.id DESC 
      LIMIT ? OFFSET ?
    `;

    this.db.query(mainSql, [...queryParams, limit, offset], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      
      this.db.query(`SELECT COUNT(*) AS total FROM tarefas t ${sqlFiltro}`, queryParams, (err, countResult) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const totalItens = countResult && countResult[0] ? (countResult[0].total || countResult[0]['COUNT(*)']) : 0;
        const totalPaginas = Math.ceil(totalItens / limit) || 1;

        res.json({
          tarefas: results,
          paginacao: { totalItens, totalPaginas, paginaAtual: page, limite: limit }
        });
      });
    });
  }

// =================================================================
// PARTE 2: PERSISTÊNCIA, EDICAO E REMOÇÃO DE TAREFAS (POST, PUT, DELETE)
// =================================================================

  // CRIAR: Registrar nova tarefa técnica injetando a prioridade correspondente
  async create(req, res) {
    const descricao = req.body.descricao;
    const usuario_id = req.body.usuario_id;
    const prioridade = req.body.prioridade;
    
    const idUsuarioValido = usuario_id || 1;

    if (!descricao || descricao.trim() === '') {
      return res.status(400).json({ error: 'Descrição vazia.' });
    }

    // VALIDAÇÃO AJUSTADA: Aceita e grava 'Media' sem acento para alinhar com o banco
    let prioridadeDefinida = 'Media';
    if (prioridade) {
      const pTrim = prioridade.trim();
      if (['Baixa', 'Media', 'Alta'].includes(pTrim)) {
        prioridadeDefinida = pTrim;
      }
    }

    const sql = 'INSERT INTO tarefas (descricao, concluida, criado_em, usuario_id, atualizado_por, prioridade) VALUES (?, 0, NOW(), ?, ?, ?)';
    
    this.db.query(sql, [descricao.trim(), idUsuarioValido, idUsuarioValido, prioridadeDefinida], (err, r) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ 
        id: r.insertId, 
        descricao: descricao.trim(), 
        concluida: 0, 
        prioridade: prioridadeDefinida 
      });
    });
  }

  // ATUALIZAR: Refatoração defensiva contra perda de estado (prioridade e descrição)
  async update(req, res) {
    const { id } = req.params;
    const { descricao, concluida, atualizado_por, prioridade } = req.body;
    
    const idModificador = atualizado_por || 1;

    this.db.query('SELECT * FROM tarefas WHERE id = ?', [id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!rows || rows.length === 0) return res.status(404).json({ error: 'Tarefa não encontrada.' });

      const textoFinal = (descricao !== undefined && descricao !== null) ? descricao.trim() : rows[0].descricao;
      const estadoConcluida = concluida !== undefined ? Number(concluida) : rows[0].concluida;
      
      // ATUALIZAÇÃO AJUSTADA: Modificado para 'Media' sem acento nas validações
      let prioridadeFinal = rows[0].prioridade;
      if (prioridade && ['Baixa', 'Media', 'Alta'].includes(prioridade.trim())) {
        prioridadeFinal = prioridade.trim();
      }

      const sqlUpdate = `
        UPDATE tarefas 
        SET descricao = ?, 
            concluida = ?, 
            concluido_em = CASE WHEN ? = 1 THEN NOW() ELSE NULL END, 
            atualizado_por = ?, 
            prioridade = ? 
        WHERE id = ?
      `;

      this.db.query(sqlUpdate, [textoFinal, estadoConcluida, estadoConcluida, idModificador, prioridadeFinal, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Tarefa auditada com sucesso!' });
      });
    });
  }

  // DELETAR: Remove o card de forma isolada e segura do ecossistema
  async delete(req, res) {  
    const { id } = req.params;
    this.db.query('DELETE FROM tarefas WHERE id = ?', [id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Tarefa removida do ecossistema.' });
    });
  }
}

module.exports = TaskController;

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let db;
function inicializarConexaoMysql() {
  db = mysql.createConnection({
    host: 'localhost', 
    user: 'root', 
    password: '', 
    database: 'db_tarefas_saas',
    keepAliveInitialDelay: 10000, 
    enableKeepAlive: true
  });
  
  db.connect((err) => {
    if (err) { 
      console.error('⚠️ Erro ao conectar no MySQL. Retentando em 5s...', err.message);
      setTimeout(inicializarConexaoMysql, 5000); 
      return; 
    }
    console.log('✅ MySQL conectado à nova arquitetura SaaS com sucesso!');
  });

  db.on('error', (err) => {
    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
      inicializarConexaoMysql();
    }
  });
}
inicializarConexaoMysql();
// CLASSE INTERNA: Evita qualquer falha de arquivo não encontrado (404) no terminal
class TaskController {
  constructor(dbConnection) {
    this.db = dbConnection;
  }

  async list(req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;
    const status = req.query.status || 'todas';
    const busca = req.query.search ? `%${req.query.search.trim()}%` : null;

    let condicoes = [];
    let queryParams = [];

    if (status === 'pendentes') condicoes.push('t.concluida = 0');
    else if (status === 'concluidas') condicoes.push('t.concluida = 1');

    if (busca) {
      condicoes.push('t.descricao LIKE ?');
      queryParams.push(busca);
    }

    const sqlFiltro = condicoes.length > 0 ? `WHERE ${condicoes.join(' AND ')}` : '';
    const mainSql = `
      SELECT t.*, u.nome AS criador_nome 
      FROM tarefas t 
      LEFT JOIN usuarios u ON t.usuario_id = u.id 
      ${sqlFiltro} 
      ORDER BY t.id DESC LIMIT ? OFFSET ?
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
  }// ==========================================================================
// MÉTODOS REVISADOS PARA CONTROLAR O ENUM 'Media' DO BANCO DE DADOS
// ==========================================================================

  async list(req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;
    const status = req.query.status || 'todas';
    const prioridade = req.query.prioridade || '';
    const busca = req.query.search ? `%${req.query.search.trim()}%` : null;

    let condicoes = [];
    let queryParams = [];

    if (status === 'pendentes') condicoes.push('t.concluida = 0');
    else if (status === 'concluidas') condicoes.push('t.concluida = 1');

    // Sanitização de busca e filtros tolerante a acentuação externa
    if (prioridade && ['Baixa', 'Media', 'Média', 'Alta'].includes(prioridade)) {
      let pFiltro = (prioridade === 'Média' || prioridade === 'Media') ? 'Media' : prioridade;
      condicoes.push('t.prioridade = ?');
      queryParams.push(pFiltro);
    }

    if (busca) {
      condicoes.push('t.descricao LIKE ?');
      queryParams.push(busca);
    }

    const sqlFiltro = condicoes.length > 0 ? `WHERE ${condicoes.join(' AND ')}` : '';
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

  async create(req, res) {
    const { descricao, usuario_id, prioridade } = req.body;
    const idUsuarioValido = usuario_id || 1;

    if (!descricao || descricao.trim() === '') {
      return res.status(400).json({ error: 'Preencha este campo.' });
    }

    const textoFormatado = descricao.trim();
    
    // TRATAMENTO COERCITIVO ROBUSTO: Mapeia strings com ou sem acentos para o ENUM do MySQL
    let prioridadeDefinida = 'Media';
    if (prioridade) {
      const pFormatado = prioridade.trim().toLowerCase();
      if (pFormatado === 'alta') prioridadeDefinida = 'Alta';
      if (pFormatado === 'baixa') prioridadeDefinida = 'Baixa';
      if (pFormatado === 'media' || pFormatado === 'média') prioridadeDefinida = 'Media';
    }

    const checarSql = 'SELECT COUNT(*) AS total FROM tarefas WHERE LOWER(TRIM(descricao)) = LOWER(TRIM(?))';
    
    this.db.query(checarSql, [textoFormatado], (err, checkResult) => {
      if (err) return res.status(500).json({ error: err.message });

      const existeDuplicidade = checkResult && checkResult[0] ? (checkResult[0].total || checkResult[0]['COUNT(*)']) : 0;

      if (existeDuplicidade > 0) {
        return res.status(400).json({ error: `A tarefa "${textoFormatado}" já existe!` });
      }

      const sqlInsert = 'INSERT INTO tarefas (descricao, concluida, criado_em, usuario_id, atualizado_por, prioridade) VALUES (?, 0, NOW(), ?, ?, ?)';
      this.db.query(sqlInsert, [textoFormatado, idUsuarioValido, idUsuarioValido, prioridadeDefinida], (err, r) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: r.insertId, descricao: textoFormatado, concluida: 0, prioridade: prioridadeDefinida });
      });
    });
  }


  async update(req, res) {
    const { id } = req.params;
    const { descricao, concluida, atualizado_por } = req.body;
    const estadoConcluida = concluida !== undefined ? Number(concluida) : 0;
    const idModificador = atualizado_por || 1;

    this.db.query('SELECT * FROM tarefas WHERE id = ?', [id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!rows || rows.length === 0) return res.status(404).json({ error: 'Não encontrado' });

      const textoFinal = descricao !== undefined ? descricao.trim() : rows[0].descricao;
      const sqlUpdate = `UPDATE tarefas SET descricao = ?, concluida = ?, concluido_em = CASE WHEN ? = 1 THEN NOW() ELSE NULL END, atualizado_por = ? WHERE id = ?`;

      this.db.query(sqlUpdate, [textoFinal, estadoConcluida, estadoConcluida, idModificador, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Sucesso' });
      });
    });
  }

  async delete(req, res) {
    this.db.query('DELETE FROM tarefas WHERE id = ?', [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Removido' });
    });
  }
}

const taskController = new TaskController(db);
// ==========================================================================
// ROTAS OFICIAIS DO SISTEMA CORPORATIVO
// ==========================================================================

// Autenticação Integrada e Bypass Direto
app.post('/auth/google', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token corporativo ausente.' });

  let email = 'techlead@saas.com';
  let name = 'Tech Lead SaaS';
  let googleId = 'mock_google_id_12345';

  db.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results && results.length > 0) {
      const usuario = results[0]; 
      return res.json({
        token: googleId,
        usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email }
      });
    } else {
      const sqlInsert = 'INSERT INTO usuarios (nome, email, google_id, criado_em) VALUES (?, ?, ?, NOW())';
      db.query(sqlInsert, [name, email, googleId], (err, insertResult) => {
        if (err) return res.status(500).json({ error: err.message });
        
        res.json({
          token: googleId,
          usuario: { id: insertResult.insertId, nome: name, email: email }
        });
      });
    }
  });
});

app.get('/tarefas', (req, res) => taskController.list(req, res));
app.post('/tarefas', (req, res) => taskController.create(req, res));
app.put('/tarefas/:id', (req, res) => taskController.update(req, res));
app.delete('/tarefas/:id', (req, res) => taskController.delete(req, res));

app.get('/tarefas/contador', (req, res) => {
  db.query('SELECT COUNT(*) as total, SUM(CASE WHEN concluida = 1 THEN 1 ELSE 0 END) as concluidas FROM tarefas', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const rows = results && results.length > 0 ? results[0] : { total: 0, concluidas: 0 };
    res.json({ 
      total: rows.total || 0, 
      concluidas: Number(rows.concluidas) || 0 
    });
  });
});

app.listen(3000, () => {
  console.log('🔥 Nova API baseada em POO ativa de forma resiliente na porta 3000');
});

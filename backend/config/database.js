const mysql = require('mysql2');

function criarPoolDeConexao() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'db_tarefas_saas',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
  });

  console.log('✅ Pool de conexões do MariaDB inicializado com sucesso!');
  return pool;
}

module.exports = criarPoolDeConexao();

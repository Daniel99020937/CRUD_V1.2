const { OAuth2Client } = require('google-auth-library');
const GOOGLE_CLIENT_ID = '://googleusercontent.com';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

class AuthController {
  constructor(dbConnection) {
    this.db = dbConnection;
  }
  async loginWithGoogle(req, res) {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token corporativo ausente.' });

    try {
      let email, name, googleId;

      // CORREÇÃO CIRÚRGICA: Intercepta o sinal do botão azul de teste sem bater nos servidores do Google
      if (token === 'token_mock_teste_local') {
        email = 'techlead@saas.com';
        name = 'Tech Lead SaaS';
        googleId = 'mock_google_id_12345';
      } else {
        const ticket = await client.verifyIdToken({
          idToken: token,
          audience: GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        email = payload.email;
        name = payload.name;
        googleId = payload.sub;
      }
      // CORREÇÃO CRÍTICA: Busca o e-mail tratando o retorno do driver do pool corretamente
      this.db.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        if (results && results.length > 0) {
          // Correção da extração: acessa a primeira linha do array retornado pelo MySQL
          const usuario = results[0]; 
          return res.json({
            token: googleId,
            usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email }
          });
        } else {
          // Cria o registro fake automaticamente se a tabela estiver limpa
          const sqlInsert = 'INSERT INTO usuarios (nome, email, google_id, criado_em) VALUES (?, ?, ?, NOW())';
          this.db.query(sqlInsert, [name, email, googleId], (err, insertResult) => {
            if (err) return res.status(500).json({ error: err.message });
            
            res.json({
              token: googleId,
              usuario: { id: insertResult.insertId, nome: name, email: email }
            });
          });
        }
      });
    } catch (error) {
      res.status(401).json({ error: 'Assinatura digital corporativa inválida.' });
    }
  }
}

module.exports = AuthController;

class AuthController {
      verificarSessaoAtiva() {
    const token = localStorage.getItem('saas_user_token');
    const paginaAtual = window.location.pathname;

    // Se tentar acessar o painel de tarefas diretamente sem token, barra e joga na auth.html
    if (!token && paginaAtual.includes('dashboard.html')) {
      window.location.href = 'auth.html';
      return;
    }
    
    // Se o engenheiro já estiver logado e cair na tela de login por engano, joga de volta no painel
    if (token && paginaAtual.includes('auth.html')) {
      window.location.href = 'dashboard.html';
      return;
    }
  }

  async autenticarUsuarioNoBackend(googleToken) {
    try {
      const resposta = await fetch('http://localhost:3000/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: googleToken })
      });

      if (!resposta.ok) {
        alert('Falha na autenticação corporativa.');
        return;
      }

      const dadosSessao = await resposta.json();
      
      localStorage.setItem('saas_user_token', dadosSessao.token);
      localStorage.setItem('saas_user_name', dadosSessao.usuario.nome);
      localStorage.setItem('saas_user_id', dadosSessao.usuario.id);

      // CORREÇÃO: Redireciona de forma relativa mantendo o escopo da URL (localhost ou file)
      window.location.href = 'dashboard.html';
    } catch (erro) {
      console.error('Erro de handshake com a API:', erro);
    }
  }

  executarLogout() {
    localStorage.clear();
    // CORREÇÃO: Redireciona corretamente para a landing page index.html
    window.location.href = 'index.html';
  }

}

const authController = new AuthController();
document.addEventListener('DOMContentLoaded', () => authController.verificarSessaoAtiva());

// Função global exigida pela API do Google Identity Services exposta no window
window.handleCredentialResponse = (response) => {
  authController.autenticarUsuarioNoBackend(response.credential);
};

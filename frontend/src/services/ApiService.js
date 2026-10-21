class ApiService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  _getHeaders() {
    const token = localStorage.getItem('saas_user_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }

  async get(endpoint) {
    const resposta = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    return resposta.json();
  }

   async post(endpoint, dados) {
    try {
      const resposta = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: this._getHeaders(),
        body: JSON.stringify(dados)
      });

      // Captura o JSON independente se o status é de sucesso (201) ou de erro (400)
      const dadosJson = await resposta.json();

      // Se a resposta não for OK (status fora da faixa 200-299), trata o erro retornado
      if (!resposta.ok) {
        return { error: dadosJson.error || 'Erro na requisição corporativa.' };
      }

      return dadosJson;
    } catch (erro) {
      console.error("Erro na camada de rede da API:", erro);
      return { error: "Sem conexão com o servidor." };
    }
  }


  async put(endpoint, dados) {
    const resposta = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this._getHeaders(),
      body: JSON.stringify(dados)
    });
    return resposta;
  }

  async delete(endpoint) {
    const resposta = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this._getHeaders()
    });
    return resposta;
  }
}

// Cria a instância global unificada compartilhada
const apiService = new ApiService('http://localhost:3000');

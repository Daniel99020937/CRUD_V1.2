/**
 * @class Formatter
 * @description Classe utilitária orientada a objetos para tratamento e conversão de dados brutos.
 */
class Formatter {
  
  /**
   * Converte uma string de data ISO vinda do banco em formato GDH Militar unificado.
   * Exemplo de saída técnica: 191132OUT26 (Dia, Hora, Minuto, Mês, Ano)
   * @param {string} stringData - Data ISO bruta do MySQL.
   * @returns {string|null} Data formatada ou nulo se inexistente.
   */
  static formatarGDHMilitar(stringData) {
    if (!stringData) return null;
    
    const d = new Date(stringData);
    
    // Força o preenchimento de zeros à esquerda para manter o tamanho fixo padrão
    const pad = (n) => String(n).padStart(2, '0');
    
    const dia  = pad(d.getDate());
    const hora = pad(d.getHours());
    const min  = pad(d.getMinutes());
    
    const meses = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
    const mesTexto = meses[d.getMonth()];
    
    // Captura apenas os dois últimos dígitos do ano (Ex: 2026 vira 26)
    const anoCurto = String(d.getFullYear()).slice(-2);
    
    return `${dia}${hora}${min}${mesTexto}${anoCurto}`;
  }
}

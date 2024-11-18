const { Sequelize } = require('sequelize');

// Configuração da conexão
const sequelize = new Sequelize('meu_banco', 'usuario', 'senha', {
  host: '0.0.0.0', // Ou IP do servidor MySQL
  dialect: 'mysql',  // Especifica o uso do MySQL
  port: 3306,        // Porta padrão do MySQL
  logging: true     // Desativa logs de SQL no console (opcional)
});

module.exports = sequelize;

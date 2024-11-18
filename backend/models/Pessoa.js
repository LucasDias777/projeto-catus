const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Pessoa = sequelize.define('Pessoa', {
  nome_completo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  data_nascimento: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  genero: {
    type: DataTypes.STRING, // Substitui ENUM por STRING
    allowNull: false,
    validate: {
      isIn: [['Masculino', 'Feminino', 'Outro']], // Validações opcionais
    },
  },
  cep: {
    type: DataTypes.STRING(8),
    allowNull: false,
  },
  cidade: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  uf: {
    type: DataTypes.STRING(2),
    allowNull: false,
  },
  endereco: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  numero_casa: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  complemento: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  bairro: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  telefone: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: /^[0-9]{10,11}$/, // Valida telefone com 10 ou 11 dígitos
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  senha: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  tipo_pessoa: {
    type: DataTypes.STRING, // Substitui ENUM por STRING
    allowNull: false,
    validate: {
      isIn: [['Aluno', 'Professor']], // Validações opcionais
    },
  },
}, {
  tableName: 'pessoa',
  timestamps: true, // Cria colunas createdAt e updatedAt
});

module.exports = Pessoa;

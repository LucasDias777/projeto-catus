// backend/routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const  Pessoa  = require('../models/Pessoa'); // Supondo que você tenha um modelo de Usuário configurado no Sequelize
const router = express.Router();

// Rota para cadastro
router.post('/cadastrar', async (req, res) => {
  console.log(86865)
  const {
    nome_completo,
    data_nascimento,
    genero,
    cep,
    cidade,
    uf,
    endereco,
    numero_casa,
    complemento,
    bairro,
    telefone,
    email,
    senha,
    tipo_pessoa,
  } = req.body;

  try {
    // Verifica se o e-mail já está cadastrado
    const existingUser = await Pessoa.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'E-mail já está cadastrado.' });
    }

    // Criptografar a senha antes de salvar
    const hashedPassword = await bcrypt.hash(senha, 10);

    // Criar um novo usuário no banco de dados
    const result = await Pessoa.create({
      nome_completo,
      data_nascimento,
      genero,
      cep,
      cidade,
      uf,
      endereco,
      numero_casa,
      complemento,
      bairro,
      telefone,
      email,
      senha: hashedPassword,
      tipo_pessoa,
    });

    res.status(200).json({ message: 'Usuário cadastrado com sucesso!' });
  } catch (error) {
    console.error('Erro ao cadastrar usuário:', error);
    res.status(500).json({ message: 'Erro no servidor. Tente novamente mais tarde.' });
  }
});

module.exports = router;

// backend/routes/authRoutes.js
import express from 'express';
import bcrypt from 'bcrypt';
import pool from '../database.js'; // Importa a configuração do banco de dados

const router = express.Router();

// Rota para cadastro
router.post('/cadastrar', async (req, res) => {
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
    const [existingUser] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'E-mail já está cadastrado.' });
    }

    // Criptografar a senha antes de salvar
    const hashedPassword = await bcrypt.hash(senha, 10);

    // Inserir o usuário no banco de dados
    const result = await pool.query(
      `INSERT INTO usuarios (nome_completo, data_nascimento, genero, cep, cidade, uf, endereco, numero_casa, complemento, bairro, telefone, email, senha, tipo_pessoa) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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
        hashedPassword,
        tipo_pessoa,
      ]
    );

    res.status(200).json({ message: 'Usuário cadastrado com sucesso!' });
  } catch (error) {
    console.error('Erro ao cadastrar usuário:', error);
    res.status(500).json({ message: 'Erro no servidor. Tente novamente mais tarde.' });
  }
});

export default router;

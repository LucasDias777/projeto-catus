const express = require('express');
const router = require('./routes/cadastraralunoRoutes');  // Importando o router corretamente
const cors = require('cors');
const path = require('path');
const sequelize = require('./database');
const Pessoa = require('./models/Pessoa');

// Usando __dirname diretamente

const app = express();
const PORT = 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas
app.use('/api', router);  // Aqui você usa 'router' ao invés de 'pessoaRoutes'

// Serve arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Rota para quando não encontrar nenhuma API, redireciona para o frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

Pessoa.sync()

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

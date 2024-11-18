import express from 'express';
import router from './controllers/pessoaController.js';  // Importando o router corretamente
import cors from 'cors';
import path from 'path';

// Usando import.meta.url para calcular o __dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname);

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

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});


# STRIVEFLOW - PROJETO DE CADASTRO E CONTROLE DE TREINO

O **StriveFlow** é um projeto de controle de treinos que utiliza React.js no frontend e Node.js com Express no backend, conectado a um banco de dados MySQL. O objetivo é permitir que professores cadastrem treinos e alunos visualizem, editem e concluam seus treinos.

## 🚀 Funcionalidades

- **Cadastro e autenticação de usuários (professores e alunos)** usando JWT.
- **Cadastro e gerenciamento de treinos** pelos professores.
- **Visualização e conclusão de treinos** pelos alunos.
- **Edição de perfil** para os usuários.

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React.js**: Biblioteca para criação de interfaces de usuário.
- **Axios**: Para realizar requisições HTTP ao backend.
- **React Router DOM**: Para gerenciamento de rotas.
- **CSS Modules**: Para estilização.

### Backend
- **Node.js**: Ambiente de execução JavaScript no servidor.
- **Express.js**: Framework para criação de APIs RESTful.
- **JWT (JSON Web Token)**: Para autenticação e gerenciamento de sessões.
- **MySQL**: Banco de dados relacional para armazenar as informações.

---

## 📂 Estrutura do Projeto

### **Frontend** (diretório `frontend/`)
- **src/components/**: Componentes reutilizáveis do React.
- **src/pages/**: Páginas principais da aplicação, como `Login`, `Cadastro`, `Dashboard`.
- **src/styles/**: Arquivos de estilização usando CSS Modules.
- **src/services/**: Arquivos para integração com o backend (ex.: configuração do Axios).

### **Backend** (diretório `backend/`)
- **routes/**: Arquivos de definição de rotas da API.
- **controllers/**: Controladores responsáveis pela lógica de cada rota.
- **models/**: Configuração do banco de dados e mapeamento das tabelas.
- **middleware/**: Middleware para autenticação e validações.
- **server.js**: Arquivo principal para inicialização do servidor.

---

## 📦 Dependências do Projeto

Certifique-se de instalar as dependências para o frontend e backend.

### Frontend:
No diretório `frontend`, execute:

```bash
npm install
```

### Backend:
No diretório `backend`, execute:

```bash
npm install
```

---

## ▶️ Inicialização do Projeto

### Backend:
No diretório `backend`, inicie o servidor:

```bash
npm start
```

O servidor estará disponível em [http://localhost:3001](http://localhost:3001).

### Frontend:
No diretório `frontend`, inicie o cliente:

```bash
npm start
```

O frontend estará disponível em [http://localhost:3000](http://localhost:3000).

---

## 📚 Bibliotecas Principais

### Frontend:
- **React.js**
- **Axios**
- **React Router DOM**

### Backend:
- **Express.js**
- **MySQL**
- **JWT**
- **bcrypt.js** (para hash de senhas)

---

## 🌐 URLs Padrão

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend**: [http://localhost:3001](http://localhost:3001)





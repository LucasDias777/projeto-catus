
# STRIVEFLOW - PROJETO DE CADASTRO E CONTROLE DE TREINO

O **StriveFlow** é um projeto de controle de treinos que utiliza React.js no frontend e Firebase para autenticação e armazenamento de dados. O objetivo é permitir que professores cadastrem treinos e alunos visualizem, editem e concluam seus treinos.

## 🚀 Funcionalidades

- **Cadastro e autenticação de usuários (professores e alunos)** utilizando o Firebase Authentication.
- **Cadastro e gerenciamento de treinos** pelos professores, armazenados no Firestore Database.
- **Visualização e conclusão de treinos** pelos alunos.
- **Edição de perfil** para os usuários.

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React.js**: Biblioteca para criação de interfaces de usuário.
- **React Router DOM**: Para gerenciamento de rotas.
- **Firebase**:
  - **Authentication**: Gerenciamento de usuários.
  - **Firestore**: Banco de dados NoSQL para armazenamento de dados.
  - **Hosting**: Implantação do frontend.
- **CSS Modules**: Para estilização.

---

## 📂 Estrutura do Projeto

### **Frontend** (diretório `src/`)
- **components/**: Componentes reutilizáveis do React.
- **pages/**: Páginas principais da aplicação, como `Login`, `Cadastro`, `Dashboard`.
- **styles/**: Arquivos de estilização usando CSS Modules.
- **config/**: Arquivos para integração com o Firebase (ex.: configuração e funções utilitárias).

---

## 📦 Dependências do Projeto

Certifique-se de instalar as dependências para o frontend.

No diretório do projeto, execute:

```bash
npm install
```

---

## ▶️ Inicialização do Projeto

1. Configure o Firebase para o projeto:
   - Acesse o [console do Firebase](https://console.firebase.google.com/).
   - Crie um projeto e adicione o aplicativo Web.
   - Copie as configurações do Firebase e substitua no arquivo de configuração (`src/services/firebaseConfig.js`).

2. No diretório do projeto, inicie o cliente:

```bash
npm start
```

A aplicação estará disponível em [http://localhost:3000](http://localhost:3000).

---

## 📚 Bibliotecas Principais

- **React.js**
- **Firebase**
- **React Router DOM**
- **CSS Modules**

---

## 🌐 URLs Padrão

- **Frontend**: [http://localhost:3000](http://localhost:3000)

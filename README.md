
# STRIVEFLOW - PROJETO DE CADASTRO E CONTROLE DE TREINO

O **StriveFlow** é uma aplicação que permite gerenciar treinos, com funcionalidades voltadas para professores e alunos. Utiliza React.js no frontend e Firebase para autenticação e armazenamento de dados, além de bibliotecas adicionais para gráficos, geração de relatórios e validação de formulários.

## 🚀 Funcionalidades

- **Cadastro e autenticação de usuários** (professores e alunos) com Firebase Authentication.
- **Gerenciamento de treinos**: cadastro, visualização e conclusão.
- **Geração de relatórios** em PDF e Excel.
- **Visualização de dados em gráficos dinâmicos** utilizando Chart.js.
- **Validação de formulários** com Formik e Yup.
- **Consulta de dados externos** via integração com APIs, como o ViaCEP.

---

## 🛠️ Tecnologias e Bibliotecas Utilizadas

### Frontend
- **React.js**: Biblioteca principal para criação de interfaces de usuário.
- **React Router DOM**: Gerenciamento de rotas da aplicação.
- **CSS Modules**: Estilização modularizada e organizada.
- **Formik**: Construção e gerenciamento de formulários.
- **Yup**: Validação de esquemas para formulários.
- **Axios**: Realização de requisições HTTP, como consulta de CEP no ViaCEP.

### Firebase
- **Authentication**: Gerenciamento de autenticação de usuários.
- **Firestore**: Banco de dados NoSQL para armazenar informações dos treinos e usuários.
- **Hosting**: Hospedagem do frontend.

### Relatórios e Gráficos
- **jsPDF**: Geração de relatórios em PDF.
- **jspdf-autotable**: Criação de tabelas no PDF.
- **XLSX**: Exportação de dados para planilhas Excel.
- **Chart.js**: Criação de gráficos interativos e dinâmicos.

---

## 📂 Estrutura do Projeto

- **components/**: Componentes reutilizáveis, como botões, cards e gráficos.
- **pages/**: Páginas principais da aplicação (ex.: Login, Cadastro, Dashboard).
- **styles/**: Arquivos de estilos usando CSS Modules.
- **config/**: Configurações e integrações (ex.: Firebase e API ViaCEP).
- **services/**: Serviços utilitários, como funções para chamadas de API e manipulação de dados.

---

## 📦 Dependências

Certifique-se de instalar todas as dependências antes de rodar o projeto.

### Instalação
No diretório do projeto, execute:

```bash
npm install
```

---

## ▶️ Inicialização do Projeto

1. Configure o Firebase:
   - Acesse o [console do Firebase](https://console.firebase.google.com/).
   - Crie um novo projeto e adicione o aplicativo Web.
   - Copie as credenciais e substitua no arquivo `src/config/firebaseConfig.js`.

2. Inicie o projeto no modo de desenvolvimento:
```bash
npm start
```

Acesse a aplicação em [http://localhost:3000](http://localhost:3000).

---

## 📚 Bibliotecas Adicionais

- **Axios**: Para requisições HTTP.
- **Formik**: Para criação e gerenciamento de formulários.
- **Yup**: Para validação de dados nos formulários.
- **Chart.js**: Para exibição de gráficos dinâmicos.
- **jsPDF** e **jspdf-autotable**: Para geração de relatórios em PDF.
- **XLSX**: Para exportação de dados em Excel.

---

## 🌐 URLs Padrão

- **Frontend**: [http://localhost:3000](http://localhost:3000)

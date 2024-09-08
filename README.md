
# STRIVEFLOW- PROJETO DE CADASTRO E CONTROLE DE TREINO

Este é um projeto de controle de treino e cadastro utilizando React.js e Firebase. O projeto permite que professores cadastrem treinos e alunos visualizem e concluam esses treinos.

## Dependências do projeto

Certifique-se de ter o [Node.js](https://nodejs.org/) e o [npm](https://www.npmjs.com/) instalados. 

Para instalar as dependências do projeto, use o comando:

```bash
npm install
```

## Inicialização do projeto

Para iniciar o projeto, use o comando:

```bash
npm start
```

O projeto será iniciado no modo de desenvolvimento e estará disponível em http://localhost:3000.

## Principais estruturas e bibliotecas utilizadas no projeto

### Estrutura do Projeto:

- **src/**: Contém todos os arquivos de código fonte do projeto.
- **components/**: Contém os componentes React.
- **firebaseConfig.js**: Configuração do Firebase.
- **App.js**: Componente principal do aplicativo.
- **index.js**: Ponto de entrada do aplicativo.

### Bibliotecas do projeto:

- **React**: Biblioteca para construir interfaces de usuário.
- **React Hook Form**: Biblioteca para gerenciar formulários.
- **Firebase**: Plataforma de desenvolvimento de aplicativos.
- **React Router DOM**: Biblioteca para roteamento no React.

As dependências estão listadas no `package.json` e serão instaladas automaticamente com o comando `npm install`.

## Configuração com o banco de dados do Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
2. Configure o Firebase no seu projeto seguindo a [documentação Firebase para Web](https://firebase.google.com/docs/web/setup).
3. Adicione seu arquivo de configuração do Firebase (**firebaseConfig.js**) ao diretório **src/**.
4. Garanta que todas as chaves e endereços fornecidos pelo Firebase estão corretamente configurados no seu projeto.

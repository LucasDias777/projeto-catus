import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../config/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import styles from '../styles/Login.module.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    console.log('Tentativa de login iniciada');
    console.log('Email:', email);

    try {
      // Faz login no Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;
      console.log('Usuário autenticado com sucesso:', user.uid);

      // Busca o tipo de usuário no Firestore com base no UID do Firebase Authentication
      console.log('Buscando tipo de usuário no Firestore...');
      
      // Consulta para verificar se o usuário é professor
      const professorQuery = query(
        collection(db, 'Pessoa'),
        where('id_professor', '==', user.uid)
      );
      const professorSnapshot = await getDocs(professorQuery);

      // Consulta para verificar se o usuário é aluno
      const alunoQuery = query(
        collection(db, 'Pessoa'),
        where('id_aluno', '==', user.uid)
      );
      const alunoSnapshot = await getDocs(alunoQuery);

      if (!professorSnapshot.empty) {
        // Usuário é um professor
        const userData = professorSnapshot.docs[0].data();
        console.log('Dados do professor encontrados:', userData);
        console.log('Redirecionando para /dashboard-professor');
        navigate('/dashboard-professor');
      } else if (!alunoSnapshot.empty) {
        // Usuário é um aluno
        const userData = alunoSnapshot.docs[0].data();
        console.log('Dados do aluno encontrados:', userData);
        console.log('Redirecionando para /dashboard-aluno');
        navigate('/dashboard-aluno');
      } else {
        // Usuário não encontrado em nenhuma coleção
        console.error('Usuário não encontrado na coleção Pessoa.');
        setError('Usuário não encontrado na base de dados.');
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error.message);
      if (error.message.includes('auth/wrong-password')) {
        setError('Senha incorreta.');
      } else if (error.message.includes('auth/user-not-found')) {
        setError('Usuário não encontrado.');
      } else {
        setError('Erro ao fazer login.');
      }
    } finally {
      setLoading(false);
      console.log('Finalizando tentativa de login');
    }
  };

  const handleRegisterClick = () => {
    console.log('Redirecionando para a página de registro...');
    navigate('/cadastro');
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.container}>
        <h1 className={styles.heading}>Login</h1>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <input
              type="email"
              placeholder="Informe seu E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <input
              type="password"
              placeholder="Informe sua Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? 'Carregando...' : 'Login'}
          </button>
          {error && <p className={styles.errorMessage}>{error}</p>}
          <div className={styles.registerLink}>
            <p>
              Ainda não tem uma conta?{' '}
              <a href="#" onClick={handleRegisterClick}>
                Registre-se
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import styles from '../styles/Login.module.css';

const Login = () => {
  const [email, setEmail] = useState(localStorage.getItem('email') || ''); // Salvar e-mail local
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);  // Novo estado para controlar se a autenticação foi checada
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Tenta autenticar o usuário no Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      // Realiza uma busca na coleção "Pessoa" pelo campo "email"
      const pessoaQuery = query(
        collection(db, 'Pessoa'),
        where('email', '==', email)
      );
      const querySnapshot = await getDocs(pessoaQuery);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data(); // Obtém o primeiro documento encontrado

        // Verifica o tipo de pessoa
        if (userData.tipo_pessoa === 'professor') {
          navigate('/dashboard-professor', { state: { id_professor: userData.id_professor } });
        } else if (userData.tipo_pessoa === 'aluno') {
          navigate('/dashboard-aluno', { state: { id_aluno: userData.id_professor } });
        } else {
          setError('Usuário não possui um tipo válido.');
        }
      } else {
        setError('Usuário não encontrado na coleção.');
      }
    } catch (error) {
      const errorMessages = {
        'auth/invalid-email': 'E-mail inválido.',
        'auth/user-not-found': 'Usuário ou senha incorretos.',
        'auth/wrong-password': 'Usuário ou senha incorretos.',
        'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
      };

      setError(errorMessages[error.code] || `Erro ao fazer login: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterClick = () => {
    navigate('/cadastro');
  };

  // Verificação de autenticação no useEffect
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setAuthChecked(true);  // Marcar como verificado
      } else {
        setAuthChecked(true);  // Marcar como verificado mesmo sem usuário logado
      }
    });

    return unsubscribe;
  }, [auth]);

  // Espera até que a autenticação seja verificada antes de exibir a tela
  if (!authChecked) {
    return <p>Carregando...</p>;
  }

  return (
    <div className={styles.loginPage}>
      <div className={styles.container}>
        <h1 className={styles.heading}>Login</h1>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <input
              id="email"
              type="email"
              placeholder="Informe seu E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <i className="bx bxs-user"></i>
          </div>
          <div className={styles.formGroup}>
            <input
              id="senha"
              type="password"
              placeholder="Informe sua Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
            <i className="bx bxs-lock-alt"></i>
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

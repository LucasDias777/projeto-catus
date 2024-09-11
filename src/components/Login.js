import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Login.module.css'; // Certifique-se de que este arquivo contém o CSS atualizado

const Login = () => {
  const [email, setEmail] = useState(localStorage.getItem('email') || ''); // Preenche com o e-mail salvo, se houver
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const auth = getAuth();
    const db = getFirestore();

    try {
      // Faz o login do usuário
      const userCredential = await signInWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      // Obtém o documento do usuário na coleção 'pessoa' usando o userId (uid)
      const userDocRef = doc(db, 'pessoas', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Verifica o tipo de pessoa e redireciona
        if (userData.tipoPessoa === 'professor') {
          navigate('/dashboard-professor');
        } else if (userData.tipoPessoa === 'aluno') {
          navigate('/dashboard-aluno');
        } else {
          setError('Tipo de pessoa inválido.');
        }
      } else {
        setError('Documento do usuário não encontrado.');
      }
    } catch (error) {
      let errorMessage;
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'E-mail inválido.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'Usuário não encontrado.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Senha incorreta.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Campo preenchido de forma incorreta, verifique e tente novamente.';
          break;
        default:
          errorMessage = 'Erro ao fazer login: ' + error.message;
          break;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterClick = () => {
    navigate('/cadastro');
  };

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
            <i className='bx bxs-user'></i>
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
            <i className='bx bxs-lock-alt'></i>
          </div>
          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? 'Carregando...' : 'Login'}
          </button>
          {error && <p className={styles.errorMessage}>{error}</p>}
          <div className={styles.registerLink}>
            <p>Ainda não tem uma conta? <a href="" onClick={handleRegisterClick}>Registre-se</a></p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';
import styles from '../styles/Login.module.css';
import logo from '../styles/images/logo.png';
import '@fortawesome/fontawesome-free/css/all.min.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const userType = await login(email, senha);

      if (userType === 'admin') {
        navigate('/dashboard-admin');
      } else if (userType === 'professor') {
        navigate('/dashboard-professor');
      } else if (userType === 'aluno') {
        navigate('/dashboard-aluno');
      } else {
        setError('Tipo de usuário inválido.');
      }
    } catch (error) {
      if (error.message.includes('auth/wrong-password')) {
        setError('Senha incorreta.');
      } else if (error.message.includes('auth/user-not-found')) {
        setError('Usuário não encontrado.');
      } else {
        setError('Usuário não encontrado.');
      }
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
        <div className={styles.logoSection}>
          <img src={logo} alt="Logo" className={styles.logo} />
        </div>
        <h4 className={styles.welcomeText}>LOGIN</h4>
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
            <div className={styles.inputWithIcon}>
            <input
            type={showPassword ? "text" : "password"}
            placeholder="Informe sua Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            />
            <i
            className={`fa-solid ${showPassword ? "fa-lock-open" : "fa-lock"} ${
            styles.icon
          }`}
          onClick={() => setShowPassword(!showPassword)}
          ></i>
          </div>
        </div>
        <button type="submit" disabled={loading} className={styles.button}>
  {loading ? (
    'Carregando...'
  ) : (
    <>
      <i className="fa-solid fa-right-to-bracket"></i> Login
    </>
  )}
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

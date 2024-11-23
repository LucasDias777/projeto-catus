import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateEmail, updatePassword } from 'firebase/auth';
import { auth, db } from '../config/firebaseConfig';
import { useAuth } from '../contexts/authContext';
import styles from '../styles/EditarUsuario.module.css';

const EditarUsuario = () => {
  const [formData, setFormData] = useState({
    nome_completo: '',
    data_nascimento: '',
    genero: '',
    cep: '',
    cidade: '',
    uf: '',
    endereco: '',
    numero_casa: '',
    bairro: '',
    complemento: '',
    telefone: '',
    email: '',
    senha: '',
  });

  const [originalEmail, setOriginalEmail] = useState('');
  const [originalSenha, setOriginalSenha] = useState('');
  const [tipoPessoa, setTipoPessoa] = useState('');
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;

    const fetchUserData = async () => {
      try {
        const userDoc = doc(db, 'Pessoa', currentUser.uid);
        const userSnap = await getDoc(userDoc);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setFormData({
            nome_completo: data.nome_completo || '',
            data_nascimento: data.data_nascimento || '',
            genero: data.genero || '',
            cep: data.cep || '',
            cidade: data.cidade || '',
            uf: data.uf || '',
            endereco: data.endereco || '',
            numero_casa: data.numero_casa || '',
            bairro: data.bairro || '',
            complemento: data.complemento || '',
            telefone: data.telefone || '',
            email: data.email || '',
            senha: '', // Não exibe a senha, apenas um campo vazio
          });
          setOriginalEmail(data.email || '');
          setOriginalSenha(data.senha || '');
          setTipoPessoa(data.tipo_pessoa || '');
        } else {
          setError('Dados do usuário não encontrados.');
        }
      } catch (error) {
        console.error('Erro ao buscar informações do usuário:', error);
        setError('Erro ao carregar informações do usuário.');
      }
    };

    fetchUserData();
  }, [currentUser]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const userDoc = doc(db, 'Pessoa', currentUser.uid);
      let requiresReLogin = false;

      if (formData.email !== originalEmail) {
        await updateEmail(auth.currentUser, formData.email);
        await updateDoc(userDoc, { email: formData.email });
        requiresReLogin = true;
      }

      if (formData.senha && formData.senha !== originalSenha) {
        await updatePassword(auth.currentUser, formData.senha);
        await updateDoc(userDoc, { senha: formData.senha });
        requiresReLogin = true;
      }

      const updatedData = { ...formData };
      delete updatedData.senha;
      await updateDoc(userDoc, updatedData);

      if (requiresReLogin) {
        alert('Alterações salvas com sucesso. Você precisará fazer login novamente.');
        auth.signOut();
        navigate('/login');
        return;
      }

      alert('Informações atualizadas com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar informações:', error);
      setError('Erro ao atualizar informações. Tente novamente.');
    }
  };

  const handleBackToDashboard = () => {
    navigate(tipoPessoa === 'professor' ? '/dashboard-professor' : '/dashboard-aluno');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Editar Informações</h1>
        <button onClick={handleBackToDashboard} className={styles.backButton}>
          Voltar ao Dashboard
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <form onSubmit={handleSubmit} className={styles.form}>
        {[
          ['nome_completo', 'Nome Completo', 'data_nascimento', 'Data de Nascimento'],
          ['genero', 'Gênero', 'cep', 'CEP'],
          ['cidade', 'Cidade', 'uf', 'UF'],
          ['endereco', 'Endereço', 'numero_casa', 'Número da Casa'],
          ['bairro', 'Bairro', 'complemento', 'Complemento'],
          ['telefone', 'Telefone', 'email', 'E-mail'],
        ].map(([name1, label1, name2, label2]) => (
          <div className={styles.formRow} key={name1}>
            {[{ name: name1, label: label1 }, { name: name2, label: label2 }].map(({ name, label }) => (
              <div className={styles.formGroup} key={name}>
                <label>{label}</label>
                <input
                  type={name === 'data_nascimento' ? 'date' : 'text'}
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                  className={styles.formControl}
                />
              </div>
            ))}
          </div>
        ))}
        <div className={styles.formGroup}>
          <label>Senha</label>
          <input
            type="password"
            name="senha"
            value={formData.senha}
            onChange={handleChange}
            className={styles.formControl}
          />
        </div>
        <div className={styles.formGroup}>
          <button type="submit">Atualizar</button>
        </div>
      </form>
    </div>
  );
};

export default EditarUsuario;

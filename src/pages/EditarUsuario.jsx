import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth, db } from '../config/firebaseConfig';
import { useAuth } from '../contexts/authContext';
import styles from '../styles/EditarUsuario.module.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

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
    senha: '',
  });

  const [originalData, setOriginalData] = useState({});
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
          setFormData({ ...data, senha: '' }); // Limpa o campo de senha no formulário
          setOriginalData(data);
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

  const handleTelefoneChange = (e) => {
    const input = e.target;
    const rawValue = input.value.replace(/\D/g, ''); // Remove caracteres não numéricos
    let formatted = '';

    if (rawValue.length > 0) {
      formatted = `(${rawValue.slice(0, 2)}`;
      if (rawValue.length > 2) {
        formatted += `) ${rawValue.slice(2, 7)}`;
      }
      if (rawValue.length > 7) {
        formatted += `-${rawValue.slice(7, 11)}`;
      }
    }

    setFormData({ ...formData, telefone: formatted });

    const cursorPosition = input.selectionStart;
    const diff = formatted.length - input.value.length;

    requestAnimationFrame(() => {
      const adjustedPosition = Math.max(0, cursorPosition + diff);
      input.setSelectionRange(adjustedPosition, adjustedPosition);
    });
  };

  const handleCEPBlur = async () => {
    const cep = formData.cep.replace(/\D/g, '');
    setError(null); // Limpa o erro anterior
  
    if (cep.length !== 8) {
      setError('CEP inválido. Deve conter exatamente 8 dígitos.');
      return;
    }
  
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (data.erro) throw new Error('CEP não encontrado.');
  
      setFormData({
        ...formData,
        cidade: data.localidade || '',
        uf: data.uf || '',
        endereco: data.logradouro || '',
        bairro: data.bairro || '',
        complemento: data.complemento || '',
      });
    } catch (error) {
      console.error('Erro ao buscar informações do CEP:', error);
      setError('CEP inválido ou não encontrado.');
    }
  };
  
  const handleCEPChange = (e) => {
    const cep = e.target.value.replace(/\D/g, '');
    setFormData({ ...formData, cep });
    setError(null); // Limpa o erro ao alterar o valor
  };
  const reauthenticateUser = async (senhaAtual) => {
    const user = auth.currentUser;
    const credential = EmailAuthProvider.credential(user.email, senhaAtual);

    try {
      await reauthenticateWithCredential(user, credential);
    } catch (error) {
      throw new Error('Senha atual incorreta.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const userDoc = doc(db, 'Pessoa', currentUser.uid);


      // Verificação de senha igual à senha atual
    if (formData.senha && formData.senha === originalData.senha) {
      setError('A nova senha não pode ser igual à senha atual.');
      return;
    }

      // Verificação e reautenticação para alteração de senha
      if (formData.senha && formData.senha !== originalData.senha) {
        const senhaAtual = prompt('Confirme sua senha atual para continuar.');
        if (!senhaAtual) {
          setError('Senha atual é obrigatória para alterar a senha.');
          return;
        }
        await reauthenticateUser(senhaAtual);
        await updatePassword(auth.currentUser, formData.senha);
        await updateDoc(userDoc, { senha: formData.senha }); // Atualiza a senha no Firestore
      }

      // Atualizar os outros dados no Firestore
      const updatedData = { ...formData };
      delete updatedData.senha; // Remove a senha do objeto
      await updateDoc(userDoc, updatedData);

      alert('Informações atualizadas com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar informações:', error);
      setError(error.message || 'Erro ao atualizar informações.');
    }
  };

  const handleBackToDashboard = () => {
    navigate(tipoPessoa === 'professor' ? '/dashboard-professor' : '/dashboard-aluno');
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Editar Informações</h1>
        <button onClick={handleBackToDashboard} className={styles.backButton}>
        <i class="fa-solid fa-rotate-left"></i> Voltar ao Dashboard
        </button>
      </div>

      <div className={styles.container}>
        {error && <p className={styles.error}>{error}</p>}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label>Nome Completo</label>
              <input
                type="text"
                name="nome_completo"
                value={formData.nome_completo}
                onChange={handleChange}
                className={styles.formControl}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Data de Nascimento</label>
              <input
                type="date"
                name="data_nascimento"
                value={formData.data_nascimento}
                onChange={handleChange}
                className={styles.formControl}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label>Gênero</label>
              <select
                name="genero"
                value={formData.genero}
                onChange={handleChange}
                className={styles.formControl}
              >
                <option value="">Selecione</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>CEP</label>
              <input
                type="text"
                name="cep"
                value={formData.cep}
                onChange={handleCEPChange}
                onBlur={handleCEPBlur}
                className={styles.formControl}
                placeholder="00000-000"
              />
              {error ===`CEP Inválido ou não Encontrado.` && ( 
                <p className={styles.error}>{error}</p>
            )}
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label>Cidade</label>
              <input
                type="text"
                name="cidade"
                value={formData.cidade}
                onChange={handleChange}
                className={styles.formControl}
              />
            </div>
            <div className={styles.formGroup}>
              <label>UF</label>
              <input
                type="text"
                name="uf"
                value={formData.uf}
                onChange={handleChange}
                className={styles.formControl}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label>Endereço</label>
              <input
                type="text"
                name="endereco"
                value={formData.endereco}
                onChange={handleChange}
                className={styles.formControl}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Número da Residência</label>
              <input
                type="text"
                name="numero_casa"
                value={formData.numero_casa}
                onChange={handleChange}
                className={styles.formControl}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label>Bairro</label>
              <input
                type="text"
                name="bairro"
                value={formData.bairro}
                onChange={handleChange}
                className={styles.formControl}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Complemento</label>
              <input
                type="text"
                name="complemento"
                value={formData.complemento}
                onChange={handleChange}
                className={styles.formControl}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label>Telefone</label>
              <input
              type="text"
              name="telefone"
              value={formData.telefone}
              onChange={handleTelefoneChange}
              className={styles.formControl}
              placeholder="(xx) xxxxx-xxxx"
              />
            </div>
            <div className={styles.formGroup}>
              <label>E-mail</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className={`${styles.formControl} ${styles.disabled}`}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label>Nova Senha</label>
              <input
                type="password"
                name="senha"
                value={formData.senha}
                onChange={handleChange}
                className={styles.formControl}
              />
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <button type="submit">
            <i class="fa-solid fa-pen-to-square"></i> Atualizar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditarUsuario;

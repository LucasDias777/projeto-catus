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
    confirmar_senha: '', // Alterado para "confirmar_senha"
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
          setFormData({ ...data, senha: '', confirmar_senha: '' }); // Limpa os campos de senha
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

  const isValidAge = (date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const isBirthdayPassed =
      today.getMonth() > birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
    return age > 14 || (age === 14 && isBirthdayPassed);
  };

  const handleTelefoneChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
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
  
    const cursorPosition = e.target.selectionStart;
    const diff = formatted.length - e.target.value.length;
  
    requestAnimationFrame(() => {
      const adjustedPosition = Math.max(0, cursorPosition + diff);
      e.target.setSelectionRange(adjustedPosition, adjustedPosition);
    });
  };

  const handleCEPBlur = async () => {
    const cep = formData.cep.replace(/\D/g, '');
    setError(null);

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
    const cep = e.target.value.replace(/\D/g, '').slice(0, 8); // Remove caracteres não numéricos e limita a 8 números
    setFormData({ ...formData, cep });
    setError(null); // Limpa o erro ao alterar o valor
  };

  const estadosBrasileiros = [
    'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'
  ];
  
  const handleUFChange = (e) => {
    const input = e.target.value.toUpperCase(); // Converte para maiúsculas
    const uf = input.replace(/[^A-Z]/g, '').slice(0, 2); // Remove caracteres não-alfabéticos e limita a 2 caracteres
  
    // Verifica se a sigla é válida
    if (uf.length === 2 && !estadosBrasileiros.includes(uf)) {
      // Se for uma sigla inválida e tiver 2 caracteres, não faz nada
      return;
    }
  
    // Atualiza o estado com o valor da sigla
    setFormData({ ...formData, uf });
  };

  const reauthenticateUser = async (senhaAtual) => {
    const user = auth.currentUser;
    const credential = EmailAuthProvider.credential(user.email, senhaAtual);

    try {
      await reauthenticateWithCredential(user, credential);
    } catch {
      throw new Error('Senha atual incorreta.');
    }
  };

  const [showPassword, setShowPassword] = useState({
    senha: false,
    confirmar_senha: false,
  });
  
  const togglePasswordVisibility = (field) => {
    setShowPassword((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
  
    // Validações dos campos obrigatórios
    const camposObrigatorios = [
      { campo: formData.nome_completo, nome: "Nome Completo" },
      { campo: formData.data_nascimento, nome: "Data de Nascimento" },
      { campo: formData.genero, nome: "Gênero" },
      { campo: formData.cidade, nome: "Cidade" },
      { campo: formData.uf, nome: "UF" },
      { campo: formData.endereco, nome: "Endereço" },
      { campo: formData.numero_casa, nome: "Número da Residência" },
      { campo: formData.bairro, nome: "Bairro" },
      { campo: formData.telefone, nome: "Telefone" },
    ];
  
    const camposVazios = camposObrigatorios.filter((item) => !item.campo.trim());
    if (camposVazios.length > 0) {
      setError(
        `Os seguintes campos são obrigatórios: ${camposVazios
          .map((item) => item.nome)
          .join(", ")}.`
      );
      return;
    }
  
    // Validação de data de nascimento
    if (!isValidAge(formData.data_nascimento)) {
      setError("O usuário precisa ter no mínimo 14 anos.");
      return;
    }
  
    // Verificação e atualização da senha
    if (formData.senha || formData.confirmar_senha) {
      if (formData.senha === originalData.senha) {
        setError("A nova senha não pode ser igual à senha atual.");
        return;
      }
  
      if (formData.senha !== formData.confirmar_senha) {
        setError("No Campo de Confirmar Senha as senhas não coincidem.");
        return;
      }
  
      if (formData.senha.length < 6) {
        setError("A senha deve ter no mínimo 6 caracteres.");
        return;
      }
  
      try {
        const senhaAtual = prompt("Confirme sua senha atual para continuar.");
        if (!senhaAtual) {
          setError("É necessário confirmar a senha atual.");
          return;
        }
  
        await reauthenticateUser(senhaAtual); // Função para reautenticar o usuário
  
        // Atualiza a senha no Firebase Authentication
        await updatePassword(auth.currentUser, formData.senha);
  
        // Atualiza os campos de senha no Firestore
        const userDoc = doc(db, "Pessoa", currentUser.uid);
        await updateDoc(userDoc, {
          senha: formData.senha,
          confirmar_senha: formData.senha,
        });
  
        alert("Senha atualizada com sucesso!");
      } catch (error) {
        console.error("Erro ao atualizar senha:", error);
        setError("Senha atual incorreta. Tente novamente.");
        return;
      }
    }
  
    // Atualização dos outros campos
    try {
      const updatedData = { ...formData };
      delete updatedData.senha;
      delete updatedData.confirmar_senha;
  
      const userDoc = doc(db, "Pessoa", currentUser.uid);
      await updateDoc(userDoc, updatedData);
  
      alert("Informações atualizadas com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar informações:", error);
      setError("Erro ao atualizar informações.");
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
              <label>Nome Completo <span className={styles.required}>*</span></label>
              <input
                type="text"
                name="nome_completo"
                value={formData.nome_completo}
                onChange={handleChange}
                className={styles.formControl}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Data de Nascimento <span className={styles.required}>*</span></label>
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
              <label>Gênero <span className={styles.required}>*</span></label>
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
              <label>Cidade <span className={styles.required}>*</span></label>
              <input
                type="text"
                name="cidade"
                value={formData.cidade}
                onChange={handleChange}
                className={styles.formControl}
              />
            </div>
            <div className={styles.formGroup}>
              <label>UF <span className={styles.required}>*</span></label>
              <input
                type="text"
                name="uf"
                value={formData.uf}
                onChange={handleUFChange}
                className={styles.formControl}
                placeholder="Ex: SP"
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label>Endereço <span className={styles.required}>*</span></label>
              <input
                type="text"
                name="endereco"
                value={formData.endereco}
                onChange={handleChange}
                className={styles.formControl}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Número da Residência <span className={styles.required}>*</span></label>
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
              <label>Bairro <span className={styles.required}>*</span></label>
              <input
                type="text"
                name="bairro"
                value={formData.bairro}
                onChange={handleChange}
                className={styles.formControl}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Complemento </label>
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
              <label>Telefone <span className={styles.required}>*</span></label>
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
              <label>E-mail <span className={styles.required}>*</span></label>
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
      {/* Campo de Nova Senha */}
      <div className={styles.formGroup}>
        <label>
          Nova Senha <span className={styles.required}>*</span>
        </label>
        <div className={styles.inputWrapper}>
          <input
            type={showPassword.senha ? "text" : "password"}
            name="senha"
            value={formData.senha}
            onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
            className={styles.formControl}
          />
          <span
            className={styles.lockIcon}
            onClick={() => togglePasswordVisibility("senha")}
          >
            {showPassword.senha ? (
              <i className="fa-solid fa-lock-open"></i> // Cadeado aberto
            ) : (
              <i className="fa-solid fa-lock"></i> // Cadeado fechado
            )}
          </span>
        </div>
      </div>

      {/* Campo de Confirmar Nova Senha */}
      <div className={styles.formGroup}>
        <label>
          Confirmar Nova Senha <span className={styles.required}>*</span>
        </label>
        <div className={styles.inputWrapper}>
          <input
            type={showPassword.confirmar_senha ? "text" : "password"}
            name="confirmarSenha"
            value={formData.confirmar_senha}
            onChange={(e) =>
              setFormData({ ...formData, confirmar_senha: e.target.value })
            }
            className={styles.formControl}
          />
          <span
            className={styles.lockIcon}
            onClick={() => togglePasswordVisibility("confirmar_senha")}
          >
            {showPassword.confirmar_senha ? (
              <i className="fa-solid fa-lock-open"></i> // Cadeado aberto
            ) : (
              <i className="fa-solid fa-lock"></i> // Cadeado fechado
            )}
          </span>
        </div>
      </div>
    </div>
          <div className={styles.formGroup}>
            <button type="submit" className={styles.submitButton}>
            <i class="fa-solid fa-pen-to-square"></i> Atualizar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditarUsuario;

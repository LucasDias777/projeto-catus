import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const EditarUsuario = () => {
  const [formData, setFormData] = useState({
    nome_completo: '',
    email: '',
    telefone: '',
    endereco: '',
    cidade: '',
    uf: '',
    cep: '',
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const userId = localStorage.getItem('userId'); // Assumindo que o ID do usuário está armazenado no localStorage

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/api/pessoas/${userId}`);
        setFormData(response.data);
      } catch (error) {
        console.error('Erro ao buscar informações do usuário:', error);
        setError('Erro ao carregar informações do usuário.');
      }
    };

    fetchUserData();
  }, [userId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.put(`http://localhost:3001/api/pessoas/${userId}`, formData);
      if (response.status === 200) {
        alert('Informações atualizadas com sucesso!');
        navigate('/dashboard'); // Redirecionar para o dashboard ou outra página
      }
    } catch (error) {
      console.error('Erro ao atualizar informações:', error);
      setError('Erro ao atualizar informações. Tente novamente.');
    }
  };

  return (
    <div>
      <h1>Editar Informações</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <label>
          Nome Completo:
          <input
            type="text"
            name="nome_completo"
            value={formData.nome_completo}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          E-mail:
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Telefone:
          <input
            type="text"
            name="telefone"
            value={formData.telefone}
            onChange={handleChange}
          />
        </label>
        <label>
          Endereço:
          <input
            type="text"
            name="endereco"
            value={formData.endereco}
            onChange={handleChange}
          />
        </label>
        <label>
          Cidade:
          <input
            type="text"
            name="cidade"
            value={formData.cidade}
            onChange={handleChange}
          />
        </label>
        <label>
          UF:
          <input
            type="text"
            name="uf"
            value={formData.uf}
            onChange={handleChange}
          />
        </label>
        <label>
          CEP:
          <input
            type="text"
            name="cep"
            value={formData.cep}
            onChange={handleChange}
          />
        </label>
        <button type="submit">Salvar</button>
        <button type="button" onClick={() => navigate('/dashboard')}>
          Cancelar
        </button>
      </form>
    </div>
  );
};

export default EditarUsuario;

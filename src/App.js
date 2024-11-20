import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/authContext';
import CadastroProfessor from './pages/CadastroProfessor';
import Login from './pages/Login';
import DashboardProfessor from './pages/DashboardProfessor';
import DashboardAluno from './pages/DashboardAluno';
import CadastroEquipamento from './pages/CadastroEquipamento';
import CadastroSerie from './pages/CadastroSerie'; // Corrigido para CadastroSerie
import CadastroRepeticao from './pages/CadastroRepeticao'; // Corrigido para CadastroRepeticao
import CadastroTipo from './pages/CadastroTipo'; // Corrigido para CadastroTipo
import VisualizarTreino from './pages/VisualizarTreino';
import RelatorioTreino from './pages/RelatorioTreino'; // Corrigido para RelatorioTreino
import CadastroTreino from './pages/CadastroTreino'; // Corrigido para CadastroTreino
import CadastroAluno from './pages/CadastroAluno';
import AlunoCadastrado from './pages/AlunoCadastrado';
import RotasPrivadas from './pages/RotasPrivadas';
import LandingPage from './pages/LandingPage';
import EditarUsuario from './pages/EditarUsuario'; // Nova rota para EditarUsuario

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rota inicial para LandingPage */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/cadastro" element={<CadastroProfessor />} />
          <Route path="/login" element={<Login />} />
          {/* Rotas privadas */}
          <Route element={<RotasPrivadas />}>
            <Route path="/dashboard-professor" element={<DashboardProfessor />} />
            <Route path="/dashboard-aluno" element={<DashboardAluno />} />
            <Route path="/cadastro-equipamento" element={<CadastroEquipamento />} />
            <Route path="/cadastro-serie" element={<CadastroSerie />} /> {/* Nome ajustado */}
            <Route path="/cadastro-repeticao" element={<CadastroRepeticao />} /> {/* Nome ajustado */}
            <Route path="/cadastro-tipo" element={<CadastroTipo />} /> {/* Nome ajustado */}
            <Route path="/visualizar-treino" element={<VisualizarTreino />} />
            <Route path="/relatorio-treino" element={<RelatorioTreino />} /> {/* Nome ajustado */}
            <Route path="/cadastro-treino" element={<CadastroTreino />} /> {/* Nome ajustado */}
            <Route path="/cadastro-aluno" element={<CadastroAluno />} />
            <Route path="/aluno-cadastrado" element={<AlunoCadastrado />} />
            <Route path="/editar-usuario" element={<EditarUsuario />} /> {/* Nova rota */}
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

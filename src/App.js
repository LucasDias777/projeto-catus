import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/authContext';
import CadastroProfessor from './pages/CadastroProfessor';
import Login from './pages/Login';
import DashboardProfessor from './pages/DashboardProfessor';
import DashboardAluno from './pages/DashboardAluno';
import CadastroEquipamento from './pages/CadastroEquipamento';
import CadastroSeries from './pages/CadastroSerie';
import CadastroRepeticoes from './pages/CadastroRepeticao';
import CadastroTipoTreino from './pages/CadastroTipo';
import VisualizarTreino from './pages/VisualizarTreino';
import RelatorioTreinos from './pages/RelatorioTreino';
import PaginaTreino from './pages/CadastroTreino';
import CadastroAluno from './pages/CadastroAluno';
import AlunoCadastrado from './pages/AlunoCadastrado';
import RotasPrivadas from './pages/RotasPrivadas';
import LandingPage from './pages/LandingPage'; // Importando o LandingPage


function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Alterando a rota inicial para LandingPage */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/cadastro" element={<CadastroProfessor />} />
          <Route path="/login" element={<Login />} />
          {/* Rotas privadas */}
          <Route element={<RotasPrivadas />}>
            <Route path="/dashboard-professor" element={<DashboardProfessor />} />
            <Route path="/dashboard-aluno" element={<DashboardAluno />} />
            <Route path="/cadastro-equipamento" element={<CadastroEquipamento />} />
            <Route path="/cadastro-series" element={<CadastroSeries />} />
            <Route path="/cadastro-repeticoes" element={<CadastroRepeticoes />} />
            <Route path="/cadastro-tipo-treino" element={<CadastroTipoTreino />} />
            <Route path="/visualizar-treino" element={<VisualizarTreino />} />
            <Route path="/relatorio-treinos" element={<RelatorioTreinos />} />
            <Route path="/Pagina-treino" element={<PaginaTreino />} />
            <Route path="/cadastro-aluno" element={<CadastroAluno />} />
            <Route path="/aluno-cadastrado" element={<AlunoCadastrado />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/authContext';
import CadastroProfessor from './pages/CadastroProfessor';
import Login from './pages/Login';
import DashboardProfessor from './pages/DashboardProfessor';
import DashboardAluno from './pages/DashboardAluno';
import DashboardAdmin from './pages/DashboardAdmin';
import CadastroEquipamento from './pages/CadastroEquipamento';
import CadastroSerie from './pages/CadastroSerie';
import CadastroRepeticao from './pages/CadastroRepeticao';
import CadastroTipo from './pages/CadastroTipo';
import VisualizarTreino from './pages/VisualizarTreino';
import RelatorioTreinoProfessor from './pages/RelatorioTreinoProfessor';
import CadastroTreino from './pages/CadastroTreino';
import CadastroAluno from './pages/CadastroAluno';
import AlunoCadastrado from './pages/AlunoCadastrado';
import RotasPrivadas from './pages/RotasPrivadas';
import EditarUsuario from './pages/EditarUsuario';
import RelatorioTreinoAluno from './pages/RelatorioTreinoAluno';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/cadastro" element={<CadastroProfessor />} />
          <Route path="/login" element={<Login />} />

          {/* Rotas protegidas */}
          <Route element={<RotasPrivadas />}>
            <Route path="/dashboard-professor" element={<DashboardProfessor />} />
            <Route path="/dashboard-aluno" element={<DashboardAluno />} />
            <Route path="/dashboard-admin/*" element={<DashboardAdmin />} />
            <Route path="/cadastro-equipamento" element={<CadastroEquipamento />} />
            <Route path="/cadastro-serie" element={<CadastroSerie />} />
            <Route path="/cadastro-repeticao" element={<CadastroRepeticao />} />
            <Route path="/cadastro-tipo" element={<CadastroTipo />} />
            <Route path="/visualizar-treino" element={<VisualizarTreino />} />
            <Route path="/relatorio-treino-professor" element={<RelatorioTreinoProfessor />} />
            <Route path="/relatorio-treino-aluno" element={<RelatorioTreinoAluno />} />
            <Route path="/cadastro-treino" element={<CadastroTreino />} />
            <Route path="/cadastro-aluno" element={<CadastroAluno />} />
            <Route path="/aluno-cadastrado" element={<AlunoCadastrado />} />
            <Route path="/editar-usuario" element={<EditarUsuario />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CadastroProfessor from './components/CadastroProfessor';
import Login from './components/Login';
import DashboardProfessor from './components/DashboardProfessor';
import DashboardAluno from './components/DashboardAluno';
import CadastroEquipamento from './components/CadastroEquipamento';
import CadastroSeries from './components/CadastroSeries';
import CadastroRepeticoes from './components/CadastroRepeticoes';
import CadastroTipoTreino from './components/CadastroTipoTreino';
import VisualizarTreino from './components/VisualizarTreino';
import RelatorioTreinos from './components/RelatorioTreinos';
import PaginaTreino from './components/PaginaTreino';
import GerenciarEquipamentos from './components/GerenciarEquipamentos';
import GerenciarSeries from './components/GerenciarSeries';
import GerenciarRepeticoes from './components/GerenciarRepeticoes';
import GerenciarTipoTreino from './components/GerenciarTipoTreino';
import CadastroAluno from './components/CadastroAluno';
import AlunoCadastrado from './components/AlunoCadastrado';
import RotasPrivadas from './components/RotasPrivadas';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/cadastro" element={<CadastroProfessor />} />
        <Route path="/login" element={<Login />} />
        {/* Rotas públicas */}
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
          <Route path="/gerenciar-equipamentos" element={<GerenciarEquipamentos />} />
          <Route path="/gerenciar-series" element={<GerenciarSeries />} />
          <Route path="/gerenciar-repeticoes" element={<GerenciarRepeticoes />} />
          <Route path="/gerenciar-tipo-treino" element={<GerenciarTipoTreino />} />
          <Route path="/cadastro-aluno" element={<CadastroAluno />} />
          <Route path="/aluno-cadastrado" element={<AlunoCadastrado />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

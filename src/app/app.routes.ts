import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { LayoutComponent } from './pages/layout/layout';
import { HomeComponent } from './pages/home/home';
import { LivrosComponent } from './pages/livros/livros';
import { EmprestimosComponent } from './pages/emprestimos/emprestimos';
import { HistoricoComponent } from './pages/historico/historico';
import { TutoriaisComponent } from './pages/tutoriais/tutoriais';
import { NaoEncontradoComponent } from './pages/nao-encontrado/nao-encontrado';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  {
    path: 'biblioteca',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: HomeComponent },
      { path: 'livros', component: LivrosComponent },
      { path: 'emprestimos', component: EmprestimosComponent },
      { path: 'historico', component: HistoricoComponent },
      { path: 'tutoriais', component: TutoriaisComponent },
    ],
  },
  { path: '**', component: NaoEncontradoComponent }
];
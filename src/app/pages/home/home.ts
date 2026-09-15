import { Component, inject, OnInit, signal } from '@angular/core';
import { BibliotecaService } from '../../services/biblioteca';
import { Emprestimo } from '../../models/biblioteca.models';
import { DashboardService, DashboardData } from '../../services/dashboard';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent implements OnInit {
  biblioteca = inject(BibliotecaService);
  private dashboardService = inject(DashboardService);

  dashboard = signal<DashboardData | null>(null);

  constructor() {
    this.biblioteca.atualizarStatusAtrasados();
  }

  ngOnInit() {
    this.dashboardService.getDashboard().subscribe({
      next: (data) => this.dashboard.set(data),
      error: (err) => console.error('Erro ao carregar dashboard:', err),
    });
  }

  // Achados auxiliares para exibir o livro/usuário de um empréstimo
  // (o empréstimo só guarda o copyId, então passa pelo exemplar até achar o livro)
  livroDoEmprestimo(emp: Emprestimo) {
    const exemplar = this.biblioteca.exemplar(emp.copyId);
    return exemplar ? this.biblioteca.livro(exemplar.bookId) : undefined;
  }

  usuarioDoEmprestimo(emp: Emprestimo) {
    return this.biblioteca.usuario(emp.userId);
  }

  ultimasMovimentacoes() {
    return [...this.biblioteca.emprestimos()]
      .sort((a, b) => b.loanDate.localeCompare(a.loanDate))
      .slice(0, 5);
  }
}
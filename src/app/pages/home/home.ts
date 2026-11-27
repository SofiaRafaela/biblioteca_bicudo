import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BibliotecaService, EmprestimoListaApi } from '../../services/biblioteca';
import { DashboardService, DashboardData } from '../../services/dashboard';

type StatusExibicao = 'ativo' | 'atrasado' | 'devolvido';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent implements OnInit {
  private biblioteca = inject(BibliotecaService);
  private dashboardService = inject(DashboardService);
  private router = inject(Router);

  busca = signal('');
  dashboard = signal<DashboardData | null>(null);
  emprestimos = signal<EmprestimoListaApi[]>([]);

  // "Em circulação" = ativos + atrasados (quem ainda está com o livro)
  emCirculacao = computed(() => {
    const d = this.dashboard();
    return d ? Number(d.emprestimos_ativos) + Number(d.atrasados) : null;
  });

  ultimasMovimentacoes = computed(() => this.emprestimos().slice(0, 6));

  emprestadosAgora = computed(() =>
    this.emprestimos().filter(emp => emp.status !== 'devolvido')
  );

  ngOnInit(): void {
    this.dashboardService.getDashboard().subscribe({
      next: (data) => this.dashboard.set(data),
      error: (err) => console.error('Erro ao carregar dashboard:', err),
    });

    this.biblioteca.listarEmprestimosApi().subscribe({
      next: (lista) => this.emprestimos.set(lista),
      error: (err) => console.error('Erro ao carregar empréstimos:', err),
    });
  }

  pesquisar(): void {
    const termo = this.busca().trim();
    this.router.navigate(['/biblioteca/livros'], termo ? { queryParams: { busca: termo } } : {});
  }

  // --- Textos das linhas ---

  nomeAluno(emp: EmprestimoListaApi): string {
    return emp.nome_aluno || emp.nome_solicitante || 'Aluno não informado';
  }

  resumoMovimentacao(emp: EmprestimoListaApi): string {
    return [this.nomeAluno(emp), emp.serie, this.formatarData(emp.data_emprestimo)]
      .filter(Boolean)
      .join(' · ');
  }

  resumoEmprestado(emp: EmprestimoListaApi): string {
    return [this.nomeAluno(emp), emp.serie].filter(Boolean).join(' · ');
  }

  // --- Datas e status ---

  private formatarIso(d: Date): string {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  // Aceita "2026-09-21" ou "2026-09-21T03:00:00.000Z" e devolve "aaaa-mm-dd" no fuso local
  private diaLocal(valor: string | null): string | null {
    if (!valor) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor;

    const d = new Date(valor);
    if (isNaN(d.getTime())) return null;
    return this.formatarIso(d);
  }

  formatarData(valor: string | null): string {
    const dia = this.diaLocal(valor);
    if (!dia) return '—';
    const [ano, mes, diaMes] = dia.split('-');
    return `${diaMes}/${mes}/${ano}`;
  }

  statusExibicao(emp: EmprestimoListaApi): StatusExibicao {
    if (emp.status === 'devolvido') return 'devolvido';

    const prevista = this.diaLocal(emp.data_prevista_devolucao);
    const hoje = this.formatarIso(new Date());
    if (emp.status === 'atrasado' || (prevista && prevista < hoje)) return 'atrasado';

    return 'ativo';
  }

  rotuloStatus(emp: EmprestimoListaApi): string {
    const mapa: Record<StatusExibicao, string> = {
      ativo: 'Ativo',
      atrasado: 'Atrasado',
      devolvido: 'Devolvido',
    };
    return mapa[this.statusExibicao(emp)];
  }
}
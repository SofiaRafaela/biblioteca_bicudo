import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BibliotecaService, EmprestimoListaApi } from '../../services/biblioteca';

type FiltroStatus = 'todos' | 'ativos' | 'devolvidos';
type StatusExibicao = 'ativo' | 'atrasado' | 'devolvido';

@Component({
  selector: 'app-emprestimos',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './emprestimos.html',
  styleUrl: './emprestimos.scss',
})
export class EmprestimosComponent implements OnInit {
  biblioteca = inject(BibliotecaService);

  emprestimos = signal<EmprestimoListaApi[]>([]);
  carregando = signal(true);
  devolvendoId = signal<number | null>(null);
  mensagem = signal<{ ok: boolean; msg: string } | null>(null);

  busca = signal('');
  filtro = signal<FiltroStatus>('todos');

  listaFiltrada = computed(() => {
    const q = this.busca().trim().toLowerCase();
    const f = this.filtro();

    return this.emprestimos().filter(emp => {
      const st = this.statusExibicao(emp);
      if (f === 'ativos' && st === 'devolvido') return false;
      if (f === 'devolvidos' && st !== 'devolvido') return false;
      if (!q) return true;

      const texto = `${emp.titulo} ${emp.autor} ${emp.nome_aluno ?? ''} ${emp.ra ?? ''} ${emp.serie ?? ''}`.toLowerCase();
      return texto.includes(q);
    });
  });

  ngOnInit(): void {
    this.carregarEmprestimos();
  }

  carregarEmprestimos(): void {
    this.carregando.set(true);
    this.biblioteca.listarEmprestimosApi().subscribe({
      next: (lista) => {
        this.emprestimos.set(lista);
        this.carregando.set(false);
      },
      error: () => {
        this.mensagem.set({ ok: false, msg: 'Erro ao carregar empréstimos.' });
        this.carregando.set(false);
      },
    });
  }

  selecionarFiltro(valor: FiltroStatus): void {
    this.filtro.set(valor);
  }

  devolver(emprestimo: EmprestimoListaApi): void {
    this.devolvendoId.set(emprestimo.id);
    this.mensagem.set(null);

    this.biblioteca.devolverEmprestimoApi(emprestimo.id, String(emprestimo.exemplar_id)).subscribe({
      next: () => {
        this.devolvendoId.set(null);
        this.mensagem.set({ ok: true, msg: `Devolução de "${emprestimo.titulo}" registrada com sucesso.` });
        this.carregarEmprestimos();
      },
      error: (err) => {
        this.devolvendoId.set(null);
        this.mensagem.set({ ok: false, msg: err.error?.erro || 'Erro ao registrar devolução.' });
      },
    });
  }

  // --- Datas e status (exibição) ---

  // Aceita "2026-09-21" ou "2026-09-21T03:00:00.000Z" e devolve sempre "aaaa-mm-dd" no fuso local
  private diaLocal(valor: string | null): string | null {
    if (!valor) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor;

    const d = new Date(valor);
    if (isNaN(d.getTime())) return null;
    return this.formatarIso(d);
  }

  private formatarIso(d: Date): string {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  formatarData(valor: string | null): string {
    const dia = this.diaLocal(valor);
    if (!dia) return '—';
    const [ano, mes, diaMes] = dia.split('-');
    return `${diaMes}/${mes}/${ano}`;
  }

  dataDevolucao(emp: EmprestimoListaApi): string {
    return this.formatarData(emp.data_devolucao_real ?? emp.data_prevista_devolucao);
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
import { Component, inject, signal, OnInit } from '@angular/core';
import { BibliotecaService, EmprestimoListaApi } from '../../services/biblioteca';

@Component({
  selector: 'app-emprestimos',
  standalone: true,
  imports: [],
  templateUrl: './emprestimos.html',
  styleUrl: './emprestimos.scss',
})
export class EmprestimosComponent implements OnInit {
  biblioteca = inject(BibliotecaService);

  emprestimos = signal<EmprestimoListaApi[]>([]);
  carregando = signal(true);
  devolvendoId = signal<number | null>(null);
  mensagem = signal<{ ok: boolean; msg: string } | null>(null);

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
}
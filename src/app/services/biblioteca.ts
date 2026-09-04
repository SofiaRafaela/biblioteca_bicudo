import { Injectable, signal, computed } from '@angular/core';
import {
  Autor, Categoria, Livro, Exemplar, Usuario, Emprestimo
} from '../models/biblioteca.models';

function uid(prefix: string): string {
  return prefix + '_' + Math.random().toString(36).slice(2, 9);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function plusDays(n: number): string {
  return new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
}

@Injectable({ providedIn: 'root' })
export class BibliotecaService {
  // --- Estado mockado (troca por API depois) ---
  autores = signal<Autor[]>([
    { id: 'aut_1', name: 'Machado de Assis', nat: 'Brasileira' },
    { id: 'aut_2', name: 'Clarice Lispector', nat: 'Brasileira' },
    { id: 'aut_3', name: 'José Saramago', nat: 'Portuguesa' },
  ]);

  categorias = signal<Categoria[]>([
    { id: 'cat_1', name: 'Literatura Brasileira', desc: 'Romances e contos nacionais.' },
    { id: 'cat_2', name: 'Literatura Estrangeira', desc: 'Obras traduzidas.' },
  ]);

  livros = signal<Livro[]>([
    { id: 'bk_1', title: 'Dom Casmurro', authorId: 'aut_1', categoryId: 'cat_1', year: 1899, isbn: '9788508137416' },
    { id: 'bk_2', title: 'A Hora da Estrela', authorId: 'aut_2', categoryId: 'cat_1', year: 1977, isbn: '9788532507860' },
    { id: 'bk_3', title: 'Ensaio sobre a Cegueira', authorId: 'aut_3', categoryId: 'cat_2', year: 1995, isbn: '9788535911983' },
  ]);

  exemplares = signal<Exemplar[]>([
    { id: 'ex_1', bookId: 'bk_1', code: 'MB-001-1', status: 'disponivel', condition: 'Novo' },
    { id: 'ex_2', bookId: 'bk_1', code: 'MB-001-2', status: 'emprestado', condition: 'Bom' },
    { id: 'ex_3', bookId: 'bk_2', code: 'MB-002-1', status: 'disponivel', condition: 'Bom' },
    { id: 'ex_4', bookId: 'bk_3', code: 'MB-003-1', status: 'disponivel', condition: 'Novo' },
  ]);

  usuarios = signal<Usuario[]>([
    { id: 'usr_1', ra: '2026001', name: 'Ana Beatriz Souza', created: today() },
    { id: 'usr_2', ra: '2026002', name: 'Pedro Henrique Lima', created: today() },
  ]);

  emprestimos = signal<Emprestimo[]>([
    { id: 'emp_1', userId: 'usr_1', copyId: 'ex_2', loanDate: plusDays(-4), dueDate: plusDays(3), returnDate: null, status: 'ativo' },
  ]);

  // --- Computeds úteis para as telas ---
  emprestimosAtivos = computed(() => this.emprestimos().filter(l => l.status !== 'devolvido'));
  emprestimosAtrasados = computed(() => this.emprestimos().filter(l => l.status === 'atrasado'));
  exemplaresDisponiveis = computed(() => this.exemplares().filter(x => x.status === 'disponivel'));

  // --- Getters auxiliares ---
  livro(id: string) { return this.livros().find(b => b.id === id); }
  autor(id: string) { return this.autores().find(a => a.id === id); }
  categoria(id: string) { return this.categorias().find(c => c.id === id); }
  exemplar(id: string) { return this.exemplares().find(x => x.id === id); }
  usuario(id: string) { return this.usuarios().find(u => u.id === id); }

  buscarUsuarioPorRa(ra: string): Usuario | undefined {
    return this.usuarios().find(u => u.ra === ra.trim());
  }

  exemplaresDisponiveisDoLivro(bookId: string): Exemplar[] {
    return this.exemplares().filter(x => x.bookId === bookId && x.status === 'disponivel');
  }

  cadastrarUsuario(ra: string, name: string): Usuario {
    const novo: Usuario = { id: uid('usr'), ra, name, created: today() };
    this.usuarios.update(list => [...list, novo]);
    return novo;
  }

  registrarEmprestimo(ra: string, copyId: string, dueDate: string): { ok: boolean; msg: string } {
    const usuario = this.buscarUsuarioPorRa(ra);
    if (!usuario) return { ok: false, msg: 'RA não encontrado. Cadastre o usuário antes.' };

    const jaEmprestado = this.emprestimos().some(l => l.copyId === copyId && l.status !== 'devolvido');
    if (jaEmprestado) return { ok: false, msg: 'Este exemplar já está emprestado.' };

    const novoEmprestimo: Emprestimo = {
      id: uid('emp'),
      userId: usuario.id,
      copyId,
      loanDate: today(),
      dueDate,
      returnDate: null,
      status: dueDate < today() ? 'atrasado' : 'ativo',
    };

    this.emprestimos.update(list => [...list, novoEmprestimo]);
    this.exemplares.update(list =>
      list.map(x => (x.id === copyId ? { ...x, status: 'emprestado' } : x))
    );

    return { ok: true, msg: `Empréstimo registrado para o RA ${usuario.ra}.` };
  }

  devolverExemplar(emprestimoId: string): void {
    this.emprestimos.update(list =>
      list.map(l => (l.id === emprestimoId ? { ...l, status: 'devolvido', returnDate: today() } : l))
    );
    const emp = this.emprestimos().find(l => l.id === emprestimoId);
    if (emp) {
      this.exemplares.update(list =>
        list.map(x => (x.id === emp.copyId ? { ...x, status: 'disponivel' } : x))
      );
    }
  }

  atualizarStatusAtrasados(): void {
    const hoje = today();
    this.emprestimos.update(list =>
      list.map(l => (l.status !== 'devolvido' ? { ...l, status: l.dueDate < hoje ? 'atrasado' : 'ativo' } : l))
    );
  }
}
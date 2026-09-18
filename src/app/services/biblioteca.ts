import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, map } from 'rxjs';
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

export interface DadosLivroIsbn {
  title: string;
  authors: string;
  publisher: string;
  date: string;
  pages: string;
  description: string;
  image: string;
  isbn: string;
}

// Formato que vai/vem do backend (colunas em português da tabela `livros`)
interface LivroApi {
  id: number;
  titulo: string;
  autor: string;
  isbn: string | null;
  categoria: string | null;
  editora: string | null;
  ano_publicacao: number | null;
}

interface ExemplarApi {
  id: number;
  livro_id: number;
  codigo_patrimonio: string | null;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class BibliotecaService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api';

  autores = signal<Autor[]>([]);

  categorias = signal<Categoria[]>([
    { id: 'cat_1', name: 'Literatura Brasileira', desc: 'Romances e contos nacionais.' },
    { id: 'cat_2', name: 'Literatura Estrangeira', desc: 'Obras traduzidas.' },
  ]);

  livros = signal<Livro[]>([]);
  exemplares = signal<Exemplar[]>([]);

  usuarios = signal<Usuario[]>([
    { id: 'usr_1', ra: '2026001', name: 'Ana Beatriz Souza', created: today() },
    { id: 'usr_2', ra: '2026002', name: 'Pedro Henrique Lima', created: today() },
  ]);

  emprestimos = signal<Emprestimo[]>([
    { id: 'emp_1', userId: 'usr_1', copyId: 'ex_2', loanDate: plusDays(-4), dueDate: plusDays(3), returnDate: null, status: 'ativo' },
  ]);

  constructor() {
    this.carregarLivrosEExemplares();
  }

  // --- Carregamento inicial a partir do backend ---

  private carregarLivrosEExemplares(): void {
    this.http.get<LivroApi[]>(`${this.apiUrl}/livros`).subscribe({
      next: (rows) => this.livros.set(rows.map(row => this.mapLivroApiParaLivro(row))),
      error: (err) => console.error('Erro ao carregar livros:', err),
    });

    this.http
      .get<(ExemplarApi & { titulo: string; autor: string })[]>(`${this.apiUrl}/exemplares`)
      .subscribe({
        next: (rows) => {
          const exemplares: Exemplar[] = rows.map(row => ({
            id: String(row.id),
            bookId: String(row.livro_id),
            code: row.codigo_patrimonio || `EX-${row.id}`,
            status: row.status as Exemplar['status'],
            condition: 'Não informado',
          }));
          this.exemplares.set(exemplares);
        },
        error: (err) => console.error('Erro ao carregar exemplares:', err),
      });
  }

  private mapLivroApiParaLivro(row: LivroApi): Livro {
    return {
      id: String(row.id),
      title: row.titulo,
      authorId: this.resolverAutor(row.autor || ''),
      categoryId: this.resolverCategoria(row.categoria || ''),
      year: row.ano_publicacao ?? undefined,
      isbn: row.isbn ?? undefined,
      publisher: row.editora ?? undefined,
    };
  }

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

  livroTemExemplarEmprestado(bookId: string): boolean {
    return this.exemplares().some(x => x.bookId === bookId && x.status === 'emprestado');
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

  // --- Cadastro de livro via ISBN ---

  buscarLivroPorIsbn(isbn: string) {
    return this.http.get<DadosLivroIsbn>(`${this.apiUrl}/buscar/${isbn}`);
  }

  dataDevolucaoPadrao(dias: number = 7): string {
    return plusDays(dias);
  }

  private resolverAutor(authorsRaw: string): string {
    const nome = (authorsRaw || '').split(',')[0].trim();

    if (!nome || nome === 'Não informado') {
      const generico = this.autores().find(a => a.name === 'Autor não informado');
      if (generico) return generico.id;
      const novo: Autor = { id: uid('aut'), name: 'Autor não informado' };
      this.autores.update(list => [...list, novo]);
      return novo.id;
    }

    const existente = this.autores().find(a => a.name.toLowerCase() === nome.toLowerCase());
    if (existente) return existente.id;

    const novo: Autor = { id: uid('aut'), name: nome };
    this.autores.update(list => [...list, novo]);
    return novo.id;
  }

  private resolverCategoria(nomeRaw: string): string {
    const nome = (nomeRaw || '').trim();

    if (!nome) {
      const generica = this.categorias().find(c => c.name === 'Categoria não informada');
      if (generica) return generica.id;
      const nova: Categoria = { id: uid('cat'), name: 'Categoria não informada', desc: '' };
      this.categorias.update(list => [...list, nova]);
      return nova.id;
    }

    const existente = this.categorias().find(c => c.name.toLowerCase() === nome.toLowerCase());
    if (existente) return existente.id;

    const nova: Categoria = { id: uid('cat'), name: nome, desc: '' };
    this.categorias.update(list => [...list, nova]);
    return nova.id;
  }

  /**
   * Cadastra o livro E um exemplar no backend (MySQL) e só então
   * atualiza os signals locais com os dados reais (ids do banco).
   */
  cadastrarLivroPorIsbn(dados: DadosLivroIsbn, categoryId: string): Observable<{ livro: Livro; exemplar: Exemplar }> {
    const categoria = this.categoria(categoryId);
    const anoMatch = dados.date?.match(/\d{4}/);
    const ano_publicacao = anoMatch ? Number(anoMatch[0]) : null;
    const autorNome = (dados.authors || '').split(',')[0].trim() || 'Autor não informado';

    const corpoLivro = {
      titulo: dados.title || 'Título não informado',
      autor: autorNome,
      isbn: dados.isbn || null,
      categoria: categoria?.name || null,
      editora: dados.publisher || null,
      ano_publicacao,
    };

    return this.http.post<LivroApi>(`${this.apiUrl}/livros`, corpoLivro).pipe(
      switchMap((livroSalvo) => {
        const corpoExemplar = {
          livro_id: livroSalvo.id,
          codigo_patrimonio: `${livroSalvo.id}-1`,
        };

        return this.http.post<ExemplarApi>(`${this.apiUrl}/exemplares`, corpoExemplar).pipe(
          map((exemplarSalvo) => {
            const authorId = this.resolverAutor(autorNome);

            const novoLivro: Livro = {
              id: String(livroSalvo.id),
              title: livroSalvo.titulo,
              authorId,
              categoryId,
              year: livroSalvo.ano_publicacao ?? undefined,
              isbn: livroSalvo.isbn ?? undefined,
              publisher: livroSalvo.editora ?? undefined,
              description: dados.description,
              pages: dados.pages,
              image: dados.image,
            };

            const novoExemplar: Exemplar = {
              id: String(exemplarSalvo.id),
              bookId: String(exemplarSalvo.livro_id),
              code: exemplarSalvo.codigo_patrimonio || `EX-${exemplarSalvo.id}`,
              status: 'disponivel',
              condition: 'Novo',
            };

            this.livros.update(list => [...list, novoLivro]);
            this.exemplares.update(list => [...list, novoExemplar]);

            return { livro: novoLivro, exemplar: novoExemplar };
          })
        );
      })
    );
  }
}
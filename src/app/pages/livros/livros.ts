import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BibliotecaService } from '../../services/biblioteca';
import { CadastrarLivroComponent } from './cadastrar-livro/cadastrar-livro';
import { DetalheLivroComponent } from './detalhe-livro/detalhe-livro';
import { Livro } from '../../models/biblioteca.models';

type StatusLivro = 'disponivel' | 'emprestado' | 'indisponivel';
type FiltroStatus = 'todos' | 'disponivel' | 'emprestado';

@Component({
  selector: 'app-livros',
  standalone: true,
  imports: [FormsModule, CadastrarLivroComponent, DetalheLivroComponent],
  templateUrl: './livros.html',
  styleUrl: './livros.scss',
})
export class LivrosComponent {
  biblioteca = inject(BibliotecaService);

  busca = signal('');
  categoriaFiltro = signal('');
  statusFiltro = signal<FiltroStatus>('todos');
  mostrarModalCadastro = signal(false);
  livroSelecionado = signal<Livro | null>(null);

  // Só categorias que têm pelo menos um livro
  categoriasEmUso = computed(() => {
    const ids = new Set(this.biblioteca.livros().map(l => l.categoryId));
    return this.biblioteca.categorias().filter(c => ids.has(c.id));
  });

  livrosFiltrados = computed(() => {
    const q = this.busca().trim().toLowerCase();
    const cat = this.categoriaFiltro();
    const st = this.statusFiltro();

    return this.biblioteca.livros().filter(l => {
      if (cat && l.categoryId !== cat) return false;
      if (st !== 'todos' && this.statusLivro(l) !== st) return false;
      if (!q) return true;

      const autor = this.biblioteca.autor(l.authorId)?.name ?? '';
      const categoria = this.biblioteca.categoria(l.categoryId)?.name ?? '';
      const texto = `${l.title} ${autor} ${categoria} ${l.isbn ?? ''}`.toLowerCase();
      return texto.includes(q);
    });
  });

  totalExemplares(bookId: string): number {
    return this.biblioteca.exemplares().filter(x => x.bookId === bookId).length;
  }

  exemplaresDisponiveis(bookId: string): number {
    return this.biblioteca.exemplaresDisponiveisDoLivro(bookId).length;
  }

  // --- Status exibido no carimbo ---

  statusLivro(livro: Livro): StatusLivro {
    if (this.biblioteca.livroTemExemplarEmprestado(livro.id)) return 'emprestado';
    if (this.exemplaresDisponiveis(livro.id) > 0) return 'disponivel';
    return 'indisponivel';
  }

  rotuloStatus(livro: Livro): string {
    const mapa: Record<StatusLivro, string> = {
      disponivel: 'Disponível',
      emprestado: 'Emprestado',
      indisponivel: 'Indisponível',
    };
    return mapa[this.statusLivro(livro)];
  }

  notaDisponibilidade(livro: Livro): string {
    const total = this.totalExemplares(livro.id);
    if (total === 0) return 'Sem exemplares';
    const disp = this.exemplaresDisponiveis(livro.id);
    return `${disp} de ${total} disponíve${total === 1 ? 'l' : 'is'}`;
  }

  // --- Modais ---

  abrirCadastro(): void {
    this.mostrarModalCadastro.set(true);
  }

  fecharCadastro(): void {
    this.mostrarModalCadastro.set(false);
  }

  aoCadastrar(evento: { emprestado: boolean }): void {
    this.mostrarModalCadastro.set(false);
    if (evento.emprestado) {
      this.statusFiltro.set('emprestado');
    }
  }

  abrirDetalhe(livro: Livro): void {
    this.livroSelecionado.set(livro);
  }

  fecharDetalhe(): void {
    this.livroSelecionado.set(null);
  }

  aoEmprestar(): void {
    this.livroSelecionado.set(null);
    this.statusFiltro.set('emprestado');
  }
}
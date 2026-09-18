import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BibliotecaService } from '../../services/biblioteca';
import { CadastrarLivroComponent } from './cadastrar-livro/cadastrar-livro';
import { DetalheLivroComponent } from './detalhe-livro/detalhe-livro';
import { Livro } from '../../models/biblioteca.models';

type FiltroLivros = 'cadastrados' | 'emprestados';

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
  filtro = signal<FiltroLivros>('cadastrados');
  mostrarModalCadastro = signal(false);
  livroSelecionado = signal<Livro | null>(null);

  livrosFiltrados = computed(() => {
    const q = this.busca().trim().toLowerCase();
    const modo = this.filtro();
    let lista = this.biblioteca.livros();

    if (modo === 'emprestados') {
      lista = lista.filter(l => this.biblioteca.livroTemExemplarEmprestado(l.id));
    }

    if (!q) return lista;
    return lista.filter(l => {
      const autor = this.biblioteca.autor(l.authorId)?.name ?? '';
      const texto = `${l.title} ${autor} ${l.isbn}`.toLowerCase();
      return texto.includes(q);
    });
  });

  totalExemplares(bookId: string): number {
    return this.biblioteca.exemplares().filter(x => x.bookId === bookId).length;
  }

  exemplaresDisponiveis(bookId: string): number {
    return this.biblioteca.exemplaresDisponiveisDoLivro(bookId).length;
  }

  selecionarFiltro(valor: FiltroLivros): void {
    this.filtro.set(valor);
  }

  abrirCadastro(): void {
    this.mostrarModalCadastro.set(true);
  }

  fecharCadastro(): void {
    this.mostrarModalCadastro.set(false);
  }

  aoCadastrar(evento: { emprestado: boolean }): void {
    this.mostrarModalCadastro.set(false);
    if (evento.emprestado) {
      this.filtro.set('emprestados');
    }
  }

  abrirDetalhe(livro: Livro): void {
    this.livroSelecionado.set(livro);
  }

  fecharDetalhe(): void {
    this.livroSelecionado.set(null);
  }
}
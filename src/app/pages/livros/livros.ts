import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BibliotecaService } from '../../services/biblioteca';
import { CadastrarLivroComponent } from './cadastrar-livro/cadastrar-livro';

@Component({
  selector: 'app-livros',
  standalone: true,
  imports: [FormsModule, CadastrarLivroComponent],
  templateUrl: './livros.html',
  styleUrl: './livros.scss',
})
export class LivrosComponent {
  biblioteca = inject(BibliotecaService);

  busca = signal('');
  mostrarModal = signal(false);

  livrosFiltrados = computed(() => {
    const q = this.busca().trim().toLowerCase();
    const lista = this.biblioteca.livros();
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

  abrirModal(): void {
    this.mostrarModal.set(true);
  }

  fecharModal(): void {
    this.mostrarModal.set(false);
  }
}
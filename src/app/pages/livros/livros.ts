import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BibliotecaService } from '../../services/biblioteca';

@Component({
  selector: 'app-livros',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './livros.html',
  styleUrl: './livros.scss',
})
export class LivrosComponent {
  biblioteca = inject(BibliotecaService);

  busca = signal('');

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
}
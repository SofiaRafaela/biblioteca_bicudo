import { Component, computed, inject } from '@angular/core';
import { BibliotecaService } from '../../services/biblioteca';

interface EventoHistorico {
  data: string;
  tipo: 'Retirada' | 'Devolução';
  ra: string;
  usuario: string;
  livro: string;
}

@Component({
  selector: 'app-historico',
  standalone: true,
  templateUrl: './historico.html',
  styleUrl: './historico.scss',
})
export class HistoricoComponent {
  biblioteca = inject(BibliotecaService);

  eventos = computed<EventoHistorico[]>(() => {
    const lista: EventoHistorico[] = [];
    for (const emp of this.biblioteca.emprestimos()) {
      const usuario = this.biblioteca.usuario(emp.userId);
      const livro = this.biblioteca.livro(this.biblioteca.exemplar(emp.copyId)?.bookId ?? '');
      lista.push({
        data: emp.loanDate,
        tipo: 'Retirada',
        ra: usuario?.ra ?? '—',
        usuario: usuario?.name ?? '—',
        livro: livro?.title ?? '—',
      });
      if (emp.returnDate) {
        lista.push({
          data: emp.returnDate,
          tipo: 'Devolução',
          ra: usuario?.ra ?? '—',
          usuario: usuario?.name ?? '—',
          livro: livro?.title ?? '—',
        });
      }
    }
    return lista.sort((a, b) => b.data.localeCompare(a.data));
  });
}
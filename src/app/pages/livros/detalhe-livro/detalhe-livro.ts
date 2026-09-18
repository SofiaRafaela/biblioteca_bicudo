import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { BibliotecaService } from '../../../services/biblioteca';
import { Livro } from '../../../models/biblioteca.models';

@Component({
  selector: 'app-detalhe-livro',
  standalone: true,
  imports: [],
  templateUrl: './detalhe-livro.html',
  styleUrl: './detalhe-livro.scss',
})
export class DetalheLivroComponent {
  biblioteca = inject(BibliotecaService);

  @Input({ required: true }) livro!: Livro;
  @Output() fechar = new EventEmitter<void>();

  fecharModal(): void {
    this.fechar.emit();
  }
}
import { Component, inject } from '@angular/core';
import { BibliotecaService } from '../../services/biblioteca';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent {
  biblioteca = inject(BibliotecaService);

  constructor() {
    this.biblioteca.atualizarStatusAtrasados();
  }
}
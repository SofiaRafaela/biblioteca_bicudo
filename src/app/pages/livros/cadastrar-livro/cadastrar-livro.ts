import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BibliotecaService, DadosLivroIsbn } from '../../../services/biblioteca';

type EstadoBusca = 'idle' | 'buscando' | 'sucesso' | 'erro';

@Component({
  selector: 'app-cadastrar-livro',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './cadastrar-livro.html',
  styleUrl: './cadastrar-livro.scss',
})
export class CadastrarLivroComponent {
  biblioteca = inject(BibliotecaService);

  @Output() fechar = new EventEmitter<void>();

  isbn = signal('');
  estado = signal<EstadoBusca>('idle');
  erroMsg = signal('');
  resultado = signal<DadosLivroIsbn | null>(null);
  categoriaSelecionada = signal('');
  salvando = signal(false);

  buscar(): void {
    const codigo = this.isbn().trim();
    if (!codigo) return;

    this.estado.set('buscando');
    this.erroMsg.set('');

    this.biblioteca.buscarLivroPorIsbn(codigo).subscribe({
      next: (dados) => {
        this.resultado.set(dados);
        this.categoriaSelecionada.set(this.biblioteca.categorias()[0]?.id ?? '');
        this.estado.set('sucesso');
      },
      error: (err) => {
        this.erroMsg.set(err.error?.erro || 'Código inválido ou livro não encontrado.');
        this.estado.set('erro');
      },
    });
  }

  confirmarCadastro(): void {
    const dados = this.resultado();
    if (!dados || !this.categoriaSelecionada()) return;

    this.salvando.set(true);

    this.biblioteca.cadastrarLivroPorIsbn(dados, this.categoriaSelecionada()).subscribe({
      next: () => {
        this.salvando.set(false);
        this.fechar.emit();
      },
      error: (err) => {
        this.salvando.set(false);
        this.erroMsg.set(err.error?.erro || 'Erro ao salvar o livro. Tente novamente.');
        this.estado.set('erro');
      },
    });
  }

  tentarNovamente(): void {
    this.estado.set('idle');
    this.isbn.set('');
    this.resultado.set(null);
    this.erroMsg.set('');
  }

  cancelar(): void {
    this.fechar.emit();
  }
}
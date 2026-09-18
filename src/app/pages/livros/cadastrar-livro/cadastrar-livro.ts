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
  @Output() cadastrado = new EventEmitter<{ emprestado: boolean }>();

  isbn = signal('');
  estado = signal<EstadoBusca>('idle');
  erroMsg = signal('');
  resultado = signal<DadosLivroIsbn | null>(null);
  categoriaSelecionada = signal('');
  salvando = signal(false);

  emprestarAgora = signal(false);
  raEmprestimo = signal('');
  erroEmprestimo = signal('');

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

    this.erroEmprestimo.set('');

    // Se marcou "emprestar agora", valida o RA antes de gastar uma chamada ao backend
    if (this.emprestarAgora() && !this.raEmprestimo().trim()) {
      this.erroEmprestimo.set('Informe o RA do usuário para emprestar.');
      return;
    }

    this.salvando.set(true);

    this.biblioteca.cadastrarLivroPorIsbn(dados, this.categoriaSelecionada()).subscribe({
      next: ({ exemplar }) => {
        this.salvando.set(false);

        let emprestado = false;

        if (this.emprestarAgora()) {
          const ra = this.raEmprestimo().trim();
          const dueDate = this.biblioteca.dataDevolucaoPadrao(7);
          const resultado = this.biblioteca.registrarEmprestimo(ra, exemplar.id, dueDate);

          if (!resultado.ok) {
            this.erroEmprestimo.set(resultado.msg);
            return; // livro já foi salvo, mas o empréstimo falhou — deixa o usuário corrigir o RA
          }
          emprestado = true;
        }

        this.cadastrado.emit({ emprestado });
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
    this.emprestarAgora.set(false);
    this.raEmprestimo.set('');
    this.erroEmprestimo.set('');
  }

  cancelar(): void {
    this.fechar.emit();
  }
}
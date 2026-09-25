import { Component, Input, Output, EventEmitter, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BibliotecaService, UsuarioApi } from '../../../services/biblioteca';
import { Livro } from '../../../models/biblioteca.models';

type EstadoEmprestimo = 'fechado' | 'buscandoRa' | 'usuarioEncontrado' | 'cadastrarUsuario' | 'salvando';

@Component({
  selector: 'app-detalhe-livro',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './detalhe-livro.html',
  styleUrl: './detalhe-livro.scss',
})
export class DetalheLivroComponent {
  biblioteca = inject(BibliotecaService);

  @Input({ required: true }) livro!: Livro;
  @Output() fechar = new EventEmitter<void>();
  @Output() emprestado = new EventEmitter<void>();

  estadoEmprestimo = signal<EstadoEmprestimo>('fechado');
  ra = signal('');
  usuarioEncontrado = signal<UsuarioApi | null>(null);
  nomeNovoUsuario = signal('');
  contatoNovoUsuario = signal('');
  erroEmprestimo = signal('');

  temExemplarDisponivel = computed(() =>
    this.biblioteca.exemplaresDisponiveisDoLivro(this.livro.id).length > 0
  );

  fecharModal(): void {
    this.fechar.emit();
  }

  abrirFormEmprestimo(): void {
    this.estadoEmprestimo.set('buscandoRa');
    this.ra.set('');
    this.usuarioEncontrado.set(null);
    this.erroEmprestimo.set('');
  }

  cancelarEmprestimo(): void {
    this.estadoEmprestimo.set('fechado');
    this.ra.set('');
    this.usuarioEncontrado.set(null);
    this.nomeNovoUsuario.set('');
    this.contatoNovoUsuario.set('');
    this.erroEmprestimo.set('');
  }

  buscarPorRa(): void {
    const raDigitado = this.ra().trim();
    if (!raDigitado) return;

    this.erroEmprestimo.set('');

    this.biblioteca.buscarUsuarioPorRaApi(raDigitado).subscribe({
      next: (usuario) => {
        this.usuarioEncontrado.set(usuario);
        this.estadoEmprestimo.set('usuarioEncontrado');
      },
      error: (err) => {
        if (err.status === 404) {
          this.estadoEmprestimo.set('cadastrarUsuario');
        } else {
          this.erroEmprestimo.set('Erro ao buscar usuário. Tente novamente.');
        }
      },
    });
  }

  confirmarEmprestimoComUsuarioExistente(): void {
    const usuario = this.usuarioEncontrado();
    const exemplar = this.biblioteca.exemplaresDisponiveisDoLivro(this.livro.id)[0];

    if (!usuario || !exemplar) {
      this.erroEmprestimo.set('Nenhum exemplar disponível para empréstimo.');
      return;
    }

    this.estadoEmprestimo.set('salvando');

    this.biblioteca.registrarEmprestimoApi(exemplar.id, usuario.id).subscribe({
      next: () => {
        this.cancelarEmprestimo();
        this.emprestado.emit();
      },
      error: (err) => {
        this.erroEmprestimo.set(err.error?.erro || 'Erro ao registrar empréstimo.');
        this.estadoEmprestimo.set('usuarioEncontrado');
      },
    });
  }

  cadastrarUsuarioEEmprestar(): void {
    const raDigitado = this.ra().trim();
    const nome = this.nomeNovoUsuario().trim();
    const exemplar = this.biblioteca.exemplaresDisponiveisDoLivro(this.livro.id)[0];

    if (!nome) {
      this.erroEmprestimo.set('Informe o nome do usuário.');
      return;
    }
    if (!exemplar) {
      this.erroEmprestimo.set('Nenhum exemplar disponível para empréstimo.');
      return;
    }

    this.estadoEmprestimo.set('salvando');

    this.biblioteca.cadastrarUsuarioApi(raDigitado, nome, this.contatoNovoUsuario().trim()).subscribe({
      next: (usuarioSalvo) => {
        this.biblioteca.registrarEmprestimoApi(exemplar.id, usuarioSalvo.id).subscribe({
          next: () => {
            this.cancelarEmprestimo();
            this.emprestado.emit();
          },
          error: (err) => {
            this.erroEmprestimo.set(err.error?.erro || 'Erro ao registrar empréstimo.');
            this.estadoEmprestimo.set('cadastrarUsuario');
          },
        });
      },
      error: (err) => {
        this.erroEmprestimo.set(err.error?.erro || 'Erro ao cadastrar usuário.');
        this.estadoEmprestimo.set('cadastrarUsuario');
      },
    });
  }
}
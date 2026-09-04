import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BibliotecaService } from '../../services/biblioteca';
import { Usuario } from '../../models/biblioteca.models';

@Component({
  selector: 'app-emprestimos',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './emprestimos.html',
  styleUrl: './emprestimos.scss',
})
export class EmprestimosComponent {
  biblioteca = inject(BibliotecaService);

  raDigitado = signal('');
  usuarioEncontrado = signal<Usuario | null>(null);
  raNaoEncontrado = signal(false);
  copyIdSelecionado = signal('');
  dataDevolucao = signal(this.padDate(7));
  mensagem = signal<{ ok: boolean; msg: string } | null>(null);

  private padDate(dias: number): string {
    return new Date(Date.now() + dias * 86400000).toISOString().slice(0, 10);
  }

  consultarRa() {
    const usuario = this.biblioteca.buscarUsuarioPorRa(this.raDigitado());
    this.usuarioEncontrado.set(usuario ?? null);
    this.raNaoEncontrado.set(!usuario);
  }

  confirmarRetirada() {
    const resultado = this.biblioteca.registrarEmprestimo(
      this.raDigitado(),
      this.copyIdSelecionado(),
      this.dataDevolucao()
    );
    this.mensagem.set(resultado);
    if (resultado.ok) {
      this.raDigitado.set('');
      this.usuarioEncontrado.set(null);
      this.copyIdSelecionado.set('');
    }
  }

  devolver(emprestimoId: string) {
    this.biblioteca.devolverExemplar(emprestimoId);
  }
}
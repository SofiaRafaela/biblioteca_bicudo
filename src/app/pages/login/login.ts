import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  modo = signal<'entrar' | 'cadastrar'>('entrar');

  nome = '';
  email = '';
  senha = '';
  confirmarSenha = '';
  senhaVisivel = false;

  mensagem = signal('');
  carregando = signal(false);

  irParaEntrar() {
    this.modo.set('entrar');
    this.limparMensagem();
  }

  irParaCadastrar() {
    this.modo.set('cadastrar');
    this.limparMensagem();
  }

  alternarSenha() {
    this.senhaVisivel = !this.senhaVisivel;
  }

  limparMensagem() {
    this.mensagem.set('');
  }

  onSubmit() {
    this.limparMensagem();

    if (!this.email || !this.email.includes('@')) {
      this.mensagem.set('Digite um e-mail válido.');
      return;
    }

    if (this.senha.length < 6) {
      this.mensagem.set('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    if (this.modo() === 'cadastrar') {
      if (!this.nome.trim()) {
        this.mensagem.set('Digite seu nome.');
        return;
      }
      if (this.senha !== this.confirmarSenha) {
        this.mensagem.set('As senhas não coincidem.');
        return;
      }

      this.carregando.set(true);
      this.auth.registrar(this.nome, this.email, this.senha).subscribe({
        next: () => {
          this.carregando.set(false);
          this.mensagem.set('Cadastro realizado com sucesso!');
          setTimeout(() => {
            this.irParaEntrar();
            this.senha = '';
            this.confirmarSenha = '';
          }, 1000);
        },
        error: (err) => {
          this.carregando.set(false);
          this.mensagem.set(err.error?.erro || 'Erro ao cadastrar.');
        },
      });
      return;
    }

    // login
    this.carregando.set(true);
    this.auth.login(this.email, this.senha).subscribe({
      next: () => {
        this.carregando.set(false);
        this.router.navigate(['/biblioteca/home']);
      },
      error: (err) => {
        this.carregando.set(false);
        this.mensagem.set(err.error?.erro || 'E-mail ou senha incorretos.');
      },
    });
  }

  esqueciSenha() {
    this.mensagem.set('Entre em contato com a secretaria para recuperar sua senha.');
  }
}
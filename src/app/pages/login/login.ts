import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  senha = '';
  senhaVisivel = false;

  mensagem = signal('');
  carregando = signal(false);

  alternarSenha() {
    this.senhaVisivel = !this.senhaVisivel;
  }

  onSubmit() {
    this.mensagem.set('');

    if (!this.email || !this.email.includes('@')) {
      this.mensagem.set('Digite um e-mail válido.');
      return;
    }

    if (this.senha.length < 6) {
      this.mensagem.set('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

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
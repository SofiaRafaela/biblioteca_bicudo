import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface Administrador {
  id: number;
  nome: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';

  admin = signal<Administrador | null>(this.carregarSessao());

  constructor(private http: HttpClient) {}

  login(email: string, senha: string): Observable<Administrador> {
    return this.http.post<Administrador>(`${this.apiUrl}/login`, { email, senha }).pipe(
      tap((admin) => {
        this.admin.set(admin);
        localStorage.setItem('adminBicudo', JSON.stringify(admin));
      })
    );
  }

  registrar(nome: string, email: string, senha: string): Observable<Administrador> {
    return this.http.post<Administrador>(`${this.apiUrl}/register`, { nome, email, senha });
  }

  logout() {
    this.admin.set(null);
    localStorage.removeItem('adminBicudo');
  }

  estaLogado(): boolean {
    return this.admin() !== null;
  }

  private carregarSessao(): Administrador | null {
    const salvo = localStorage.getItem('adminBicudo');
    return salvo ? JSON.parse(salvo) : null;
  }
}
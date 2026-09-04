import { Component } from '@angular/core';
import { RouterLink } from '@angular/router'; // Adicionei isso para o botão funcionar!

@Component({
  selector: 'app-nao-encontrado',
  imports: [RouterLink], // Coloque o RouterLink aqui dentro dos imports
  templateUrl: './nao-encontrado.html',
  styleUrl: './nao-encontrado.scss'
})
export class NaoEncontradoComponent {}

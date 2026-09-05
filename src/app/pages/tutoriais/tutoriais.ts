import { Component, signal } from '@angular/core';

interface Passo {
  titulo: string;
  descricao: string;
}

interface Topico {
  titulo: string;
  icone: string;
  passos: Passo[];
}

@Component({
  selector: 'app-tutoriais',
  standalone: true,
  templateUrl: './tutoriais.html',
  styleUrl: './tutoriais.scss',
})
export class TutoriaisComponent {
  topicoAberto = signal<number | null>(0);

  topicos: Topico[] = [
    {
      titulo: 'Como cadastrar um livro',
      icone: '▤',
      passos: [
        { titulo: 'Acesse a tela Livros', descricao: 'No menu lateral, clique em "Livros", dentro do grupo Cadastros.' },
        { titulo: 'Clique em "+ Novo livro"', descricao: 'O botão fica no canto superior direito da tela.' },
        { titulo: 'Preencha os dados', descricao: 'Título, autor, categoria, ano e ISBN do livro.' },
        { titulo: 'Salve o cadastro', descricao: 'Clique em "Cadastrar livro". Ele já aparece na lista imediatamente.' },
      ],
    },
    {
      titulo: 'Como consultar o RA de um aluno',
      icone: '◎',
      passos: [
        { titulo: 'Acesse Empréstimos', descricao: 'No menu, dentro do grupo Circulação.' },
        { titulo: 'Digite o RA', descricao: 'No campo "Digite o RA", escreva o número de RA do aluno.' },
        { titulo: 'Clique em Consultar', descricao: 'O sistema mostra se o RA já está cadastrado.' },
        { titulo: 'Se não encontrado', descricao: 'Aparece um campo para digitar o nome e cadastrar o aluno na hora.' },
      ],
    },
    {
      titulo: 'Como registrar um empréstimo',
      icone: '↔',
      passos: [
        { titulo: 'Confirme o RA', descricao: 'Siga o passo anterior até o RA aparecer como encontrado.' },
        { titulo: 'Busque o livro', descricao: 'No campo de busca, digite o título, autor ou ISBN.' },
        { titulo: 'Selecione o livro', descricao: 'Clique sobre o livro desejado na lista — ele fica destacado em verde.' },
        { titulo: 'Confirme a retirada', descricao: 'Clique em "Confirmar retirada". O empréstimo passa a aparecer no Histórico.' },
      ],
    },
    {
      titulo: 'Como registrar uma devolução',
      icone: '◷',
      passos: [
        { titulo: 'Acesse Histórico', descricao: 'No menu, dentro do grupo Circulação.' },
        { titulo: 'Encontre o empréstimo', descricao: 'Use a busca por RA, aluno ou livro se a lista estiver grande.' },
        { titulo: 'Clique em "Registrar devolução"', descricao: 'O botão aparece na linha de empréstimos que ainda não foram devolvidos.' },
        { titulo: 'Pronto', descricao: 'O status muda para "devolvido" e o exemplar volta a ficar disponível.' },
      ],
    },
  ];

  perguntas = [
    { p: 'O que significa o status "Atrasado"?', r: 'O empréstimo passou da data prevista de devolução e ainda não foi devolvido.' },
    { p: 'Posso emprestar um livro sem exemplar disponível?', r: 'Não. O sistema não deixa registrar um empréstimo se todos os exemplares já estiverem emprestados.' },
    { p: 'O que acontece se eu digitar um RA que não existe?', r: 'O sistema avisa que o RA não foi encontrado e oferece um campo para cadastrar o aluno na hora, sem sair da tela.' },
  ];

  alternar(indice: number) {
    this.topicoAberto.set(this.topicoAberto() === indice ? null : indice);
  }
}
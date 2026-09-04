export interface Autor {
    id: string;
    name: string;
    nat?: string;
}

export interface Categoria {
    id: string;
    name: string;
    desc?: string;
}

export interface Livro {
    id: string;
    title: string;
    authorId: string;
    categoryId: string;
    year?: number;
    isbn?: string;
}

export interface Exemplar {
    id: string;
    bookId: string;
    code: string;
    status: 'disponivel' | 'emprestado' | 'manutencao';
    condition: string;
}

export interface Usuario {
    id: string;
    ra: string;
    name: string;
    created: string; // ISO date
}

export type EmprestimoStatus = 'ativo' | 'atrasado' | 'devolvido';

export interface Emprestimo {
    id: string;
    userId: string;
    copyId: string;
    loanDate: string;
    dueDate: string;
    returnDate: string | null;
    status: EmprestimoStatus;
}
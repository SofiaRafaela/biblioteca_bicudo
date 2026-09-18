const express = require('express');
const router = express.Router();

const ISBN_REGEX = /^(97[89])?\d{9}[\dX]$/i;

function validarIsbn(rawIsbn) {
    const isbn = (rawIsbn || '').replace(/[-\s]/g, '').trim();
    if (!isbn || !ISBN_REGEX.test(isbn)) return null;
    return isbn;
}

async function buscarNomesAutores(authorRefs) {
    if (!authorRefs || authorRefs.length === 0) return null;

    const nomes = await Promise.all(
        authorRefs.map(async (key) => {
            try {
                const res = await fetch(`https://openlibrary.org${key}.json`);
                if (!res.ok) return null;
                const data = await res.json();
                return data.name || null;
            } catch {
                return null;
            }
        })
    );

    const validos = nomes.filter(Boolean);
    return validos.length > 0 ? validos.join(', ') : null;
}

async function fetchOpenLibrary(isbn) {
    try {
        const res = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);
        if (!res.ok) {
            console.error('Open Library respondeu com status:', res.status);
            return null;
        }
        const item = await res.json();

        // 1ª tentativa: autor direto na edição (raro, mas acontece)
        let authorsNames = null;
        if (item.authors && item.authors.length > 0) {
            const keys = item.authors.map(a => a.key || a);
            authorsNames = await buscarNomesAutores(keys);
        }

        // 2ª tentativa: autor vem associado ao "work" (o caso mais comum)
        if (!authorsNames && item.works && item.works.length > 0) {
            try {
                const workRes = await fetch(`https://openlibrary.org${item.works[0].key}.json`);
                if (workRes.ok) {
                    const work = await workRes.json();
                    if (work.authors && work.authors.length > 0) {
                        const keys = work.authors
                            .map(a => (a.author && a.author.key) || null)
                            .filter(Boolean);
                        authorsNames = await buscarNomesAutores(keys);
                    }
                }
            } catch (err) {
                console.error('Erro ao buscar work da Open Library:', err.message);
            }
        }

        // 3ª tentativa: texto livre "by_statement" (ex.: "by Robert C. Martin")
        if (!authorsNames && item.by_statement) {
            authorsNames = item.by_statement.replace(/^by\s+/i, '');
        }

        if (!authorsNames) authorsNames = 'Não informado';

        // Descrição pode vir como string direta ou como { value: '...' }
        let description = 'Sinopse não disponível.';
        if (typeof item.description === 'string') {
            description = item.description;
        } else if (item.description && item.description.value) {
            description = item.description.value;
        } else if (item.subtitle) {
            description = item.subtitle;
        }

        // Capa vem como ID numérico, precisa montar a URL
        const coverId = item.covers && item.covers.length > 0 ? item.covers[0] : null;
        const image = coverId
            ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
            : `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;

        return {
            title: item.title || null,
            authors: authorsNames,
            publisher: item.publishers ? item.publishers.join(', ') : 'Não informada',
            date: item.publish_date || 'Não informada',
            pages: item.number_of_pages ? `${item.number_of_pages} páginas` : 'Não informado',
            description,
            image,
        };
    } catch (err) {
        console.error('Erro Open Library:', err.message);
        return null;
    }
}

async function fetchGoogleBooks(isbn) {
    try {
        const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
        const res = await fetch(url);
        if (!res.ok) {
            console.error('Google Books respondeu com status:', res.status);
            return null;
        }
        const data = await res.json();

        const items = data.items;
        if (!items || items.length === 0) return null;

        const info = items[0].volumeInfo || {};
        const imageLinks = info.imageLinks || {};
        const thumbnail = imageLinks.thumbnail || '';
        const authors = info.authors;

        return {
            title: info.title || null,
            authors: authors ? authors.join(', ') : 'Não informado',
            publisher: info.publisher || 'Não informada',
            date: info.publishedDate || 'Não informada',
            pages: info.pageCount ? `${info.pageCount} páginas` : 'Não informado',
            description: info.description || 'Sinopse não disponível.',
            image: thumbnail ? thumbnail.replace('http://', 'https://') : '',
        };
    } catch (err) {
        console.error('Erro Google Books:', err.message);
        return null;
    }
}

async function searchBook(rawIsbn) {
    const isbn = validarIsbn(rawIsbn);
    if (!isbn) {
        throw new Error('Por favor, informe um código ISBN válido de 10 ou 13 dígitos.');
    }

    let book = await fetchOpenLibrary(isbn);
    if (!book) book = await fetchGoogleBooks(isbn);
    if (!book) throw new Error('Nenhum livro encontrado para este ISBN.');

    book.isbn = isbn;
    return book;
}

// GET /api/buscar/:isbn
router.get('/:isbn', async (req, res) => {
    try {
        const book = await searchBook(req.params.isbn);
        res.json(book);
    } catch (err) {
        res.status(400).json({ erro: err.message });
    }
});

module.exports = router;
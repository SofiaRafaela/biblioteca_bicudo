const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/livros — lista todos os livros
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM livros ORDER BY titulo');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar livros' });
  }
});

// GET /api/livros/:id — busca um livro específico
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM livros WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ erro: 'Livro não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar livro' });
  }
});

// POST /api/livros — cadastra um novo livro
router.post('/', async (req, res) => {
  const { titulo, autor, isbn, categoria, editora, ano_publicacao, descricao, paginas, capa_url } = req.body;

  if (!titulo || !autor) {
    return res.status(400).json({ erro: 'Título e autor são obrigatórios' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO livros (titulo, autor, isbn, categoria, editora, ano_publicacao, descricao, paginas, capa_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [titulo, autor, isbn || null, categoria || null, editora || null, ano_publicacao || null, descricao || null, paginas || null, capa_url || null]
    );
    res.status(201).json({
      id: result.insertId, titulo, autor, isbn, categoria, editora, ano_publicacao, descricao, paginas, capa_url
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao cadastrar livro' });
  }
});

// PUT /api/livros/:id — atualiza um livro
router.put('/:id', async (req, res) => {
  const { titulo, autor, isbn, categoria, editora, ano_publicacao } = req.body;

  try {
    const [result] = await pool.query(
      `UPDATE livros SET titulo = ?, autor = ?, isbn = ?, categoria = ?, editora = ?, ano_publicacao = ?
       WHERE id = ?`,
      [titulo, autor, isbn || null, categoria || null, editora || null, ano_publicacao || null, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ erro: 'Livro não encontrado' });
    res.json({ mensagem: 'Livro atualizado com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao atualizar livro' });
  }
});

// DELETE /api/livros/:id — remove um livro (e seus exemplares, por CASCADE)
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM livros WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ erro: 'Livro não encontrado' });
    res.json({ mensagem: 'Livro removido com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao remover livro' });
  }
});

module.exports = router;
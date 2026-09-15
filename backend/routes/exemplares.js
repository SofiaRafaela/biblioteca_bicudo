const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/exemplares — lista todos os exemplares (com dados do livro)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.*, l.titulo, l.autor
       FROM exemplares e
       JOIN livros l ON l.id = e.livro_id
       ORDER BY l.titulo`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar exemplares' });
  }
});

// GET /api/exemplares/livro/:livroId — exemplares de um livro específico
router.get('/livro/:livroId', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM exemplares WHERE livro_id = ?',
      [req.params.livroId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar exemplares do livro' });
  }
});

// POST /api/exemplares — cadastra um novo exemplar
router.post('/', async (req, res) => {
  const { livro_id, codigo_patrimonio } = req.body;

  if (!livro_id) {
    return res.status(400).json({ erro: 'livro_id é obrigatório' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO exemplares (livro_id, codigo_patrimonio) VALUES (?, ?)',
      [livro_id, codigo_patrimonio || null]
    );
    res.status(201).json({ id: result.insertId, livro_id, codigo_patrimonio, status: 'disponivel' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao cadastrar exemplar' });
  }
});

// PUT /api/exemplares/:id — atualiza status/código de um exemplar
router.put('/:id', async (req, res) => {
  const { codigo_patrimonio, status } = req.body;

  try {
    const [result] = await pool.query(
      'UPDATE exemplares SET codigo_patrimonio = ?, status = ? WHERE id = ?',
      [codigo_patrimonio, status, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ erro: 'Exemplar não encontrado' });
    res.json({ mensagem: 'Exemplar atualizado com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao atualizar exemplar' });
  }
});

// DELETE /api/exemplares/:id — remove um exemplar
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM exemplares WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ erro: 'Exemplar não encontrado' });
    res.json({ mensagem: 'Exemplar removido com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao remover exemplar' });
  }
});

module.exports = router;
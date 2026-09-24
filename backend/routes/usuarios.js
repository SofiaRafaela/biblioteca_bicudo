const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/usuarios — lista todos
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM usuarios ORDER BY nome');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar usuários' });
  }
});

// GET /api/usuarios/ra/:ra — busca um usuário pelo RA
router.get('/ra/:ra', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE ra = ?', [req.params.ra]);
    if (rows.length === 0) return res.status(404).json({ erro: 'Usuário não encontrado para este RA' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar usuário' });
  }
});

// POST /api/usuarios — cadastra um novo usuário
router.post('/', async (req, res) => {
  const { ra, nome, contato } = req.body;

  if (!ra || !nome) {
    return res.status(400).json({ erro: 'RA e nome são obrigatórios' });
  }

  try {
    const [existentes] = await pool.query('SELECT id FROM usuarios WHERE ra = ?', [ra]);
    if (existentes.length > 0) {
      return res.status(409).json({ erro: 'Já existe um usuário cadastrado com esse RA' });
    }

    const [result] = await pool.query(
      'INSERT INTO usuarios (ra, nome, contato) VALUES (?, ?, ?)',
      [ra, nome, contato || null]
    );

    res.status(201).json({ id: result.insertId, ra, nome, contato: contato || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao cadastrar usuário' });
  }
});

module.exports = router;
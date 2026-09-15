const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/dashboard — retorna os 4 números dos cards
router.get('/', async (req, res) => {
  try {
    // Atualiza empréstimos vencidos para 'atrasado' antes de contar
    await pool.query(
      `UPDATE emprestimos
       SET status = 'atrasado'
       WHERE status = 'ativo' AND data_prevista_devolucao < CURDATE()`
    );

    const [[{ livros_cadastrados }]] = await pool.query(
      'SELECT COUNT(*) AS livros_cadastrados FROM livros'
    );
    const [[{ exemplares_disponiveis }]] = await pool.query(
      "SELECT COUNT(*) AS exemplares_disponiveis FROM exemplares WHERE status = 'disponivel'"
    );
    const [[{ emprestimos_ativos }]] = await pool.query(
      "SELECT COUNT(*) AS emprestimos_ativos FROM emprestimos WHERE status = 'ativo'"
    );
    const [[{ atrasados }]] = await pool.query(
      "SELECT COUNT(*) AS atrasados FROM emprestimos WHERE status = 'atrasado'"
    );

    res.json({ livros_cadastrados, exemplares_disponiveis, emprestimos_ativos, atrasados });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar dados do dashboard' });
  }
});

module.exports = router;
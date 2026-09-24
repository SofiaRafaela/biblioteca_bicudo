const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/emprestimos — lista todos os empréstimos (com dados do exemplar/livro)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT emp.*, l.titulo, l.autor, ex.codigo_patrimonio
       FROM emprestimos emp
       JOIN exemplares ex ON ex.id = emp.exemplar_id
       JOIN livros l ON l.id = ex.livro_id
       ORDER BY emp.data_emprestimo DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar empréstimos' });
  }
});

// POST /api/emprestimos — registra um novo empréstimo (usando usuário já cadastrado)
router.post('/', async (req, res) => {
  const {
    exemplar_id,
    usuario_id,
    data_emprestimo,
    data_prevista_devolucao,
    administrador_id
  } = req.body;

  if (!exemplar_id || !usuario_id || !data_emprestimo || !data_prevista_devolucao) {
    return res.status(400).json({
      erro: 'exemplar_id, usuario_id, data_emprestimo e data_prevista_devolucao são obrigatórios'
    });
  }

  try {
    const [exemplares] = await pool.query(
      'SELECT status FROM exemplares WHERE id = ?',
      [exemplar_id]
    );
    if (exemplares.length === 0) {
      return res.status(404).json({ erro: 'Exemplar não encontrado' });
    }
    if (exemplares[0].status !== 'disponivel') {
      return res.status(409).json({ erro: 'Exemplar não está disponível para empréstimo' });
    }

    const [usuarios] = await pool.query('SELECT nome FROM usuarios WHERE id = ?', [usuario_id]);
    if (usuarios.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    const [result] = await pool.query(
      `INSERT INTO emprestimos
        (exemplar_id, usuario_id, nome_solicitante, data_emprestimo, data_prevista_devolucao, administrador_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [exemplar_id, usuario_id, usuarios[0].nome, data_emprestimo, data_prevista_devolucao, administrador_id || null]
    );

    res.status(201).json({ id: result.insertId, mensagem: 'Empréstimo registrado com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao registrar empréstimo' });
  }
});

// PUT /api/emprestimos/:id/devolver — marca devolução
router.put('/:id/devolver', async (req, res) => {
  try {
    const [result] = await pool.query(
      `UPDATE emprestimos
       SET status = 'devolvido', data_devolucao_real = CURDATE()
       WHERE id = ? AND status != 'devolvido'`,
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: 'Empréstimo não encontrado ou já devolvido' });
    }
    // O trigger trg_emprestimo_atualiza já libera o exemplar
    res.json({ mensagem: 'Devolução registrada com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao registrar devolução' });
  }
});

// GET /api/emprestimos/atrasados — lista só os atrasados
router.get('/atrasados', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT emp.*, l.titulo, l.autor
       FROM emprestimos emp
       JOIN exemplares ex ON ex.id = emp.exemplar_id
       JOIN livros l ON l.id = ex.livro_id
       WHERE emp.status = 'ativo' AND emp.data_prevista_devolucao < CURDATE()`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar atrasados' });
  }
});

module.exports = router;
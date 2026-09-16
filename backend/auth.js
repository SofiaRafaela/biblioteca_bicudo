const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('./db');

// POST /api/auth/register — cadastra um novo administrador
router.post('/register', async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Nome, e-mail e senha são obrigatórios' });
  }
  if (senha.length < 6) {
    return res.status(400).json({ erro: 'A senha precisa ter pelo menos 6 caracteres' });
  }

  try {
    const [existentes] = await pool.query(
      'SELECT id FROM administradores WHERE email = ?',
      [email]
    );
    if (existentes.length > 0) {
      return res.status(409).json({ erro: 'Já existe um cadastro com esse e-mail' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const [result] = await pool.query(
      'INSERT INTO administradores (nome, email, senha_hash) VALUES (?, ?, ?)',
      [nome, email, senhaHash]
    );

    res.status(201).json({ id: result.insertId, nome, email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao cadastrar administrador' });
  }
});

// POST /api/auth/login — autentica um administrador
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'E-mail e senha são obrigatórios' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, nome, email, senha_hash FROM administradores WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos' });
    }

    const admin = rows[0];
    const senhaCorreta = await bcrypt.compare(senha, admin.senha_hash);

    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos' });
    }

    res.json({ id: admin.id, nome: admin.nome, email: admin.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao autenticar' });
  }
});

module.exports = router;
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/livros', require('./routes/livros'));
app.use('/api/exemplares', require('./routes/exemplares'));
app.use('/api/emprestimos', require('./routes/emprestimos'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/auth', require('./auth'));

// Rota de teste rápido
app.get('/', (req, res) => {
  res.send('API da Biblioteca Monsenhor Bicudo no ar 📚');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
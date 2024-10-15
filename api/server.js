const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();

// Ajout du middleware CORS
app.use(cors({
  origin: 'http://localhost:3000'
}));

app.use(express.json());

// Modifions le chemin du fichier DATA_FILE
const DATA_FILE = path.join(__dirname, 'data.json');

app.get('/api/events', async (req, res) => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Erreur lors de la lecture du fichier:', error);
    res.status(500).json({ error: 'Erreur lors de la lecture des événements' });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    const events = JSON.parse(data);
    events.push(req.body);
    await fs.writeFile(DATA_FILE, JSON.stringify(events, null, 2));
    res.status(201).json(req.body);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'ajout de l\'événement' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Serveur en écoute sur le port ${PORT}`);
});

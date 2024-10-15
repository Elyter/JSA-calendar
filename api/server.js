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
    let events = JSON.parse(data);
    const newEvent = req.body;

    // Vérification des chevauchements
    const conflictingEvents = events.filter(event => 
      event.resourceId === newEvent.resourceId &&
      ((new Date(event.start) < new Date(newEvent.end) && new Date(event.end) > new Date(newEvent.start)))
    );

    if (conflictingEvents.length > 0) {
      return res.status(400).json({ error: 'Un événement existe déjà sur ce terrain pour cette plage horaire' });
    }

    // Vérification pour resourceId 3
    if (newEvent.resourceId === '3') {
      const conflictingEvents = events.filter(event => 
        (event.resourceId === '1' || event.resourceId === '2') &&
        ((new Date(event.start) < new Date(newEvent.end) && new Date(event.end) > new Date(newEvent.start)))
      );

      if (conflictingEvents.length > 0) {
        return res.status(400).json({ error: 'Les terrains 2 et 3 sont déjà réservés pour cette plage de temps' });
      }

      // Modification de la couleur pour les événements "Indisponible"
      const unavailableEvent1 = { ...newEvent, id: Date.now().toString(), title: 'Indisponible', description: '', resourceId: '1', color: '#808080' };
      const unavailableEvent2 = { ...newEvent, id: (Date.now() + 1).toString(), title: 'Indisponible', description: '', resourceId: '2', color: '#808080' };
      events.push(unavailableEvent1, unavailableEvent2);
    }

    // Assurez-vous que newEvent a une couleur
    if (!newEvent.color) {
      newEvent.color = '#3174ad'; // Couleur par défaut si non spécifiée
    }

    events.push(newEvent);
    await fs.writeFile(DATA_FILE, JSON.stringify(events, null, 2));
    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'événement:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout de l\'événement' });
  }
});

app.put('/api/events/:id', async (req, res) => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    let events = JSON.parse(data);
    const eventId = req.params.id;
    const updatedEvent = req.body;

    const eventIndex = events.findIndex(event => event.id === eventId);
    if (eventIndex === -1) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }

    events[eventIndex] = { ...events[eventIndex], ...updatedEvent };

    await fs.writeFile(DATA_FILE, JSON.stringify(events, null, 2));
    res.json(events[eventIndex]);
  } catch (error) {
    console.error('Erreur lors de la modification de l\'événement:', error);
    res.status(500).json({ error: 'Erreur lors de la modification de l\'événement' });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    let events = JSON.parse(data);
    const eventId = req.params.id;

    const eventIndex = events.findIndex(event => event.id === eventId);
    if (eventIndex === -1) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }

    events.splice(eventIndex, 1);

    await fs.writeFile(DATA_FILE, JSON.stringify(events, null, 2));
    res.json({ message: 'Événement supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'événement:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'événement' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Serveur en écoute sur le port ${PORT}`);
});

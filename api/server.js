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

// Définition des ressources (terrains)
const resources = ['0', '1', '2', '3'];

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

    if (newEvent.title === 'Match') {
      const conflictingEvents = events.filter(event => 
        ((new Date(event.start) < new Date(newEvent.end) && new Date(event.end) > new Date(newEvent.start)))
      );

      if (conflictingEvents.length > 0) {
        return res.status(400).json({ error: 'Un événement existe déjà sur un des terrains pour cette plage horaire' });
      }

      const matchEvents = resources.map(resourceId => ({
        ...newEvent,
        id: Date.now().toString() + resourceId,
        resourceId: resourceId,
      }));

      events.push(...matchEvents);
    } else {
      if (newEvent.resourceId === '3') {
        const conflictingEvents = events.filter(event => 
          (event.resourceId === '1' || event.resourceId === '2') &&
          ((new Date(event.start) < new Date(newEvent.end) && new Date(event.end) > new Date(newEvent.start)))
        );
      
        if (conflictingEvents.length > 0) {
          return res.status(400).json({ error: 'Les terrains 2 et/ou 3 sont déjà réservés pour cette plage de temps' });
        }
      
        const unavailableEvent1 = { ...newEvent, id: Date.now().toString(), title: 'Indisponible', description: '', resourceId: '1', color: '#808080' };
        const unavailableEvent2 = { ...newEvent, id: (Date.now() + 1).toString(), title: 'Indisponible', description: '', resourceId: '2', color: '#808080' };
        events.push(unavailableEvent1, unavailableEvent2);
      }
      // Assurez-vous que newEvent a une couleur
      if (!newEvent.color) {
        newEvent.color = '#3174ad'; // Couleur par défaut si non spécifiée
      }
  
      events.push(newEvent);
    }

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

    const originalEvent = events[eventIndex];

    if (originalEvent.title === 'Match') {
      // Vérifier les chevauchements pour tous les terrains, en excluant les autres événements de match
      const conflictingEvents = events.filter(event => 
        event.title !== 'Match' &&
        ((new Date(event.start) < new Date(updatedEvent.end) && new Date(event.end) > new Date(updatedEvent.start)))
      );

      if (conflictingEvents.length > 0) {
        return res.status(400).json({ error: 'La modification chevauche des réservations existantes non-match' });
      }

      // Mettre à jour tous les événements du match
      events = events.map(event => {
        if (event.start === originalEvent.start && event.end === originalEvent.end && event.title === 'Match') {
          return { ...event, ...updatedEvent, id: event.id, resourceId: event.resourceId };
        }
        return event;
      });
    } else {
      if (updatedEvent.resourceId === '3') {
        const conflictingEvents = events.filter(event => 
          event.id !== eventId && // Exclure l'événement en cours de modification
          (event.resourceId === '1' || event.resourceId === '2') &&
          event.title !== 'Indisponible' && // Exclure les événements "Indisponible" associés
          ((new Date(event.start) < new Date(updatedEvent.end) && new Date(event.end) > new Date(updatedEvent.start)))
        );
      
        if (conflictingEvents.length > 0) {
          return res.status(400).json({ error: 'Les terrains 2 et/ou 3 sont déjà réservés pour cette plage de temps' });
        }

        // Mettre à jour les événements "Indisponible" associés
        events = events.map(event => {
          if (event.start === originalEvent.start && event.end === originalEvent.end && event.title === 'Indisponible' && (event.resourceId === '1' || event.resourceId === '2')) {
            return { ...event, start: updatedEvent.start, end: updatedEvent.end };
          }
          return event;
        });
      } else {
        // Vérification des conflits pour les autres terrains
        const conflictingEvents = events.filter(event => 
          event.id !== eventId &&
          event.resourceId === updatedEvent.resourceId &&
          ((new Date(event.start) < new Date(updatedEvent.end) && new Date(event.end) > new Date(updatedEvent.start)))
        );

        if (conflictingEvents.length > 0) {
          return res.status(400).json({ error: 'La modification chevauche des réservations existantes' });
        }
      }

      events[eventIndex] = { ...events[eventIndex], ...updatedEvent };
    }

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

    const eventToDelete = events.find(event => event.id === eventId);
    if (!eventToDelete) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }

    if (eventToDelete.title === 'Match') {
      // Supprimer tous les événements du match
      events = events.filter(event => 
        !(event.start === eventToDelete.start && 
          event.end === eventToDelete.end && 
          event.title === 'Match')
      );
    } else if (eventToDelete.resourceId === '3') {
      // Supprimer l'événement spécifié et les réservations "Indisponible" associées
      events = events.filter(event => 
        !(event.id === eventId || 
          (event.start === eventToDelete.start && 
           event.end === eventToDelete.end && 
           event.title === 'Indisponible' && 
           (event.resourceId === '1' || event.resourceId === '2')))
      );
    } else {
      // Supprimer uniquement l'événement spécifié
      events = events.filter(event => event.id !== eventId);
    }

    await fs.writeFile(DATA_FILE, JSON.stringify(events, null, 2));
    res.json({ message: 'Événement(s) supprimé(s) avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'événement:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'événement' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Serveur en écoute sur le port ${PORT}`);
});

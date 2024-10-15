import { useState, useMemo, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/fr';
import Modal from 'react-modal'; // Assurez-vous d'installer cette dépendance
import axios from 'axios'; // Assurez-vous d'installer axios

moment.locale('fr');
const localizer = momentLocalizer(moment);

const terrains = ['Terrain 1', 'Terrain 2', 'Terrain 3', 'Terrain Central'];

// Définissez les couleurs pour chaque collectif
const collectifColors = {
  'Collectif A': '#FF5733',
  'Collectif B': '#33FF57',
  'Collectif C': '#3357FF',
  // Ajoutez d'autres collectifs et leurs couleurs ici
};

const EventComponent = ({ event }) => (
  <div>
    <strong>{event.title}</strong>
    {event.description && <p>{event.description}</p>}
  </div>
);

export default function CalendarComponent({ isAdmin = false }) {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(moment().startOf('day'));
  const [currentMonth, setCurrentMonth] = useState(moment().startOf('month'));
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [newEvent, setNewEvent] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalCollectif, setModalCollectif] = useState('');
  const [modalStartTime, setModalStartTime] = useState('');
  const [modalEndTime, setModalEndTime] = useState('');
  const [modalDescription, setModalDescription] = useState('');

  const collectifs = ['Collectif A', 'Collectif B', 'Collectif C']; // Ajoutez vos collectifs ici

  useEffect(() => {
    console.log("Composant monté, appel de fetchEvents");
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    console.log("Début de fetchEvents");
    try {
      console.log("Envoi de la requête GET");
      const response = await axios.get('http://localhost:3001/api/events');
      console.log("Réponse reçue:", response.data);
      setEvents(response.data.map(event => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
        // Assurez-vous que la couleur est incluse ici
      })));
      console.log("Événements mis à jour dans l'état");
    } catch (error) {
      console.error('Erreur lors de la récupération des événements:', error);
    }
  };

  const handleSelect = ({ start, end, resourceId }) => {
    if (isAdmin) {
      setNewEvent({ start, end, resourceId });
      setModalIsOpen(true);
      // Ajoutez ces lignes pour définir les horaires dans le modal
      setModalStartTime(moment(start).format('HH:mm'));
      setModalEndTime(moment(end).format('HH:mm'));
    }
  };

  const handleSelectEvent = (event) => {
    if (isAdmin) {
      setSelectedEvent(event);
      setModalCollectif(event.title);
      setModalStartTime(moment(event.start).format('HH:mm'));
      setModalEndTime(moment(event.end).format('HH:mm'));
      setModalIsOpen(true);
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const collectif = modalCollectif;
    const startTime = moment(modalStartTime, 'HH:mm');
    const endTime = moment(modalEndTime, 'HH:mm');

    if (collectif) {
      const eventToUpdate = selectedEvent || newEvent;
      const updatedStart = moment(eventToUpdate.start).set({
        hour: startTime.get('hour'),
        minute: startTime.get('minute')
      });
      const updatedEnd = moment(eventToUpdate.end).set({
        hour: endTime.get('hour'),
        minute: endTime.get('minute')
      });

      const eventData = {
        id: eventToUpdate.id || Date.now().toString(),
        title: collectif,
        description: modalDescription, // Ajout de la description
        start: updatedStart.toISOString(),
        end: updatedEnd.toISOString(),
        resourceId: eventToUpdate.resourceId,
        color: collectifColors[collectif],
      };

      try {
        if (selectedEvent) {
          await axios.put(`http://localhost:3001/api/events/${selectedEvent.id}`, eventData);
        } else {
          await axios.post('http://localhost:3001/api/events', eventData);
        }
        await fetchEvents();
        setModalIsOpen(false);
        setErrorMessage('');
        resetModalFields();
      } catch (error) {
        console.error('Erreur lors de la modification/ajout de l\'événement:', error);
        if (error.response && error.response.status === 400) {
          setErrorMessage(error.response.data.error || 'Une erreur 400 est survenue. Veuillez vérifier vos données.');
        } else {
          setErrorMessage('Une erreur est survenue lors de la modification/ajout de l\'événement');
        }
      }
    }
  };

  const resetModalFields = () => {
    setSelectedEvent(null);
    setModalCollectif('');
    setModalStartTime('');
    setModalEndTime('');
    setModalDescription(''); // Réinitialisation de la description
  };

  const handleDeleteEvent = async () => {
    if (selectedEvent && window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      try {
        await axios.delete(`http://localhost:3001/api/events/${selectedEvent.id}`);
        await fetchEvents();
        setModalIsOpen(false);
        setSelectedEvent(null);
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'événement:', error);
        setErrorMessage('Une erreur est survenue lors de la suppression de l\'événement');
      }
    }
  };

  const resources = useMemo(() => 
    terrains.map((terrain, index) => ({
      id: index.toString(),
      title: terrain,
    })),
    []
  );

  const getWeekendsOfMonth = (month) => {
    const weekends = [];
    const startOfMonth = month.clone().startOf('month');
    const endOfMonth = month.clone().endOf('month');
    let currentDay = startOfMonth.clone();

    while (currentDay.isSameOrBefore(endOfMonth)) {
      if (currentDay.day() === 6) { // Samedi
        weekends.push({
          saturday: currentDay.clone(),
          sunday: currentDay.clone().add(1, 'day')
        });
      }
      currentDay.add(1, 'day');
    }
    return weekends;
  };

  const weekends = useMemo(() => getWeekendsOfMonth(currentMonth), [currentMonth]);

  const navigateMonth = (direction) => {
    setCurrentMonth(currentMonth.clone().add(direction, 'month'));
  };

  const selectDay = (day) => {
    setCurrentDate(day);
  };

  const WeekendSelector = () => (
    <div className="weekend-selector">
      <button className="month-nav" onClick={() => navigateMonth(-1)}>&lt;</button>
      <div className="weekends-container">
        <div className="weekends-scroll">
          {weekends.map((weekend, index) => (
            <div key={index} className="weekend-buttons">
              <button 
                onClick={() => selectDay(weekend.saturday)}
                className={currentDate.isSame(weekend.saturday, 'day') ? 'selected' : ''}
              >
                <span className="day-number">{weekend.saturday.format('DD')}</span>
                <span className="day-name">Sam</span>
              </button>
              <button 
                onClick={() => selectDay(weekend.sunday)}
                className={currentDate.isSame(weekend.sunday, 'day') ? 'selected' : ''}
              >
                <span className="day-number">{weekend.sunday.format('DD')}</span>
                <span className="day-name">Dim</span>
              </button>
            </div>
          ))}
        </div>
      </div>
      <button className="month-nav" onClick={() => navigateMonth(1)}>&gt;</button>
    </div>
  );

  return (
    <div>
      <h2 className="current-month">{currentMonth.format('MMMM YYYY')}</h2>
      <WeekendSelector />
      <div style={{ height: '500px' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          selectable={isAdmin}
          onSelectSlot={handleSelect}
          onSelectEvent={handleSelectEvent}
          views={['day']}
          formats={{
            dayFormat: 'dddd DD/MM',
          }}
          messages={{
            day: 'Jour',
          }}
          defaultView="day"
          resources={resources}
          resourceIdAccessor="id"
          resourceTitleAccessor="title"
          min={moment().hour(8).minute(0).toDate()}
          max={moment().hour(20).minute(0).toDate()}
          date={currentDate.toDate()}
          onNavigate={(newDate) => {
            setCurrentDate(moment(newDate));
          }}
          components={{
            event: EventComponent,
            toolbar: () => null // Ceci supprime la barre d'outils complète
          }}
          eventPropGetter={(event) => ({
            style: {
              backgroundColor: event.color,
              borderColor: event.color,
            },
          })}
        />
      </div>
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => {
          setModalIsOpen(false);
          setErrorMessage('');
        }}
        contentLabel="Nouvelle réservation"
        className="modal"
        overlayClassName="modal-overlay"
      >
        <h2 className="modal-title">{selectedEvent ? 'Modifier la réservation' : 'Nouvelle réservation'}</h2>
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        <form onSubmit={handleModalSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="collectif">Collectif :</label>
            <select
              id="collectif"
              name="collectif"
              value={modalCollectif}
              onChange={(e) => setModalCollectif(e.target.value)}
              required
            >
              <option value="">Sélectionnez un collectif</option>
              {Object.keys(collectifColors).map((collectif) => (
                <option key={collectif} value={collectif}>
                  {collectif}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="startTime">Heure de début :</label>
            <input
              type="time"
              id="startTime"
              name="startTime"
              value={modalStartTime}
              onChange={(e) => setModalStartTime(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="endTime">Heure de fin :</label>
            <input
              type="time"
              id="endTime"
              name="endTime"
              value={modalEndTime}
              onChange={(e) => setModalEndTime(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description (optionnelle) :</label>
            <textarea
              id="description"
              name="description"
              value={modalDescription}
              onChange={(e) => setModalDescription(e.target.value)}
              rows="3"
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {selectedEvent ? 'Modifier' : 'Ajouter'}
            </button>
            {selectedEvent && (
              <button type="button" onClick={handleDeleteEvent} className="btn btn-danger">
                Supprimer
              </button>
            )}
            <button type="button" onClick={() => {
              setModalIsOpen(false);
              resetModalFields();
              setErrorMessage('');
            }} className="btn btn-secondary">
              Annuler
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

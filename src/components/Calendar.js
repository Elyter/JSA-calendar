import { useState, useMemo, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/fr';
import Modal from 'react-modal'; // Assurez-vous d'installer cette dépendance
import axios from 'axios'; // Assurez-vous d'installer axios

moment.locale('fr');
const localizer = momentLocalizer(moment);

const terrains = ['Terrain 1', 'Terrain 2', 'Terrain 3', 'Terrain Central'];

export default function CalendarComponent({ isAdmin = false }) {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(moment().startOf('day'));
  const [currentMonth, setCurrentMonth] = useState(moment().startOf('month'));
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [newEvent, setNewEvent] = useState(null);

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
        end: new Date(event.end)
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
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const collectif = formData.get('collectif');
    const startTime = moment(formData.get('startTime'), 'HH:mm');
    const endTime = moment(formData.get('endTime'), 'HH:mm');

    if (collectif) {
      const updatedStart = moment(newEvent.start).set({
        hour: startTime.get('hour'),
        minute: startTime.get('minute')
      });
      const updatedEnd = moment(newEvent.start).set({
        hour: endTime.get('hour'),
        minute: endTime.get('minute')
      });

      const newEventData = {
        id: Date.now().toString(), // Génère un ID unique
        title: collectif,
        start: updatedStart.toISOString(),
        end: updatedEnd.toISOString(),
        resourceId: newEvent.resourceId,
      };

      try {
        await axios.post('http://localhost:3001/api/events', newEventData);
        await fetchEvents(); // Recharge les événements après l'ajout
        setModalIsOpen(false);
      } catch (error) {
        console.error('Erreur lors de l\'ajout de l\'événement:', error);
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
            toolbar: () => null // Ceci supprime la barre d'outils complète
          }}
        />
      </div>
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        contentLabel="Nouvelle réservation"
        className="modal"
        overlayClassName="modal-overlay"
      >
        <h2 className="modal-title">Nouvelle réservation</h2>
        <form onSubmit={handleModalSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="collectif">Collectif</label>
            <select name="collectif" id="collectif" required className="form-control">
              <option value="">Sélectionnez un collectif</option>
              {collectifs.map((collectif, index) => (
                <option key={index} value={collectif}>{collectif}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="startTime">Heure de début</label>
            <input
              name="startTime"
              id="startTime"
              type="time"
              defaultValue={newEvent ? moment(newEvent.start).format('HH:mm') : ''}
              required
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label htmlFor="endTime">Heure de fin</label>
            <input
              name="endTime"
              id="endTime"
              type="time"
              defaultValue={newEvent ? moment(newEvent.end).format('HH:mm') : ''}
              required
              className="form-control"
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">Ajouter</button>
            <button type="button" onClick={() => setModalIsOpen(false)} className="btn btn-secondary">Annuler</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

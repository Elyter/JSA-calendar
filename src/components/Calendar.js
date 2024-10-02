import { useState, useMemo, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/fr';

moment.locale('fr');
const localizer = momentLocalizer(moment);

const terrains = ['Terrain 1', 'Terrain 2', 'Terrain 3', 'Terrain Central'];

export default function CalendarComponent({ isAdmin = false }) {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(moment().startOf('day'));
  const [currentMonth, setCurrentMonth] = useState(moment().startOf('month'));

  const handleSelect = ({ start, end, resourceId }) => {
    if (isAdmin) {
      const title = window.prompt('Nouvelle réservation');
      if (title) {
        setEvents([
          ...events,
          {
            start,
            end,
            title,
            resourceId,
          },
        ]);
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
    </div>
  );
}

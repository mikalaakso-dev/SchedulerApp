import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const localizer = momentLocalizer(moment);

function AppointmentScheduler() {
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({ title: '', start: null, end: null });
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await fetch('http://localhost:3001/appointments');
      const data = await response.json();
      setEvents(data.map(apt => ({
        ...apt,
        start: new Date(apt.start),
        end: new Date(apt.end)
      })));
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const handleSelectSlot = ({ start, end }) => {
    setNewEvent({ ...newEvent, start, end });
  };

  const handleCreateAppointment = async () => {
    if (!newEvent.title || !newEvent.start || !newEvent.end) {
      setShowAlert(true);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });

      if (response.ok) {
        fetchAppointments();
        setNewEvent({ title: '', start: null, end: null });
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Appointment Scheduler</h1>
      <div className="mb-4">
        <Label htmlFor="appointmentTitle">Appointment Title</Label>
        <Input
          id="appointmentTitle"
          type="text"
          value={newEvent.title}
          onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
          placeholder="Enter appointment title"
        />
      </div>
      <Button onClick={handleCreateAppointment}>Create Appointment</Button>
      {showAlert && (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Please provide a title and select a time slot for the appointment.
          </AlertDescription>
        </Alert>
      )}
      <div className="mt-4" style={{ height: '500px' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          onSelectSlot={handleSelectSlot}
          selectable
        />
      </div>
    </div>
  );
}

export default AppointmentScheduler;
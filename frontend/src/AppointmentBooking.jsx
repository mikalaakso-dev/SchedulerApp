import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('YOUR_SUPABASE_PROJECT_URL', 'YOUR_SUPABASE_ANON_KEY');

function AppointmentBooking() {
  const [session, setSession] = useState(null);
  const [petInfo, setPetInfo] = useState({ name: '', species: '', breed: '', reasonForVisit: '' });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [vets, setVets] = useState([]);
  const [selectedVet, setSelectedVet] = useState(null);
  const [previousTreatments, setPreviousTreatments] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      checkAdminStatus(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      checkAdminStatus(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchVets();
      fetchPreviousTreatments();
    }
  }, [session]);

  const checkAdminStatus = async (session) => {
    if (session) {
      const { data, error } = await supabase
        .from('owners')
        .select('role')
        .eq('id', session.user.id)
        .single();
      if (error) console.error('Error checking admin status:', error);
      else setIsAdmin(data.role === 'admin');
    }
  };

  const fetchVets = async () => {
    const { data, error } = await supabase.from('veterinarians').select('*');
    if (error) console.error('Error fetching vets:', error);
    else setVets(data);
  };

  const fetchPreviousTreatments = async () => {
    const { data, error } = await supabase
      .from('treatments')
      .select(`
        *,
        appointments (
          appointment_datetime,
          pets (
            name
          )
        )
      `)
      .order('treatment_date', { ascending: false });
    if (error) console.error('Error fetching previous treatments:', error);
    else setPreviousTreatments(data);
  };

  const handlePetInfoSubmit = async (e) => {
    e.preventDefault();
    fetchAvailableSlots();
  };

  const fetchAvailableSlots = async () => {
    // Placeholder for fetching actual available slots from Supabase
    const mockSlots = [
      new Date('2024-09-26T09:00:00'),
      new Date('2024-09-26T10:00:00'),
      new Date('2024-09-26T11:00:00'),
    ];
    setAvailableSlots(mockSlots);
  };

  const handleSlotSelection = (slot) => {
    setSelectedSlot(slot);
  };

  const handleAppointmentSubmit = async () => {
    if (!selectedSlot || !selectedVet) return;

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        pet_id: 'PLACEHOLDER_PET_ID', // You'd need to create the pet first and get its ID
        vet_id: selectedVet,
        appointment_datetime: selectedSlot,
        reason_for_visit: petInfo.reasonForVisit
      });

    if (error) console.error('Error booking appointment:', error);
    else {
      console.log('Appointment booked successfully:', data);
      fetchPreviousTreatments();
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error logging out:', error);
  };

  if (!session) {
    return (
      <div>
        <h1>Login</h1>
        {/* Add login form here */}
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        {isAdmin ? 'Admin Dashboard' : 'Book an Appointment'}
      </h1>
      
      <button onClick={handleLogout}>Logout</button>

      {!isAdmin && (
        <form onSubmit={handlePetInfoSubmit}>
          <div className="mb-4">
            <label htmlFor="petName">Pet's Name</label>
            <input
              id="petName"
              type="text"
              value={petInfo.name}
              onChange={(e) => setPetInfo({...petInfo, name: e.target.value})}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="species">Species</label>
            <select
              id="species"
              value={petInfo.species}
              onChange={(e) => setPetInfo({...petInfo, species: e.target.value})}
              required
            >
              <option value="">Select species</option>
              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="breed">Breed</label>
            <input
              id="breed"
              type="text"
              value={petInfo.breed}
              onChange={(e) => setPetInfo({...petInfo, breed: e.target.value})}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="reasonForVisit">Reason for Visit</label>
            <textarea
              id="reasonForVisit"
              value={petInfo.reasonForVisit}
              onChange={(e) => setPetInfo({...petInfo, reasonForVisit: e.target.value})}
              rows={3}
              required
            />
          </div>
          <button type="submit">Find Available Slots</button>
        </form>
      )}

      {availableSlots.length > 0 && !isAdmin && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-2">Available Slots</h2>
          {availableSlots.map((slot, index) => (
            <button
              key={index}
              onClick={() => handleSlotSelection(slot)}
              className={`mr-2 mb-2 ${selectedSlot === slot ? 'bg-blue-500' : 'bg-gray-200'}`}
            >
              {slot.toLocaleString()}
            </button>
          ))}
        </div>
      )}

      {selectedSlot && !isAdmin && (
        <div className="mt-4">
          <label htmlFor="vetSelect">Select Veterinarian</label>
          <select
            id="vetSelect"
            value={selectedVet}
            onChange={(e) => setSelectedVet(e.target.value)}
            required
          >
            <option value="">Select a vet</option>
            {vets.map((vet) => (
              <option key={vet.id} value={vet.id}>{vet.name}</option>
            ))}
          </select>
        </div>
      )}

      {selectedSlot && selectedVet && !isAdmin && (
        <button onClick={handleAppointmentSubmit} className="mt-4">
          Book Appointment
        </button>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Previous Treatments</h2>
        {previousTreatments.map((treatment) => (
          <div key={treatment.id} className="mb-4 p-4 border rounded">
            <p><strong>Date:</strong> {new Date(treatment.treatment_date).toLocaleString()}</p>
            <p><strong>Pet:</strong> {treatment.appointments.pets.name}</p>
            <p><strong>Description:</strong> {treatment.description}</p>
            <p><strong>Notes:</strong> {treatment.notes}</p>
          </div>
        ))}
      </div>

      {isAdmin && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-2">Admin Functions</h2>
          {/* Add admin-specific functions here */}
        </div>
      )}
    </div>
  );
}

export default AppointmentBooking;
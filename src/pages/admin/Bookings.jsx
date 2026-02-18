import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, User, Phone, Mail, Edit, Trash2, Search, Filter, X, Loader2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { format, parseISO, isFuture, isPast, isToday, addMinutes, startOfDay, isSameDay, parse, isBefore, areIntervalsOverlapping, getDay } from 'date-fns';
import { it } from 'date-fns/locale';
import ManualBookingModal from '../../components/ManualBookingModal';

const BookingsList = () => {
    const [bookings, setBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, upcoming, past, today
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState({
        user_name: '',
        user_surname: '',
        user_phone: '',
        user_email: '',
        start_time: '',
        end_time: ''
    });
    const [saving, setSaving] = useState(false);

    // New State for Advanced Editing/Creation
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showManualModal, setShowManualModal] = useState(false);
    const [activeManualEvent, setActiveManualEvent] = useState(null);

    const [showEventPicker, setShowEventPicker] = useState(false);

    useEffect(() => {
        fetchBookings();
        fetchEvents();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [bookings, searchTerm, filterStatus]);

    const handleNewBookingClick = () => {
        if (events.length === 0) {
            alert("Crea prima un evento nelle impostazioni!");
            return;
        }

        if (events.length === 1) {
            setActiveManualEvent(events[0]);
            setShowManualModal(true);
        } else {
            setShowEventPicker(true);
        }
    };

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select('*, events(title, slug, duration_minutes, location)')
                .order('start_time', { ascending: true });

            if (error) throw error;
            setBookings(data || []);
        } catch (err) {
            console.error('Error fetching bookings:', err);
        } finally {
            setLoading(false);
        }
    };



    const fetchEvents = async () => {
        const { data } = await supabase.from('events').select('*, availabilities(*)');
        if (data) setEvents(data);
    };

    const availableSlots = useMemo(() => {
        if (!selectedDate || !selectedEventId || !events) return [];
        const event = events.find(e => e.id === selectedEventId);
        if (!event || !event.availabilities) return [];

        const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
        const dayName = dayNames[getDay(selectedDate)];

        const availability = event.availabilities;
        const rules = availability.rules[dayName] || [];
        const slots = [];
        const duration = event.duration_minutes;

        // Filter bookings for this day
        const dayBookings = bookings.filter(b => isSameDay(parseISO(b.start_time), selectedDate) && b.id !== selectedBooking?.id);

        rules.forEach(rule => {
            let current = parse(rule.start, 'HH:mm', selectedDate);
            const end = parse(rule.end, 'HH:mm', selectedDate);
            while (isBefore(addMinutes(current, duration), end) || isSameDay(addMinutes(current, duration), end)) {
                const slotEnd = addMinutes(current, duration);
                const isOverlapping = dayBookings.some(b => {
                    const bStart = parseISO(b.start_time);
                    const bEnd = parseISO(b.end_time);
                    return areIntervalsOverlapping(
                        { start: current, end: slotEnd },
                        { start: bStart, end: bEnd }
                    );
                });

                if (!isOverlapping) {
                    slots.push(format(current, 'HH:mm'));
                }
                current = addMinutes(current, duration);
            }
        });
        return slots;
    }, [selectedDate, selectedEventId, events, bookings, selectedBooking]);
    const applyFilters = () => {
        let filtered = [...bookings];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(b =>
                b.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                b.user_surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                b.user_phone.includes(searchTerm) ||
                b.events?.title.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // 1. Apply Status filtering
        if (filterStatus === 'upcoming') {
            filtered = filtered.filter(b => isFuture(parseISO(b.start_time)));
        } else if (filterStatus === 'past') {
            filtered = filtered.filter(b => isPast(parseISO(b.start_time)) && !isToday(parseISO(b.start_time)));
        } else if (filterStatus === 'today') {
            filtered = filtered.filter(b => isToday(parseISO(b.start_time)));
        }

        // 2. Explicit sorting: "Closest to Furthest"
        filtered.sort((a, b) => {
            const dateA = parseISO(a.start_time);
            const dateB = parseISO(b.start_time);
            const now = new Date();

            const isAFuture = dateA >= now;
            const isBFuture = dateB >= now;

            // Priority 1: Future bookings come before past bookings
            if (isAFuture && !isBFuture) return -1;
            if (!isAFuture && isBFuture) return 1;

            if (isAFuture && isBFuture) {
                // Priority 2: Among future bookings, soonest first (ascending)
                return dateA - dateB;
            } else {
                // Priority 3: Among past bookings, most recent first (descending)
                return dateB - dateA;
            }
        });

        setFilteredBookings(filtered);
    };

    const openEditModal = (booking) => {
        setSelectedBooking(booking);
        setIsCreating(false);
        setSelectedEventId(booking.events?.id || booking.event_id);
        setSelectedDate(parseISO(booking.start_time));
        setEditFormData({
            user_name: booking.user_name,
            user_surname: booking.user_surname,
            user_phone: booking.user_phone,
            user_email: booking.user_email || '',
            start_time: booking.start_time,
            end_time: booking.end_time
        });
        setEditingId(booking.id);
        setShowEditModal(false);
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (isCreating) {
                // Create New Booking
                const event = events.find(e => e.id === selectedEventId);
                const startTime = editFormData.start_time; // Already ISO from slot click
                const endTime = addMinutes(parseISO(startTime), event.duration_minutes).toISOString();

                const { error } = await supabase.from('bookings').insert([{
                    event_id: selectedEventId,
                    user_name: editFormData.user_name,
                    user_surname: editFormData.user_surname,
                    user_phone: editFormData.user_phone,
                    user_email: editFormData.user_email,
                    start_time: startTime,
                    end_time: endTime
                }]);
                if (error) throw error;
            } else {
                // Update Existing Booking
                const event = events.find(e => e.id === selectedEventId);
                // If start time changed via slot pick, recalc end time
                const startTime = editFormData.start_time;
                const endTime = addMinutes(parseISO(startTime), event.duration_minutes).toISOString();

                const { error } = await supabase
                    .from('bookings')
                    .update({
                        ...editFormData,
                        event_id: selectedEventId,
                        start_time: startTime,
                        end_time: endTime
                    })
                    .eq('id', selectedBooking.id);
                if (error) throw error;
            }

            setEditingId(null);
            setShowEditModal(false);
            fetchBookings();
        } catch (err) {
            alert('Errore durante il salvataggio: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Sei sicuro di voler eliminare questa prenotazione?')) return;
        try {
            const { error } = await supabase.from('bookings').delete().eq('id', id);
            if (error) throw error;
            fetchBookings();
        } catch (err) {
            alert('Errore durante l\'eliminazione: ' + err.message);
        }
    };

    const getStatusBadge = (startTime) => {
        const date = parseISO(startTime);
        if (isToday(date)) return <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full uppercase">Oggi</span>;
        if (isFuture(date)) return <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full uppercase">Futuro</span>;
        return <span className="px-3 py-1 bg-gray-500/20 text-gray-400 text-xs font-bold rounded-full uppercase">Passato</span>;
    };

    return (
        <div className="animate-fade-in">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl tracking-tight font-bold text-primary">Prenotazioni</h1>
                    <p className="text-text-muted">Gestisci tutti gli appuntamenti</p>
                </div>
                <button
                    onClick={handleNewBookingClick}
                    className="btn btn-primary flex items-center gap-2 group hover:scale-105 active:scale-95 transition-all"
                >
                    <Calendar size={20} className="group-hover:rotate-12 transition-transform" />
                    Nuova Prenotazione
                </button>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={18} />
                        <input
                            type="text"
                            placeholder="Cerca per nome, telefono..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input pl-10 pr-4 py-2 w-64"
                        />
                    </div>
                </div>
            </header>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
                {[
                    { key: 'all', label: 'Tutte' },
                    { key: 'today', label: 'Oggi' },
                    { key: 'upcoming', label: 'Prossime' },
                    { key: 'past', label: 'Passate' }
                ].map(filter => (
                    <button
                        key={filter.key}
                        onClick={() => setFilterStatus(filter.key)}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${filterStatus === filter.key
                            ? 'bg-primary text-white shadow-lg'
                            : 'bg-glass-bg text-text-muted hover:bg-glass-bg/80'
                            }`}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            {/* Bookings List */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="animate-spin text-primary" size={48} />
                </div>
            ) : filteredBookings.length === 0 ? (
                <div className="card py-16 text-center">
                    <Calendar className="mx-auto mb-4 text-text-muted" size={64} />
                    <h2 className="text-xl font-bold mb-2">Nessuna prenotazione trovata</h2>
                    <p className="text-text-muted">Prova a modificare i filtri di ricerca</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredBookings.map((booking) => (
                        <motion.div
                            key={booking.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="card hover:border-primary/30 transition-all cursor-pointer"
                        >
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black text-lg">
                                            {booking.user_name[0]}{booking.user_surname[0]}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold">{booking.user_name} {booking.user_surname}</h3>
                                            <p className="text-sm text-text-muted">{booking.events?.title || 'Evento'}</p>
                                        </div>
                                        {getStatusBadge(booking.start_time)}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                        <div className="flex items-center gap-2 text-text-muted">
                                            <Calendar size={16} className="text-primary" />
                                            <span className="font-semibold">{format(parseISO(booking.start_time), 'EEEE d MMMM yyyy', { locale: it })}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-text-muted">
                                            <Clock size={16} className="text-primary" />
                                            <span className="font-semibold">{format(parseISO(booking.start_time), 'HH:mm')} - {format(parseISO(booking.end_time), 'HH:mm')}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-text-muted">
                                            <Phone size={16} className="text-primary" />
                                            <span className="font-semibold">{booking.user_phone}</span>
                                        </div>
                                    </div>

                                    {booking.user_email && (
                                        <div className="flex items-center gap-2 text-sm text-text-muted mt-2">
                                            <Mail size={16} className="text-primary" />
                                            <span className="font-semibold">{booking.user_email}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex md:flex-col gap-2">
                                    <button
                                        onClick={() => openEditModal(booking)}
                                        className="btn btn-outline flex-1 md:flex-none gap-2 text-xs py-2"
                                    >
                                        <Edit size={14} /> Modifica
                                    </button>
                                    <button
                                        onClick={() => handleDelete(booking.id)}
                                        className="btn btn-outline flex-1 md:flex-none gap-2 text-xs py-2 text-error hover:bg-error/10"
                                    >
                                        <Trash2 size={14} /> Elimina
                                    </button>
                                </div>
                            </div>

                            {/* Inline Edit Form */}
                            <AnimatePresence>
                                {editingId === booking.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden bg-bg-card border-t border-primary/20 mt-4 pt-6"
                                    >
                                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-primary/10">
                                            <h3 className="font-bold text-lg text-primary">Modifica Dettagli</h3>
                                            <button type="button" onClick={() => setEditingId(null)} className="text-text-muted hover:text-error transition-colors">
                                                <X size={18} />
                                            </button>
                                        </div>
                                        <form onSubmit={handleSaveEdit} className="space-y-6">
                                            {/* 1. Event & Date */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="label">Data</label>
                                                    <input
                                                        type="date"
                                                        className="input w-full"
                                                        value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                                                        onChange={(e) => setSelectedDate(parseISO(e.target.value))}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="label">Nuovo Orario</label>
                                                    <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                                                        {availableSlots.map(slot => {
                                                            const isSelected = editFormData.start_time && format(parseISO(editFormData.start_time), 'HH:mm') === slot;
                                                            return (
                                                                <button
                                                                    key={slot}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const slotDate = parse(slot, 'HH:mm', selectedDate);
                                                                        setEditFormData({ ...editFormData, start_time: slotDate.toISOString() });
                                                                    }}
                                                                    className={`p-1 text-xs rounded border ${isSelected ? 'bg-primary text-white border-primary' : 'bg-white border-border'}`}
                                                                >
                                                                    {slot}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 2. Details */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <input type="text" className="input" placeholder="Nome" value={editFormData.user_name} onChange={e => setEditFormData({ ...editFormData, user_name: e.target.value })} />
                                                <input type="text" className="input" placeholder="Cognome" value={editFormData.user_surname} onChange={e => setEditFormData({ ...editFormData, user_surname: e.target.value })} />
                                                <input type="tel" className="input" placeholder="Tel" value={editFormData.user_phone} onChange={e => setEditFormData({ ...editFormData, user_phone: e.target.value })} />
                                                <input type="email" className="input" placeholder="Email" value={editFormData.user_email} onChange={e => setEditFormData({ ...editFormData, user_email: e.target.value })} />
                                            </div>

                                            <div className="flex gap-2 justify-end">
                                                <button type="button" onClick={() => setEditingId(null)} className="btn btn-outline py-2 px-4 text-xs">Annulla</button>
                                                <button type="submit" disabled={saving} className="btn btn-primary py-2 px-6 text-xs">{saving ? <Loader2 className="animate-spin" /> : 'Salva'}</button>
                                            </div>
                                        </form>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Edit/Create Smart Modal */}
            <AnimatePresence>
                {showEditModal && (
                    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowEditModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="card relative z-10 w-full max-w-4xl bg-bg-card border-primary/20 max-h-[90vh] overflow-y-auto custom-scrollbar"
                        >
                            <div className="flex justify-between items-center mb-6 sticky top-0 bg-bg-card z-10 py-2 border-b border-border">
                                <h2 className="text-2xl font-bold text-primary">{isCreating ? 'Nuova Prenotazione' : 'Modifica Prenotazione'}</h2>
                                <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSaveEdit} className="space-y-8 pb-8">
                                {/* 1. Event & Date Selection */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="label">Evento</label>
                                        <select
                                            className="input w-full"
                                            value={selectedEventId || ''}
                                            onChange={(e) => setSelectedEventId(e.target.value)}
                                            disabled={!isCreating} // Lock event on edit? Or allow change. Allow change is fine but slots update.
                                        >
                                            {events.map(ev => (
                                                <option key={ev.id} value={ev.id}>{ev.title} ({ev.duration_minutes} min)</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Data</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                                            <input
                                                type="date"
                                                className="input pl-10 w-full"
                                                value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                                                onChange={(e) => setSelectedDate(parseISO(e.target.value))}
                                                min={new Date().toISOString().split('T')[0]} // Optional: Prevent past dates?
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Slot Selection */}
                                <div>
                                    <label className="label mb-3 block">Orari Disponibili <span className="text-xs font-normal text-text-muted ml-2">(Verde = Disponibile)</span></label>
                                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-40 overflow-y-auto p-2 bg-bg-input rounded-xl border border-border">
                                        {availableSlots.length > 0 ? (
                                            availableSlots.map(slot => {
                                                const slotDate = parse(slot, 'HH:mm', selectedDate); // Construct date for value
                                                const isSelected = editFormData.start_time && isSameDay(parseISO(editFormData.start_time), selectedDate) && format(parseISO(editFormData.start_time), 'HH:mm') === slot;
                                                return (
                                                    <button
                                                        key={slot}
                                                        type="button"
                                                        onClick={() => setEditFormData({ ...editFormData, start_time: slotDate.toISOString() })}
                                                        className={`py-2 px-1 rounded-lg text-xs font-bold transition-all border ${isSelected
                                                            ? 'bg-primary text-white border-primary shadow-lg scale-105'
                                                            : 'bg-white text-text-main border-border hover:border-primary/50'}`}
                                                    >
                                                        {slot}
                                                    </button>
                                                )
                                            })
                                        ) : (
                                            <div className="col-span-full text-center py-8 text-text-muted text-xs uppercase tracking-widest">Nessuna disponibilità</div>
                                        )}
                                    </div>
                                    {editFormData.start_time && (
                                        <p className="text-xs text-primary font-bold mt-2 text-right">
                                            📅 Selezionato: {format(parseISO(editFormData.start_time), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
                                        </p>
                                    )}
                                </div>

                                {/* 3. Customer Details */}
                                <div className="bg-bg-input p-6 rounded-xl border border-border">
                                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                        <User size={18} className="text-primary" />
                                        Dati Cliente
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="label">Nome</label>
                                            <input
                                                type="text"
                                                className="input"
                                                required
                                                value={editFormData.user_name}
                                                onChange={(e) => setEditFormData({ ...editFormData, user_name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Cognome</label>
                                            <input
                                                type="text"
                                                className="input"
                                                required
                                                value={editFormData.user_surname}
                                                onChange={(e) => setEditFormData({ ...editFormData, user_surname: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Telefono</label>
                                            <input
                                                type="tel"
                                                className="input"
                                                required
                                                value={editFormData.user_phone}
                                                onChange={(e) => setEditFormData({ ...editFormData, user_phone: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Email</label>
                                            <input
                                                type="email"
                                                className="input"
                                                value={editFormData.user_email}
                                                onChange={(e) => setEditFormData({ ...editFormData, user_email: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-border">
                                    <button type="submit" disabled={saving || !editFormData.start_time} className="btn btn-primary flex-1 py-4 font-bold text-lg">
                                        {saving ? <Loader2 className="animate-spin" size={24} /> : (isCreating ? 'Crea Prenotazione' : 'Salva Modifiche')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Event Picker Modal (when multiple events exist) */}
            <AnimatePresence>
                {showEventPicker && (
                    <div className="fixed inset-0 flex items-center justify-center p-4 z-[100]">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowEventPicker(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="card relative z-[101] w-full max-w-md bg-bg-card border-primary/20 p-6"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-primary">Cosa desidera prenotare?</h2>
                                <button onClick={() => setShowEventPicker(false)} className="p-2 hover:bg-white/5 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex flex-col gap-3">
                                {events.map(ev => (
                                    <button
                                        key={ev.id}
                                        onClick={() => {
                                            setActiveManualEvent(ev);
                                            setShowEventPicker(false);
                                            setShowManualModal(true);
                                        }}
                                        className="flex items-center justify-between p-4 rounded-xl border border-glass-border bg-glass-bg hover:border-primary/50 hover:bg-primary/5 transition-all group"
                                    >
                                        <div className="text-left">
                                            <p className="font-bold text-text-main group-hover:text-primary transition-colors">{ev.title}</p>
                                            <p className="text-xs text-text-muted">{ev.duration_minutes} minuti</p>
                                        </div>
                                        <Clock size={18} className="text-text-muted group-hover:text-primary transition-colors" />
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Manual Booking Modal Implementation */}
            {activeManualEvent && (
                <ManualBookingModal
                    isOpen={showManualModal}
                    onClose={() => {
                        setShowManualModal(false);
                        fetchBookings(); // Refresh list after booking
                    }}
                    event={activeManualEvent}
                />
            )}
        </div>
    );
};

export default BookingsList;

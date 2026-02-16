import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, Mail, Edit, Trash2, Search, Filter, X, Loader2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { format, parseISO, isFuture, isPast, isToday } from 'date-fns';
import { it } from 'date-fns/locale';

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

    useEffect(() => {
        fetchBookings();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [bookings, searchTerm, filterStatus]);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select('*, events(title, slug, duration_minutes, location)')
                .order('start_time', { ascending: false });

            if (error) throw error;
            setBookings(data || []);
        } catch (err) {
            console.error('Error fetching bookings:', err);
        } finally {
            setLoading(false);
        }
    };

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

        // Status filter
        if (filterStatus === 'upcoming') {
            filtered = filtered.filter(b => isFuture(parseISO(b.start_time)));
        } else if (filterStatus === 'past') {
            filtered = filtered.filter(b => isPast(parseISO(b.start_time)) && !isToday(parseISO(b.start_time)));
        } else if (filterStatus === 'today') {
            filtered = filtered.filter(b => isToday(parseISO(b.start_time)));
        }

        setFilteredBookings(filtered);
    };

    const openEditModal = (booking) => {
        setSelectedBooking(booking);
        setEditFormData({
            user_name: booking.user_name,
            user_surname: booking.user_surname,
            user_phone: booking.user_phone,
            user_email: booking.user_email || '',
            start_time: booking.start_time,
            end_time: booking.end_time
        });
        setShowEditModal(true);
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { error } = await supabase
                .from('bookings')
                .update(editFormData)
                .eq('id', selectedBooking.id);

            if (error) throw error;
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
                    <h1 className="text-3xl tracking-tight font-bold">Prenotazioni</h1>
                    <p className="text-text-muted">Gestisci tutte le prenotazioni ricevute</p>
                </div>
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
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            <AnimatePresence>
                {showEditModal && (
                    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 100 }}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowEditModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="card relative z-10 w-full max-w-2xl bg-bg-card border-primary/20"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold">Modifica Prenotazione</h2>
                                <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-white/5 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSaveEdit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
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
                                    <label className="label">Email (Opzionale)</label>
                                    <input
                                        type="email"
                                        className="input"
                                        value={editFormData.user_email}
                                        onChange={(e) => setEditFormData({ ...editFormData, user_email: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Inizio</label>
                                        <input
                                            type="datetime-local"
                                            className="input"
                                            required
                                            value={editFormData.start_time ? format(parseISO(editFormData.start_time), "yyyy-MM-dd'T'HH:mm") : ''}
                                            onChange={(e) => setEditFormData({ ...editFormData, start_time: new Date(e.target.value).toISOString() })}
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Fine</label>
                                        <input
                                            type="datetime-local"
                                            className="input"
                                            required
                                            value={editFormData.end_time ? format(parseISO(editFormData.end_time), "yyyy-MM-dd'T'HH:mm") : ''}
                                            onChange={(e) => setEditFormData({ ...editFormData, end_time: new Date(e.target.value).toISOString() })}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button type="submit" disabled={saving} className="btn btn-primary flex-1 py-3 font-bold">
                                        {saving ? <Loader2 className="animate-spin" size={20} /> : 'Salva Modifiche'}
                                    </button>
                                    <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-outline px-6">
                                        Annulla
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BookingsList;

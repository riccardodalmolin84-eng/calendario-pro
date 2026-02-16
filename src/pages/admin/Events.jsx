import React, { useState, useEffect } from 'react';
import { Plus, Search, MoreVertical, Link as LinkIcon, Edit, Trash2, Calendar, Clock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';

const EventsList = () => {
    const [events, setEvents] = useState([]);
    const [availabilities, setAvailabilities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        duration_minutes: 30,
        slug: '',
        availability_id: '',
        event_type: 'recurring'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);

        // Fetch Events
        const { data: eventsData } = await supabase
            .from('events')
            .select('*, availabilities(title)');

        // Fetch Availabilities for the dropdown
        const { data: availData } = await supabase
            .from('availabilities')
            .select('id, title');

        if (eventsData) setEvents(eventsData);
        if (availData) {
            setAvailabilities(availData);
            if (availData.length > 0) {
                setFormData(prev => ({ ...prev, availability_id: availData[0].id }));
            }
        }

        setLoading(false);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSaving(true);

        const { error } = await supabase
            .from('events')
            .insert([formData]);

        if (!error) {
            setShowCreateModal(false);
            setFormData({
                title: '',
                description: '',
                duration_minutes: 30,
                slug: '',
                availability_id: availabilities[0]?.id || '',
                event_type: 'recurring'
            });
            fetchData();
        } else {
            alert('Errore: ' + error.message);
        }
        setSaving(false);
    };

    return (
        <div className="animate-fade-in">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl">Eventi</h1>
                    <p className="text-text-muted">Gestisci i tuoi tipi di appuntamento e i link di prenotazione pubblica.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn btn-primary gap-2"
                >
                    <Plus size={20} /> Crea Evento
                </button>
            </header>

            <div className="card mb-6 flex items-center gap-3 py-2 px-4">
                <Search size={18} className="text-text-muted" />
                <input
                    type="text"
                    placeholder="Cerca eventi..."
                    className="bg-transparent border-none outline-none flex-1 text-sm text-text-main"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="card h-48 animate-pulse bg-glass-bg line-clamp-1"></div>)
                ) : events.length === 0 ? (
                    <div className="col-span-full card py-12 text-center flex flex-col items-center gap-4">
                        <div className="bg-glass-bg p-4 rounded-full">
                            <Calendar size={48} className="text-text-muted" />
                        </div>
                        <div>
                            <h2 className="text-xl">Nessun evento creato</h2>
                            <p className="text-text-muted">Crea il tuo primo evento per iniziare a ricevere prenotazioni.</p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn btn-primary"
                        >
                            Inizia Ora
                        </button>
                    </div>
                ) : (
                    events.map((event) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            key={event.id}
                            className="card flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${event.event_type === 'recurring' ? 'bg-primary/20 text-primary' : 'bg-success/20 text-success'
                                        }`}>
                                        {event.event_type}
                                    </span>
                                    <button className="text-text-muted hover:text-text-main">
                                        <MoreVertical size={18} />
                                    </button>
                                </div>
                                <h3 className="text-lg mb-1">{event.title}</h3>
                                <p className="text-sm text-text-muted mb-4 line-clamp-2">{event.description}</p>

                                <div className="flex flex-col gap-2 text-xs text-text-muted mb-4">
                                    <div className="flex items-center gap-2">
                                        <Clock size={14} /> {event.duration_minutes} min
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <LinkIcon size={14} /> /book/{event.slug}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} /> {event.availabilities?.title || 'Nessuna disponibilità'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 border-t border-glass-border pt-4 mt-2">
                                <button className="btn btn-outline flex-1 text-xs gap-1">
                                    <Edit size={14} /> Modifica
                                </button>
                                <button
                                    onClick={() => {
                                        const url = `${window.location.origin}/book/${event.slug}`;
                                        navigator.clipboard.writeText(url);
                                        alert('Link copiato negli appunti!');
                                    }}
                                    className="btn btn-primary flex-1 text-xs gap-1"
                                >
                                    <LinkIcon size={14} /> Copia Link
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCreateModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="card w-full max-w-lg relative z-10"
                        >
                            <h2 className="text-2xl mb-4">Crea Nuovo Evento</h2>
                            <form className="flex flex-col gap-4" onSubmit={handleCreate}>
                                <div>
                                    <label className="label">Titolo</label>
                                    <input
                                        type="text"
                                        className="input"
                                        required
                                        placeholder="es. Riunione 15 min"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Disponibilità</label>
                                        <select
                                            className="input"
                                            required
                                            value={formData.availability_id}
                                            onChange={(e) => setFormData({ ...formData, availability_id: e.target.value })}
                                        >
                                            {availabilities.map(a => (
                                                <option key={a.id} value={a.id}>{a.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Durata (min)</label>
                                        <input
                                            type="number"
                                            className="input"
                                            required
                                            value={formData.duration_minutes}
                                            onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="label">Slug URL</label>
                                    <input
                                        type="text"
                                        className="input"
                                        required
                                        placeholder="riunione-15"
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                    />
                                </div>
                                <div>
                                    <label className="label">Descrizione</label>
                                    <textarea
                                        className="input"
                                        rows="3"
                                        placeholder="Di cosa tratta questo evento?"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    ></textarea>
                                </div>
                                <div className="flex justify-end gap-3 mt-4">
                                    <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-outline" disabled={saving}>Annulla</button>
                                    <button type="submit" className="btn btn-primary" disabled={saving}>
                                        {saving ? <Loader2 className="animate-spin" size={20} /> : 'Crea Evento'}
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

export default EventsList;

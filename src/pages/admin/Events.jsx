import React, { useState, useEffect } from 'react';
import { Plus, Search, MoreVertical, Link as LinkIcon, Edit, Trash2, Calendar, Clock, Loader2, ExternalLink, MapPin, ChevronLeft, ChevronRight, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfMonth, endOfMonth, getDay, addDays, isBefore, startOfToday, startOfDay } from 'date-fns';
import { it } from 'date-fns/locale';
import ManualBookingModal from '../../components/ManualBookingModal';

const WeekPicker = ({ selectedDate, onChange }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const firstDayOfMonth = startOfMonth(currentMonth);
    const lastDayOfMonth = endOfMonth(currentMonth);
    const days = eachDayOfInterval({
        start: startOfWeek(firstDayOfMonth, { weekStartsOn: 1 }),
        end: endOfWeek(lastDayOfMonth, { weekStartsOn: 1 })
    });

    const weekStart = selectedDate ? startOfDay(selectedDate) : null;
    const weekEnd = selectedDate ? addDays(weekStart, 6) : null;

    return (
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            {/* Header: Month/Year and Navigation */}
            <div className="bg-white/5 p-4 border-b border-white/5 flex justify-between items-center">
                <span className="text-sm font-bold text-text-main capitalize">
                    {format(currentMonth, 'MMMM yyyy', { locale: it })}
                </span>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className="p-1.5 hover:bg-white/10 rounded-lg border border-white/5 transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className="p-1.5 hover:bg-white/10 rounded-lg border border-white/5 transition-colors"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Calendar Body */}
            <div className="p-4 bg-black/40">
                {/* Day Names Header */}
                <div className="grid grid-cols-7 mb-4">
                    {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((d) => (
                        <div key={d} className="text-[10px] text-center font-bold text-text-muted/60 uppercase tracking-tighter">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-px bg-white/5 border border-white/5 rounded-xl overflow-hidden shadow-inner">
                    {days.map((day, i) => {
                        const isInRollingWeek = weekStart && weekEnd && day >= weekStart && day <= weekEnd;
                        const isOutsideMonth = !isSameMonth(day, currentMonth);
                        const isToday = isSameDay(day, new Date());
                        const isStartDay = weekStart && isSameDay(day, weekStart);
                        const isEndDay = weekEnd && isSameDay(day, weekEnd);

                        return (
                            <button
                                key={i}
                                type="button"
                                onClick={() => onChange(day)}
                                className={`aspect-square flex flex-col items-center justify-center text-xs transition-all duration-200 relative
                                    ${isOutsideMonth ? 'bg-black/20 text-text-muted/20' : 'bg-black/40 text-text-main hover:bg-white/5'}
                                    ${isInRollingWeek ? '!bg-primary/20 !text-white z-10' : ''}
                                    ${isStartDay ? '!bg-primary !text-white font-black shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]' : ''}
                                    ${isEndDay ? 'border-r-2 border-primary/40' : ''}
                                `}
                            >
                                <span className={`z-10 ${isStartDay ? 'scale-110' : ''}`}>
                                    {format(day, 'd')}
                                </span>
                                {isToday && !isStartDay && (
                                    <div className="absolute bottom-1.5 w-1 h-1 bg-primary rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Selected Range Footer */}
            <div className="bg-white/5 p-4 border-t border-white/5 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Calendar size={16} className="text-primary" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-text-muted uppercase font-bold tracking-widest leading-none">Inizio Settimana</span>
                        <span className="text-xs font-bold text-text-main">
                            {weekStart ? format(weekStart, 'EEEE d MMMM', { locale: it }) : 'Nessuna data selezionata'}
                        </span>
                    </div>
                </div>
                {weekStart && (
                    <div className="flex items-center gap-2 mt-1">
                        <div className="h-px flex-1 bg-white/5" />
                        <span className="text-[9px] font-black text-primary/60 uppercase">Durerà fino al {format(weekEnd, 'd MMMM')}</span>
                        <div className="h-px flex-1 bg-white/5" />
                    </div>
                )}
            </div>
        </div>
    );
};

const EventsList = () => {
    const [events, setEvents] = useState([]);
    const [availabilities, setAvailabilities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showManualModal, setShowManualModal] = useState(false);
    const [selectedEventForManual, setSelectedEventForManual] = useState(null);
    const [saving, setSaving] = useState(false);
    const [editingEventId, setEditingEventId] = useState(null);

    const initialFormState = {
        title: '',
        description: '',
        duration_minutes: 30,
        slug: '',
        availability_id: '',
        event_type: 'recurring',
        location: '',
        start_date: null
    };

    // Form State
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);

        try {
            // Fetch Events
            const { data: eventsData } = await supabase
                .from('events')
                .select('*, availabilities(title)')
                .order('created_at', { ascending: false });

            // Fetch Availabilities for the dropdown
            const { data: availData } = await supabase
                .from('availabilities')
                .select('id, title');

            if (eventsData) setEvents(eventsData);
            if (availData) {
                setAvailabilities(availData);
                if (availData.length > 0 && !formData.availability_id) {
                    setFormData(prev => ({ ...prev, availability_id: availData[0].id }));
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);

        const dataToSave = { ...formData };
        if (dataToSave.event_type === 'recurring' && !dataToSave.start_date) {
            dataToSave.start_date = null;
        }

        try {
            if (editingEventId) {
                const { error } = await supabase
                    .from('events')
                    .update(dataToSave)
                    .eq('id', editingEventId);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('events')
                    .insert([dataToSave]);

                if (error) throw error;
            }

            setShowModal(false);
            setFormData(initialFormState);
            setEditingEventId(null);
            fetchData();
        } catch (error) {
            alert('Errore: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const openEditModal = (event) => {
        setEditingEventId(event.id);
        setFormData({
            title: event.title || '',
            description: event.description || '',
            duration_minutes: event.duration_minutes || 30,
            slug: event.slug || '',
            availability_id: event.availability_id || '',
            event_type: event.event_type || 'recurring',
            location: event.location || '',
            start_date: event.start_date ? new Date(event.start_date) : null
        });
        setShowModal(true);
    };

    const openCreateModal = () => {
        setEditingEventId(null);
        setFormData({
            ...initialFormState,
            availability_id: availabilities[0]?.id || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Sei sicuro di voler eliminare questo evento?')) return;
        const { error } = await supabase.from('events').delete().eq('id', id);
        if (!error) fetchData();
        else alert('Errore: ' + error.message);
    };

    return (
        <div className="animate-fade-in">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl tracking-tight">I tuoi Eventi</h1>
                    <p className="text-text-muted">Gestisci i tipi di appuntamento e la loro ricorrenza temporale.</p>
                </div>
                <button onClick={openCreateModal} className="btn btn-primary gap-2 shadow-lg shadow-primary/20">
                    <Plus size={20} /> Crea Nuovo Evento
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="card h-64 animate-pulse bg-glass-bg"></div>)
                ) : events.length === 0 ? (
                    <div className="col-span-full card py-16 text-center flex flex-col items-center gap-6">
                        <div className="bg-primary/10 p-6 rounded-full">
                            <Calendar size={48} className="text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold">Nessun evento configurato</h2>
                        <button onClick={openCreateModal} className="btn btn-primary px-8">Inizia Ora</button>
                    </div>
                ) : (
                    events.map((event) => (
                        <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} key={event.id} className="card flex flex-col group relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`text-[10px] tracking-widest uppercase font-black px-2 py-1 rounded-md ${event.event_type === 'recurring' ? 'bg-primary/20 text-primary' : 'bg-warning/20 text-warning'}`}>
                                        {event.event_type === 'recurring'
                                            ? (event.start_date ? 'Ricorrente (dal ' + format(new Date(event.start_date), 'd/MM', { locale: it }) + ')' : 'Sempre Attivo')
                                            : 'Settimana (7 gg)'}
                                    </span>
                                    <button onClick={() => handleDelete(event.id)} className="text-text-muted hover:text-error transition-colors p-1"><Trash2 size={16} /></button>
                                </div>
                                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-1">{event.title}</h3>
                                <p className="text-sm text-text-muted mb-6 line-clamp-2 h-10 leading-relaxed text-balance">{event.description || 'Nessuna descrizione.'}</p>
                                <div className="space-y-3 mb-6 bg-glass-bg/50 p-4 rounded-xl border border-glass-border">
                                    <div className="flex items-center gap-3 text-xs font-semibold text-text-main"><Clock size={16} className="text-primary" /> <span>{event.duration_minutes} minuti</span></div>
                                    <div className="flex items-center gap-3 text-xs font-semibold text-text-main"><Calendar size={16} className="text-primary" /> <span className="truncate">{event.availabilities?.title || 'Nessuna regola'}</span></div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => { setSelectedEventForManual(event); setShowManualModal(true); }} className="btn btn-primary flex-1 text-xs gap-1.5 py-2.5 shadow-md shadow-primary/20" title="Prenotazione Manuale (Telefono)">
                                    <Phone size={14} /> Prenota
                                </button>
                                <button onClick={() => openEditModal(event)} className="btn btn-outline flex-1 text-xs gap-1.5 py-2.5">
                                    <Edit size={14} /> Edit
                                </button>
                                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/book/${event.slug}`); alert('Link copiato!'); }} className="btn btn-outline p-2.5 text-text-muted hover:text-primary" title="Copia Link">
                                    <LinkIcon size={14} />
                                </button>
                                <a href={`/book/${event.slug}`} target="_blank" rel="noreferrer" className="btn btn-outline p-2.5 text-text-muted hover:text-primary"><ExternalLink size={14} /></a>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }} className="card w-full max-w-4xl relative z-10 shadow-2xl border-primary/20 overflow-y-auto max-h-[90vh]">
                            <h2 className="text-3xl font-bold mb-1 tracking-tight">{editingEventId ? 'Modifica Evento' : 'Nuovo Tipo di Evento'}</h2>
                            <p className="text-text-muted text-sm mb-8">Definisci i dettagli e le regole di ricorrenza dell'evento.</p>

                            <form className="flex flex-col gap-8" onSubmit={handleSave}>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="flex flex-col gap-6">
                                        <div>
                                            <label className="label">Titolo Evento</label>
                                            <input type="text" className="input" required placeholder="es. Visita Specialistica" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="label">Regole Disponibilità</label>
                                                <select className="input" required value={formData.availability_id} onChange={(e) => setFormData({ ...formData, availability_id: e.target.value })}>
                                                    {availabilities.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="label">Durata (min)</label>
                                                <input type="number" className="input" required min="5" value={formData.duration_minutes} onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="label">Slug URL</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-text-muted">/book/</span>
                                                <input type="text" className="input pl-14" required placeholder="visita-30" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="label">Tipo di Ricorrenza</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {['recurring', 'single_week', 'recurring_from'].map((type) => (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => {
                                                            const newType = type === 'recurring_from' ? 'recurring' : type;
                                                            setFormData({
                                                                ...formData,
                                                                event_type: newType,
                                                                start_date: type === 'recurring' && !formData.start_date ? null : (formData.start_date || new Date())
                                                            });
                                                        }}
                                                        className={`py-2 px-1 text-[10px] uppercase font-bold border-2 rounded-lg transition-all
                                                            ${(type === 'recurring' && formData.event_type === 'recurring' && !formData.start_date) ||
                                                                (type === 'single_week' && formData.event_type === 'single_week') ||
                                                                (type === 'recurring_from' && formData.event_type === 'recurring' && formData.start_date)
                                                                ? 'bg-primary/20 border-primary text-primary'
                                                                : 'bg-glass-bg border-glass-border text-text-muted hover:border-primary/40'}
                                                        `}
                                                    >
                                                        {type === 'recurring' ? 'Sempre' : type === 'single_week' ? 'Settimana (7 gg)' : 'Da data...'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-6">
                                        {(formData.event_type === 'single_week' || (formData.event_type === 'recurring' && formData.start_date)) && (
                                            <div>
                                                <label className="label">{formData.event_type === 'single_week' ? 'Seleziona Data di Inizio' : 'Data di inizio'}</label>
                                                <WeekPicker
                                                    selectedDate={formData.start_date ? new Date(formData.start_date) : null}
                                                    onChange={(date) => setFormData({ ...formData, start_date: date })}
                                                />
                                            </div>
                                        )}
                                        <div>
                                            <label className="label">Descrizione</label>
                                            <textarea className="input" rows="4" placeholder="Opzionale..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}></textarea>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-6 border-t border-glass-border">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Annulla</button>
                                    <button type="submit" className="btn btn-primary px-10" disabled={saving}>
                                        {saving ? <Loader2 className="animate-spin" size={20} /> : (editingEventId ? 'Salva Modifiche' : 'Crea Evento')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ManualBookingModal
                isOpen={showManualModal}
                onClose={() => setShowManualModal(false)}
                event={selectedEventForManual}
            />
        </div>
    );
};

export default EventsList;

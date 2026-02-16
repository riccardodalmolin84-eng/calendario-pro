import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar as CalendarIcon, Clock, User, Phone, Mail, Loader2, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isAfter, startOfToday, parse, addMinutes, isBefore, startOfDay } from 'date-fns';
import { it } from 'date-fns/locale';

const ManualBookingModal = ({ isOpen, onClose, event }) => {
    const [step, setStep] = useState(1);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [availability, setAvailability] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        phone: '',
        email: ''
    });

    useEffect(() => {
        if (isOpen && event) {
            fetchAvailability();
            setStep(1);
            setSelectedDate(null);
            setSelectedSlot(null);
            setFormData({ name: '', surname: '', phone: '', email: '' });

            // If rolling week, set month to start_date month
            if (event.event_type === 'single_week' && event.start_date) {
                setCurrentMonth(new Date(event.start_date));
            } else {
                setCurrentMonth(new Date());
            }
        }
    }, [isOpen, event]);

    const fetchAvailability = async () => {
        if (!event?.availability_id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('availabilities')
                .select('*')
                .eq('id', event.availability_id)
                .single();
            if (data) setAvailability(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const calendarDays = useMemo(() => {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    const availableSlots = useMemo(() => {
        if (!selectedDate || !availability || !event) return [];

        const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
        const dayName = dayNames[getDay(selectedDate)];
        const rules = availability.rules[dayName] || [];

        const slots = [];
        const duration = event.duration_minutes;

        rules.forEach(rule => {
            let current = parse(rule.start, 'HH:mm', selectedDate);
            const end = parse(rule.end, 'HH:mm', selectedDate);

            while (isBefore(addMinutes(current, duration), end) || isSameDay(addMinutes(current, duration), end)) {
                slots.push(format(current, 'HH:mm'));
                current = addMinutes(current, duration);
            }
        });

        return slots;
    }, [selectedDate, availability, event]);

    const handleBooking = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const [hours, minutes] = selectedSlot.split(':');
        const startTime = new Date(selectedDate);
        startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        const endTime = addMinutes(startTime, event.duration_minutes);

        try {
            const { error } = await supabase
                .from('bookings')
                .insert([{
                    event_id: event.id,
                    user_name: formData.name,
                    user_surname: formData.surname,
                    user_phone: formData.phone,
                    user_email: formData.email,
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString()
                }]);

            if (error) throw error;
            setStep(3);
        } catch (err) {
            alert('Errore: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="card w-full max-w-4xl relative z-10 shadow-2xl border-primary/20 p-0 overflow-hidden max-h-[90vh] flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-glass-bg">
                    <div>
                        <h2 className="text-xl font-bold">Prenotazione Manuale (Telefono)</h2>
                        <p className="text-xs text-text-muted">Stai prenotando per: <span className="text-primary font-bold">{event?.title}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-text-muted transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Calendar */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Seleziona Data</h3>
                                        <div className="flex gap-1">
                                            <button onClick={() => setCurrentMonth(addDays(startOfMonth(currentMonth), -1))} className="p-1 hover:bg-white/5 rounded border border-white/10"><ChevronLeft size={16} /></button>
                                            <button onClick={() => setCurrentMonth(addDays(endOfMonth(currentMonth), 1))} className="p-1 hover:bg-white/5 rounded border border-white/10"><ChevronRight size={16} /></button>
                                        </div>
                                    </div>
                                    <div className="text-center text-xs font-bold mb-2">{format(currentMonth, 'MMMM yyyy', { locale: it })}</div>
                                    <div className="grid grid-cols-7 gap-1 text-[10px] text-center opacity-50 font-bold mb-1">
                                        {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map(d => <div key={d}>{d}</div>)}
                                    </div>
                                    <div className="grid grid-cols-7 gap-1">
                                        {Array.from({ length: (getDay(startOfMonth(currentMonth)) + 6) % 7 }).map((_, i) => <div key={i} />)}
                                        {calendarDays.map(day => {
                                            const today = startOfToday();
                                            let isPast = isBefore(day, today);

                                            if (event.event_type === 'single_week' && event.start_date) {
                                                const start = startOfDay(new Date(event.start_date));
                                                const end = addDays(start, 6);
                                                if (isBefore(day, start) || isAfter(day, end)) isPast = true;
                                            }

                                            const isSelected = selectedDate && isSameDay(day, selectedDate);
                                            return (
                                                <button
                                                    key={day.toISOString()}
                                                    disabled={isPast}
                                                    onClick={() => { setSelectedDate(day); setSelectedSlot(null); }}
                                                    className={`aspect-square flex items-center justify-center rounded-lg text-xs font-bold transition-all ${isSelected ? 'bg-primary text-white shadow-lg' : isPast ? 'opacity-20 cursor-not-allowed' : 'hover:bg-primary/10 text-text-muted hover:text-primary'
                                                        }`}
                                                >
                                                    {format(day, 'd')}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Slots */}
                                <div className="flex flex-col">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-4">Orari Disponibili</h3>
                                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2 min-h-[200px]">
                                        {selectedDate ? (
                                            availableSlots.length > 0 ? (
                                                availableSlots.map(slot => (
                                                    <button
                                                        key={slot}
                                                        onClick={() => setSelectedSlot(slot)}
                                                        className={`w-full py-3 px-4 rounded-xl border-2 transition-all text-xs font-bold text-center ${selectedSlot === slot ? 'bg-primary/10 border-primary text-primary' : 'bg-glass-bg border-glass-border hover:border-primary/40 text-text-main'
                                                            }`}
                                                    >
                                                        {slot}
                                                    </button>
                                                ))
                                            ) : <div className="text-center py-10 text-xs text-text-muted italic">Nessun orario per questa data.</div>
                                        ) : <div className="text-center py-10 text-xs text-text-muted italic">Seleziona una data per vedere gli orari.</div>}
                                    </div>
                                    {selectedSlot && (
                                        <button onClick={() => setStep(2)} className="btn btn-primary w-full mt-4 py-3 text-xs font-bold">Prosegui</button>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="max-w-lg mx-auto py-4">
                                <button onClick={() => setStep(1)} className="text-primary text-xs font-bold flex items-center gap-1 mb-6"><ChevronLeft size={16} /> Indietro</button>
                                <h3 className="text-xl font-bold mb-4">Dati dell'Utente</h3>
                                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 mb-6 flex gap-4 items-center">
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"><CalendarIcon size={20} className="text-primary" /></div>
                                    <div>
                                        <p className="text-xs font-bold">{format(selectedDate, 'EEEE d MMMM', { locale: it })}</p>
                                        <p className="text-[10px] text-text-muted uppercase">Alle ore {selectedSlot}</p>
                                    </div>
                                </div>
                                <form onSubmit={handleBooking} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] uppercase font-bold text-text-muted px-1">Nome</label>
                                            <input type="text" className="input text-xs h-10" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] uppercase font-bold text-text-muted px-1">Cognome</label>
                                            <input type="text" className="input text-xs h-10" required value={formData.surname} onChange={e => setFormData({ ...formData, surname: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-text-muted px-1">Telefono</label>
                                        <input type="tel" className="input text-xs h-10" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-text-muted px-1">Email (Opzionale)</label>
                                        <input type="email" className="input text-xs h-10" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                    </div>
                                    <button type="submit" disabled={submitting} className="btn btn-primary w-full py-4 mt-4 font-bold">
                                        {submitting ? <Loader2 className="animate-spin" size={20} /> : 'Conferma Prenotazione Telefona'}
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
                                <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle size={40} className="text-success" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Prenotazione Completata!</h3>
                                <p className="text-text-muted text-sm mb-8">L'appuntamento è stato registrato correttamente nel sistema.</p>
                                <button onClick={onClose} className="btn btn-primary px-10">Chiudi</button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default ManualBookingModal;

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, MapPin, CheckCircle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isAfter, startOfToday, parse, addMinutes, isBefore } from 'date-fns';
import { it } from 'date-fns/locale';

const BookingPage = () => {
    const { slug: rawSlug } = useParams();
    const slug = rawSlug?.trim().replace(/\/$/, '');
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState(null);
    const [availability, setAvailability] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);

    const [bookingFormData, setBookingFormData] = useState({
        name: '',
        surname: '',
        phone: '',
        email: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchEvent();
    }, [slug]);

    const fetchEvent = async () => {
        setLoading(true);
        try {
            console.log('Fetching event with slug:', slug);
            const { data, error } = await supabase
                .from('events')
                .select('*, availabilities(*)')
                .eq('slug', slug)
                .single();

            if (error) {
                console.error('Supabase error fetching event:', error);
                setEvent(null);
            } else if (data) {
                console.log('Event found:', data);
                setEvent(data);
                setAvailability(data.availabilities);

                // If it's a single week event, set the current month to the week's month
                if (data.event_type === 'single_week' && data.start_date) {
                    setCurrentMonth(new Date(data.start_date));
                    setSelectedDate(new Date(data.start_date));
                }
            } else {
                console.warn('No event found for slug:', slug);
                setEvent(null);
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            setEvent(null);
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

    const handleBookingSubmission = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const [hours, minutes] = selectedSlot.split(':');
        const startTime = new Date(selectedDate);
        startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        const endTime = addMinutes(startTime, event.duration_minutes);

        const { error } = await supabase
            .from('bookings')
            .insert([{
                event_id: event.id,
                user_name: bookingFormData.name,
                user_surname: bookingFormData.surname,
                user_phone: bookingFormData.phone,
                user_email: bookingFormData.email,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString()
            }]);

        if (!error) {
            setStep(3);
        } else {
            alert('Errore nella prenotazione: ' + error.message);
        }
        setSubmitting(false);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={48} />
        </div>
    );

    if (!event) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <h1 className="text-2xl font-bold">Evento non trovato</h1>
            <p className="text-text-muted">Il link potrebbe essere scaduto o errato.</p>
            <button onClick={() => window.location.href = '/'} className="btn btn-primary px-8">Torna alla Home</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-bg-main py-12 px-4 flex justify-center items-start text-text-main">
            <div className="w-full max-w-4xl">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="card overflow-hidden shadow-2xl border-glass-border/20"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
                                {/* Info Panel */}
                                <div className="lg:col-span-4 p-8 bg-glass-bg border-r border-glass-border">
                                    <div className="flex items-center gap-3 text-primary mb-8 bg-primary/10 w-fit px-3 py-1.5 rounded-full">
                                        <CalendarIcon size={18} />
                                        <span className="font-bold text-xs uppercase tracking-widest text-primary">Prenotazione</span>
                                    </div>
                                    <h1 className="text-3xl font-bold mb-4 tracking-tight leading-tight">{event.title}</h1>
                                    <div className="flex flex-col gap-4 text-text-muted mb-8">
                                        <div className="flex items-center gap-3 text-sm font-semibold">
                                            <div className="w-8 h-8 rounded-full bg-bg-input flex items-center justify-center">
                                                <Clock size={16} className="text-primary" />
                                            </div>
                                            {event.duration_minutes} minuti
                                        </div>
                                        {event.location && (
                                            <div className="flex items-center gap-3 text-sm font-semibold">
                                                <div className="w-8 h-8 rounded-full bg-bg-input flex items-center justify-center">
                                                    <MapPin size={16} className="text-primary" />
                                                </div>
                                                {event.location}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-text-muted leading-relaxed text-sm">
                                        {event.description || "Nessuna descrizione fornita per questo evento."}
                                    </p>
                                </div>

                                {/* Selection Panel */}
                                <div className="lg:col-span-8 p-8 flex flex-col">
                                    <h2 className="text-xl font-bold mb-6">Seleziona una data</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 h-full">
                                        {/* Calendar */}
                                        <div className="flex flex-col">
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="font-bold text-sm uppercase tracking-widest text-text-muted">
                                                    {format(currentMonth, 'MMMM yyyy', { locale: it })}
                                                </h3>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => setCurrentMonth(addDays(startOfMonth(currentMonth), -1))}
                                                        className="p-1.5 hover:bg-glass-bg rounded-lg transition-colors border border-glass-border"
                                                    >
                                                        <ChevronLeft size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => setCurrentMonth(addDays(endOfMonth(currentMonth), 1))}
                                                        className="p-1.5 hover:bg-glass-bg rounded-lg transition-colors border border-glass-border"
                                                    >
                                                        <ChevronRight size={18} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-7 gap-1 mb-2">
                                                {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => (
                                                    <div key={day} className="text-center text-[10px] font-bold text-text-muted py-2 uppercase opacity-50">{day}</div>
                                                ))}
                                            </div>

                                            <div className="grid grid-cols-7 gap-1">
                                                {/* Filler for start day of month */}
                                                {Array.from({ length: (getDay(startOfMonth(currentMonth)) + 6) % 7 }).map((_, i) => (
                                                    <div key={`empty-${i}`} className="aspect-square" />
                                                ))}

                                                {calendarDays.map(day => {
                                                    const today = startOfToday();
                                                    let isPast = isBefore(day, today);

                                                    // Rule: Don't show days before start_date if recurring with start date
                                                    if (event.event_type === 'recurring' && event.start_date) {
                                                        const startDate = new Date(event.start_date);
                                                        if (isBefore(day, startDate) && !isSameDay(day, startDate)) {
                                                            isPast = true;
                                                        }
                                                    }

                                                    // Rule: Only show days within the specific week if single_week
                                                    if (event.event_type === 'single_week' && event.start_date) {
                                                        const weekStart = startOfWeek(new Date(event.start_date), { weekStartsOn: 1 });
                                                        const weekEnd = endOfWeek(new Date(event.start_date), { weekStartsOn: 1 });
                                                        if (day < weekStart || day > weekEnd) {
                                                            isPast = true;
                                                        }
                                                    }

                                                    const isSelected = selectedDate && isSameDay(day, selectedDate);

                                                    return (
                                                        <button
                                                            key={day.toISOString()}
                                                            disabled={isPast}
                                                            onClick={() => {
                                                                setSelectedDate(day);
                                                                setSelectedSlot(null);
                                                            }}
                                                            className={`aspect-square flex items-center justify-center rounded-xl text-sm font-bold transition-all relative ${isSelected
                                                                ? 'bg-primary text-white shadow-xl shadow-primary/30 z-10'
                                                                : isPast
                                                                    ? 'opacity-20 cursor-not-allowed'
                                                                    : 'hover:bg-primary/10 text-text-muted hover:text-primary'
                                                                }`}
                                                        >
                                                            {format(day, 'd')}
                                                            {isSelected && (
                                                                <motion.div
                                                                    layoutId="active-bg"
                                                                    className="absolute inset-0 bg-primary rounded-xl -z-10"
                                                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                                                />
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Timeslots */}
                                        <div className="flex flex-col">
                                            <h3 className="font-bold text-sm uppercase tracking-widest text-text-muted mb-6">
                                                Orari Disponibili
                                            </h3>
                                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-2">
                                                {selectedDate ? (
                                                    availableSlots.length > 0 ? (
                                                        availableSlots.map(slot => (
                                                            <button
                                                                key={slot}
                                                                onClick={() => setSelectedSlot(slot)}
                                                                className={`w-full py-4 px-4 rounded-xl border-2 transition-all text-sm font-bold text-center ${selectedSlot === slot
                                                                    ? 'bg-primary/10 border-primary text-primary'
                                                                    : 'bg-glass-bg border-glass-border hover:border-primary/40 text-text-main'
                                                                    }`}
                                                            >
                                                                {slot}
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="flex-1 flex flex-col items-center justify-center text-text-muted text-xs border-2 border-dashed border-glass-border rounded-2xl px-6 text-center py-12">
                                                            Nessun orario disponibile per questa data.
                                                        </div>
                                                    )
                                                ) : (
                                                    <div className="flex-1 flex flex-col items-center justify-center text-text-muted text-xs border-2 border-dashed border-glass-border rounded-2xl px-6 text-center py-12">
                                                        Seleziona una data per vedere gli orari.
                                                    </div>
                                                )}
                                            </div>

                                            {selectedSlot && (
                                                <motion.button
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    onClick={() => setStep(2)}
                                                    className="btn btn-primary w-full mt-6 py-4 rounded-xl font-bold shadow-lg shadow-primary/25"
                                                >
                                                    Prosegui <ChevronRight size={18} className="ml-1" />
                                                </motion.button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="max-w-xl mx-auto card relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <CalendarIcon size={120} />
                            </div>

                            <button
                                onClick={() => setStep(1)}
                                className="text-text-muted hover:text-primary flex items-center gap-1 text-sm font-bold mb-8 transition-colors"
                            >
                                <ChevronLeft size={18} /> Indietro
                            </button>

                            <div>
                                <h2 className="text-3xl font-bold mb-2">Conferma i tuoi dati</h2>
                                <p className="text-text-muted text-sm mb-10 flex items-center gap-2">
                                    <Clock size={16} className="text-primary" />
                                    <span>{event.title} • {format(selectedDate, 'd MMMM', { locale: it })} alle {selectedSlot}</span>
                                </p>

                                <form className="flex flex-col gap-6" onSubmit={handleBookingSubmission}>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="label">Nome</label>
                                            <input
                                                type="text"
                                                className="input h-12"
                                                required
                                                placeholder="Mario"
                                                value={bookingFormData.name}
                                                onChange={(e) => setBookingFormData({ ...bookingFormData, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="label">Cognome</label>
                                            <input
                                                type="text"
                                                className="input h-12"
                                                required
                                                placeholder="Rossi"
                                                value={bookingFormData.surname}
                                                onChange={(e) => setBookingFormData({ ...bookingFormData, surname: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="label">Cellulare</label>
                                        <input
                                            type="tel"
                                            className="input h-12"
                                            required
                                            placeholder="+39 123 456 7890"
                                            value={bookingFormData.phone}
                                            onChange={(e) => setBookingFormData({ ...bookingFormData, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="label flex justify-between">
                                            Email <span className="text-[10px] font-normal italic opacity-50">(Opzionale)</span>
                                        </label>
                                        <input
                                            type="email"
                                            className="input h-12"
                                            placeholder="mario@esempio.it"
                                            value={bookingFormData.email}
                                            onChange={(e) => setBookingFormData({ ...bookingFormData, email: e.target.value })}
                                        />
                                    </div>

                                    <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl text-[10px] text-text-muted leading-relaxed italic">
                                        * Cliccando sul pulsante qui sotto, confermi la tua partecipazione all'evento e accetti di ricevere notifiche via e-mail o WhatsApp.
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-primary w-full py-4 rounded-xl font-bold text-lg shadow-xl shadow-primary/25"
                                        disabled={submitting}
                                    >
                                        {submitting ? <Loader2 className="animate-spin" size={24} /> : 'Conferma Prenotazione'}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="max-w-md mx-auto card text-center py-12 shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-primary/5 -z-10" />
                            <div className="w-24 h-24 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                                <CheckCircle className="text-success" size={56} />
                            </div>
                            <h2 className="text-4xl font-black mb-3 tracking-tight">Prenotato!</h2>
                            <p className="text-text-muted mb-10 px-6 font-medium">
                                Grande! La tua sessione di <b>{event.title}</b> è stata programmata.
                            </p>

                            <div className="bg-bg-main/50 backdrop-blur-md p-6 rounded-2xl border border-glass-border mb-10 text-left space-y-4">
                                <div className="flex items-center gap-4 text-sm font-bold">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <CalendarIcon size={20} className="text-primary" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase text-text-muted opacity-60">Data</div>
                                        {format(selectedDate, 'EEEE d MMMM, yyyy', { locale: it })}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-sm font-bold">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Clock size={20} className="text-primary" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase text-text-muted opacity-60">Ora</div>
                                        {selectedSlot} ({event.duration_minutes} min)
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button className="btn btn-primary w-full py-4 rounded-xl font-bold shadow-lg shadow-primary/20">Aggiungi al Calendario</button>
                                <button onClick={() => window.location.reload()} className="btn btn-outline w-full py-4 rounded-xl font-bold">Prenota un altro</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default BookingPage;


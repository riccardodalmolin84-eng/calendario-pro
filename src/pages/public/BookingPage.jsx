import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, MapPin, CheckCircle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';

const BookingPage = () => {
    const { slug } = useParams();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState(null);
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
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('slug', slug)
            .single();

        if (data) {
            setEvent(data);
        }
        setLoading(false);
    };

    const handleBookingSubmission = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const startTime = new Date(`2026-02-${selectedDate.toString().padStart(2, '0')}T${selectedSlot}:00Z`);
        const endTime = new Date(startTime.getTime() + (event.duration_minutes * 60000));

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

    const slots = ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00'];

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={48} />
        </div>
    );

    if (!event) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <h1 className="text-2xl">Evento non trovato</h1>
            <button onClick={() => window.location.href = '/'} className="btn btn-primary">Torna alla Home</button>
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
                            className="card overflow-hidden"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-3">
                                {/* Left Info Panel */}
                                <div className="p-8 lg:border-r border-glass-border">
                                    <div className="flex items-center gap-2 text-text-muted mb-8">
                                        <div className="p-2 bg-primary/20 rounded-lg">
                                            <CalendarIcon size={24} className="text-primary" />
                                        </div>
                                        <span className="font-bold text-lg">CalendarioAloe</span>
                                    </div>
                                    <h1 className="text-2xl mb-4">{event.title}</h1>
                                    <div className="flex flex-col gap-3 text-text-muted mb-6">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <Clock size={18} /> {event.duration_minutes} min
                                        </div>
                                        {event.location && (
                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                <MapPin size={18} /> {event.location}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-text-muted leading-relaxed">
                                        {event.description}
                                    </p>
                                </div>

                                {/* Calendar Selection */}
                                <div className="p-8 lg:col-span-2">
                                    <h2 className="text-xl mb-6">Seleziona Data e Ora</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Simple Calendar Mock */}
                                        <div>
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="font-bold">Febbraio 2026</h3>
                                                <div className="flex gap-2">
                                                    <button className="p-1 hover:bg-glass-bg rounded-md"><ChevronLeft size={20} /></button>
                                                    <button className="p-1 hover:bg-glass-bg rounded-md"><ChevronRight size={20} /></button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-7 gap-1 mb-2">
                                                {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map(day => (
                                                    <div key={day} className="text-center text-[10px] font-bold text-text-muted py-1">{day}</div>
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-7 gap-1">
                                                {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                                                    <button
                                                        key={day}
                                                        onClick={() => setSelectedDate(day)}
                                                        className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all ${selectedDate === day
                                                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                                            : 'hover:bg-glass-bg text-text-muted hover:text-text-main'
                                                            }`}
                                                    >
                                                        {day}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Time Slots */}
                                        <div>
                                            <p className="text-sm font-medium mb-4">{selectedDate ? `Giorno ${selectedDate} Feb` : 'Seleziona una data'}</p>
                                            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2">
                                                {selectedDate ? (
                                                    slots.map(slot => (
                                                        <button
                                                            key={slot}
                                                            onClick={() => setSelectedSlot(slot)}
                                                            className={`w-full py-3 px-4 rounded-xl border transition-all text-sm font-medium ${selectedSlot === slot
                                                                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                                                                : 'bg-glass-bg border-glass-border hover:border-primary/50'
                                                                }`}
                                                        >
                                                            {slot}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="h-full flex items-center justify-center text-text-muted text-xs border-2 border-dashed border-glass-border rounded-xl px-8 text-center py-10">
                                                        Seleziona una data per vedere le fasce orarie disponibili.
                                                    </div>
                                                )}
                                            </div>
                                            {selectedSlot && (
                                                <button
                                                    onClick={() => setStep(2)}
                                                    className="btn btn-primary w-full mt-4 py-3"
                                                >
                                                    Conferma Selezione
                                                </button>
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
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="max-w-xl mx-auto card relative"
                        >
                            <button
                                onClick={() => setStep(1)}
                                className="absolute top-6 left-6 text-text-muted hover:text-text-main flex items-center gap-1 text-sm font-medium"
                            >
                                <ChevronLeft size={16} /> Indietro
                            </button>

                            <div className="pt-8">
                                <h2 className="text-2xl mb-2">Inserisci i tuoi dati</h2>
                                <p className="text-text-muted text-sm mb-8">
                                    Stai prenotando per <b>{event.title}</b> il <b>{selectedDate} Febbraio</b> alle <b>{selectedSlot}</b>.
                                </p>

                                <form className="flex flex-col gap-4" onSubmit={handleBookingSubmission}>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="label">Nome</label>
                                            <input
                                                type="text"
                                                className="input"
                                                required
                                                placeholder="Mario"
                                                value={bookingFormData.name}
                                                onChange={(e) => setBookingFormData({ ...bookingFormData, name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Cognome</label>
                                            <input
                                                type="text"
                                                className="input"
                                                required
                                                placeholder="Rossi"
                                                value={bookingFormData.surname}
                                                onChange={(e) => setBookingFormData({ ...bookingFormData, surname: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="label">Numero di Telefono</label>
                                        <input
                                            type="tel"
                                            className="input"
                                            required
                                            placeholder="+39 123 456 7890"
                                            value={bookingFormData.phone}
                                            onChange={(e) => setBookingFormData({ ...bookingFormData, phone: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="label flex justify-between">
                                            Indirizzo Email <span className="text-[10px] font-normal italic">(Opzionale)</span>
                                        </label>
                                        <input
                                            type="email"
                                            className="input"
                                            placeholder="mario@esempio.it"
                                            value={bookingFormData.email}
                                            onChange={(e) => setBookingFormData({ ...bookingFormData, email: e.target.value })}
                                        />
                                    </div>

                                    <p className="text-[10px] text-text-muted leading-relaxed mt-2">
                                        Prenotando questo appuntamento, accetti di ricevere un'e-mail di conferma e comunicazioni correlate a questa sessione.
                                    </p>

                                    <button
                                        type="submit"
                                        className="btn btn-primary w-full py-3 mt-4 text-base"
                                        disabled={submitting}
                                    >
                                        {submitting ? <Loader2 className="animate-spin" size={24} /> : 'Completa Prenotazione'}
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
                            className="max-w-sm mx-auto card text-center py-12"
                        >
                            <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="text-success" size={48} />
                            </div>
                            <h2 className="text-3xl mb-2">Confermato!</h2>
                            <p className="text-text-muted mb-8 px-4">
                                Il tuo appuntamento per <b>{event.title}</b> è stato programmato con successo.
                            </p>

                            <div className="bg-glass-bg p-4 rounded-xl border border-glass-border mb-8 text-left">
                                <div className="flex items-center gap-3 mb-2 text-sm">
                                    <CalendarIcon size={16} className="text-primary" /> {selectedDate} Febbraio, 2026
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Clock size={16} className="text-primary" /> {selectedSlot} ({event.duration_minutes} min)
                                </div>
                            </div>

                            <button className="btn btn-outline w-full mb-3">Aggiungi al Calendario</button>
                            <button onClick={() => setStep(1)} className="btn btn-primary w-full">Fatto</button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default BookingPage;

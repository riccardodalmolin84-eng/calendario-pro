import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Clock, MapPin, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BookingPage = () => {
    const { slug } = useParams();
    const [step, setStep] = useState(1); // 1: Date/Time, 2: Details, 3: Success
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);

    // Mock Event Data
    const event = {
        title: 'Consulenza Professionale',
        description: 'Una sessione di 30 minuti per discutere i requisiti del tuo progetto e come possiamo aiutarti a raggiungere i tuoi obiettivi.',
        duration: '30 min',
        location: 'Google Meet',
    };

    const slots = ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00'];

    return (
        <div className="min-h-screen bg-bg-main py-12 px-4 flex justify-center items-start">
            <div className="w-full max-w-4xl">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="grid grid-cols-1 md:grid-cols-3 gap-8"
                        >
                            {/* Event Info */}
                            <div className="md:col-span-1">
                                <div className="flex items-center gap-2 text-primary mb-4">
                                    <div className="p-2 bg-primary/20 rounded-lg">
                                        <Calendar size={24} />
                                    </div>
                                    <span className="font-bold text-lg">Calendario PRO</span>
                                </div>
                                <h1 className="text-2xl mb-4">{event.title}</h1>
                                <div className="flex flex-col gap-3 text-text-muted mb-6">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Clock size={18} /> {event.duration}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <MapPin size={18} /> {event.location}
                                    </div>
                                </div>
                                <p className="text-sm text-text-muted leading-relaxed">
                                    {event.description}
                                </p>
                            </div>

                            {/* Selector */}
                            <div className="md:col-span-2 card">
                                <h2 className="text-xl mb-6">Seleziona Data e Ora</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Calendar Widget Mockup */}
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="font-bold">Febbraio 2026</span>
                                            <div className="flex gap-2">
                                                <button className="p-1 hover:bg-glass-bg rounded"><ChevronLeft size={20} /></button>
                                                <button className="p-1 hover:bg-glass-bg rounded"><ChevronRight size={20} /></button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-7 text-center text-xs text-text-muted mb-2">
                                            {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map(d => <div key={d}>{d}</div>)}
                                        </div>
                                        <div className="grid grid-cols-7 gap-1">
                                            {Array.from({ length: 28 }, (_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setSelectedDate(i + 1)}
                                                    className={`aspect-square flex items-center justify-center rounded-lg text-sm transition-all ${selectedDate === i + 1 ? 'bg-primary text-white font-bold' : 'hover:bg-glass-bg'
                                                        }`}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Time Slots */}
                                    <div>
                                        <p className="text-sm font-medium mb-4">{selectedDate ? `Venerdì, ${selectedDate} Feb` : 'Seleziona una data'}</p>
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
                                                <div className="h-full flex items-center justify-center text-text-muted text-xs border-2 border-dashed border-glass-border rounded-xl px-8 text-center">
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
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="max-w-lg mx-auto card"
                        >
                            <button
                                onClick={() => setStep(1)}
                                className="flex items-center gap-1 text-text-muted hover:text-text-main text-sm mb-6"
                            >
                                <ChevronLeft size={16} /> Indietro
                            </button>

                            <h2 className="text-2xl mb-2">Inserisci i tuoi dati</h2>
                            <p className="text-text-muted text-sm mb-8">
                                Stai prenotando per <b>{event.title}</b> il <b>{selectedDate} Feb</b> alle <b>{selectedSlot}</b>.
                            </p>

                            <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); setStep(3); }}>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Nome</label>
                                        <input type="text" className="input" required placeholder="Mario" />
                                    </div>
                                    <div>
                                        <label className="label">Cognome</label>
                                        <input type="text" className="input" required placeholder="Rossi" />
                                    </div>
                                </div>
                                <div>
                                    <label className="label">Numero di Telefono</label>
                                    <input type="tel" className="input" required placeholder="+39 123 456 7890" />
                                </div>
                                <div>
                                    <label className="label flex justify-between">
                                        Indirizzo Email <span className="text-[10px] font-normal italic">(Opzionale)</span>
                                    </label>
                                    <input type="email" className="input" placeholder="mario@esempio.it" />
                                </div>

                                <p className="text-[10px] text-text-muted leading-relaxed mt-2">
                                    Prenotando questo appuntamento, accetti di ricevere un'e-mail di conferma e comunicazioni correlate a questa sessione.
                                </p>

                                <button type="submit" className="btn btn-primary w-full py-3 mt-4 text-base">
                                    Completa Prenotazione
                                </button>
                            </form>
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
                                    <Calendar size={16} className="text-primary" /> {selectedDate} Febbraio, 2026
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Clock size={16} className="text-primary" /> {selectedSlot} ({event.duration})
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

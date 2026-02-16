import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, MapPin, CheckCircle, ChevronLeft, ChevronRight, Loader2, RefreshCw, Globe, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isAfter, startOfToday, parse, addMinutes, isBefore, startOfDay, startOfWeek, endOfWeek, isSameMonth } from 'date-fns';
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
    const [timeFormat, setTimeFormat] = useState('24h');

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
            const { data, error } = await supabase
                .from('events')
                .select('*, availabilities(*)')
                .eq('slug', slug)
                .single();

            if (data) {
                setEvent(data);
                setAvailability(data.availabilities);

                if (data.event_type === 'single_week' && data.start_date) {
                    const start = new Date(data.start_date);
                    setCurrentMonth(start);
                    setSelectedDate(start);
                } else {
                    setSelectedDate(startOfToday());
                }
            }
        } catch (err) {
            console.error('Unexpected error:', err);
        } finally {
            setLoading(false);
        }
    };

    const calendarDays = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
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

    const formatTime = (timeStr) => {
        if (timeFormat === '24h') return timeStr;
        const [hours, minutes] = timeStr.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'pm' : 'am';
        const displayH = h % 12 || 12;
        return `${displayH}:${minutes}${ampm}`;
    };

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

        if (!error) setStep(3);
        else alert('Errore nella prenotazione: ' + error.message);
        setSubmitting(false);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <Loader2 className="animate-spin text-[#222]" size={48} />
        </div>
    );

    if (!event) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white text-[#222]">
            <h1 className="text-2xl font-bold">Evento non trovato</h1>
            <button onClick={() => window.location.href = '/'} className="btn btn-primary px-8">Torna alla Home</button>
        </div>
    );

    return (
        <div className="light-theme min-h-screen bg-[#f5f5f5] py-12 px-4 flex justify-center items-start">
            <div className="w-full max-w-[1100px]">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="card overflow-hidden bg-white p-0 border-[#eee]"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[600px]">
                                {/* Info Panel */}
                                <div className="md:col-span-3 p-10 border-r border-[#f0f0f0] flex flex-col">
                                    <div className="mb-10 flex flex-col items-start gap-4">
                                        <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-xl">🌾</div>
                                        <div>
                                            <p className="text-[11px] font-black text-[#999] uppercase tracking-wider mb-1">Aloe di Elisabetta</p>
                                            <h1 className="text-2xl font-black text-[#111] leading-none uppercase tracking-tighter">{event.title}</h1>
                                            <p className="text-sm font-bold text-[#111] mt-1">{event.title}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 text-sm font-bold text-[#444]">
                                            <Clock size={18} />
                                            <span>{event.duration_minutes}m</span>
                                        </div>
                                        <div className="flex items-start gap-3 text-sm font-bold text-[#444]">
                                            <RefreshCw size={18} className="mt-1 shrink-0" />
                                            <div className="flex flex-col">
                                                <span>Ogni mese per</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="px-3 py-1 border border-[#ddd] rounded-full text-xs">1</div>
                                                    <span>occorrenza</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 text-sm font-bold text-[#444]">
                                            <MapPin size={18} className="mt-1 shrink-0" />
                                            <span className="uppercase text-[10px] tracking-tight leading-relaxed">
                                                {event.location || "PUCCINI 74 IMOLA BOLOGNA"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm font-bold text-[#444]">
                                            <Globe size={18} />
                                            <div className="flex items-center gap-1 cursor-pointer hover:underline">
                                                <span>Australia/Perth</span>
                                                <ChevronDown size={14} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Calendar Panel */}
                                <div className="md:col-span-6 p-10 border-r border-[#f0f0f0]">
                                    <div className="flex justify-between items-center mb-10">
                                        <h3 className="text-xl font-black text-[#111] capitalize">
                                            {format(currentMonth, 'MMMM yyyy', { locale: it })}
                                        </h3>
                                        <div className="flex gap-4">
                                            <button onClick={() => setCurrentMonth(addDays(startOfMonth(currentMonth), -1))} className="text-[#bbb] hover:text-[#000]"><ChevronLeft size={20} /></button>
                                            <button onClick={() => setCurrentMonth(addDays(endOfMonth(currentMonth), 1))} className="text-[#bbb] hover:text-[#000]"><ChevronRight size={20} /></button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-7 gap-2 mb-6">
                                        {['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'].map(d => (
                                            <div key={d} className="text-center text-[11px] font-black text-[#bbb] tracking-widest">{d}</div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-7 gap-4">
                                        {calendarDays.map(day => {
                                            const today = startOfToday();
                                            const isPastDay = isBefore(day, today);
                                            const isSelected = selectedDate && isSameDay(day, selectedDate);
                                            const isMonthDay = isSameMonth(day, currentMonth);

                                            let isAvailable = isMonthDay && !isPastDay;
                                            if (event.event_type === 'single_week' && event.start_date) {
                                                const start = startOfDay(new Date(event.start_date));
                                                const end = addDays(start, 6);
                                                isAvailable = isMonthDay && !isPastDay && day >= start && day <= end;
                                            }

                                            return (
                                                <button
                                                    key={day.toISOString()}
                                                    disabled={!isAvailable}
                                                    onClick={() => { setSelectedDate(day); setSelectedSlot(null); }}
                                                    className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all relative ${isSelected
                                                            ? 'bg-black text-white shadow-xl z-10 font-black'
                                                            : isAvailable
                                                                ? 'bg-[#eef2f5] text-[#111] hover:bg-[#dfe5ea] font-bold'
                                                                : 'text-[#ccc] cursor-not-allowed'
                                                        } ${!isMonthDay ? 'opacity-0' : ''}`}
                                                >
                                                    {format(day, 'd')}
                                                    {isSameDay(day, today) && !isSelected && (
                                                        <div className="absolute bottom-1.5 w-1 h-1 bg-black rounded-full" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Slots Panel */}
                                <div className="md:col-span-3 p-10 flex flex-col">
                                    <div className="flex justify-between items-center mb-8">
                                        <h3 className="text-sm font-black text-[#111] capitalize">
                                            {selectedDate ? format(selectedDate, 'eee d', { locale: it }) : 'Seleziona'}
                                        </h3>
                                        <div className="flex bg-[#f1f5f9] p-1 rounded-lg">
                                            <button
                                                onClick={() => setTimeFormat('12h')}
                                                className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${timeFormat === '12h' ? 'bg-white shadow-sm' : 'text-[#94a3b8]'}`}
                                            >12h</button>
                                            <button
                                                onClick={() => setTimeFormat('24h')}
                                                className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${timeFormat === '24h' ? 'bg-white shadow-sm' : 'text-[#94a3b8]'}`}
                                            >24 ore</button>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                                        {selectedDate ? (
                                            availableSlots.length > 0 ? (
                                                availableSlots.map(slot => (
                                                    <button
                                                        key={slot}
                                                        onClick={() => setSelectedSlot(slot)}
                                                        className={`w-full py-4 px-6 rounded-xl border-2 transition-all flex items-center justify-start gap-4 ${selectedSlot === slot
                                                                ? 'border-black bg-[#f8fafc] text-black'
                                                                : 'border-[#f1f5f9] hover:border-black/20 text-[#1e293b]'
                                                            }`}
                                                    >
                                                        <div className="w-2 h-2 rounded-full bg-[#2ecc71]" />
                                                        <span className="text-sm font-bold">{formatTime(slot)}</span>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="text-center py-20 text-[#888] text-xs font-bold uppercase tracking-widest">Nessun orario</div>
                                            )
                                        ) : (
                                            <div className="text-center py-20 text-[#888] text-xs font-bold uppercase tracking-widest">Seleziona data</div>
                                        )}
                                    </div>

                                    {selectedSlot && (
                                        <button onClick={() => setStep(2)} className="w-full mt-10 btn btn-primary py-4 rounded-xl font-black uppercase tracking-widest">Prosegui</button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="max-w-xl mx-auto bg-white p-12 rounded-3xl shadow-2xl border border-[#eee] text-black"
                        >
                            <button onClick={() => setStep(1)} className="text-[#888] hover:text-black flex items-center gap-1 text-xs font-black mb-10 transition-colors">
                                <ChevronLeft size={18} /> Indietro
                            </button>
                            <h2 className="text-4xl font-black mb-2 uppercase tracking-tighter">Dati Utente</h2>
                            <p className="text-[#888] text-xs font-black mb-10 uppercase tracking-widest">
                                {event.title} • {format(selectedDate, 'd MMMM', { locale: it })} • {selectedSlot}
                            </p>

                            <form className="space-y-6" onSubmit={handleBookingSubmission}>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" className="input bg-[#f8fafc]" required placeholder="Nome" value={bookingFormData.name} onChange={(e) => setBookingFormData({ ...bookingFormData, name: e.target.value })} />
                                    <input type="text" className="input bg-[#f8fafc]" required placeholder="Cognome" value={bookingFormData.surname} onChange={(e) => setBookingFormData({ ...bookingFormData, surname: e.target.value })} />
                                </div>
                                <input type="tel" className="input bg-[#f8fafc]" required placeholder="Cellulare" value={bookingFormData.phone} onChange={(e) => setBookingFormData({ ...bookingFormData, phone: e.target.value })} />
                                <input type="email" className="input bg-[#f8fafc]" placeholder="Email (Opzionale)" value={bookingFormData.email} onChange={(e) => setBookingFormData({ ...bookingFormData, email: e.target.value })} />
                                <button type="submit" disabled={submitting} className="btn btn-primary w-full py-5 rounded-2xl font-black text-lg uppercase tracking-widest">
                                    {submitting ? <Loader2 className="animate-spin mx-auto" size={24} /> : 'Conferma Prenotazione'}
                                </button>
                            </form>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="max-w-md mx-auto bg-white p-16 rounded-3xl shadow-2xl text-center border border-[#eee] text-black"
                        >
                            <div className="w-24 h-24 bg-[#2ecc71]/10 rounded-full flex items-center justify-center mx-auto mb-10">
                                <CheckCircle className="text-[#2ecc71]" size={64} />
                            </div>
                            <h2 className="text-4xl font-black mb-4 uppercase tracking-tighter">Fatto!</h2>
                            <p className="text-[#444] mb-12 font-bold leading-relaxed">{event.title} programmato per il {format(selectedDate, 'd MMMM', { locale: it })} alle {selectedSlot}.</p>
                            <button onClick={() => window.location.reload()} className="btn btn-primary w-full py-5 rounded-2xl font-black uppercase tracking-widest">Chiudi</button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default BookingPage;

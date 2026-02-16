import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, MapPin, CheckCircle, ChevronLeft, ChevronRight, Loader2, RefreshCw, Globe, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isAfter, startOfToday, parse, addMinutes, isBefore, startOfDay, startOfWeek, endOfWeek } from 'date-fns';
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
    const [timeFormat, setTimeFormat] = useState('24h'); // '12h' or '24h'

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
                    setCurrentMonth(new Date(data.start_date));
                    setSelectedDate(new Date(data.start_date));
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
        <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
            <Loader2 className="animate-spin text-[#222]" size={48} />
        </div>
    );

    if (!event) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#f5f5f5]">
            <h1 className="text-2xl font-bold text-[#222]">Evento non trovato</h1>
            <button onClick={() => window.location.href = '/'} className="btn btn-primary px-8">Torna alla Home</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f5f5f5] py-20 px-4 flex justify-center items-start">
            <div className="w-full max-w-[1100px]">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] overflow-hidden border border-[#eee]"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
                                {/* Info Panel */}
                                <div className="md:col-span-3 p-10 border-r border-[#f0f0f0] flex flex-col">
                                    <div className="flex flex-col items-start gap-4 mb-10">
                                        <div className="w-12 h-12 bg-[#222] rounded-full flex items-center justify-center">
                                            <span className="text-white text-lg">🌾</span>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-[#888] uppercase tracking-wider mb-1">Aloe di Elisabetta</p>
                                            <h1 className="text-2xl font-black text-[#111] leading-tight uppercase tracking-tight">{event.title}</h1>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h2 className="text-lg font-black text-[#111] uppercase tracking-tight">{event.title}</h2>

                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 text-sm font-bold text-[#555]">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center"><Clock size={16} /></div>
                                                {event.duration_minutes}m
                                            </div>
                                            <div className="flex items-center gap-3 text-sm font-bold text-[#555]">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center"><RefreshCw size={16} /></div>
                                                <span>Ogni mese per <span className="inline-block px-3 py-1 border border-[#ddd] rounded-full mx-1">1</span> occorrenza</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm font-bold text-[#555]">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center"><MapPin size={16} /></div>
                                                <span className="uppercase text-[10px] break-all">{event.location || "PUCCINI 74 IMOLA BOLOGNA"}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm font-bold text-[#555]">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center"><Globe size={16} /></div>
                                                <div className="flex items-center gap-1">
                                                    <span>Australia/Perth</span>
                                                    <ChevronDown size={14} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Calendar Panel */}
                                <div className="md:col-span-6 p-10 border-r border-[#f0f0f0]">
                                    <div className="flex justify-between items-center mb-12">
                                        <h3 className="text-xl font-bold text-[#111] capitalize">
                                            {format(currentMonth, 'MMMM yyyy', { locale: it })}
                                        </h3>
                                        <div className="flex gap-4">
                                            <button onClick={() => setCurrentMonth(addDays(startOfMonth(currentMonth), -1))} className="text-[#888] hover:text-[#000] transition-colors"><ChevronLeft size={20} /></button>
                                            <button onClick={() => setCurrentMonth(addDays(endOfMonth(currentMonth), 1))} className="text-[#888] hover:text-[#000] transition-colors"><ChevronRight size={20} /></button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-7 gap-2 mb-6">
                                        {['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'].map(day => (
                                            <div key={day} className="text-center text-[10px] font-black text-[#aaa] tracking-widest">{day}</div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-7 gap-3">
                                        {calendarDays.map(day => {
                                            const today = startOfToday();
                                            const isPastDay = isBefore(day, today);
                                            const isSelected = selectedDate && isSameDay(day, selectedDate);
                                            const isThisMonth = isSameMonth(day, currentMonth);

                                            // Mock availability logic to match visual (grey boxes on available days)
                                            // Real logic: recurring or single_week
                                            let isAvailable = !isPastDay && isThisMonth;
                                            if (event.event_type === 'single_week' && event.start_date) {
                                                const start = startOfDay(new Date(event.start_date));
                                                const end = addDays(start, 6);
                                                isAvailable = !isPastDay && day >= start && day <= end;
                                            }

                                            return (
                                                <button
                                                    key={day.toISOString()}
                                                    disabled={!isAvailable}
                                                    onClick={() => { setSelectedDate(day); setSelectedSlot(null); }}
                                                    className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all relative ${isSelected
                                                            ? 'bg-[#111] text-white shadow-lg z-10 font-bold'
                                                            : isAvailable
                                                                ? 'bg-[#e9ecef] text-[#111] hover:bg-[#dee2e6] font-bold'
                                                                : 'text-[#bbb] cursor-not-allowed'
                                                        } ${!isThisMonth ? 'opacity-0' : ''}`}
                                                >
                                                    {format(day, 'd')}
                                                    {isSameDay(day, today) && !isSelected && (
                                                        <div className="absolute bottom-1.5 w-1 h-1 bg-[#111] rounded-full" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Slots Panel */}
                                <div className="md:col-span-3 p-10 bg-white">
                                    <div className="flex justify-between items-center mb-10">
                                        <h3 className="text-sm font-bold text-[#111]">
                                            {selectedDate ? format(selectedDate, 'eee d', { locale: it }) : 'Seleziona'}
                                        </h3>
                                        <div className="flex bg-[#f0f0f0] p-1 rounded-lg">
                                            <button
                                                onClick={() => setTimeFormat('12h')}
                                                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${timeFormat === '12h' ? 'bg-white shadow-sm' : 'text-[#888]'}`}
                                            >12h</button>
                                            <button
                                                onClick={() => setTimeFormat('24h')}
                                                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${timeFormat === '24h' ? 'bg-white shadow-sm' : 'text-[#888]'}`}
                                            >24 ore</button>
                                        </div>
                                    </div>

                                    <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                                        {selectedDate ? (
                                            availableSlots.length > 0 ? (
                                                availableSlots.map(slot => (
                                                    <button
                                                        key={slot}
                                                        onClick={() => setSelectedSlot(slot)}
                                                        className={`w-full py-4 px-6 rounded-xl border transition-all text-sm font-bold flex items-center gap-3 ${selectedSlot === slot
                                                                ? 'border-[#2ecc71] bg-[#f0fff4] text-[#111]'
                                                                : 'border-[#eee] hover:border-[#111] text-[#111]'
                                                            }`}
                                                    >
                                                        <div className={`w-2 h-2 rounded-full ${selectedSlot === slot ? 'bg-[#2ecc71]' : 'bg-[#2ecc71]'}`} />
                                                        {formatTime(slot)}
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="text-center py-20 text-[#888] text-xs font-bold">Nessun orario disponibile.</div>
                                            )
                                        ) : (
                                            <div className="text-center py-20 text-[#888] text-xs font-bold">Seleziona una data.</div>
                                        )}
                                    </div>

                                    {selectedSlot && (
                                        <button onClick={() => setStep(2)} className="w-full mt-10 btn btn-primary py-4 rounded-xl font-bold">Prosegui</button>
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
                            className="max-w-xl mx-auto bg-white p-10 rounded-2xl shadow-xl border border-[#eee]"
                        >
                            <button onClick={() => setStep(1)} className="text-[#888] hover:text-[#111] flex items-center gap-1 text-sm font-bold mb-10 transition-colors">
                                <ChevronLeft size={18} /> Indietro
                            </button>
                            <h2 className="text-4xl font-black text-[#111] mb-2 uppercase tracking-tight">Dati Prenotazione</h2>
                            <p className="text-[#888] text-sm font-bold mb-10 uppercase tracking-widest">{event.title} • {format(selectedDate, 'd MMMM', { locale: it })} • {selectedSlot}</p>

                            <form className="space-y-6" onSubmit={handleBookingSubmission}>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" className="input bg-[#f9f9f9] border-[#eee]" required placeholder="Nome" value={bookingFormData.name} onChange={(e) => setBookingFormData({ ...bookingFormData, name: e.target.value })} />
                                    <input type="text" className="input bg-[#f9f9f9] border-[#eee]" required placeholder="Cognome" value={bookingFormData.surname} onChange={(e) => setBookingFormData({ ...bookingFormData, surname: e.target.value })} />
                                </div>
                                <input type="tel" className="input bg-[#f9f9f9] border-[#eee]" required placeholder="Cellulare" value={bookingFormData.phone} onChange={(e) => setBookingFormData({ ...bookingFormData, phone: e.target.value })} />
                                <input type="email" className="input bg-[#f9f9f9] border-[#eee]" placeholder="Email (Opzionale)" value={bookingFormData.email} onChange={(e) => setBookingFormData({ ...bookingFormData, email: e.target.value })} />
                                <button type="submit" disabled={submitting} className="btn btn-primary w-full py-5 rounded-2xl font-black text-lg uppercase tracking-widest">
                                    {submitting ? <Loader2 className="animate-spin mx-auto" size={24} /> : 'Conferma'}
                                </button>
                            </form>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="max-w-md mx-auto bg-white p-16 rounded-3xl shadow-2xl text-center border border-[#eee]"
                        >
                            <div className="w-24 h-24 bg-[#2ecc71]/10 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner">
                                <CheckCircle className="text-[#2ecc71]" size={56} />
                            </div>
                            <h2 className="text-4xl font-black text-[#111] mb-4 uppercase tracking-tighter">Confermato!</h2>
                            <p className="text-[#555] mb-12 font-bold leading-relaxed">{event.title} programmato per il {format(selectedDate, 'd MMMM', { locale: it })} alle {selectedSlot}.</p>
                            <button onClick={() => window.location.reload()} className="btn btn-primary w-full py-5 rounded-2xl font-black uppercase tracking-widest">Fine</button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

const isSameMonth = (d1, d2) => d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

export default BookingPage;

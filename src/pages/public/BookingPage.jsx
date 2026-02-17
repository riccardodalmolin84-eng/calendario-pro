import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, MapPin, CheckCircle, ChevronLeft, ChevronRight, Loader2, RefreshCw, Globe, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { downloadICSFile } from '../../utils/calendar';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isAfter, startOfToday, parse, addMinutes, isBefore, startOfDay, startOfWeek, endOfWeek, isSameMonth, areIntervalsOverlapping, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

const BookingPage = () => {
    const { slug: rawSlug } = useParams();
    const slug = rawSlug?.trim().replace(/\/$/, '');
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState(null);
    const [availability, setAvailability] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [timeFormat, setTimeFormat] = useState('24h');
    const today = startOfToday();
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

    useEffect(() => {
        if (event) fetchBookings();
    }, [event, currentMonth]);

    const fetchBookings = async () => {
        if (!event) return;
        const start = startOfMonth(currentMonth).toISOString();
        const end = endOfMonth(currentMonth).toISOString();
        const { data } = await supabase
            .from('bookings')
            .select('start_time, end_time')
            .eq('event_id', event.id)
            .gte('start_time', start)
            .lte('end_time', end);

        if (data) setBookings(data);
    };

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
                setSelectedDate(startOfToday());
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

    const availableDates = useMemo(() => {
        if (!availability || !event) return new Set();

        const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
        const availableSet = new Set();

        calendarDays.forEach(day => {
            const today = startOfToday();
            // Basic month and past check
            if (isBefore(day, today) || !isSameMonth(day, currentMonth)) return;

            // Type specific activation/expiry logic
            if (event.event_type === 'recurring' && event.start_date) {
                if (isBefore(day, startOfDay(new Date(event.start_date)))) return;
            }
            if (event.event_type === 'single_week' && event.start_date) {
                const start = startOfDay(new Date(event.start_date));
                const end = addDays(start, 6);
                if (day < start || day > end) return;
            }

            const dayName = dayNames[getDay(day)];
            const rules = availability.rules[dayName] || [];
            if (rules.length === 0) return;

            // Deep check for real available slots
            const duration = event.duration_minutes;
            let hasFreeSlot = false;

            for (const rule of rules) {
                let current = parse(rule.start, 'HH:mm', day);
                const end = parse(rule.end, 'HH:mm', day);

                while (isBefore(addMinutes(current, duration), end) || isSameDay(addMinutes(current, duration), end)) {
                    const slotEnd = addMinutes(current, duration);
                    const isOverlapping = bookings.some(b => {
                        const bStart = parseISO(b.start_time);
                        const bEnd = parseISO(b.end_time);
                        return areIntervalsOverlapping(
                            { start: current, end: slotEnd },
                            { start: bStart, end: bEnd }
                        );
                    });

                    if (!isOverlapping) {
                        hasFreeSlot = true;
                        break;
                    }
                    current = addMinutes(current, duration);
                }
                if (hasFreeSlot) break;
            }

            if (hasFreeSlot) availableSet.add(day.toISOString());
        });

        return availableSet;
    }, [calendarDays, availability, event, bookings, currentMonth]);

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
                const slotEnd = addMinutes(current, duration);
                const isOverlapping = bookings.some(b => {
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
    }, [selectedDate, availability, event, bookings]);

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
        const { error } = await supabase.from('bookings').insert([{
            event_id: event.id,
            user_name: bookingFormData.name,
            user_surname: bookingFormData.surname,
            user_phone: bookingFormData.phone,
            user_email: bookingFormData.email,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString()
        }]);
        if (!error) {
            fetchBookings();
            setStep(3);
        } else {
            alert('Errore: ' + error.message);
        }
        setSubmitting(false);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-black" size={48} /></div>;
    if (!event) return <div className="min-h-screen flex flex-col items-center justify-center bg-white"><h1>Evento non trovato</h1></div>;

    return (
        <div className="min-h-screen bg-[#fcfcfc] py-12 px-4 flex justify-center items-start">
            <div className="booking-container bg-white shadow-2xl">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <>
                            {/* 1. INFO PANEL */}
                            <div className="p-10 border-r border-[#f0f0f0] flex flex-col bg-white">
                                <div className="mb-12">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center shadow-lg">
                                            <span className="text-white text-xl">🌿</span>
                                        </div>
                                        <span className="text-[11px] font-black uppercase tracking-wider text-[#999]">Aloe di Elisabetta</span>
                                    </div>
                                    <h1 className="text-2xl font-black text-[#111] leading-tight uppercase tracking-tighter mb-2">{event.title}</h1>
                                    <p className="text-sm font-bold text-[#111]">{event.title}</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-start gap-4 text-sm font-bold text-[#444]">
                                        <Clock size={18} className="shrink-0 mt-0.5" />
                                        <span>{event.duration_minutes}m</span>
                                    </div>
                                    <div className="flex items-start gap-4 text-sm font-bold text-[#444]">
                                        <RefreshCw size={18} className="shrink-0 mt-0.5" />
                                        <div className="flex flex-col gap-2">
                                            <span>Ogni mese per</span>
                                            <div className="flex items-center gap-2">
                                                <div className="px-3 py-1 border border-[#ddd] rounded-full text-[10px] font-black">1</div>
                                                <span className="text-xs">occorrenza</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 text-sm font-bold text-[#444]">
                                        <MapPin size={18} className="shrink-0 mt-0.5" />
                                        <span className="uppercase text-[10px] tracking-tight leading-relaxed">{event.location || "PUCCINI 74 IMOLA BOLOGNA"}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm font-bold text-[#444]">
                                        <Globe size={18} className="shrink-0" />
                                        <div className="flex items-center gap-1 cursor-pointer">
                                            <span>Australia/Perth</span>
                                            <ChevronDown size={14} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. CALENDAR PANEL */}
                            <div className="p-10 border-r border-[#f0f0f0] bg-white">
                                <div className="flex justify-between items-center mb-10">
                                    <h3 className="text-xl font-black text-[#111] capitalize">
                                        {format(currentMonth, 'MMMM yyyy', { locale: it })}
                                    </h3>
                                    <div className="flex gap-4">
                                        <button onClick={() => setCurrentMonth(addDays(startOfMonth(currentMonth), -1))} className="text-[#ccc] hover:text-black transition-colors"><ChevronLeft size={22} /></button>
                                        <button onClick={() => setCurrentMonth(addDays(endOfMonth(currentMonth), 1))} className="text-[#ccc] hover:text-black transition-colors"><ChevronRight size={22} /></button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-7 gap-1 mb-6">
                                    {['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'].map(d => (
                                        <div key={d} className="text-center text-[11px] font-black text-[#bbb] tracking-widest py-2">{d}</div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-7 gap-2.5">
                                    {calendarDays.map(day => {
                                        const isSelected = selectedDate && isSameDay(day, selectedDate);
                                        const isMonthDay = isSameMonth(day, currentMonth);
                                        const isAvailable = availableDates.has(day.toISOString());

                                        return (
                                            <button
                                                key={day.toISOString()}
                                                disabled={!isAvailable}
                                                onClick={() => { setSelectedDate(day); setSelectedSlot(null); }}
                                                className={`aspect-square relative flex items-center justify-center rounded-lg text-sm transition-all ${isSelected
                                                    ? 'bg-[#111] text-white shadow-xl font-black z-10'
                                                    : isAvailable
                                                        ? 'bg-white border-2 border-black text-[#111] font-black'
                                                        : 'bg-[#f0f2f5] text-[#ddd] cursor-not-allowed opacity-50'
                                                    } ${!isMonthDay ? 'opacity-0 pointer-events-none' : ''}`}
                                            >
                                                {format(day, 'd')}
                                                {isSameDay(day, today) && !isSelected && (
                                                    <div className="absolute bottom-1 w-1.5 h-1.5 bg-[#111] rounded-full" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 3. SLOTS PANEL */}
                            <div className="p-10 flex flex-col bg-white">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-sm font-black text-[#111] capitalize">
                                        {selectedDate ? format(selectedDate, 'eee d', { locale: it }) : 'Orari'}
                                    </h3>
                                    <div className="flex bg-[#f0f2f5] p-1 rounded-lg">
                                        <button onClick={() => setTimeFormat('12h')} className={`px-3 py-1 text-xs font-black rounded-lg transition-all ${timeFormat === '12h' ? 'bg-white shadow-sm' : 'text-[#888]'}`}>12h</button>
                                        <button onClick={() => setTimeFormat('24h')} className={`px-3 py-1 text-xs font-black rounded-lg transition-all ${timeFormat === '24h' ? 'bg-white shadow-sm' : 'text-[#888]'}`}>24 ore</button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 max-h-[450px]">
                                    {selectedDate ? (
                                        availableSlots.length > 0 ? (
                                            availableSlots.map(slot => (
                                                <button
                                                    key={slot}
                                                    onClick={() => setSelectedSlot(slot)}
                                                    className={`w-full py-4 px-6 rounded-xl border-2 transition-all flex items-center justify-start gap-4 ${selectedSlot === slot
                                                        ? 'border-black bg-black text-white shadow-xl font-black scale-[1.02]'
                                                        : 'border-[#f0f2f5] hover:border-black/20 text-[#222] bg-white'
                                                        }`}
                                                >
                                                    <div className={`w-2 h-2 rounded-full ${selectedSlot === slot ? 'bg-white animate-pulse' : 'bg-[#2ecc71]'}`} />
                                                    <span className="text-sm font-bold">{formatTime(slot)}</span>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="text-center py-20 text-[#bbb] text-xs font-black uppercase tracking-widest">Nessun Orario</div>
                                        )
                                    ) : (
                                        <div className="text-center py-20 text-[#bbb] text-xs font-black uppercase tracking-widest">Seleziona Data</div>
                                    )}
                                </div>

                                {selectedSlot && (
                                    <motion.button
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onClick={() => setStep(2)}
                                        className="w-full mt-8 btn btn-primary py-4 uppercase tracking-widest font-black"
                                    >
                                        Prosegui
                                    </motion.button>
                                )}
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="col-span-full p-20 flex flex-col items-center justify-center bg-white">
                            <div className="w-full max-w-lg">
                                <button onClick={() => setStep(1)} className="text-[#888] hover:text-black flex items-center gap-1 text-xs font-black mb-10 transition-colors uppercase tracking-widest">
                                    <ChevronLeft size={18} /> Indietro
                                </button>
                                <h2 className="text-4xl font-black mb-2 tracking-tighter uppercase">Conferma i dati</h2>
                                <p className="text-[#888] text-xs font-bold mb-10 uppercase tracking-widest">
                                    {event.title} • {format(selectedDate, 'd MMMM', { locale: it })} • {selectedSlot}
                                </p>
                                <form className="space-y-4" onSubmit={handleBookingSubmission}>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="text" className="input" required placeholder="Nome" value={bookingFormData.name} onChange={(e) => setBookingFormData({ ...bookingFormData, name: e.target.value })} />
                                        <input type="text" className="input" required placeholder="Cognome" value={bookingFormData.surname} onChange={(e) => setBookingFormData({ ...bookingFormData, surname: e.target.value })} />
                                    </div>
                                    <input type="tel" className="input" required placeholder="Cellulare" value={bookingFormData.phone} onChange={(e) => setBookingFormData({ ...bookingFormData, phone: e.target.value })} />
                                    <div>
                                        <input type="email" className="input" placeholder="Email (Opzionale)" value={bookingFormData.email} onChange={(e) => setBookingFormData({ ...bookingFormData, email: e.target.value })} />
                                        <p className="text-xs text-[#888] mt-2 italic">Ti invio un promemoria sul tuo calendario</p>
                                    </div>
                                    <div className="bg-primary/5 p-4 rounded-xl mb-6 text-center border border-primary/20">
                                        <p className="text-sm font-medium text-text-main">
                                            Stai prenotando per <span className="font-bold">{format(selectedDate, 'd MMMM yyyy', { locale: it })}</span> alle <span className="font-bold">{selectedSlot}</span>
                                        </p>
                                    </div>
                                    <button type="submit" disabled={submitting} className="btn btn-primary w-full py-5 text-lg uppercase tracking-widest font-black mt-4">
                                        {submitting ? <Loader2 className="animate-spin" size={24} /> : 'Conferma Prenotazione'}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="col-span-full p-20 flex flex-col items-center justify-center text-center bg-white">
                            <div className="w-24 h-24 bg-[#2ecc71]/10 rounded-full flex items-center justify-center mb-10">
                                <CheckCircle className="text-[#2ecc71]" size={64} />
                            </div>
                            <h2 className="text-5xl font-black mb-4 tracking-tighter uppercase">Successo!</h2>
                            <p className="text-[#111] max-w-md mx-auto mb-12 font-bold text-lg leading-relaxed">Il tuo appuntamento per <b>{event.title}</b> è stato confermato per il {format(selectedDate, 'd MMMM', { locale: it })} alle {selectedSlot}.</p>

                            <div className="flex flex-col gap-3 w-full max-w-md justify-center mt-6">
                                <p className="text-xs font-bold uppercase tracking-widest text-[#888] mb-2">Aggiungi al calendario</p>

                                {/* Google Calendar */}
                                <a
                                    href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${format(selectedDate, 'yyyyMMdd') + 'T' + selectedSlot.replace(':', '') + '00'}/${format(selectedDate, 'yyyyMMdd') + 'T' + format(addMinutes(parse(selectedSlot, 'HH:mm', selectedDate), event.duration_minutes), 'HHmm') + '00'}&details=${encodeURIComponent('Appuntamento con Aloe di Elisabetta')}&location=${encodeURIComponent(event.location || '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-outline py-4 text-sm font-bold flex items-center justify-center gap-3 border-[#eee] hover:border-black transition-all"
                                >
                                    <span className="text-lg">📅</span>
                                    Google Calendar
                                </a>

                                {/* Outlook Calendar */}
                                <a
                                    href={`https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&startdt=${format(parse(selectedSlot, 'HH:mm', selectedDate), "yyyy-MM-dd'T'HH:mm:ss")}&enddt=${format(addMinutes(parse(selectedSlot, 'HH:mm', selectedDate), event.duration_minutes), "yyyy-MM-dd'T'HH:mm:ss")}&subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent('Appuntamento con Aloe di Elisabetta')}&location=${encodeURIComponent(event.location || '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-outline py-4 text-sm font-bold flex items-center justify-center gap-3 border-[#eee] hover:border-[#0078d4] hover:text-[#0078d4] transition-all"
                                >
                                    <span className="text-lg">📧</span>
                                    Outlook
                                </a>

                                {/* iCal / iOS */}
                                <button
                                    onClick={() => {
                                        const [hours, minutes] = selectedSlot.split(':');
                                        const startTime = new Date(selectedDate);
                                        startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                                        const endTime = addMinutes(startTime, event.duration_minutes);

                                        downloadICSFile({
                                            start_time: startTime,
                                            end_time: endTime,
                                            eventTitle: event.title,
                                            user_name: bookingFormData.name,
                                            user_surname: bookingFormData.surname,
                                            location: event.location
                                        });
                                    }}
                                    className="btn btn-outline py-4 text-sm font-bold flex items-center justify-center gap-3 border-[#eee] hover:border-black transition-all"
                                >
                                    <span className="text-lg">🍏</span>
                                    Apple / iCal
                                </button>

                                <button onClick={() => window.location.reload()} className="btn btn-primary py-4 mt-4 text-lg uppercase tracking-widest font-black">Fine</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default BookingPage;

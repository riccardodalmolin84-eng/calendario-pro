import React, { useState, useEffect } from 'react';
import { Plus, Clock, Save, Trash2, Loader2, Copy, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';

const AvailabilitiesList = () => {
    const [availabilities, setAvailabilities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeId, setActiveId] = useState(null);

    useEffect(() => {
        fetchAvailabilities();
    }, []);

    const fetchAvailabilities = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('availabilities')
            .select('*')
            .order('created_at', { ascending: false });

        if (data && data.length > 0) {
            setAvailabilities(data);
            if (!activeId) setActiveId(data[0].id);
        } else {
            // Default if none exists
            const defaultAvail = {
                id: 'new',
                title: 'Orario di Lavoro Standard',
                rules: {
                    'Lunedì': [{ start: '09:00', end: '17:00' }],
                    'Martedì': [{ start: '09:00', end: '17:00' }],
                    'Mercoledì': [{ start: '09:00', end: '17:00' }],
                    'Giovedì': [{ start: '09:00', end: '17:00' }],
                    'Venerdì': [{ start: '09:00', end: '17:00' }],
                    'Sabato': [],
                    'Domenica': []
                }
            };
            setAvailabilities([defaultAvail]);
            setActiveId('new');
        }
        setLoading(false);
    };

    const handleSave = async (avail) => {
        setSaving(true);
        const { id, created_at, ...updateData } = avail;

        try {
            let result;
            if (id === 'new') {
                result = await supabase.from('availabilities').insert([updateData]).select();
            } else {
                result = await supabase.from('availabilities').update(updateData).eq('id', id).select();
            }

            if (!result.error) {
                // If it was 'new', update the ID in state to avoid creating duplicates
                if (id === 'new' && result.data?.[0]) {
                    setActiveId(result.data[0].id);
                }
                fetchAvailabilities();
                // We could use a toast here instead of alert
            } else {
                alert('Errore nel salvataggio: ' + result.error.message);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const updateTitle = (id, newTitle) => {
        setAvailabilities(availabilities.map(a => a.id === id ? { ...a, title: newTitle } : a));
    };

    const addSlot = (availId, day) => {
        setAvailabilities(availabilities.map(a => {
            if (a.id === availId) {
                const newRules = { ...a.rules };
                newRules[day] = [...(newRules[day] || []), { start: '09:00', end: '17:00' }];
                return { ...a, rules: newRules };
            }
            return a;
        }));
    };

    const removeSlot = (availId, day, index) => {
        setAvailabilities(availabilities.map(a => {
            if (a.id === availId) {
                const newRules = { ...a.rules };
                newRules[day] = newRules[day].filter((_, i) => i !== index);
                return { ...a, rules: newRules };
            }
            return a;
        }));
    };

    const updateSlot = (availId, day, index, field, value) => {
        setAvailabilities(availabilities.map(a => {
            if (a.id === availId) {
                const newRules = { ...a.rules };
                const newDaySlots = [...newRules[day]];
                newDaySlots[index] = { ...newDaySlots[index], [field]: value };
                newRules[day] = newDaySlots;
                return { ...a, rules: newRules };
            }
            return a;
        }));
    };

    const createAvailability = async () => {
        setSaving(true);
        const newAvail = {
            title: 'Nuova Disponibilità',
            rules: {
                'Lunedì': [{ start: '09:00', end: '17:00' }],
                'Martedì': [{ start: '09:00', end: '17:00' }],
                'Mercoledì': [{ start: '09:00', end: '17:00' }],
                'Giovedì': [{ start: '09:00', end: '17:00' }],
                'Venerdì': [{ start: '09:00', end: '17:00' }],
                'Sabato': [],
                'Domenica': []
            }
        };

        const { data, error } = await supabase.from('availabilities').insert([newAvail]).select();
        if (!error && data?.[0]) {
            setActiveId(data[0].id);
            fetchAvailabilities();
        } else {
            alert('Errore: ' + error?.message);
        }
        setSaving(false);
    };

    const duplicateAvailability = async (avail) => {
        setSaving(true);
        const { id, created_at, ...copyData } = avail;
        copyData.title = `${copyData.title} (Copia)`;

        const { data, error } = await supabase.from('availabilities').insert([copyData]).select();
        if (!error && data?.[0]) {
            setActiveId(data[0].id);
            fetchAvailabilities();
        } else {
            alert('Errore nella duplicazione: ' + error?.message);
        }
        setSaving(false);
    };

    const deleteAvailability = async (id) => {
        if (!window.confirm('Sei sicuro di voler eliminare questa disponibilità?')) return;

        setSaving(true);
        const { error } = await supabase.from('availabilities').delete().eq('id', id);
        if (!error) {
            if (activeId === id) setActiveId(null);
            fetchAvailabilities();
        } else {
            alert('Errore: ' + error.message);
        }
        setSaving(false);
    };

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <Loader2 className="animate-spin text-primary" size={48} />
        </div>
    );

    const activeAvail = availabilities.find(a => a.id === activeId) || availabilities[0];

    return (
        <div className="animate-fade-in max-w-5xl">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl tracking-tight">Regole di Disponibilità</h1>
                    <p className="text-text-muted">Crea diversi set di orari per i tuoi vari servizi.</p>
                </div>
                <button
                    onClick={createAvailability}
                    disabled={saving}
                    className="btn btn-primary gap-2 shadow-lg shadow-primary/20"
                >
                    <Plus size={18} /> Nuova Disponibilità
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-4 flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2 px-1">I tuoi Orari</label>
                    {availabilities.map((avail) => (
                        <button
                            key={avail.id}
                            onClick={() => setActiveId(avail.id)}
                            className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left ${activeId === avail.id
                                    ? 'bg-primary/10 border-primary text-primary active-ring'
                                    : 'bg-glass-bg border-glass-border text-text-muted hover:border-primary/50'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Calendar size={18} />
                                <span className="font-medium truncate max-w-[150px]">{avail.title}</span>
                            </div>
                            {activeId === avail.id && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-8">
                    {activeAvail && (
                        <motion.div
                            key={activeAvail.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="card overflow-visible"
                        >
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-glass-border">
                                <div className="flex-1 w-full">
                                    <label className="label">Nome della Disponibilità</label>
                                    <input
                                        type="text"
                                        className="bg-transparent border-none text-2xl font-bold outline-none border-b-2 border-transparent focus:border-primary w-full py-1 hover:bg-white/5 rounded px-2 -mx-2 transition-colors"
                                        value={activeAvail.title}
                                        onChange={(e) => updateTitle(activeAvail.id, e.target.value)}
                                        placeholder="Esempio: Orario Estivo"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => duplicateAvailability(activeAvail)}
                                        className="btn btn-outline p-2.5"
                                        title="Duplica"
                                    >
                                        <Copy size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleSave(activeAvail)}
                                        disabled={saving}
                                        className="btn btn-primary gap-2 min-w-[140px]"
                                    >
                                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                        Salva
                                    </button>
                                    {activeAvail.id !== 'new' && (
                                        <button
                                            onClick={() => deleteAvailability(activeAvail.id)}
                                            className="btn btn-outline border-error/30 text-error hover:bg-error/10 p-2.5"
                                            title="Elimina"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1">
                                {['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'].map((day) => (
                                    <div key={day} className="group flex flex-col md:flex-row items-start md:items-center gap-4 py-4 px-2 hover:bg-white/5 rounded-xl transition-colors">
                                        <div className="w-28 font-semibold text-sm">{day}</div>
                                        <div className="flex-1 flex flex-wrap gap-3">
                                            {activeAvail.rules[day]?.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {activeAvail.rules[day].map((slot, index) => (
                                                        <div key={index} className="flex items-center gap-2 bg-bg-input border border-glass-border p-1.5 rounded-lg group/slot shadow-sm">
                                                            <input
                                                                type="time"
                                                                className="bg-transparent border-none outline-none text-xs text-text-main font-medium cursor-pointer"
                                                                value={slot.start}
                                                                onChange={(e) => updateSlot(activeAvail.id, day, index, 'start', e.target.value)}
                                                            />
                                                            <span className="text-text-muted text-[10px]">-</span>
                                                            <input
                                                                type="time"
                                                                className="bg-transparent border-none outline-none text-xs text-text-main font-medium cursor-pointer"
                                                                value={slot.end}
                                                                onChange={(e) => updateSlot(activeAvail.id, day, index, 'end', e.target.value)}
                                                            />
                                                            <button
                                                                onClick={() => removeSlot(activeAvail.id, day, index)}
                                                                className="opacity-0 group-hover/slot:opacity-100 transition-opacity text-error hover:scale-110 p-1"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-text-muted italic py-1.5">Nessun orario definito</span>
                                            )}
                                            <button
                                                onClick={() => addSlot(activeAvail.id, day)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:text-primary-hover text-[11px] font-bold flex items-center gap-1 p-1.5 uppercase tracking-wider"
                                            >
                                                <Plus size={14} /> Aggiungi
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AvailabilitiesList;


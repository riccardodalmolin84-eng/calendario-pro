import React, { useState, useEffect } from 'react';
import { Plus, Clock, Save, Trash2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';

const AvailabilitiesList = () => {
    const [availabilities, setAvailabilities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchAvailabilities();
    }, []);

    const fetchAvailabilities = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('availabilities')
            .select('*');

        if (data && data.length > 0) {
            setAvailabilities(data);
        } else {
            // Default if none exists
            setAvailabilities([{
                id: 'new',
                title: 'Orario di Lavoro Predefinito',
                rules: {
                    'Lunedì': [{ start: '09:00', end: '17:00' }],
                    'Martedì': [{ start: '09:00', end: '17:00' }],
                    'Mercoledì': [{ start: '09:00', end: '17:00' }],
                    'Giovedì': [{ start: '09:00', end: '17:00' }],
                    'Venerdì': [{ start: '09:00', end: '17:00' }],
                    'Sabato': [],
                    'Domenica': []
                }
            }]);
        }
        setLoading(false);
    };

    const handleSave = async (avail) => {
        setSaving(true);
        const { id, created_at, ...updateData } = avail;

        let result;
        if (id === 'new') {
            result = await supabase.from('availabilities').insert([updateData]);
        } else {
            result = await supabase.from('availabilities').update(updateData).eq('id', id);
        }

        if (!result.error) {
            alert('Disponibilità salvata con successo!');
            fetchAvailabilities();
        } else {
            alert('Errore nel salvataggio: ' + result.error.message);
        }
        setSaving(false);
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
                newRules[day][index][field] = value;
                return { ...a, rules: newRules };
            }
            return a;
        }));
    };

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <Loader2 className="animate-spin text-primary" size={48} />
        </div>
    );

    return (
        <div className="animate-fade-in">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl">Disponibilità</h1>
                    <p className="text-text-muted">Definisci le tue regole di orario da utilizzare per gli eventi.</p>
                </div>
                {/* For now, we support editing the primary one */}
            </header>

            <div className="flex flex-col gap-6">
                {availabilities.map((avail) => (
                    <div key={avail.id} className="card">
                        <div className="flex justify-between items-center mb-6">
                            <input
                                type="text"
                                className="bg-transparent border-none text-xl font-bold outline-none border-b border-transparent focus:border-primary"
                                value={avail.title}
                                onChange={(e) => updateTitle(avail.id, e.target.value)}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleSave(avail)}
                                    disabled={saving}
                                    className="btn btn-primary py-2 text-xs gap-1"
                                >
                                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                    Salva Modifiche
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            {['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'].map((day) => (
                                <div key={day} className="flex items-center gap-6 py-3 border-b border-glass-border last:border-0">
                                    <div className="w-32 font-medium">{day}</div>
                                    <div className="flex-1 flex flex-wrap gap-3">
                                        {avail.rules[day]?.map((slot, index) => (
                                            <div key={index} className="flex items-center gap-2 bg-glass-bg border border-glass-border px-3 py-1.5 rounded-lg text-sm">
                                                <input
                                                    type="time"
                                                    className="bg-transparent border-none outline-none text-text-main"
                                                    value={slot.start}
                                                    onChange={(e) => updateSlot(avail.id, day, index, 'start', e.target.value)}
                                                />
                                                <span>-</span>
                                                <input
                                                    type="time"
                                                    className="bg-transparent border-none outline-none text-text-main"
                                                    value={slot.end}
                                                    onChange={(e) => updateSlot(avail.id, day, index, 'end', e.target.value)}
                                                />
                                                <button
                                                    onClick={() => removeSlot(avail.id, day, index)}
                                                    className="text-error hover:text-error/80 ml-2"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => addSlot(avail.id, day)}
                                            className="text-primary hover:text-primary-hover text-sm font-medium flex items-center gap-1"
                                        >
                                            <Plus size={14} /> Aggiungi Fascia
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AvailabilitiesList;

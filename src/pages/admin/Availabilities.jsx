import React, { useState } from 'react';
import { Plus, Clock, Save, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const AvailabilitiesList = () => {
    const [availabilities, setAvailabilities] = useState([
        { id: '1', title: 'Orario di Lavoro Predefinito', rules: { monday: [{ start: '09:00', end: '17:00' }] } }
    ]);

    return (
        <div className="animate-fade-in">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl">Disponibilità</h1>
                    <p className="text-text-muted">Definisci le tue regole di orario da utilizzare per gli eventi.</p>
                </div>
                <button className="btn btn-primary gap-2">
                    <Plus size={20} /> Nuova Disponibilità
                </button>
            </header>

            <div className="flex flex-col gap-6">
                {availabilities.map((avail) => (
                    <div key={avail.id} className="card">
                        <div className="flex justify-between items-center mb-6">
                            <input
                                type="text"
                                className="bg-transparent border-none text-xl font-bold outline-none border-b border-transparent focus:border-primary"
                                defaultValue={avail.title}
                            />
                            <div className="flex gap-2">
                                <button className="btn btn-outline py-2 text-xs">Duplica</button>
                                <button className="btn btn-primary py-2 text-xs gap-1">
                                    <Save size={14} /> Salva Modifiche
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            {['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'].map((day) => (
                                <div key={day} className="flex items-center gap-6 py-3 border-b border-glass-border last:border-0">
                                    <div className="w-32 font-medium">{day}</div>
                                    <div className="flex-1 flex flex-wrap gap-3">
                                        <div className="flex items-center gap-2 bg-glass-bg border border-glass-border px-3 py-1.5 rounded-lg text-sm">
                                            <input type="time" className="bg-transparent border-none outline-none text-text-main" defaultValue="09:00" />
                                            <span>-</span>
                                            <input type="time" className="bg-transparent border-none outline-none text-text-main" defaultValue="17:00" />
                                            <button className="text-error hover:text-error/80 ml-2">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <button className="text-primary hover:text-primary-hover text-sm font-medium flex items-center gap-1">
                                            <Plus size={14} /> Aggiungi Fascia
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs text-text-muted">Non disponibile</label>
                                        <input type="checkbox" className="w-4 h-4 rounded border-glass-border bg-bg-input" />
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

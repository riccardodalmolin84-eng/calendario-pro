import React from 'react';
import { Users, Calendar, Clock, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="card flex flex-col gap-2"
    >
        <div className="flex justify-between items-start">
            <div className="bg-glass-bg p-3 rounded-xl border border-glass-border">
                {icon}
            </div>
            <span className="text-success flex items-center text-xs font-bold">
                +12% <ArrowUpRight size={12} />
            </span>
        </div>
        <div>
            <h3 className="text-text-muted text-sm font-medium">{title}</h3>
            <p className="text-3xl font-bold">{value}</p>
        </div>
    </motion.div>
);

const AdminDashboard = () => {
    return (
        <div className="animate-fade-in">
            <header className="mb-6">
                <h1 className="text-3xl">Dashboard Amministrazione</h1>
                <p className="text-text-muted">Bentornato! Ecco cosa sta succedendo con i tuoi appuntamenti.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard
                    title="Prenotazioni Totali"
                    value="128"
                    icon={<Users className="text-primary" size={24} />}
                    delay={0.1}
                />
                <StatCard
                    title="Eventi Attivi"
                    value="12"
                    icon={<Calendar className="text-primary" size={24} />}
                    delay={0.2}
                />
                <StatCard
                    title="Ore Prenotate"
                    value="84h"
                    icon={<Clock className="text-primary" size={24} />}
                    delay={0.3}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                    <h2 className="text-xl mb-4">Prenotazioni Recenti</h2>
                    <div className="flex flex-col gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-glass-bg border border-glass-border">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                        JD
                                    </div>
                                    <div>
                                        <p className="font-medium">Mario Rossi</p>
                                        <p className="text-xs text-text-muted">Consulenza Professionale • 14:00</p>
                                    </div>
                                </div>
                                <button className="btn btn-outline py-1 px-3 text-xs">Vedi</button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <h2 className="text-xl mb-4">Prossimi Appuntamenti</h2>
                    <div className="flex flex-col gap-4">
                        <p className="text-text-muted text-center py-8">Nessun evento in programma per le prossime 24 ore.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;

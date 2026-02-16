import React from 'react';
import { Mail, Phone, MessageSquare, Save, User } from 'lucide-react';

const Settings = () => {
    return (
        <div className="animate-fade-in max-w-4xl">
            <header className="mb-8">
                <h1 className="text-3xl">Impostazioni</h1>
                <p className="text-text-muted">Configura il tuo profilo, le notifiche e l'integrazione con WhatsApp.</p>
            </header>

            <div className="flex flex-col gap-8">
                {/* Profile Settings */}
                <section className="card">
                    <div className="flex items-center gap-2 mb-6">
                        <User className="text-primary" size={24} />
                        <h2 className="text-xl">Profilo Amministratore</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="label">E-mail Calendario</label>
                            <div className="flex items-center gap-2 bg-bg-input border border-glass-border px-3 rounded-lg">
                                <Mail size={18} className="text-text-muted" />
                                <input type="email" className="bg-transparent border-none outline-none py-2.5 flex-1 text-sm text-text-main" placeholder="admin@esempio.it" />
                            </div>
                            <p className="text-[10px] text-text-muted mt-1.5 px-1">Le notifiche e gli inviti del calendario saranno inviati qui.</p>
                        </div>
                        <div>
                            <label className="label">Numero WhatsApp</label>
                            <div className="flex items-center gap-2 bg-bg-input border border-glass-border px-3 rounded-lg">
                                <Phone size={18} className="text-text-muted" />
                                <input type="tel" className="bg-transparent border-none outline-none py-2.5 flex-1 text-sm text-text-main" placeholder="+39 123 456 7890" />
                            </div>
                            <p className="text-[10px] text-text-muted mt-1.5 px-1">Utilizzato per condividere link e ricevere avvisi WhatsApp.</p>
                        </div>
                    </div>
                </section>

                {/* WhatsApp Template Settings */}
                <section className="card">
                    <div className="flex items-center gap-2 mb-6">
                        <MessageSquare className="text-primary" size={24} />
                        <h2 className="text-xl">Template WhatsApp</h2>
                    </div>
                    <div>
                        <label className="label">Template Messaggio Predefinito</label>
                        <textarea
                            className="input min-h-[120px]"
                            defaultValue={`Ciao! Sono pronto per il nostro appuntamento.
Prenota qui il tuo slot: {event_url}

A presto!`}
                        />
                        <div className="flex flex-wrap gap-2 mt-3">
                            <span className="bg-glass-bg border border-glass-border text-[10px] px-2 py-1 rounded cursor-pointer hover:bg-glass-bg/80">{`{event_url}`}</span>
                            <span className="bg-glass-bg border border-glass-border text-[10px] px-2 py-1 rounded cursor-pointer hover:bg-glass-bg/80">{`{event_title}`}</span>
                            <span className="bg-glass-bg border border-glass-border text-[10px] px-2 py-1 rounded cursor-pointer hover:bg-glass-bg/80">{`{admin_name}`}</span>
                        </div>
                    </div>
                </section>

                <div className="flex justify-end gap-3">
                    <button className="btn btn-primary gap-2 px-8">
                        <Save size={18} /> Salva Impostazioni
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;

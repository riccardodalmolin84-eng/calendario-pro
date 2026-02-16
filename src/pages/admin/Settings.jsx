import React, { useState, useEffect, useMemo } from 'react';
import { Mail, Phone, MessageSquare, Save, User, Loader2, Eye, Calendar, CheckSquare, Square } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const Settings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [events, setEvents] = useState([]);
    const [selectedEventIds, setSelectedEventIds] = useState([]);
    const [profile, setProfile] = useState({
        email: '',
        phone: '',
        whatsapp_template: `Ciao! Ecco i link per i nostri appuntamenti:
{event_links}

A presto!`
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: profileData } = await supabase
                .from('admin_profiles')
                .select('*')
                .maybeSingle();

            if (profileData) {
                setProfile({
                    email: profileData.email || '',
                    phone: profileData.phone || '',
                    whatsapp_template: profileData.whatsapp_template || profile.whatsapp_template
                });
            }

            const { data: eventsData } = await supabase
                .from('events')
                .select('id, title, slug');

            if (eventsData) {
                setEvents(eventsData);
                if (eventsData.length > 0) {
                    setSelectedEventIds([eventsData[0].id]);
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { data: existing } = await supabase
                .from('admin_profiles')
                .select('id')
                .maybeSingle();

            let result;
            if (existing) {
                result = await supabase
                    .from('admin_profiles')
                    .update(profile)
                    .eq('id', existing.id);
            } else {
                result = await supabase
                    .from('admin_profiles')
                    .insert([profile]);
            }

            if (result.error) throw result.error;
            alert('Impostazioni salvate con successo!');
        } catch (error) {
            alert('Errore nel salvataggio: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const toggleEventSelection = (id) => {
        setSelectedEventIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const previewMessage = useMemo(() => {
        const selectedEvents = events.filter(e => selectedEventIds.includes(e.id));
        const linksText = selectedEvents
            .map(e => `${e.title}: ${window.location.origin}/book/${e.slug}`)
            .join('\n');

        return profile.whatsapp_template
            .replace(/{event_links}/g, linksText)
            .replace(/{admin_name}/g, profile.email.split('@')[0] || 'Admin');
    }, [profile.whatsapp_template, selectedEventIds, events, profile.email]);

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <Loader2 className="animate-spin text-primary" size={48} />
        </div>
    );

    return (
        <div className="animate-fade-in max-w-5xl">
            <header className="mb-8">
                <h1 className="text-3xl tracking-tight">Impostazioni</h1>
                <p className="text-text-muted">Configura il tuo profilo e personalizza il template per inviare più link contemporaneamente.</p>
            </header>

            <div className="flex flex-col gap-8">
                {/* Profile Settings */}
                <section className="card">
                    <div className="flex items-center gap-2 mb-6">
                        <User className="text-primary" size={24} />
                        <h2 className="text-xl font-bold">Profilo Amministratore</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="label">E-mail Calendario</label>
                            <input
                                type="email"
                                className="input"
                                value={profile.email}
                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="label">Numero WhatsApp</label>
                            <input
                                type="tel"
                                className="input"
                                value={profile.phone}
                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                            />
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* WhatsApp Template Editor */}
                    <section className="card">
                        <div className="flex items-center gap-2 mb-6">
                            <MessageSquare className="text-primary" size={24} />
                            <h2 className="text-xl font-bold">Template WhatsApp</h2>
                        </div>
                        <div>
                            <label className="label">Editor Messaggio</label>
                            <textarea
                                className="input min-h-[180px] leading-relaxed font-mono text-xs"
                                value={profile.whatsapp_template}
                                onChange={(e) => setProfile({ ...profile, whatsapp_template: e.target.value })}
                            />
                            <div className="mt-4">
                                <p className="text-[10px] text-text-muted mb-2 font-bold uppercase tracking-wider italic">Tag Speciale: Crea una lista di link</p>
                                <button
                                    onClick={() => setProfile({ ...profile, whatsapp_template: profile.whatsapp_template + '\n{event_links}' })}
                                    className="bg-primary/10 border border-primary/20 text-xs px-3 py-2 rounded-lg hover:bg-primary/20 transition-all flex items-center gap-2"
                                >
                                    <span className="text-primary font-bold">{"{event_links}"}</span>
                                    <span className="text-text-muted text-[10px]">Inserisce tutti gli eventi selezionati</span>
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Live Preview & Multi-Select */}
                    <section className="card flex flex-col">
                        <div className="flex items-center gap-2 mb-6">
                            <Eye className="text-primary" size={24} />
                            <h2 className="text-xl font-bold">Simulazione Multi-Evento</h2>
                        </div>

                        <div className="flex-1 flex flex-col gap-6">
                            <div>
                                <label className="label mb-3">Seleziona Eventi da includere:</label>
                                <div className="max-h-40 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                                    {events.map(event => (
                                        <button
                                            key={event.id}
                                            onClick={() => toggleEventSelection(event.id)}
                                            className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-all border ${selectedEventIds.includes(event.id)
                                                    ? 'bg-primary/10 border-primary/30 text-primary'
                                                    : 'bg-white/5 border-white/5 text-text-muted hover:bg-white/10'
                                                }`}
                                        >
                                            <span className="font-bold">{event.title}</span>
                                            {selectedEventIds.includes(event.id) ? <CheckSquare size={14} /> : <Square size={14} />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 bg-black/40 rounded-2xl border border-white/5 p-5 relative group">
                                <div className="absolute top-4 right-4 text-[9px] uppercase font-black text-primary/40 tracking-widest">WhatsApp Preview</div>
                                <div className="text-xs whitespace-pre-wrap leading-relaxed text-text-main italic border-l-2 border-primary/40 pl-4 py-1">
                                    {previewMessage}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn btn-primary gap-2 px-12 py-4 text-sm shadow-xl shadow-primary/20"
                    >
                        {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                        Salva Template
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;




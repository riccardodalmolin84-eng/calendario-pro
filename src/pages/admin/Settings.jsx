import React, { useState, useEffect, useMemo } from 'react';
import { Mail, Phone, MessageSquare, Save, User, Loader2, Eye, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const Settings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [profile, setProfile] = useState({
        email: '',
        phone: '',
        whatsapp_template: `Ciao! Sono pronto per il nostro appuntamento.
Prenota qui il tuo slot: {event_url}

A presto!`
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Profile
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

            // Fetch Events for preview
            const { data: eventsData } = await supabase
                .from('events')
                .select('id, title, slug');

            if (eventsData) {
                setEvents(eventsData);
                if (eventsData.length > 0) {
                    setSelectedEventId(eventsData[0].id);
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

    const previewMessage = useMemo(() => {
        if (!selectedEventId) return profile.whatsapp_template;
        const event = events.find(e => e.id === selectedEventId);
        if (!event) return profile.whatsapp_template;

        const url = `${window.location.origin}/book/${event.slug}`;
        return profile.whatsapp_template
            .replace(/{event_url}/g, url)
            .replace(/{event_title}/g, event.title)
            .replace(/{admin_name}/g, profile.email.split('@')[0]);
    }, [profile.whatsapp_template, selectedEventId, events, profile.email]);

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <Loader2 className="animate-spin text-primary" size={48} />
        </div>
    );

    return (
        <div className="animate-fade-in max-w-5xl">
            <header className="mb-8">
                <h1 className="text-3xl tracking-tight">Impostazioni</h1>
                <p className="text-text-muted">Configura il tuo profilo e personalizza l'invio dei link via WhatsApp.</p>
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
                            <div className="flex items-center gap-2 bg-bg-input border border-glass-border px-3 rounded-lg focus-within:border-primary transition-colors">
                                <Mail size={18} className="text-text-muted" />
                                <input
                                    type="email"
                                    className="bg-transparent border-none outline-none py-2.5 flex-1 text-sm text-text-main"
                                    placeholder="admin@esempio.it"
                                    value={profile.email}
                                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="label">Numero WhatsApp (internazionale)</label>
                            <div className="flex items-center gap-2 bg-bg-input border border-glass-border px-3 rounded-lg focus-within:border-primary transition-colors">
                                <Phone size={18} className="text-text-muted" />
                                <input
                                    type="tel"
                                    className="bg-transparent border-none outline-none py-2.5 flex-1 text-sm text-text-main"
                                    placeholder="+39 333 1234567"
                                    value={profile.phone}
                                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                />
                            </div>
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
                                className="input min-h-[160px] leading-relaxed font-mono text-xs"
                                value={profile.whatsapp_template}
                                onChange={(e) => setProfile({ ...profile, whatsapp_template: e.target.value })}
                                placeholder="Scrivi qui il tuo messaggio..."
                            />
                            <div className="mt-4">
                                <p className="text-[10px] text-text-muted mb-2 font-bold uppercase tracking-wider">Tag Disponibili (Clicca per inserire)</p>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { tag: '{event_url}', label: 'URL Prenotazione' },
                                        { tag: '{event_title}', label: 'Nome Evento' },
                                        { tag: '{admin_name}', label: 'Tuo Nome' }
                                    ].map(item => (
                                        <button
                                            key={item.tag}
                                            onClick={() => setProfile({ ...profile, whatsapp_template: profile.whatsapp_template + item.tag })}
                                            className="bg-glass-bg border border-glass-border text-[10px] px-2 py-1.5 rounded-lg cursor-pointer hover:bg-primary/20 hover:border-primary transition-all flex items-center gap-1.5"
                                        >
                                            <span className="text-primary font-bold">{item.tag}</span>
                                            <span className="text-text-muted">{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Live Preview Section */}
                    <section className="card flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Eye className="text-primary" size={24} />
                                <h2 className="text-xl font-bold">Anteprima Invio</h2>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col gap-4">
                            <div>
                                <label className="label">Seleziona Evento da simulare</label>
                                <div className="flex items-center gap-2 bg-bg-input border border-glass-border px-3 rounded-lg focus-within:border-primary transition-colors">
                                    <Calendar size={18} className="text-text-muted" />
                                    <select
                                        className="bg-transparent border-none outline-none py-2.5 flex-1 text-sm text-text-main appearance-none cursor-pointer"
                                        value={selectedEventId}
                                        onChange={(e) => setSelectedEventId(e.target.value)}
                                    >
                                        {events.map(event => (
                                            <option key={event.id} value={event.id} className="bg-bg-card">
                                                {event.title}
                                            </option>
                                        ))}
                                        {events.length === 0 && <option value="">Nessun evento creato</option>}
                                    </select>
                                </div>
                            </div>

                            <div className="flex-1 bg-black/40 rounded-xl border border-glass-border p-4 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                </div>
                                <label className="text-[10px] uppercase font-black text-primary tracking-widest mb-2 block">Cosa vedrà il cliente:</label>
                                <div className="text-sm whitespace-pre-wrap leading-relaxed text-text-main italic border-l-2 border-primary/40 pl-4 py-1">
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
                        className="btn btn-primary gap-2 px-8 shadow-lg shadow-primary/20"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Salva Tutte le Impostazioni
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;



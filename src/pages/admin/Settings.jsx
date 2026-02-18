import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Mail, Phone, MessageSquare, Save, User, Loader2, Eye, Calendar, CheckSquare, Square, Copy, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const Settings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [events, setEvents] = useState([]);
    const [profile, setProfile] = useState({
        email: '',
        phone: '',
        whatsapp_template: `Ciao! Ecco i link per i nostri appuntamenti:

{link:slug-esempio}

A presto!`
    });

    // TextArea ref for inserting tags at cursor position
    const textAreaRef = useRef(null);

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
            // Explicitly extract fields to avoid sending unwanted DB fields
            const dataToSave = {
                email: profile.email,
                phone: profile.phone,
                whatsapp_template: profile.whatsapp_template
            };

            const { data: existing } = await supabase
                .from('admin_profiles')
                .select('id')
                .limit(1)
                .maybeSingle();

            let error;
            if (existing) {
                const result = await supabase
                    .from('admin_profiles')
                    .update(dataToSave)
                    .eq('id', existing.id);
                error = result.error;
            } else {
                const result = await supabase
                    .from('admin_profiles')
                    .insert([dataToSave]);
                error = result.error;
            }

            if (error) throw error;
            alert('Impostazioni salvate con successo!');
            fetchData(); // Refresh data to get latest state
        } catch (error) {
            console.error('Save error:', error);
            alert('Errore nel salvataggio: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const insertTag = (tag) => {
        const textarea = textAreaRef.current;
        if (!textarea) {
            setProfile(prev => ({ ...prev, whatsapp_template: prev.whatsapp_template + tag }));
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = profile.whatsapp_template;
        const newText = text.substring(0, start) + tag + text.substring(end);

        setProfile({ ...profile, whatsapp_template: newText });

        // Restore focus and cursor position (after the inserted tag)
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + tag.length, start + tag.length);
        }, 0);
    };

    const previewMessage = useMemo(() => {
        let message = profile.whatsapp_template;
        const origin = window.location.origin;

        // Replace global {event_links} tag
        const allLinksText = events
            .map(e => `${e.title}: ${origin}/book/${e.slug}`)
            .join('\n');

        // Use regex for global replacement
        message = message.replace(/{event_links}/g, allLinksText);

        // Replace specific {link:slug} tags
        events.forEach(event => {
            const tag = `{link:${event.slug}}`;
            const link = `${origin}/book/${event.slug}`;
            // Escape special chars for regex if any, but slugs are safe
            const regex = new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            message = message.replace(regex, link);
        });

        // Replace admin name
        message = message.replace(/{admin_name}/g, profile.email.split('@')[0] || 'Admin');

        return message;
    }, [profile.whatsapp_template, events, profile.email]);

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <Loader2 className="animate-spin text-primary" size={48} />
        </div>
    );

    return (
        <div className="animate-fade-in max-w-6xl">
            <header className="mb-8">
                <h1 className="text-3xl tracking-tight">Impostazioni</h1>
                <p className="text-text-muted">Configura il tuo profilo e personalizza il template per i messaggi WhatsApp.</p>
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
                    <section className="card flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-6">
                            <MessageSquare className="text-primary" size={24} />
                            <h2 className="text-xl font-bold">Template WhatsApp</h2>
                        </div>
                        <div className="flex-1 flex flex-col">
                            <label className="label">Editor Messaggio (Usa i tag qui sotto)</label>
                            <textarea
                                ref={textAreaRef}
                                className="input flex-1 min-h-[400px] md:min-h-[300px] leading-relaxed font-mono text-sm md:text-xs resize-none p-4"
                                value={profile.whatsapp_template}
                                onChange={(e) => setProfile({ ...profile, whatsapp_template: e.target.value })}
                                placeholder="Scrivi qui il tuo messaggio..."
                            />
                        </div>
                    </section>

                    {/* Tags & Preview */}
                    <div className="flex flex-col gap-8">

                        {/* Tags Selection */}
                        <section className="card">
                            <div className="flex items-center gap-2 mb-4">
                                <LinkIcon size={18} className="text-primary" />
                                <h3 className="font-bold text-sm uppercase tracking-wider">Tag Disponibili</h3>
                            </div>
                            <p className="text-text-muted text-xs mb-4">Clicca su un tag per inserirlo nel messaggio.</p>

                            <div className="flex flex-wrap gap-2 mb-6">
                                {/* Special Bulk Tag */}
                                <button
                                    onClick={() => insertTag('{event_links}')}
                                    className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 text-xs font-bold text-primary transition-all flex items-center gap-2"
                                >
                                    <Plus size={14} />
                                    <span>{'{event_links}'}</span>
                                    <span className="opacity-50 font-normal">(Tutti i link)</span>
                                </button>
                            </div>

                            <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2 leading-none">
                                {events.map(event => (
                                    <button
                                        key={event.id}
                                        onClick={() => insertTag(`{link:${event.slug}}`)}
                                        className="w-full text-left p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-xs flex items-center justify-between group"
                                    >
                                        <span className="font-medium text-text-main truncate max-w-[70%]">{event.title}</span>
                                        <code className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded opacity-70 group-hover:opacity-100 transition-opacity">
                                            {`{link:${event.slug}}`}
                                        </code>
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Live Preview */}
                        <section className="card flex-1 flex flex-col bg-black/40 border-dashed">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Eye className="text-primary/60" size={18} />
                                    <h3 className="font-bold text-sm uppercase tracking-wider text-text-muted">Anteprima Reale</h3>
                                </div>
                                {profile.phone && (
                                    <button
                                        onClick={() => {
                                            const cleanPhone = profile.phone.replace(/\D/g, '');
                                            const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(previewMessage)}`;
                                            window.open(url, '_blank');
                                        }}
                                        style={{
                                            backgroundColor: '#128C7E',
                                            color: '#ffffff',
                                            padding: '8px 16px',
                                            borderRadius: '20px',
                                            border: 'none',
                                            fontWeight: 'bold',
                                            fontSize: '11px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                            appearance: 'none',
                                            WebkitAppearance: 'none'
                                        }}
                                    >
                                        <MessageSquare size={14} fill="white" />
                                        Invia a Me Stesso
                                    </button>
                                )}
                            </div>
                            <div className="flex-1 rounded-2xl p-4 relative group overflow-hidden">
                                <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-primary/5 to-transparent" />
                                <div className="text-xs whitespace-pre-wrap leading-relaxed text-text-main/90 italic border-l-2 border-primary/40 pl-4 py-1 relative z-10 font-sans">
                                    {previewMessage}
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 pb-12">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn btn-primary gap-2 px-12 py-4 text-sm shadow-xl shadow-primary/20 w-full sm:w-auto"
                    >
                        {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                        Salva Impostazioni
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;

// Helper Icon Component since we lost the import in the full replace
const LinkIcon = ({ size, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
    </svg>
);




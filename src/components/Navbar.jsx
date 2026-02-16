import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, LayoutDashboard, Settings, Clock, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

const Navbar = () => {
    const location = useLocation();
    const [previewUrl, setPreviewUrl] = useState('#');

    useEffect(() => {
        const fetchFirstEvent = async () => {
            const { data } = await supabase.from('events').select('slug').limit(1).single();
            if (data) {
                setPreviewUrl(`/book/${data.slug}`);
            }
        };
        fetchFirstEvent();
    }, []);

    const navItems = [
        { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
        { name: 'Eventi', path: '/admin/events', icon: <Calendar size={20} /> },
        { name: 'Disponibilità', path: '/admin/availabilities', icon: <Clock size={20} /> },
        { name: 'Impostazioni', path: '/admin/settings', icon: <Settings size={20} /> },
    ];

    return (
        <nav className="card mt-4 mx-4 flex items-center justify-between py-3 px-6 shadow-xl border-primary/10">
            <div className="flex items-center gap-2">
                <div className="bg-primary p-2 rounded-lg shadow-lg shadow-primary/20">
                    <Calendar color="white" size={24} />
                </div>
                <span className="text-xl font-bold tracking-tighter text-text-main">Calendario<span className="text-primary">Aloe</span></span>
            </div>

            <div className="hidden md:flex gap-8">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-2 font-semibold transition-all duration-300 relative py-1 ${location.pathname === item.path
                            ? 'text-primary'
                            : 'text-text-muted hover:text-text-main'
                            }`}
                    >
                        {item.icon}
                        <span>{item.name}</span>
                        {location.pathname === item.path && (
                            <motion.div
                                layoutId="nav-underline"
                                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full"
                            />
                        )}
                    </Link>
                ))}
            </div>

            <div className="flex items-center gap-4">
                <a
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline gap-2 text-xs border-glass-border hover:border-primary/50 group"
                >
                    <ExternalLink size={14} className="group-hover:text-primary transition-colors" />
                    <span className="group-hover:text-text-main transition-colors">Anteprima Sito</span>
                </a>
            </div>
        </nav>
    );
};

export default Navbar;


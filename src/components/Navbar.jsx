import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, LayoutDashboard, Settings, Clock, ExternalLink, CalendarCheck, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

const Navbar = () => {
    const location = useLocation();
    const [previewUrl, setPreviewUrl] = useState('#');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

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
        { name: 'Prenotazioni', path: '/admin/bookings', icon: <CalendarCheck size={20} /> },
        { name: 'Impostazioni', path: '/admin/settings', icon: <Settings size={20} /> },
    ];

    return (
        <nav className="card mt-4 mx-4 flex flex-col md:flex-row items-center justify-between py-3 px-6 shadow-xl border-primary/10 relative z-50 bg-bg-card">
            <div className="flex items-center justify-between w-full md:w-auto">
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 flex-shrink-0 rounded-md overflow-hidden bg-transparent shadow-sm border border-black/5">
                        <img
                            src="/logo-aloe.png"
                            alt="Aloe Logo"
                            className="w-full h-full object-cover scale-110"
                        />
                    </div>
                    <span className="text-xl font-bold tracking-tighter text-text-main">Aloe<span className="text-primary">Admin</span></span>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="md:hidden p-2 text-primary hover:bg-glass-bg rounded-lg transition-colors"
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Desktop Navigation */}
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

            {/* Mobile Navigation Drawer */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden w-full overflow-hidden mt-4 border-t border-border pt-4 flex flex-col gap-2"
                    >
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMenuOpen(false)}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${location.pathname === item.path
                                    ? 'bg-primary/10 text-primary font-bold'
                                    : 'text-text-muted hover:bg-glass-bg hover:text-text-main'
                                    }`}
                            >
                                {item.icon}
                                <span>{item.name}</span>
                            </Link>
                        ))}

                    </motion.div>
                )}
            </AnimatePresence>

            <div className="hidden md:flex items-center gap-4">

            </div>
        </nav>
    );
};

export default Navbar;


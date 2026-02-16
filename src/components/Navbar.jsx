import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, LayoutDashboard, Settings, Clock } from 'lucide-react';

const Navbar = () => {
    const location = useLocation();

    const navItems = [
        { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
        { name: 'Eventi', path: '/admin/events', icon: <Calendar size={20} /> },
        { name: 'Disponibilità', path: '/admin/availabilities', icon: <Clock size={20} /> },
        { name: 'Impostazioni', path: '/admin/settings', icon: <Settings size={20} /> },
    ];

    return (
        <nav className="card mt-4 mx-4 flex items-center justify-between py-3 px-6">
            <div className="flex items-center gap-2">
                <div className="bg-primary p-2 rounded-lg">
                    <Calendar color="white" size={24} />
                </div>
                <span className="text-xl font-bold tracking-tight">Calendario PRO</span>
            </div>

            <div className="flex gap-6">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-2 font-medium transition-colors ${location.pathname === item.path ? 'text-primary' : 'text-text-muted hover:text-text-main'
                            }`}
                    >
                        {item.icon}
                        <span>{item.name}</span>
                    </Link>
                ))}
            </div>

            <div className="flex items-center gap-4">
                <button className="btn btn-outline">Anteprima Sito</button>
            </div>
        </nav>
    );
};

export default Navbar;

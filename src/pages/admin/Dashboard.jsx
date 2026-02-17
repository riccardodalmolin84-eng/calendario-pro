import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, Clock, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';

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
                +0% <ArrowUpRight size={12} />
            </span>
        </div>
        <div>
            <h3 className="text-text-muted text-sm font-medium">{title}</h3>
            <p className="text-3xl font-bold">{value}</p>
        </div>
    </motion.div>
);

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalBookings: 0,
        activeEvents: 0,
        totalHours: 0
    });
    const [recentBookings, setRecentBookings] = useState([]);
    const [upcomingBookings, setUpcomingBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Total Bookings Count
            const { count: bookingsCount } = await supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true });

            // 2. Fetch Active Events Count
            const { count: eventsCount } = await supabase
                .from('events')
                .select('*', { count: 'exact', head: true });

            // 3. Fetch All Bookings for stats (could be optimized if needed)
            const { data: allBookings } = await supabase
                .from('bookings')
                .select('start_time, end_time');

            let totalMinutes = 0;
            if (allBookings) {
                allBookings.forEach(booking => {
                    const start = new Date(booking.start_time);
                    const end = new Date(booking.end_time);
                    totalMinutes += (end - start) / (1000 * 60);
                });
            }

            // 4. Fetch Recent Bookings (last created)
            const { data: recent } = await supabase
                .from('bookings')
                .select('*, events(title)')
                .order('created_at', { ascending: false })
                .limit(5);
            setRecentBookings(recent || []);

            // 5. Fetch Upcoming Bookings (next 24 hours)
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            const endOfTomorrow = new Date(startOfToday.getTime() + 48 * 60 * 60 * 1000);

            const { data: upcoming } = await supabase
                .from('bookings')
                .select('*, events(title)')
                .gte('start_time', startOfToday.toISOString())
                .lte('start_time', endOfTomorrow.toISOString())
                .order('start_time', { ascending: true });

            setUpcomingBookings(upcoming || []);

            setStats({
                totalBookings: bookingsCount || 0,
                activeEvents: eventsCount || 0,
                totalHours: Math.round(totalMinutes / 60)
            });

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <header className="mb-6">
                <h1 className="text-3xl">Dashboard Amministrazione</h1>
                <p className="text-text-muted">Bentornato! Ecco cosa sta succedendo con i tuoi appuntamenti.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard
                    title="Prenotazioni Totali"
                    value={loading ? "..." : stats.totalBookings}
                    icon={<Users className="text-primary" size={24} />}
                    delay={0.1}
                />
                <StatCard
                    title="Eventi Attivi"
                    value={loading ? "..." : stats.activeEvents}
                    icon={<Calendar className="text-primary" size={24} />}
                    delay={0.2}
                />
                <StatCard
                    title="Ore Prenotate"
                    value={loading ? "..." : `${stats.totalHours}h`}
                    icon={<Clock className="text-primary" size={24} />}
                    delay={0.3}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                    <h2 className="text-xl mb-4">Prenotazioni Recenti</h2>
                    <div className="flex flex-col gap-4">
                        {loading ? (
                            <p className="text-text-muted text-sm italic">Caricamento...</p>
                        ) : recentBookings.length === 0 ? (
                            <p className="text-text-muted text-sm italic">Nessuna prenotazione recente.</p>
                        ) : (
                            recentBookings.map((booking) => (
                                <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg bg-glass-bg border border-glass-border">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                            {booking.user_name?.[0]}{booking.user_surname?.[0]}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{booking.user_name} {booking.user_surname}</p>
                                            <p className="text-xs text-text-muted">
                                                {booking.events?.title || 'Evento'} • {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <Link to="/admin/bookings" className="btn btn-outline py-1 px-3 text-xs">Vedi</Link>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="card">
                    <h2 className="text-xl mb-4 text-primary font-bold">Prossimi Appuntamenti (24h)</h2>
                    <div className="flex flex-col gap-4">
                        {loading ? (
                            <p className="text-text-muted text-sm italic">Caricamento...</p>
                        ) : upcomingBookings.length === 0 ? (
                            <p className="text-text-muted text-center py-8 italic bg-glass-bg rounded-xl border border-dashed border-glass-border">
                                Nessun evento in programma per le prossime 24 ore.
                            </p>
                        ) : (
                            upcomingBookings.map((booking) => (
                                <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                                            <Clock size={18} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">{booking.user_name} {booking.user_surname}</p>
                                            <p className="text-xs text-text-muted font-medium">
                                                {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {booking.events?.title}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full border border-primary/20">
                                        In arrivo
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;

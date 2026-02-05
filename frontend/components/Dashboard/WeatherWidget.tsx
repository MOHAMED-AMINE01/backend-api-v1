
import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Wind, Thermometer, RefreshCcw, MapPin } from 'lucide-react';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';

const WeatherWidget: React.FC = () => {
    const [weather, setWeather] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { latestMetric } = useSocket(); // We'll listen for weather_update event if we add it to useSocket, or just use a custom listener

    const fetchWeather = async () => {
        try {
            const response = await api.get('/monitoring/weather/current');
            setWeather(response.data);
        } catch (err) {
            console.error('Failed to fetch weather:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWeather();

        // Custom socket listener for real-time weather updates
        const socket = (window as any).socket;
        if (socket) {
            socket.on('weather_update', (data: any) => {
                setWeather(data);
            });
            return () => socket.off('weather_update');
        }
    }, []);

    if (loading) return (
        <div className="glass-card p-4 rounded-2xl border border-slate-800 animate-pulse flex items-center justify-center h-24">
            <RefreshCcw className="text-slate-700 animate-spin" />
        </div>
    );

    if (!weather) return null;

    const getWeatherIcon = (code: number) => {
        if (code === 0) return <Sun className="text-amber-400" size={32} />;
        if (code <= 3) return <Cloud className="text-slate-400" size={32} />;
        if (code >= 51) return <CloudRain className="text-cyan-400" size={32} />;
        return <Sun className="text-amber-400" size={32} />;
    };

    return (
        <div className="glass-card p-6 rounded-3xl border border-slate-800/50 bg-gradient-to-br from-slate-900/50 to-slate-800/20 relative overflow-hidden group h-full">
            {/* Background decoration */}
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                {getWeatherIcon(weather.weathercode)}
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-800/50 border border-slate-700 flex items-center justify-center shadow-inner">
                        {getWeatherIcon(weather.weathercode)}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <Thermometer size={14} className="text-rose-400" />
                            <h3 className="text-2xl font-bold text-white tracking-tight">{weather.temperature}°C</h3>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                            <MapPin size={10} className="text-cyan-500" />
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{weather.city || 'Industrial Site'}</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/50 rounded-lg border border-slate-700/50">
                        <Wind size={14} className="text-cyan-400" />
                        <span className="text-xs font-bold text-slate-300">{weather.windspeed} <span className="text-[8px] text-slate-500">km/h</span></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Live Feed</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeatherWidget;

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent
} from '@/components/ui/chart';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';

// Mock Data
const hourlyData = [
    { time: '08:00', revenue: 1200 },
    { time: '09:00', revenue: 2100 },
    { time: '10:00', revenue: 4500 },
    { time: '11:00', revenue: 6200 },
    { time: '12:00', revenue: 8900 },
    { time: '13:00', revenue: 7500 },
    { time: '14:00', revenue: 5800 },
    { time: '15:00', revenue: 4200 },
    { time: '16:00', revenue: 6800 },
    { time: '17:00', revenue: 9500 },
    { time: '18:00', revenue: 11000 },
    { time: '19:00', revenue: 8200 },
    { time: '20:00', revenue: 3500 },
];

const dailyData = [
    { day: 'Mon', revenue: 45000 },
    { day: 'Tue', revenue: 52000 },
    { day: 'Wed', revenue: 49000 },
    { day: 'Thu', revenue: 61000 },
    { day: 'Fri', revenue: 75000 },
    { day: 'Sat', revenue: 92000 },
    { day: 'Sun', revenue: 88000 },
];

const monthlyData = [
    { month: 'Jan', revenue: 1200000 },
    { month: 'Feb', revenue: 1450000 },
    { month: 'Mar', revenue: 1380000 },
    { month: 'Apr', revenue: 1650000 },
    { month: 'May', revenue: 1890000 },
    { month: 'Jun', revenue: 2100000 },
];

const peakHoursData = [
    { hour: '08:00', density: 20 },
    { hour: '10:00', density: 45 },
    { hour: '12:00', density: 85 },
    { hour: '14:00', density: 60 },
    { hour: '16:00', density: 55 },
    { hour: '18:00', density: 100 },
    { hour: '20:00', density: 40 },
];

export default function SalesAnalytics() {
    const { t, i18n } = useTranslation();
    const [timeRange, setTimeRange] = useState<'hourly' | 'daily' | 'monthly'>('hourly');

    const chartConfig = {
        revenue: {
            label: t('dashboard.analytics.revenue_label'),
            color: "#BCFF2F", // Chartreuse
        },
        density: {
            label: t('dashboard.analytics.density_label'),
            color: "#000000",
        }
    };

    const getRevenueData = () => {
        switch (timeRange) {
            case 'hourly': return hourlyData;
            case 'daily': return dailyData;
            case 'monthly': return monthlyData;
        }
    };

    const getDataKey = () => timeRange === 'hourly' ? 'time' : (timeRange === 'daily' ? 'day' : 'month');

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Analytics Card */}
            <Card className="lg:col-span-2 p-6 relative overflow-hidden border-none shadow-none">
                <CardHeader className="flex flex-row items-start justify-between p-0 mb-8 relative z-10">
                    <div>
                        <CardTitle className="text-2xl font-bold text-black uppercase tracking-tight leading-none">
                            {t('dashboard.analytics.revenue_title')}
                        </CardTitle>
                        <CardDescription className="text-[10px] text-black/40 uppercase tracking-[0.2em] mt-2">
                            {t('dashboard.analytics.revenue_subtitle')}
                        </CardDescription>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger className="outline-none border-none ring-0 focus:ring-0 focus:outline-none focus:ring-offset-0 focus-visible:ring-0 focus-visible:outline-none">
                            <div className="flex items-center gap-2 bg-zinc-200 hover:bg-zinc-300 transition-colors px-4 py-2 rounded-full cursor-pointer group outline-none ring-0">
                                <span
                                    className="text-xs font-bold text-black uppercase tracking-wider"
                                    style={{ fontFamily: i18n.language === 'ar' ? '"Cairo", sans-serif' : 'inherit' }}
                                >
                                    {timeRange === 'hourly' && t('dashboard.analytics.today')}
                                    {timeRange === 'daily' && t('dashboard.analytics.seven_days')}
                                    {timeRange === 'monthly' && t('dashboard.analytics.month')}
                                </span>
                                <ChevronDown size={14} className="text-black/40 group-hover:text-black transition-colors" />
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[150px] rounded-xl p-1 shadow-xl border-zinc-100 bg-white">
                            <DropdownMenuItem
                                onClick={() => setTimeRange('hourly')}
                                className="rounded-lg text-xs font-medium cursor-pointer py-2 focus:bg-zinc-100 outline-none border-none ring-0 focus:ring-0 focus-visible:ring-0"
                                style={{ fontFamily: i18n.language === 'ar' ? '"Cairo", sans-serif' : 'inherit' }}
                            >
                                {t('dashboard.analytics.today')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setTimeRange('daily')}
                                className="rounded-lg text-xs font-medium cursor-pointer py-2 focus:bg-zinc-100 outline-none border-none ring-0 focus:ring-0 focus-visible:ring-0"
                                style={{ fontFamily: i18n.language === 'ar' ? '"Cairo", sans-serif' : 'inherit' }}
                            >
                                {t('dashboard.analytics.seven_days')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setTimeRange('monthly')}
                                className="rounded-lg text-xs font-medium cursor-pointer py-2 focus:bg-zinc-100 outline-none border-none ring-0 focus:ring-0 focus-visible:ring-0"
                                style={{ fontFamily: i18n.language === 'ar' ? '"Cairo", sans-serif' : 'inherit' }}
                            >
                                {t('dashboard.analytics.month')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>
                <CardContent className="p-0 relative z-10">
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <AreaChart data={getRevenueData()} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00fff2ff" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#00fff2ff" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                            <XAxis
                                dataKey={getDataKey()}
                                axisLine={false}
                                tickLine={false}
                                tickMargin={10}
                                tickFormatter={(value) => value.slice(0, 3)}
                                className="text-[10px] font-bold fill-black/40 uppercase tracking-wider"
                            />
                            <YAxis
                                hide={true}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={
                                    <ChartTooltipContent
                                        indicator="line"
                                        className="w-[150px] bg-white/80 backdrop-blur-sm shadow-xl border-zinc-100/50"
                                        formatter={(value: any) => formatCurrency(Number(value))}
                                    />
                                }
                            />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#00fff2ff"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                                animationDuration={1000}
                                animationEasing="ease-in-out"
                            />
                        </AreaChart>
                    </ChartContainer>
                </CardContent>

                {/* Subtle Background Decoration */}
                <div className="absolute -right-10 top-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none select-none rotate-90">
                    <span className="text-[140px] font-black tracking-tighter uppercase italic">Analytics</span>
                </div>
            </Card>

            {/* Peak Hours Card */}
            <Card className="bg-blue-400 p-6 rounded-[3rem] relative overflow-hidden group">
                <CardHeader className="p-0 mb-15 relative z-10">
                    <CardTitle className="text-xl font-bold text-white uppercase tracking-tight leading-none">
                        {t('dashboard.analytics.peak_hours_title')}
                    </CardTitle>
                    <CardDescription className="text-[10px] text-white/40 uppercase tracking-[0.2em] mt-2">
                        {t('dashboard.analytics.peak_hours_subtitle')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0 relative z-10">
                    <ChartContainer config={chartConfig} className="h-[200px] w-full">
                        <BarChart data={peakHoursData}>
                            <XAxis
                                dataKey="hour"
                                axisLine={false}
                                tickLine={false}
                                tickMargin={10}
                                className="text-[10px] font-bold fill-white/60 uppercase tracking-wider"
                            />
                            <ChartTooltip
                                cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                                content={
                                    <ChartTooltipContent
                                        className="bg-white/90 backdrop-blur-sm text-black border-none shadow-xl w-[150px]"
                                        labelFormatter={(value) => `${t('dashboard.analytics.time_label')}: ${value}`}
                                    />
                                }
                            />
                            <Bar
                                dataKey="density"
                                fill="#ffee00ff"
                                radius={[6, 6, 0, 0]}
                                barSize={12}
                                animationDuration={1500}
                            />
                        </BarChart>
                    </ChartContainer>

                    <div className="mt-6 flex items-center justify-between p-2.5 rounded-[1.5rem] bg-[#ffee00ff]">
                        <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-bold text-black tracking-widest">{t('dashboard.analytics.recommended_staff')}</span>
                            <span className="text-xl font-bold text-black mt-1">4 {t('dashboard.analytics.waiters')}</span>
                        </div>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center">
                            <span className="text-black font-black text-xs">GO</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

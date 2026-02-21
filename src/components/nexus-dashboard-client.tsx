"use client"

import React from 'react';
import {
    Box,
    TrendingUp,
    AlertTriangle,
    Coins,
    Package,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Mock Data for Charts (Placeholders as per design)
const productionTrendData = [
    { day: 'Mon', value: 1.2 }, { day: 'Tue', value: 2.1 }, { day: 'Wed', value: 1.8 },
    { day: 'Thu', value: 2.9 }, { day: 'Fri', value: 3.5 }, { day: 'Sat', value: 3.2 }, { day: 'Sun', value: 3.8 }
];

const stockStatusData = [
    { name: 'Optimal', value: 3.0, fill: '#1e40af' }, // Blue
    { name: 'Low', value: 1.2, fill: '#f97316' }   // Orange
];

const StatCard = ({ title, value, subtext, trend, trendUp, icon: Icon, colorClass }: any) => (
    <Card className="flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
                </div>
                <div className={`p-2 rounded-lg ${colorClass}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{subtext}</p>
                {trend && (
                    <div className={`flex items-center text-xs font-medium ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
                        {trendUp ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                        {trend}
                    </div>
                )}
            </div>
        </CardContent>
    </Card>
);

export function NexusDashboardClient({ initialReport }: { initialReport?: any }) {
    // Determine today's date for display
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Extract dynamic data from report if available, else placeholders
    // Adapted to match generic report structure if fields are missing
    const totalItems = initialReport?.inventory?.length || 0;
    const todaysProduction = initialReport?.totalProduced || 0;
    const lowStockCount = initialReport?.inventory?.filter((i: any) => i.currentStock < 50).length || 0;
    const inventoryValue = "$891.35"; // Placeholder for now as value isn't in simple report

    return (
        <div className="space-y-6 pt-2 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back, Admin User</h1>
                    <p className="text-slate-500">Here's your manufacturing overview for today</p>
                </div>
                <div className="text-sm font-medium text-slate-400 bg-white px-4 py-2 rounded-md border border-slate-100 shadow-sm">
                    {today}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Items"
                    value={totalItems}
                    subtext="Fastener types in inventory"
                    trend="+12% from last week"
                    trendUp={true}
                    icon={Box}
                    colorClass="bg-blue-50 text-blue-600"
                />
                <StatCard
                    title="Today's Production"
                    value={todaysProduction}
                    subtext="Units produced today"
                    trend="+8% from last week"
                    trendUp={true}
                    icon={TrendingUp}
                    colorClass="bg-emerald-50 text-emerald-600"
                />
                <StatCard
                    title="Low Stock Alerts"
                    value={lowStockCount}
                    subtext="Items below minimum stock"
                    icon={AlertTriangle}
                    colorClass="bg-orange-50 text-orange-600"
                />
                <StatCard
                    title="Inventory Value"
                    value={inventoryValue}
                    subtext="Total stock value"
                    trend="+5% from last week"
                    trendUp={true}
                    icon={Coins}
                    colorClass="bg-indigo-50 text-indigo-600"
                />
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Production Trend Chart */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-blue-600" />
                            Production Trend (7 Days)
                        </CardTitle>
                        <CardDescription>Daily production output over the last week</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={productionTrendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ stroke: '#94a3b8', strokeWidth: 1 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#2563eb"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: "#2563eb", strokeWidth: 2, stroke: "#fff" }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Stock Status Chart */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-blue-600" />
                            Stock Status Overview
                        </CardTitle>
                        <CardDescription>Distribution of inventory stock levels</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stockStatusData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: '#f1f5f9' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={60} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

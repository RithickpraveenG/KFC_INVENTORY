"use client";

import React from "react";
import {
    Activity,
    AlertTriangle,
    Box,
    CheckCircle2,
    Clock,
    Factory,
    MoreVertical,
    TrendingDown,
    TrendingUp,
    Users,
    Zap
} from "lucide-react";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

// Mock Data
const productionData = [
    { time: "06:00", output: 120, target: 150 },
    { time: "08:00", output: 145, target: 150 },
    { time: "10:00", output: 160, target: 150 },
    { time: "12:00", output: 130, target: 150 },
    { time: "14:00", output: 170, target: 150 },
    { time: "16:00", output: 155, target: 150 },
    { time: "18:00", output: 140, target: 150 },
];

const machineStatus = [
    { name: "CNC-01", status: "Running", efficiency: 92 },
    { name: "CNC-02", status: "Running", efficiency: 88 },
    { name: "Milling-A", status: "Downtime", efficiency: 0 },
    { name: "Lathe-X1", status: "Running", efficiency: 95 },
];

const StatCard = ({ title, value, subtext, icon: Icon, trend, trendUp, alert }: any) => (
    <div className={`relative overflow-hidden rounded-lg border bg-white p-6 shadow-sm transition-all hover:shadow-md ${alert ? 'border-red-200 bg-red-50/50' : 'border-slate-200'}`}>
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <h3 className={`mt-2 text-3xl font-bold ${alert ? 'text-red-700' : 'text-slate-900'}`}>{value}</h3>
            </div>
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${alert ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                <Icon className="h-6 w-6" />
            </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
            {trend && (
                <span className={`flex items-center text-sm font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                    {trendUp ? <TrendingUp className="mr-1 h-4 w-4" /> : <TrendingDown className="mr-1 h-4 w-4" />}
                    {trend}
                </span>
            )}
            <span className="text-sm text-slate-400">{subtext}</span>
        </div>
    </div>
);

const MachineCard = ({ name, status, efficiency }: any) => (
    <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-white p-4 shadow-sm transition-colors hover:border-blue-100">
        <div className="flex items-center gap-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${status === 'Running' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                <Factory className="h-5 w-5" />
            </div>
            <div>
                <h4 className="font-semibold text-slate-900">{name}</h4>
                <p className="text-xs font-medium text-slate-500">{status}</p>
            </div>
        </div>
        <div className="text-right">
            <div className="text-lg font-bold text-slate-900">{efficiency}%</div>
            <p className="text-xs text-slate-400">Efficiency</p>
        </div>
    </div>
);

export function DashboardView() {
    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Daily Production"
                    value="1,248"
                    subtext="units produced"
                    icon={Box}
                    trend="+12.5%"
                    trendUp={true}
                />
                <StatCard
                    title="Active Machines"
                    value="7/8"
                    subtext="machines running"
                    icon={Activity}
                    trend="92% Uptime"
                    trendUp={true}
                />
                <StatCard
                    title="Operators"
                    value="14"
                    subtext="active on shift"
                    icon={Users}
                    trend="Full Capacity"
                    trendUp={true}
                />
                <StatCard
                    title="Critical Alerts"
                    value="2"
                    subtext="require attention"
                    icon={AlertTriangle}
                    alert={true}
                />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Main Chart */}
                <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Production Output</h3>
                            <p className="text-sm text-slate-500">Hourly production vs Target</p>
                        </div>
                        <select className="rounded-md border border-slate-200 px-3 py-1 text-sm text-slate-600">
                            <option>Today</option>
                            <option>Yesterday</option>
                            <option>This Week</option>
                        </select>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={productionData}>
                                <defs>
                                    <linearGradient id="colorOutput" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="output"
                                    stroke="#2563EB"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorOutput)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="target"
                                    stroke="#94A3B8"
                                    strokeWidth={2}
                                    strokeDasharray="4 4"
                                    fill="none"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Machine Status */}
                <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900">Machine Status</h3>
                        <span className="flex h-6 items-center justify-center rounded-full bg-blue-100 px-2 text-xs font-semibold text-blue-700">Live</span>
                    </div>
                    <div className="flex flex-col gap-4">
                        {machineStatus.map((machine, i) => (
                            <MachineCard key={i} {...machine} />
                        ))}
                    </div>
                    <button className="mt-6 w-full rounded-md bg-slate-50 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700">
                        View All Machines
                    </button>
                </div>
            </div>

            {/* Recent Alerts Table / List */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 p-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Recent Alerts & Notifications</h3>
                        <p className="text-sm text-slate-500">System warnings and production updates</p>
                    </div>
                </div>
                <div>
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between border-b border-slate-50 p-4 last:border-0 hover:bg-slate-50">
                            <div className="flex items-center gap-4">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${i === 1 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {i === 1 ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-900">
                                        {i === 1 ? 'Machine Breakdown: Milling-A' : 'Production Batch #204 Completed'}
                                    </h4>
                                    <p className="text-xs text-slate-500">
                                        {i === 1 ? 'Critical Failure - Hydraulic pump malfunction' : 'Target reached ahead of schedule'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-xs text-slate-400">24 mins ago</span>
                                <button className="rounded p-1 hover:bg-slate-200">
                                    <MoreVertical className="h-4 w-4 text-slate-400" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

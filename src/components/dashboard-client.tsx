"use client";

import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { utils, writeFile } from 'xlsx';
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
    Zap,
    Printer,
    Download,
    PlusCircle
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
    Line,
    LineChart
} from "recharts";
import Link from 'next/link';

import { DailyReport } from "@/types";



interface DashboardClientProps {
    initialReport: DailyReport;
}

const StatCard = ({ title, value, subtext, icon: Icon, trend, trendUp, alert }: any) => (
    <div className={`relative overflow-hidden rounded-lg border p-6 shadow-sm transition-all hover:shadow-md ${alert ? 'border-red-200 bg-red-50/50' : 'border-slate-200 bg-white'}`}>
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

export function DashboardClient({ initialReport }: DashboardClientProps) {
    const componentRef = useRef<HTMLDivElement>(null);
    const { records, totalMaterialUsed, averageEfficiency, totalProduced, alerts } = initialReport;

    const handlePrint = useReactToPrint({
        // @ts-ignore
        content: () => componentRef.current,
        documentTitle: `Production_Report_${new Date().toISOString().split('T')[0]}`,
    });

    const handleExportExcel = () => {
        const data = records.map(r => ({
            BatchID: r.batchId,
            Date: new Date(r.date).toLocaleDateString(),
            Material: r.rawMaterial.name,
            Input_Qty: r.rawMaterial.quantity,
            Product: r.finishedProduct.name,
            Output_Qty: r.finishedProduct.quantity,
            Efficiency_Percent: r.efficiency.toFixed(2),
            Status: r.status
        }));
        const ws = utils.json_to_sheet(data);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Production Log");
        writeFile(wb, `Production_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // Transform records for Chart
    // Sort records by date/time ideally, but for now just mapping
    const chartData = records.map((r, i) => ({
        name: r.batchId || `Batch ${i}`,
        efficiency: r.efficiency,
        output: r.finishedProduct.quantity,
        target: r.finishedProduct.quantity * 1.1 // Mock target
    })).slice(0, 10); // Take last 10

    return (
        <div className="space-y-6">
            {/* Top Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
                    <p className="text-slate-500 mt-1">Production overview and daily metrics</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/entry" className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                        <PlusCircle className="h-4 w-4" />
                        Log Production
                    </Link>
                    <button onClick={() => handlePrint && handlePrint()} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                        <Printer className="h-4 w-4" />
                        Print
                    </button>
                    <button onClick={handleExportExcel} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                        <Download className="h-4 w-4" />
                        Export
                    </button>
                </div>
            </div>

            {/* Printable Area */}
            <div ref={componentRef} className="space-y-6 print:p-8">

                {/* Header Stats */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Output"
                        value={totalProduced}
                        subtext="units produced"
                        icon={Box}
                        trend="+0%"
                        trendUp={true}
                    />
                    <StatCard
                        title="Avg Efficiency"
                        value={`${averageEfficiency.toFixed(1)}%`}
                        subtext="vs target"
                        icon={Activity}
                        trend={averageEfficiency > 85 ? "Optimal" : "Needs Review"}
                        trendUp={averageEfficiency > 85}
                    />
                    <StatCard
                        title="Raw Material"
                        value={`${totalMaterialUsed}kg`}
                        subtext="processed today"
                        icon={Zap} // Replaced Layers with Zap or Box
                        trend="Normal usage"
                        trendUp={true}
                    />
                    <StatCard
                        title="System Alerts"
                        value={alerts.length}
                        subtext="active notifications"
                        icon={AlertTriangle}
                        alert={alerts.length > 0}
                    />
                </div>

                {/* Main Chart */}
                <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Efficiency Trends</h3>
                            <p className="text-sm text-slate-500">Recent batch performance</p>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorEfficiency" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="efficiency"
                                    stroke="#2563EB"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorEfficiency)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                {/* Detailed Records Table */}
                <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-100 p-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Production Batches</h3>
                            <p className="text-sm text-slate-500">Detailed logs of recent activity</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 font-semibold">Batch ID</th>
                                    <th className="px-6 py-3 font-semibold">Material</th>
                                    <th className="px-6 py-3 font-semibold">Input/Output</th>
                                    <th className="px-6 py-3 font-semibold">Efficiency</th>
                                    <th className="px-6 py-3 font-semibold text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((record) => (
                                    <tr key={record.id} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {record.batchId || record.id.substring(0, 6)}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {record.rawMaterial.name}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {record.rawMaterial.quantity}kg → {record.finishedProduct.quantity} units
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`font-medium ${record.efficiency >= 85 ? 'text-green-600' : 'text-amber-600'}`}>
                                                {record.efficiency.toFixed(1)}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                        ${record.status === 'optimal' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    record.status === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                                                        'bg-amber-50 text-amber-700 border-amber-200'
                                                }`}>
                                                {record.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {records.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                            No records found. Start production to see data here.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}

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
    Zap,
    Printer,
    Download,
    PlusCircle,
    Cpu,
    Server,
    Globe,
    Shield,
    Play,
    AlertCircle,
    Package
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

// Mock Sparkline Data (could be real if we calculated hourly trends)
const sparkData = [
    { value: 10 }, { value: 15 }, { value: 12 }, { value: 20 },
    { value: 18 }, { value: 25 }, { value: 22 }, { value: 30 },
    { value: 28 }, { value: 35 }, { value: 32 }, { value: 40 }
];

const StatCard = ({ title, value, subtext, icon: Icon, trend, trendUp, alert }: any) => (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm group hover:border-primary/50 transition-all">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 blur-xl transition-all group-hover:bg-primary/10" />
        <div className="flex items-center justify-between mb-4">
            <div>
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <h3 className={`text-2xl font-bold mt-1 ${alert ? 'text-red-500' : 'text-foreground'}`}>{value}</h3>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${alert ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
                <Icon className="h-5 w-5" />
            </div>
        </div>
        <div className="flex items-center justify-between">
            <div className={`flex items-center gap-1 text-xs font-medium ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
                {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {trend}
                <span className="text-muted-foreground ml-1 font-normal">{subtext}</span>
            </div>
            <div className="h-8 w-20 opacity-50">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparkData}>
                        <Line type="monotone" dataKey="value" stroke={trendUp ? "#10b981" : "#f43f5e"} strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    </div>
);

export function NexusDashboardClient({ initialReport }: DashboardClientProps) {
    const componentRef = useRef<HTMLDivElement>(null);
    const { records, totalMaterialUsed, averageEfficiency, totalProduced, alerts, inventory = [] } = initialReport;

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Production_Report_${new Date().toISOString().split('T')[0]}`,
    });

    // Calculate Production by Component
    const productionByComponent = records.reduce((acc, record) => {
        const name = record.finishedProduct.name;
        acc[name] = (acc[name] || 0) + record.finishedProduct.quantity;
        return acc;
    }, {} as Record<string, number>);

    const productionSummaryData = Object.entries(productionByComponent)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    // Prepare Inventory Data for Chart
    const inventoryChartData = inventory.map(item => ({
        name: item.name,
        stock: item.currentStock,
        produced: item.totalProduced,
        dispatched: item.totalDispatched
    })).sort((a, b) => a.stock - b.stock); // Ascending stock to highlight low stock first? Or desc? Let's do desc for general view.
    // Actually, low stock is more critical. Let's sort by Stock Ascending (Low to High)
    inventoryChartData.sort((a, b) => a.stock - b.stock);

    const lowStockItems = inventory.filter(i => i.currentStock < 50);

    const handleExportExcel = () => {
        // Sheet 1: Detailed Logs
        const logData = records.map(r => ({
            BatchID: r.batchId,
            Date: new Date(r.date).toLocaleDateString(),
            Material: r.rawMaterial.name,
            Input_Qty: r.rawMaterial.quantity,
            Product: r.finishedProduct.name,
            Output_Qty: r.finishedProduct.quantity,
            Efficiency_Percent: r.efficiency.toFixed(2),
            Status: r.status
        }));
        const wsLogs = utils.json_to_sheet(logData);

        // Sheet 2: Component Summary
        const summaryData = productionSummaryData.map(item => ({
            Component: item.name,
            Total_Produced: item.value
        }));
        const wsSummary = utils.json_to_sheet(summaryData);

        // Sheet 3: Inventory Status
        const invData = inventory.map(item => ({
            Component: item.name,
            Current_Stock: item.currentStock,
            Total_Produced: item.totalProduced,
            Total_Dispatched: item.totalDispatched,
            Status: item.currentStock < 50 ? 'LOW STOCK' : 'OK'
        }));
        const wsInv = utils.json_to_sheet(invData);

        const wb = utils.book_new();
        utils.book_append_sheet(wb, wsLogs, "Production Log");
        utils.book_append_sheet(wb, wsSummary, "Component Summary");
        utils.book_append_sheet(wb, wsInv, "Inventory Status");
        writeFile(wb, `Production_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // Transform records for Chart
    const chartData = records.map((r, i) => ({
        name: r.batchId || `Batch ${i}`,
        efficiency: r.efficiency,
        output: r.finishedProduct.quantity,
        target: r.finishedProduct.quantity * 1.1
    })).slice(0, 10);

    return (
        <div className="space-y-6 pt-2">
            {/* HUD Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Production Hub</h1>
                    <p className="text-sm text-muted-foreground">Real-time monitoring and control system.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => handlePrint && handlePrint()} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-white/10 transition-colors">
                        <Printer className="h-4 w-4" />
                        <span>Print Report</span>
                    </button>
                    <button onClick={handleExportExcel} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-white/10 transition-colors">
                        <Download className="h-4 w-4" />
                        <span>Export CSV</span>
                    </button>
                    <Link href="/inventory" className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-white/10 transition-colors">
                        <Package className="h-4 w-4" />
                        <span>Inventory</span>
                    </Link>
                    <Link href="/entry" className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[0_0_20px_rgba(34,211,238,0.5)] hover:bg-primary/90 transition-all">
                        <PlusCircle className="h-4 w-4 fill-current" />
                        <span>Log Production</span>
                    </Link>
                </div>
            </div>

            <div ref={componentRef} className="space-y-6">
                {/* Metrics Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Output"
                        value={totalProduced}
                        subtext="produced"
                        icon={Box}
                        trend="+12%"
                        trendUp={true}
                    />
                    <StatCard
                        title="Avg Efficiency"
                        value={`${averageEfficiency.toFixed(1)}%`}
                        subtext="vs target"
                        icon={Activity}
                        trend={(averageEfficiency > 85 ? "+2.4%" : "-1.2%")}
                        trendUp={averageEfficiency > 85}
                    />
                    <StatCard
                        title="Raw Material"
                        value={`${totalMaterialUsed}kg`}
                        subtext="consumed"
                        icon={Zap}
                        trend="Normal"
                        trendUp={true}
                    />
                    <StatCard
                        title="Active Alerts"
                        value={alerts.length} // Now includes Low Stock alerts
                        subtext="system warnings"
                        icon={AlertTriangle}
                        alert={alerts.length > 0}
                        trend={alerts.length === 0 ? "Stable" : "Critical"}
                        trendUp={alerts.length === 0}
                    />
                </div>

                {/* Charts Section */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Efficiency Matrix */}
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Efficiency Matrix</h3>
                                <p className="text-sm text-muted-foreground">Batch performance analytics</p>
                            </div>
                            <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary border border-primary/20">
                                Live Data
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorEfficiency" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="efficiency"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorEfficiency)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Production by Component Chart */}
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Production by Component</h3>
                                <p className="text-sm text-muted-foreground">Volume per item type</p>
                            </div>
                            <Factory className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={productionSummaryData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                                    <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                                    <Tooltip
                                        cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                                        contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
                                    />
                                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20}>
                                        <Cell fill="hsl(var(--primary))" />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Inventory Overview Section (NEW) */}
                <div className="grid gap-4 md:grid-cols-3">
                    {/* Inventory Levels Chart */}
                    <div className="md:col-span-2 rounded-xl border border-border bg-card p-6 shadow-sm">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Inventory Levels</h3>
                                <p className="text-sm text-muted-foreground">Current Stock & Dispatch Status</p>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500 rounded-sm"></div> Stock</span>
                                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded-sm"></div> Dispatched</span>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={inventoryChartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
                                    />
                                    <Bar dataKey="stock" fill="#10b981" stackId="a" radius={[0, 0, 4, 4]} />
                                    <Bar dataKey="dispatched" fill="#3b82f6" stackId="a" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Low Stock Watchlist */}
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm overflow-hidden">
                        <div className="mb-4">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-amber-500" /> Low Stock Alerts
                            </h3>
                            <p className="text-sm text-muted-foreground">Items below threshold (50)</p>
                        </div>
                        <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                            {lowStockItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground bg-muted/20 rounded-lg">
                                    <CheckCircle2 className="h-8 w-8 mb-2 text-emerald-500" />
                                    <p>Stock levels healthy</p>
                                </div>
                            ) : (
                                lowStockItems.map((item) => (
                                    <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                        <div>
                                            <p className="font-medium text-red-500">{item.name}</p>
                                            <p className="text-xs text-red-400/80">Stock: {item.currentStock}</p>
                                        </div>
                                        <button className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors">
                                            Restock
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* System Logs (Production Log) */}
                <div className="rounded-xl border border-border bg-card shadow-sm">
                    <div className="flex items-center justify-between border-b border-border p-4">
                        <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-primary" />
                            <h3 className="font-semibold text-foreground">System Logs</h3>
                        </div>
                        <button className="rounded-lg p-1 hover:bg-white/5">
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </div>
                    <div className="p-0">
                        {records.map((record, i) => (
                            <div key={record.id} className="flex items-center justify-between border-b border-border p-4 last:border-0 hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/5 ${record.status === 'optimal' ? 'text-emerald-500' : record.status === 'critical' ? 'text-red-500' : 'text-amber-500'}`}>
                                        {record.status === 'optimal' ? <CheckCircle2 className="h-4 w-4" /> : record.status === 'critical' ? <AlertCircle className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">
                                            {record.batchId || `Batch-${record.id.substring(0, 6)}`} • {record.finishedProduct.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Efficiency: {record.efficiency.toFixed(1)}% • Input: {record.rawMaterial.quantity}kg
                                        </p>
                                    </div>
                                </div>
                                <code className="hidden rounded bg-black/30 px-2 py-1 font-mono text-xs text-muted-foreground md:block">
                                    {record.status.toUpperCase()}
                                </code>
                            </div>
                        ))}
                        {records.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground text-sm">
                                System idle. No production logs detected.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

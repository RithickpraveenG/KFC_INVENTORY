"use client"

import React from 'react';
import {
    Activity,
    Cpu,
    Globe,
    Zap,
    Server,
    Shield,
    Clock,
    Play,
    MoreVertical,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip } from 'recharts';

// Mock Data for Sparklines
const sparkData = [
    { value: 10 }, { value: 15 }, { value: 12 }, { value: 20 },
    { value: 18 }, { value: 25 }, { value: 22 }, { value: 30 },
    { value: 28 }, { value: 35 }, { value: 32 }, { value: 40 }
];

const AgentCard = ({ name, id, status, type, latency }: any) => (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
        {/* Status Glow - Removed for solid look or kept as accent */}
        <div className={`absolute left-0 top-0 h-full w-[4px] transition-all ${status === 'active' ? 'bg-emerald-500' :
            status === 'idle' ? 'bg-amber-500' : 'bg-red-500'
            }`} />

        <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted ${status === 'active' ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                    {type === 'scraper' ? <Globe className="h-5 w-5" /> :
                        type === 'analyzer' ? <Cpu className="h-5 w-5" /> :
                            <Zap className="h-5 w-5" />}
                </div>
                <div>
                    <h3 className="font-bold text-foreground">{name}</h3>
                    <p className="font-mono text-[10px] text-muted-foreground">{id}</p>
                </div>
            </div>
            <div className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                status === 'idle' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                {status}
            </div>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-muted p-2 text-center">
                <div className="text-xs font-bold text-foreground">98%</div>
                <div className="text-[9px] uppercase text-muted-foreground">Success</div>
            </div>
            <div className="rounded-lg bg-muted p-2 text-center">
                <div className="text-xs font-bold text-foreground">{latency}ms</div>
                <div className="text-[9px] uppercase text-muted-foreground">Latency</div>
            </div>
            <div className="rounded-lg bg-muted p-2 text-center">
                <div className="text-xs font-bold text-foreground">1.2k</div>
                <div className="text-[9px] uppercase text-muted-foreground">Ops</div>
            </div>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>2m ago</span>
            </div>
            <div className="flex gap-2">
                <button className="rounded-md bg-muted/50 p-1.5 text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors">
                    <Activity className="h-3 w-3" />
                </button>
                <button className="rounded-md bg-primary/10 p-1.5 text-primary hover:bg-primary/20 transition-colors">
                    <Play className="h-3 w-3 fill-current" />
                </button>
            </div>
        </div>
    </div>
);

const StatCard = ({ label, value, icon: Icon, trend, trendUp }: any) => (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 transition-all group-hover:bg-primary/10" />
        <div className="flex items-center justify-between mb-4">
            <div>
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <h3 className="text-2xl font-bold text-foreground mt-1">{value}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
            </div>
        </div>
        <div className="flex items-center justify-between">
            <div className={`flex items-center gap-1 text-xs font-medium ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
                {trendUp ? '+' : '-'}{trend}
                <span className="text-muted-foreground ml-1">vs last hour</span>
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

export function NexusDashboard() {
    return (
        <div className="space-y-6 pt-2">

            {/* HUD Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back, Commander</h1>
                    <p className="text-sm text-muted-foreground">Grid status is nominal. 4 agents are currently active.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                        <Clock className="h-4 w-4" />
                        <span>Last 24 Hours</span>
                    </button>
                    <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-all">
                        <Play className="h-4 w-4 fill-current" />
                        <span>Deploy Agent</span>
                    </button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total Agents" value="12" icon={Cpu} trend="2.5%" trendUp={true} />
                <StatCard label="Active Threads" value="248" icon={Activity} trend="5.2%" trendUp={true} />
                <StatCard label="Global Latency" value="42ms" icon={Zap} trend="12%" trendUp={false} />
                <StatCard label="Token Usage" value="1.4M" icon={Server} trend="0.8%" trendUp={true} />
            </div>

            {/* Agents Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold tracking-wide text-foreground">Active Deployments</h2>
                    <button className="text-xs text-primary hover:text-primary/80">View All Agents</button>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <AgentCard name="Prod-Scraper-01" id="AGT-3928" status="active" type="scraper" latency={24} />
                    <AgentCard name="Data-Analyzer-X" id="AGT-9921" status="active" type="analyzer" latency={120} />
                    <AgentCard name="Sentiment-Bot-V2" id="AGT-1102" status="idle" type="analyzer" latency={45} />
                    <AgentCard name="Market-Watch-Alpha" id="AGT-5520" status="active" type="scraper" latency={32} />
                    <AgentCard name="Email-Responder" id="AGT-8833" status="error" type="analyzer" latency={0} />
                    <AgentCard name="Invoice-Parser" id="AGT-2291" status="idle" type="analyzer" latency={15} />
                </div>
            </div>

            {/* Recent Logs (Table to Card conversion) */}
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
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center justify-between border-b border-border p-4 last:border-0 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-muted ${i === 2 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                    {i === 2 ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">
                                        {i === 2 ? 'Connection timeout on Node-4' : 'Successfully processed batch job'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Agent: Prod-Scraper-01 • {i * 12} mins ago</p>
                                </div>
                            </div>
                            <code className="hidden rounded bg-black/30 px-2 py-1 font-mono text-xs text-muted-foreground md:block">
                                ID: log_2938{i}
                            </code>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

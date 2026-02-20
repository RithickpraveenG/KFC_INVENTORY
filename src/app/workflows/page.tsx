"use client";

import React, { useState } from 'react';
import {
    Plus,
    Save,
    Play,
    Settings,
    MoreHorizontal,
    X,
    MessageSquare,
    Database,
    Globe,
    Zap,
    Cpu,
    ArrowRight
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// Design: 
// A canvas area with a dot grid background.
// Draggable nodes (simulated with absolute positioning for this MVP).
// Sidebar with components to drag in.

const NODE_TYPES = [
    { type: 'trigger', label: 'Webhook Trigger', icon: Zap, color: 'text-amber-400', border: 'border-amber-400/50', bg: 'bg-amber-400/10' },
    { type: 'action', label: 'LLM Process', icon: Cpu, color: 'text-primary', border: 'border-primary/50', bg: 'bg-primary/10' },
    { type: 'source', label: 'Data Source', icon: Database, color: 'text-emerald-400', border: 'border-emerald-400/50', bg: 'bg-emerald-400/10' },
    { type: 'output', label: 'Response', icon: MessageSquare, color: 'text-purple-400', border: 'border-purple-400/50', bg: 'bg-purple-400/10' },
];

export default function WorkflowsPage() {
    const [nodes, setNodes] = useState([
        { id: 1, type: 'trigger', label: 'New Email Received', x: 100, y: 100 },
        { id: 2, type: 'action', label: 'Analyze Sentiment', x: 400, y: 150 },
        { id: 3, type: 'output', label: 'Slack Notification', x: 750, y: 120 },
    ]);

    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col bg-background relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-background px-6 py-3 z-20">
                <div className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary border border-primary/50">
                        <Zap className="h-4 w-4" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-foreground">Invoice Processing Pipeline</h1>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">v1.2 • Active</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 border-white/10 bg-white/5 hover:bg-white/10 text-muted-foreground">
                        <Settings className="mr-2 h-3 w-3" /> Config
                    </Button>
                    <Button size="sm" className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                        <Save className="mr-2 h-3 w-3" /> Save Workflow
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Sidebar */}
                <div className="w-64 border-r border-border bg-card p-4 z-10 flex flex-col gap-4">
                    <div>
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Components</h3>
                        <div className="space-y-2">
                            {NODE_TYPES.map((node) => (
                                <div key={node.type} className="flex cursor-move items-center gap-3 rounded-lg border border-border bg-background p-3 hover:border-primary/50 hover:bg-accent transition-colors group">
                                    <node.icon className={`h-4 w-4 ${node.color}`} />
                                    <span className="text-sm font-medium text-foreground">{node.label}</span>
                                    <Plus className="ml-auto h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Canvas */}
                <div className="flex-1 relative bg-muted/20">
                    {/* Grid Pattern */}
                    <div className="absolute inset-0 opacity-20"
                        style={{
                            backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
                            backgroundSize: '24px 24px'
                        }}
                    />

                    {/* Nodes (Simulated) */}
                    {nodes.map((node, index) => {
                        const typeDef = NODE_TYPES.find(t => t.type === node.type) || NODE_TYPES[0];
                        return (
                            <React.Fragment key={node.id}>
                                {/* Connection Line (Mock) */}
                                {index < nodes.length - 1 && (
                                    <svg className="absolute inset-0 h-full w-full pointer-events-none overflow-visible">
                                        <path
                                            d={`M ${node.x + 200} ${node.y + 40} C ${node.x + 250} ${node.y + 40}, ${nodes[index + 1].x - 50} ${nodes[index + 1].y + 40}, ${nodes[index + 1].x} ${nodes[index + 1].y + 40}`}
                                            fill="none"
                                            stroke="url(#gradient-line)"
                                            strokeWidth="2"
                                            className="opacity-50"
                                        />
                                        <defs>
                                            <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                                                <stop offset="100%" stopColor="#3b82f6" stopOpacity="1" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                )}

                                <div
                                    className={`absolute w-[200px] rounded-xl border ${typeDef.border} bg-card p-0 shadow-sm transition-transform hover:scale-105 cursor-pointer`}
                                    style={{ left: node.x, top: node.y }}
                                >
                                    {/* Header */}
                                    <div className={`flex items-center justify-between border-b border-border p-3 ${typeDef.bg}`}>
                                        <div className="flex items-center gap-2">
                                            <typeDef.icon className={`h-4 w-4 ${typeDef.color}`} />
                                            <span className="text-xs font-bold text-foreground">{typeDef.label}</span>
                                        </div>
                                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    {/* Body */}
                                    <div className="p-3">
                                        <p className="text-[10px] text-muted-foreground mb-2">Configuration</p>
                                        <div className="h-6 w-full rounded bg-black/20 border border-white/5 mb-2"></div>
                                        <div className="h-6 w-2/3 rounded bg-black/20 border border-white/5"></div>
                                    </div>
                                    {/* Ports */}
                                    <div className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border border-white/20 bg-black"></div>
                                    <div className="absolute -right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border border-primary bg-primary shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
                                </div>
                            </React.Fragment>
                        );
                    })}

                    {/* Floating Controls */}
                    <div className="absolute bottom-8 right-8 flex gap-2">
                        <Button className="rounded-full h-12 w-12 bg-primary/20 hover:bg-primary/40 text-primary border border-primary/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                            <Play className="h-5 w-5 fill-current" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

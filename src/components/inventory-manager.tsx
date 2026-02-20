"use client";

import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Download, ArrowLeft, Box, Truck, X } from "lucide-react";
import { DispatchRecord, ProductStock } from "@/types/inventory";
import { utils, writeFile } from 'xlsx';

import { Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface InventoryManagerProps {
    initialStock: ProductStock[];
    initialHistory: DispatchRecord[];
}

export function InventoryManager({ initialStock, initialHistory }: InventoryManagerProps) {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    const [history, setHistory] = useState(initialHistory);
    const [productionHistory, setProductionHistory] = useState<any[]>([]); // To be fetched
    const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
    const [filterProduct, setFilterProduct] = useState<string | null>(null);

    // Fetch Production History on mount or when tab changes
    const fetchProductionHistory = async () => {
        try {
            const res = await fetch('/api/production');
            if (res.ok) setProductionHistory(await res.json());
        } catch (e) {
            console.error("Failed to fetch production logs");
        }
    };

    const handleDeleteDispatch = async (id: string) => {
        if (!confirm("Are you sure you want to delete this dispatch record?")) return;
        try {
            const res = await fetch(`/api/inventory?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setHistory(history.filter(h => h.id !== id));
                // Ideally refresh stock data too, but for now just update list
            }
        } catch (e) {
            alert("Failed to delete");
        }
    };

    const handleDeleteProduction = async (id: string) => {
        if (!confirm("Are you sure you want to delete this production record?")) return;
        try {
            const res = await fetch(`/api/production?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setProductionHistory(productionHistory.filter(p => p.id !== id));
            }
        } catch (e) {
            alert("Failed to delete");
        }
    };

    const handleExport = () => {
        const wb = utils.book_new();

        const wsStock = utils.json_to_sheet(initialStock.map(s => ({
            Product: s.name,
            Produced: s.totalProduced,
            Dispatched: s.totalDispatched,
            Stock: s.currentStock,
            Status: s.currentStock < s.minStockLevel ? 'LOW' : 'OK'
        })));
        utils.book_append_sheet(wb, wsStock, "Stock Levels");

        const wsHistory = utils.json_to_sheet(initialHistory.map(h => ({
            Date: h.date,
            Product: h.productName,
            Quantity: h.quantity,
            Destination: h.destination,
            Detail: h.destinationDetail,
            Notes: h.notes
        })));
        utils.book_append_sheet(wb, wsHistory, "Dispatch History");

        writeFile(wb, `Inventory_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // --- DETAIL VIEW ---
    if (selectedProduct) {
        const productStats = initialStock.find(p => p.name === selectedProduct);
        const productHistory = initialHistory.filter(h => h.productName === selectedProduct);

        return (
            <div className="space-y-6 pt-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedProduct(null)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">{selectedProduct}</h2>
                        <p className="text-muted-foreground">Product Details & Ledger</p>
                    </div>
                </div>

                {/* KPI Cards for Product */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Current Stock</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-primary">{productStats?.currentStock || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Box className="h-4 w-4" /> Total Produced
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{productStats?.totalProduced || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Truck className="h-4 w-4" /> Total Dispatched
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{productStats?.totalDispatched || 0}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-border/50">
                    <CardHeader>
                        <CardTitle>Dispatch History</CardTitle>
                        <CardDescription>Ledger of all movements for {selectedProduct}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border border-border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/5">
                                        <TableHead>Date</TableHead>
                                        <TableHead>Destination</TableHead>
                                        <TableHead>Detail</TableHead>
                                        <TableHead>Notes</TableHead>
                                        <TableHead className="text-right">Quantity</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {productHistory.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                                No dispatch history for this product.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {productHistory.map((log) => (
                                        <TableRow key={log.id} className="hover:bg-muted/50 transition-colors">
                                            <TableCell className="font-mono text-sm text-muted-foreground">{new Date(log.date).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className={`shadow-none ${log.destination === 'Customer' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-purple-500/10 text-purple-500 border-purple-500/20'}`}>
                                                    {log.destination}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{log.destinationDetail || '-'}</TableCell>
                                            <TableCell className="text-muted-foreground italic">{log.notes || '-'}</TableCell>
                                            <TableCell className="text-right font-bold">{log.quantity}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // --- MAIN VIEW ---
    return (
        <div className="space-y-8 pt-6 animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Inventory Management</h2>
                    <p className="text-muted-foreground mt-1">Track stock levels and dispatch history.</p>
                </div>
                <Button onClick={handleExport} variant="outline" className="flex items-center gap-2 border-primary/20 hover:bg-primary/5">
                    <Download className="h-4 w-4" /> Export Report
                </Button>
            </div>

            <Tabs defaultValue="stock" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-[600px] mb-4">
                    <TabsTrigger value="stock">Stock Overview</TabsTrigger>
                    <TabsTrigger value="history">Dispatch History</TabsTrigger>
                    <TabsTrigger value="production" onClick={fetchProductionHistory}>Production History</TabsTrigger>
                </TabsList>

                {/* STOCK TAB */}
                <TabsContent value="stock" className="space-y-4">
                    <Card className="border-border/50">
                        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 pb-2">
                            <div className="space-y-1">
                                <CardTitle>Produced Components Stock</CardTitle>
                                <CardDescription>Select a product to view detailed ledger.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Select value={filterProduct || "all"} onValueChange={(val) => setFilterProduct(val === "all" ? null : val)}>
                                    <SelectTrigger className="w-[280px]">
                                        <SelectValue placeholder="Filter by Product" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Products</SelectItem>
                                        {initialStock.map((p) => (
                                            <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {filterProduct && (
                                    <Button variant="ghost" size="icon" onClick={() => setFilterProduct(null)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border border-border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/5">
                                            <TableHead className="w-[30%]">Product Name</TableHead>
                                            <TableHead className="text-right">Total Produced</TableHead>
                                            <TableHead className="text-right">Total Dispatched</TableHead>
                                            <TableHead className="text-right">Current Stock</TableHead>
                                            <TableHead className="text-center">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {initialStock.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                                    No production data available.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {initialStock
                                            .filter(item => item.type === 'FINISHED')
                                            .filter(item => !filterProduct || item.name === filterProduct)
                                            .map((item) => (
                                                <TableRow
                                                    key={item.name}
                                                    className="hover:bg-muted/50 transition-colors cursor-pointer group"
                                                    onClick={() => setSelectedProduct(item.name)}
                                                >
                                                    <TableCell className="font-medium text-foreground group-hover:text-primary transition-colors">{item.name}</TableCell>
                                                    <TableCell className="text-right">{item.totalProduced}</TableCell>
                                                    <TableCell className="text-right">{item.totalDispatched}</TableCell>
                                                    <TableCell className="text-right">
                                                        <span className={`font-bold text-lg ${item.currentStock < 50 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                            {item.currentStock}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {item.currentStock < 50 ? (
                                                            <Badge variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20 shadow-none">Low Stock</Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-none">Optimal</Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* HISTORY TAB */}
                <TabsContent value="history" className="space-y-4">
                    <Card className="border-border/50">
                        <CardHeader>
                            <CardTitle>Dispatch Log</CardTitle>
                            <CardDescription>History of all finalized customer shipments.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border border-border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/5">
                                            <TableHead>Date</TableHead>
                                            <TableHead>Product</TableHead>
                                            <TableHead>Destination</TableHead>
                                            <TableHead>Detail</TableHead>
                                            <TableHead className="text-right">Quantity</TableHead>
                                            {isAdmin && <TableHead className="w-[50px]"></TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {initialHistory.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                                    No dispatch records found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {initialHistory.map((log) => (
                                            <TableRow key={log.id} className="hover:bg-muted/50 transition-colors">
                                                <TableCell className="font-mono text-sm text-muted-foreground">{new Date(log.date).toLocaleDateString()}</TableCell>
                                                <TableCell className="font-medium">{log.productName}</TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className={`shadow-none ${log.destination === 'Customer' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-purple-500/10 text-purple-500 border-purple-500/20'}`}>
                                                        {log.destination}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">{log.destinationDetail || '-'}</TableCell>
                                                <TableCell className="text-right font-bold">{log.quantity}</TableCell>
                                                {isAdmin && (
                                                    <TableCell>
                                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteDispatch(log.id)} className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* PRODUCTION TAB */}
                <TabsContent value="production" className="space-y-4">
                    <Card className="border-border/50">
                        <CardHeader>
                            <CardTitle>Production Log</CardTitle>
                            <CardDescription>History of all completed production batches.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border border-border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/5">
                                            <TableHead>Date</TableHead>
                                            <TableHead>Batch ID</TableHead>
                                            <TableHead>Product</TableHead>
                                            <TableHead>Operator</TableHead>
                                            <TableHead className="text-right">Quantity</TableHead>
                                            {isAdmin && <TableHead className="w-[50px]"></TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {productionHistory.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                                    No production records found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {productionHistory.map((log) => (
                                            <TableRow key={log.id} className="hover:bg-muted/50 transition-colors">
                                                <TableCell className="font-mono text-sm text-muted-foreground">{log.date}</TableCell>
                                                <TableCell className="font-mono text-xs">{log.batchId}</TableCell>
                                                <TableCell className="font-medium">{log.componentProduced}</TableCell>
                                                <TableCell>{log.operator}</TableCell>
                                                <TableCell className="text-right font-bold">{log.quantityProduced}</TableCell>
                                                {isAdmin && (
                                                    <TableCell>
                                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteProduction(log.id)} className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

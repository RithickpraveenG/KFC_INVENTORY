"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useMasterData } from "@/lib/master-data-context";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Layers, Package, Save, CheckCircle2, Clock, CheckSquare, Circle, ArrowRight, Check, Truck, AlertTriangle, Plus, FileText, Calendar, Filter } from "lucide-react";

// --- Types & Schema ---
const rawMaterialSchema = z.object({
    date: z.string().min(1, "Date is required"),
    operator: z.string().min(2, "Operator name is required"),
    batchId: z.string().min(3, "Batch ID is required"),
    materialName: z.string().min(1, "Select a material"),
    quantity: z.coerce.number().gt(0, "Quantity must be greater than 0"),
});

const productionSchema = z.object({
    productName: z.string().min(1, "Select a product"),
    unitsProduced: z.coerce.number().int().min(1, "Units must be at least 1"),
});

const dispatchSchema = z.object({
    date: z.string().min(1, "Date is required"),
    productName: z.string().min(1, "Select a product"),
    quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
    destination: z.enum(["Plating", "Customer"]),
    destinationDetail: z.string().optional(),
    notes: z.string().optional(),
});

interface PendingBatch {
    id: string;
    date: string;
    operator: string;
    materialName: string;
    quantity: number;
    status: 'PENDING';
}

interface ProductStock {
    name: string;
    totalProduced: number;
    totalDispatched: number;
    currentStock: number;
}

export default function EntryPage() {
    const { materials, products, operators } = useMasterData();
    const [view, setView] = useState<'list' | 'dispatch'>('list'); // 'list' allows toggling between history/pending
    const [activeTab, setActiveTab] = useState("pending");

    // Data State
    const [pendingBatches, setPendingBatches] = useState<PendingBatch[]>([
        { id: "B-2024-001", date: "2024-10-25", operator: "John Doe", materialName: "Steel Sheet", quantity: 120.5, status: 'PENDING' },
    ]);
    const [productionLogs, setProductionLogs] = useState<any[]>([]);
    const [stockData, setStockData] = useState<ProductStock[]>([]);

    // UI State
    const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
    const [isNewBatchDialogOpen, setIsNewBatchDialogOpen] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState<PendingBatch | null>(null);
    const [nextBatchId, setNextBatchId] = useState("");

    // --- Forms ---
    const rmForm = useForm<z.infer<typeof rawMaterialSchema>>({
        resolver: zodResolver(rawMaterialSchema) as any,
        defaultValues: {
            date: new Date().toISOString().split("T")[0],
            operator: "",
            batchId: "",
            materialName: "",
            quantity: 0,
        },
    });

    const prodForm = useForm<z.infer<typeof productionSchema>>({
        resolver: zodResolver(productionSchema) as any,
        defaultValues: {
            productName: "",
            unitsProduced: 0,
        },
    });

    // Fetch Stock & Logs
    const fetchData = async () => {
        try {
            const [stockRes, prodRes] = await Promise.all([
                fetch('/api/inventory'),
                fetch('/api/production')
            ]);
            if (stockRes.ok) setStockData(await stockRes.json());
            if (prodRes.ok) setProductionLogs(await prodRes.json());
        } catch (error) {
            console.error("Failed to fetch data", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- Batch ID Logic ---
    const generateBatchId = async () => {
        try {
            const res = await fetch('/api/batch-id');
            if (res.ok) {
                const data = await res.json();
                setNextBatchId(data.id);
                rmForm.setValue("batchId", data.id);
            }
        } catch (error) {
            const fallbackId = `B-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
            setNextBatchId(fallbackId);
            rmForm.setValue("batchId", fallbackId);
        }
    };

    useEffect(() => {
        if (isNewBatchDialogOpen) generateBatchId();
    }, [isNewBatchDialogOpen]);

    // --- Handlers ---
    async function onStartBatch(values: z.infer<typeof rawMaterialSchema>) {
        const newBatch: PendingBatch = {
            id: values.batchId || `B-${Date.now()}`,
            date: values.date,
            operator: values.operator,
            materialName: values.materialName,
            quantity: values.quantity,
            status: 'PENDING'
        };
        setPendingBatches(prev => [...prev, newBatch]);

        toast.success("Batch Started", {
            description: `Batch ${newBatch.id} initialized.`,
            icon: <Layers className="h-4 w-4 text-blue-600" />,
        });

        rmForm.reset({
            date: new Date().toISOString().split("T")[0],
            operator: "",
            batchId: "",
            materialName: "",
            quantity: 0,
        });
        setIsNewBatchDialogOpen(false);
    }

    const openCompletionDialog = (batch: PendingBatch) => {
        setSelectedBatch(batch);
        prodForm.setValue("productName", "");
        prodForm.setValue("unitsProduced", 0);
        setIsCompletionDialogOpen(true);
    };

    async function onCompleteBatch(values: z.infer<typeof productionSchema>) {
        if (!selectedBatch) return;

        const selectedProductInfo = products.find(p => p.name === values.productName);
        const isSemiFinished = selectedProductInfo?.type === 'SEMI_FINISHED';
        const isFinished = !selectedProductInfo?.type || selectedProductInfo?.type === 'FINISHED';

        const productionLog = {
            batchId: selectedBatch.id,
            date: selectedBatch.date,
            operator: selectedBatch.operator,
            rmUsed: selectedBatch.materialName,
            rmQuantity: selectedBatch.quantity,
            componentProduced: values.productName,
            quantityProduced: values.unitsProduced,
            semiFinished: isSemiFinished,
            finished: isFinished,
            status: 'COMPLETED'
        };

        try {
            const response = await fetch('/api/production', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productionLog)
            });

            if (!response.ok) throw new Error('Failed to save batch');

            setPendingBatches(prev => prev.filter(b => b.id !== selectedBatch.id));
            toast.success("Batch Completed", {
                description: `Production recorded for Batch ${selectedBatch.id}.`,
                icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
            });
            setIsCompletionDialogOpen(false);
            prodForm.reset();
            setSelectedBatch(null);
            fetchData();
        } catch (error) {
            toast.error("Failed to save batch");
        }
    }

    // --- Summary Calculations ---
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysLogs = productionLogs.filter(l => l.date === todayStr);
    const totalWeekly = productionLogs.length; // Placeholder logic

    return (
        <div className="space-y-6 pt-2 animate-in fade-in duration-300">
            {/* Page Header with Action Button */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Production Log</h1>
                    <p className="text-muted-foreground">Manage and track production batches.</p>
                </div>
                <Dialog open={isNewBatchDialogOpen} onOpenChange={setIsNewBatchDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                            <Plus className="h-4 w-4 mr-2" /> Log Production
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Start New Production Batch</DialogTitle>
                        </DialogHeader>
                        <Form {...rmForm}>
                            <form onSubmit={rmForm.handleSubmit(onStartBatch)} className="space-y-6 pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={rmForm.control}
                                        name="batchId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Batch ID</FormLabel>
                                                <FormControl><Input {...field} readOnly disabled className="bg-muted font-mono" /></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={rmForm.control}
                                        name="date"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Date</FormLabel>
                                                <FormControl><Input type="date" {...field} /></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={rmForm.control}
                                        name="operator"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Operator</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select operator" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {operators.map((op) => (
                                                            <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={rmForm.control}
                                        name="materialName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Raw Material</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select raw material" /></SelectTrigger></FormControl>
                                                    <SelectContent className="max-h-[200px]">
                                                        {materials.map((item) => (
                                                            <SelectItem key={item.id} value={item.name}>{item.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={rmForm.control}
                                        name="quantity"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Quantity Used (kg)</FormLabel>
                                                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <Button type="submit" className="w-full">Initialize Batch</Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-card border-border/60 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Today's Production</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{todaysLogs.length} Batches</div>
                        <p className="text-xs text-muted-foreground">+2 from yesterday</p>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border/60 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{productionLogs.length}</div>
                        <p className="text-xs text-muted-foreground">All time records</p>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border/60 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Weekly Output</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalWeekly}</div>
                        <p className="text-xs text-muted-foreground">Batches this week</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Area */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex items-center justify-between mb-4">
                    <TabsList className="grid w-[400px] grid-cols-2">
                        <TabsTrigger value="pending" className="relative">
                            Pending Batches
                            {pendingBatches.length > 0 && (
                                <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-600">
                                    {pendingBatches.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="history">History Log</TabsTrigger>
                    </TabsList>
                    {/* Add Filter Button or Date Picker here if needed */}
                </div>

                <TabsContent value="pending" className="space-y-4">
                    <Card className="border-orange-200 bg-orange-50/30">
                        <CardHeader>
                            <CardTitle className="text-orange-700 flex items-center gap-2">
                                <Clock className="h-5 w-5" /> In Progress
                            </CardTitle>
                            <CardDescription>Batches currently on the floor. Click 'Complete' to finalize.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-orange-200">
                                        <TableHead className="text-orange-700">Batch ID</TableHead>
                                        <TableHead className="text-orange-700">Operator</TableHead>
                                        <TableHead className="text-orange-700">Material</TableHead>
                                        <TableHead className="text-orange-700">Start Time</TableHead>
                                        <TableHead className="text-right text-orange-700">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendingBatches.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No pending batches. Start a new one above.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {pendingBatches.map((batch) => (
                                        <TableRow key={batch.id} className="border-orange-100 hover:bg-orange-50">
                                            <TableCell className="font-mono font-medium">{batch.id}</TableCell>
                                            <TableCell>{batch.operator}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{batch.materialName}</span>
                                                    <span className="text-xs text-muted-foreground">{batch.quantity} kg</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{batch.date}</TableCell>
                                            <TableCell className="text-right">
                                                <Button size="sm" onClick={() => openCompletionDialog(batch)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                                    <Check className="h-4 w-4 mr-1" /> Complete
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>Production History</CardTitle>
                            <CardDescription>Comprehensive log of all completed batches.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30">
                                        <TableHead>Date</TableHead>
                                        <TableHead>Batch ID</TableHead>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Operator</TableHead>
                                        <TableHead className="text-right">Quantity</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {productionLogs.map((log) => (
                                        <TableRow key={log.id || log.batchId} className="hover:bg-muted/50">
                                            <TableCell className="text-muted-foreground">{log.date}</TableCell>
                                            <TableCell className="font-mono text-xs">{log.batchId}</TableCell>
                                            <TableCell className="font-medium text-foreground">{log.componentProduced}</TableCell>
                                            <TableCell>{log.operator}</TableCell>
                                            <TableCell className="text-right font-bold">{log.quantityProduced}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Completed</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {productionLogs.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                                No history records found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Completion Dialog */}
            <Dialog open={isCompletionDialogOpen} onOpenChange={setIsCompletionDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Complete Batch: {selectedBatch?.id}</DialogTitle>
                    </DialogHeader>
                    <Form {...prodForm}>
                        <form onSubmit={prodForm.handleSubmit(onCompleteBatch)} className="space-y-4">
                            <FormField
                                control={prodForm.control}
                                name="unitsProduced"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Units Produced</FormLabel>
                                        <FormControl><Input type="number" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={prodForm.control}
                                name="productName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Product</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select finished product" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="max-h-[200px]">
                                                {products.map((p) => (
                                                    <SelectItem key={p.id} value={p.name}>
                                                        {p.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">Finalize Batch</Button>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

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
} from "@/components/ui/dialog";
import { Layers, Package, Save, CheckCircle2, Clock, CheckSquare, Circle, ArrowRight, Check, Truck, AlertTriangle } from "lucide-react";

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
    const [activeTab, setActiveTab] = useState("new-batch");
    const [selectedBatch, setSelectedBatch] = useState<PendingBatch | null>(null);
    const [pendingBatches, setPendingBatches] = useState<PendingBatch[]>([
        { id: "B-2024-001", date: "2024-10-25", operator: "John Doe", materialName: "Steel Sheet", quantity: 120.5, status: 'PENDING' },
    ]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [nextBatchId, setNextBatchId] = useState("");
    const [stockData, setStockData] = useState<ProductStock[]>([]);

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

    const dispatchForm = useForm<z.infer<typeof dispatchSchema>>({
        resolver: zodResolver(dispatchSchema) as any,
        defaultValues: {
            date: new Date().toISOString().split("T")[0],
            productName: "",
            quantity: 0,
            destination: "Customer",
            destinationDetail: "",
            notes: "",
        },
    });

    // Fetch Stock Data
    const fetchStock = async () => {
        try {
            const res = await fetch('/api/inventory');
            if (res.ok) {
                const data = await res.json();
                setStockData(data);
            }
        } catch (error) {
            console.error("Failed to fetch stock", error);
        }
    };

    useEffect(() => {
        fetchStock();
    }, []);

    // --- Auto Batch ID Logic ---
    const generateBatchId = async () => {
        try {
            const res = await fetch('/api/batch-id');
            if (res.ok) {
                const data = await res.json();
                setNextBatchId(data.id);
                rmForm.setValue("batchId", data.id);
            }
        } catch (error) {
            console.error("Failed to fetch batch ID", error);
            // Fallback for offline/error
            const fallbackId = `B-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
            setNextBatchId(fallbackId);
            rmForm.setValue("batchId", fallbackId);
        }
    };

    useEffect(() => {
        generateBatchId();
    }, []);

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
        setPendingBatches([...pendingBatches, newBatch]);

        toast.success("Batch Started", {
            description: `Batch ${newBatch.id} initialized with ${values.quantity}kg of ${values.materialName}.`,
            icon: <Layers className="h-4 w-4 text-blue-600" />,
        });

        rmForm.reset({
            date: new Date().toISOString().split("T")[0],
            operator: "",
            batchId: "",
            materialName: "",
            quantity: 0,
        });
        generateBatchId(); // Generate new ID for next batch
    }

    const openCompletionDialog = (batch: PendingBatch) => {
        setSelectedBatch(batch);
        prodForm.setValue("productName", "");
        prodForm.setValue("unitsProduced", 0);
        setIsDialogOpen(true);
    };

    async function onCompleteBatch(values: z.infer<typeof productionSchema>) {
        if (!selectedBatch) return;

        // ... (productionLog construction) ...
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

            setPendingBatches(pendingBatches.filter(b => b.id !== selectedBatch.id));
            toast.success("Batch Completed", {
                description: `Production recorded for Batch ${selectedBatch.id}.`,
                icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
            });
            setIsDialogOpen(false);
            prodForm.reset();
            setSelectedBatch(null);
            fetchStock(); // Update stock after production
        } catch (error) {
            console.error(error);
            toast.error("Failed to save batch");
        }
    }

    async function onDispatchSubmit(values: z.infer<typeof dispatchSchema>) {
        try {
            const res = await fetch('/api/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values)
            });

            if (res.ok) {
                toast.success("Dispatch Recorded", {
                    description: `${values.quantity} units of ${values.productName} sent to ${values.destination}.`,
                    icon: <Truck className="h-4 w-4 text-blue-600" />,
                });
                dispatchForm.reset({
                    date: new Date().toISOString().split("T")[0],
                    productName: "",
                    quantity: 0,
                    destination: "Customer",
                    destinationDetail: "",
                    notes: "",
                });
                fetchStock(); // Update stock
            } else {
                const err = await res.json();
                toast.error("Dispatch Failed", { description: err.error });
            }
        } catch (error) {
            toast.error("Network Error");
        }
    }

    const selectedProductForDispatch = dispatchForm.watch("productName");
    const currentStock = stockData.find(s => s.name === selectedProductForDispatch)?.currentStock || 0;

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Production Entry</h1>
                <p className="text-muted-foreground">Manage daily production batches, material logs, and inventory dispatch.</p>
            </div>

            <div className="w-full max-w-5xl mx-auto">
                <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); if (val === 'dispatch') fetchStock(); }} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted p-1 rounded-xl">
                        <TabsTrigger value="new-batch" className="rounded-lg py-3">
                            <Layers className="h-4 w-4 mr-2" /> Start New Batch
                        </TabsTrigger>
                        <TabsTrigger value="pending" className="rounded-lg py-3">
                            <Clock className="h-4 w-4 mr-2" /> Pending Batches
                            {pendingBatches.length > 0 && (
                                <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-amber-500/20 text-amber-500">
                                    {pendingBatches.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="dispatch" className="rounded-lg py-3">
                            <Truck className="h-4 w-4 mr-2" /> Dispatch & Inventory
                        </TabsTrigger>
                    </TabsList>

                    {/* ... (New Batch Tab Content) ... */}
                    <TabsContent value="new-batch">
                        {/* Existing New Batch Content - kept same but wrapped to ensure structure */}
                        <Card className="border-primary/20 shadow-lg shadow-primary/5 inset-0 overflow-hidden bg-card">
                            <div className="h-2 bg-primary w-full"></div>
                            <CardHeader className="bg-card border-b border-border">
                                <CardTitle className="text-primary">Raw Material Input</CardTitle>
                                <CardDescription>Select material and quantity to initialize a batch.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 md:p-8">
                                <Form {...rmForm}>
                                    <form onSubmit={rmForm.handleSubmit(onStartBatch)} className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                                            {/* Column 1: Meta Data */}
                                            <div className="space-y-6">
                                                <FormField
                                                    control={rmForm.control}
                                                    name="batchId"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Batch ID</FormLabel>
                                                            <FormControl><Input {...field} readOnly disabled className="bg-muted font-mono" /></FormControl>
                                                            <FormMessage />
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
                                                            <FormMessage />
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
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            {/* Column 2: Material & Quantity */}
                                            <div className="space-y-6">
                                                <FormField
                                                    control={rmForm.control}
                                                    name="materialName"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Raw Material</FormLabel>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Select raw material" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent className="max-h-[300px]">
                                                                    {materials.map((item) => (
                                                                        <SelectItem key={item.id} value={item.name}>
                                                                            {item.name}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={rmForm.control}
                                                    name="quantity"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Quantity Used (kg)</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    placeholder="0.00"
                                                                    {...field}
                                                                    value={field.value === 0 ? '' : field.value}
                                                                    onChange={(e) => field.onChange(e.target.value)}
                                                                />
                                                            </FormControl>
                                                            <FormDescription>Enter the amount of material consumed.</FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                        <Button type="submit" className="w-full md:w-auto bg-primary text-primary-foreground py-6 px-10 rounded-xl">Start Batch</Button>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ... (Pending Batches Tab Content) ... */}
                    <TabsContent value="pending">
                        {/* ... Existing Pending Batches Table ... */}
                        <Card className="border-0 shadow-lg bg-card overflow-hidden relative">
                            <div className="absolute top-0 left-0 right-0 h-3 bg-orange-500"></div>
                            <CardHeader className="pt-8 border-b border-border">
                                <CardTitle className="text-orange-500 text-xl font-bold">Pending Batches</CardTitle>
                                <CardDescription>Batches in progress.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent border-b border-orange-500/20">
                                            <TableHead className="text-orange-500 font-bold">Batch ID</TableHead>
                                            <TableHead className="text-orange-500 font-bold">Date</TableHead>
                                            <TableHead className="text-orange-500 font-bold">Given RM</TableHead>
                                            <TableHead className="text-orange-500 font-bold">Quantity</TableHead>
                                            <TableHead className="text-right text-orange-500 font-bold pr-6">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pendingBatches.map((batch) => (
                                            <TableRow key={batch.id}>
                                                <TableCell className="font-semibold">{batch.id}</TableCell>
                                                <TableCell>{batch.date}</TableCell>
                                                <TableCell>{batch.materialName}</TableCell>
                                                <TableCell>{batch.quantity}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button size="sm" onClick={() => openCompletionDialog(batch)} variant="outline" className="border-2 border-teal-500 text-teal-500 hover:bg-teal-500 hover:text-white">Complete</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* --- DISPATCH TAB --- */}
                    <TabsContent value="dispatch" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Dispatch Form */}
                            <Card className="lg:col-span-2 border-blue-500/20 shadow-lg shadow-blue-500/5 overflow-hidden">
                                <div className="h-2 bg-blue-500 w-full"></div>
                                <CardHeader>
                                    <CardTitle className="text-blue-600 flex items-center gap-2"><Truck className="h-5 w-5" /> Dispatch Inventory</CardTitle>
                                    <CardDescription>Log items sent to customers or external plating.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Form {...dispatchForm}>
                                        <form onSubmit={dispatchForm.handleSubmit(onDispatchSubmit)} className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <FormField
                                                    control={dispatchForm.control}
                                                    name="date"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Date</FormLabel>
                                                            <FormControl><Input type="date" {...field} /></FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={dispatchForm.control}
                                                    name="destination"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Destination Type</FormLabel>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="Customer">Customer</SelectItem>
                                                                    <SelectItem value="Plating">Plating Vendor</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <FormField
                                                control={dispatchForm.control}
                                                name="productName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Product to Dispatch</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl><SelectTrigger><SelectValue placeholder="Select Product" /></SelectTrigger></FormControl>
                                                            <SelectContent>
                                                                {products.filter(p => !p.type || p.type === 'FINISHED').map((p) => (
                                                                    <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        {field.value && (
                                                            <div className={`text-sm mt-1 font-medium ${currentStock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                                Available Stock: {currentStock} units
                                                            </div>
                                                        )}
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <FormField
                                                    control={dispatchForm.control}
                                                    name="quantity"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Quantity</FormLabel>
                                                            <FormControl><Input type="number" {...field} /></FormControl>
                                                            <FormDescription>Must not exceed available stock.</FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={dispatchForm.control}
                                                    name="destinationDetail"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Destination Name (Optional)</FormLabel>
                                                            <FormControl><Input placeholder="e.g. ABC Corp" {...field} /></FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-semibold">
                                                Confirm Dispatch
                                            </Button>
                                        </form>
                                    </Form>
                                </CardContent>
                            </Card>

                            {/* Stock Overview Sidebar */}
                            <Card className="h-fit">
                                <CardHeader>
                                    <CardTitle>Current Stock</CardTitle>
                                    <CardDescription>Real-time inventory levels.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
                                    {stockData.filter(s => s.currentStock > 0).map((stock) => (
                                        <div key={stock.name} className="flex justify-between items-center border-b pb-2 last:border-0 hover:bg-muted/50 p-2 rounded">
                                            <div>
                                                <p className="font-medium text-sm">{stock.name}</p>
                                                <p className="text-xs text-muted-foreground">Produced: {stock.totalProduced} | Sent: {stock.totalDispatched}</p>
                                            </div>
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                                {stock.currentStock}
                                            </Badge>
                                        </div>
                                    ))}
                                    {stockData.filter(s => s.currentStock > 0).length === 0 && (
                                        <div className="text-center text-muted-foreground py-8">
                                            No stock available.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                </Tabs>

                {/* ... (Dialog for Completion) ... */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                                                <SelectContent className="max-h-[300px]">
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
                                <Button type="submit" className="w-full">Finalize</Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}

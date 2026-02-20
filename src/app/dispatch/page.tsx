"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useMasterData } from "@/lib/master-data-context";
import { Truck, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { ProductStock } from "@/types/inventory";
import Link from "next/link";

const dispatchSchema = z.object({
    date: z.string().min(1, "Date is required"),
    productName: z.string().min(1, "Select a product"),
    quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
    destination: z.enum(["Plating", "Customer"]),
    destinationDetail: z.string().optional(),
    notes: z.string().optional(),
});

export default function DispatchPage() {
    const { products } = useMasterData();
    const [stockData, setStockData] = useState<ProductStock[]>([]);
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof dispatchSchema>>({
        resolver: zodResolver(dispatchSchema),
        defaultValues: {
            date: new Date().toISOString().split("T")[0],
            productName: "",
            quantity: 0,
            destination: "Customer",
            destinationDetail: "",
            notes: "",
        },
    });

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

    const selectedProduct = form.watch("productName");
    const currentStock = stockData.find(s => s.name === selectedProduct)?.currentStock || 0;

    async function onSubmit(values: z.infer<typeof dispatchSchema>) {
        if (values.quantity > currentStock) {
            form.setError("quantity", {
                type: "manual",
                message: `Insufficient stock! Max available: ${currentStock}`
            });
            toast.error("Insufficient Stock", {
                description: `You only have ${currentStock} units of ${values.productName}.`
            });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values)
            });

            if (res.ok) {
                toast.success("Dispatch Recorded", {
                    description: `${values.quantity} units of ${values.productName} sent to ${values.destination}.`,
                    icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
                });
                form.reset({
                    date: new Date().toISOString().split("T")[0],
                    productName: "",
                    quantity: 0,
                    destination: "Customer",
                    destinationDetail: "",
                    notes: "",
                });
                fetchStock(); // Refresh stock data
            } else {
                const err = await res.json();
                toast.error("Dispatch Failed", { description: err.error });
            }
        } catch (error) {
            toast.error("Network Error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-8 max-w-2xl mx-auto py-8 px-4">
            <div className="flex items-center gap-4 mb-4">
                <Link href="/entry">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Dispatch Entry</h1>
                    <p className="text-muted-foreground">Record finished goods leaving the facility.</p>
                </div>
            </div>

            <Card className="border-blue-500/20 shadow-lg shadow-blue-500/5">
                <div className="h-2 bg-blue-500 w-full rounded-t-xl"></div>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-600">
                        <Truck className="h-5 w-5" /> New Dispatch
                    </CardTitle>
                    <CardDescription>
                        Enter details for outgoing shipment.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
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
                                    control={form.control}
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
                                control={form.control}
                                name="productName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Product to Dispatch</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select Product" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {products
                                                    .filter(p => p.type === 'FINISHED') // Optionally filter to finished goods only
                                                    .map((p) => (
                                                        <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                        {field.value && (
                                            <div className={`text-sm mt-2 font-medium flex items-center gap-2 ${currentStock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                {currentStock > 0 ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                                                Available Stock: {currentStock} units
                                            </div>
                                        )}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="quantity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Quantity</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                            <FormDescription>Cannot exceed {currentStock} available.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="destinationDetail"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Destination Name</FormLabel>
                                            <FormControl><Input placeholder="e.g. ABC Corp" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Notes</FormLabel>
                                        <FormControl><Input placeholder="Additional comments..." {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-semibold shadow-lg shadow-blue-500/20">
                                {loading ? "Processing..." : "Confirm Dispatch"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}

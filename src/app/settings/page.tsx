"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit2, Save, Trash2 } from "lucide-react";
import { useMasterData, Material, Product, Operator } from "@/lib/master-data-context";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { isValidProjectName, DEFAULT_PROJECT_NAME } from "@/lib/project-config";
import { Settings } from "lucide-react";

function SettingsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, users, addUser, deleteUser: removeUser } = useAuth();
    const currentTab = searchParams.get("tab") || "materials";
    const {
        materials, addMaterial, deleteMaterial, updateMaterial,
        products, addProduct, deleteProduct, updateProduct,
        operators, addOperator, deleteOperator, updateOperator
    } = useMasterData();

    // -- Dialog States --
    const [isMaterialOpen, setIsMaterialOpen] = useState(false);
    const [isProductOpen, setIsProductOpen] = useState(false);
    const [isOperatorOpen, setIsOperatorOpen] = useState(false);
    const [isUserOpen, setIsUserOpen] = useState(false);

    // -- Form States --
    const [newMaterial, setNewMaterial] = useState({ name: "", unit: "kg", cost: "" });
    const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
    const [isEditMaterialOpen, setIsEditMaterialOpen] = useState(false);

    const [newProduct, setNewProduct] = useState({ name: "", type: "FINISHED" as const, sku: "", minStockLevel: 50 });
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isEditProductOpen, setIsEditProductOpen] = useState(false);

    const [newOperator, setNewOperator] = useState({ name: "", role: "Operator" });
    const [editingOperator, setEditingOperator] = useState<Operator | null>(null);
    const [isEditOperatorOpen, setIsEditOperatorOpen] = useState(false);

    const [newUser, setNewUser] = useState({ username: "", password: "", name: "", role: "OPERATOR" as const });

    const [projectName, setProjectName] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem("projectName") || DEFAULT_PROJECT_NAME;
        }
        return DEFAULT_PROJECT_NAME;
    });
    const [projectNameInput, setProjectNameInput] = useState(projectName);
    const [projectError, setProjectError] = useState("");

    // -- Handlers --
    const handleAddMaterial = () => {
        if (!newMaterial.name) return;
        addMaterial({
            name: newMaterial.name,
            unit: newMaterial.unit,
            costPerUnit: parseFloat(newMaterial.cost) || 0
        });
        setNewMaterial({ name: "", unit: "kg", cost: "" });
        setIsMaterialOpen(false);
    };

    const handleUpdateMaterial = () => {
        if (!editingMaterial || !editingMaterial.name) return;
        updateMaterial(editingMaterial.id, {
            name: editingMaterial.name,
            unit: editingMaterial.unit,
            costPerUnit: editingMaterial.costPerUnit
        });
        setEditingMaterial(null);
        setIsEditMaterialOpen(false);
    };

    const openEditMaterialDialog = (m: Material) => {
        setEditingMaterial({ ...m });
        setIsEditMaterialOpen(true);
    };

    const handleAddProduct = () => {
        if (!newProduct.name) return;
        addProduct({
            name: newProduct.name,
            type: newProduct.type,
            sku: newProduct.sku,
            minStockLevel: newProduct.minStockLevel
        });
        setNewProduct({ name: "", type: "FINISHED", sku: "", minStockLevel: 50 });
        setIsProductOpen(false);
    };

    const handleUpdateProduct = () => {
        if (!editingProduct || !editingProduct.name) return;
        updateProduct(editingProduct.id, {
            name: editingProduct.name,
            type: editingProduct.type,
            sku: editingProduct.sku,
            minStockLevel: editingProduct.minStockLevel
        });
        setEditingProduct(null);
        setIsEditProductOpen(false);
    };

    const openEditProductDialog = (product: Product) => {
        setEditingProduct({ ...product });
        setIsEditProductOpen(true);
    };

    const handleAddOperator = () => {
        if (!newOperator.name) return;
        addOperator({
            name: newOperator.name,
            role: newOperator.role
        });
        setNewOperator({ name: "", role: "Operator" });
        setIsOperatorOpen(false);
    };

    const handleUpdateOperator = () => {
        if (!editingOperator || !editingOperator.name) return;
        updateOperator(editingOperator.id, {
            name: editingOperator.name,
            role: editingOperator.role
        });
        setEditingOperator(null);
        setIsEditOperatorOpen(false);
    };

    const openEditOperatorDialog = (op: Operator) => {
        setEditingOperator({ ...op });
        setIsEditOperatorOpen(true);
    };

    const handleAddUser = async () => {
        if (!newUser.username || !newUser.password) return;
        await addUser({
            username: newUser.username,
            password: newUser.password,
            name: newUser.name || newUser.username,
            role: newUser.role
        });
        setNewUser({ username: "", password: "", name: "", role: "OPERATOR" });
        setIsUserOpen(false);
    };

    const handleSaveProjectName = () => {
        if (!isValidProjectName(projectNameInput)) {
            setProjectError("Invalid project name. Use lowercase, numbers, '.', '_', '-' only (max 30 chars).");
            return;
        }
        setProjectError("");
        setProjectName(projectNameInput);
        if (typeof window !== 'undefined') {
            localStorage.setItem("projectName", projectNameInput);
            // Proactively notify of change (in a real app we'd use a context/store)
            window.dispatchEvent(new Event("storage"));
        }
        toast.success("Project name updated successfully!");
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Master Data Settings</h1>
                <p className="text-muted-foreground">Manage your Raw Materials, Products, Operator profiles, and System Users.</p>
            </div>

            <Tabs value={currentTab} onValueChange={(val) => router.push(`/settings?tab=${val}`)} className="w-full">
                <TabsList className={`grid w-full max-w-[600px] ${user?.role === 'ADMIN' ? 'grid-cols-5' : 'grid-cols-4'}`}>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="materials">Materials</TabsTrigger>
                    <TabsTrigger value="products">Products</TabsTrigger>
                    <TabsTrigger value="operators">Operators</TabsTrigger>
                    {user?.role === 'ADMIN' && <TabsTrigger value="users">Users</TabsTrigger>}
                </TabsList>

                {/* --- GENERAL TAB --- */}
                <TabsContent value="general" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" /> General Settings
                            </CardTitle>
                            <CardDescription>Manage your application branding and global preferences.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="projectName">Project Name</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="projectName"
                                        value={projectNameInput}
                                        onChange={(e) => setProjectNameInput(e.target.value)}
                                        placeholder="e.g. kovai-inventory"
                                        className={projectError ? "border-destructive" : ""}
                                    />
                                    <Button onClick={handleSaveProjectName} disabled={projectNameInput === projectName}>
                                        <Save className="mr-2 h-4 w-4" /> Save
                                    </Button>
                                </div>
                                {projectError && <p className="text-xs text-destructive">{projectError}</p>}
                                <p className="text-xs text-muted-foreground">
                                    Rules: Lowercase, numbers, dots, underscores, and hyphens only. Max 30 chars.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- MATERIALS TAB --- */}
                <TabsContent value="materials" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="space-y-1">
                                <CardTitle>Raw Materials</CardTitle>
                                <CardDescription>Define the inputs for your production.</CardDescription>
                            </div>
                            {user?.role === 'ADMIN' && (
                                <Dialog open={isMaterialOpen} onOpenChange={setIsMaterialOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="mr-2 h-4 w-4" /> Add Material</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add Raw Material</DialogTitle>
                                            <DialogDescription>Add a new material to your inventory definition.</DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="name" className="text-right">Name</Label>
                                                <Input id="name" value={newMaterial.name} onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })} className="col-span-3" />
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="unit" className="text-right">Unit</Label>
                                                <Select value={newMaterial.unit} onValueChange={(val) => setNewMaterial({ ...newMaterial, unit: val })}>
                                                    <SelectTrigger className="col-span-3">
                                                        <SelectValue placeholder="Select unit" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="kg">kg</SelectItem>
                                                        <SelectItem value="l">liters</SelectItem>
                                                        <SelectItem value="m">meters</SelectItem>
                                                        <SelectItem value="pcs">pieces</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="cost" className="text-right">Cost</Label>
                                                <Input id="cost" type="number" value={newMaterial.cost} onChange={(e) => setNewMaterial({ ...newMaterial, cost: e.target.value })} className="col-span-3" placeholder="0.00" />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button onClick={handleAddMaterial}>Save changes</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Unit</TableHead>
                                        {user?.role === 'ADMIN' && <TableHead className="text-right">Actions</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {materials.length === 0 ? (
                                        <TableRow><TableCell colSpan={user?.role === 'ADMIN' ? 4 : 3} className="text-center text-muted-foreground">No materials defined.</TableCell></TableRow>
                                    ) : materials.map((m) => (
                                        <TableRow key={m.id}>
                                            <TableCell className="font-mono text-xs">{m.id}</TableCell>
                                            <TableCell className="font-medium">{m.name}</TableCell>
                                            <TableCell>{m.unit}</TableCell>
                                            {user?.role === 'ADMIN' && (
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => openEditMaterialDialog(m)}>
                                                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>

                        {/* Edit Material Dialog */}
                        <Dialog open={isEditMaterialOpen} onOpenChange={setIsEditMaterialOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Edit Material</DialogTitle>
                                    <DialogDescription>Update material details.</DialogDescription>
                                </DialogHeader>
                                {editingMaterial && (
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="edit-m-name" className="text-right">Name</Label>
                                            <Input id="edit-m-name" value={editingMaterial.name} onChange={(e) => setEditingMaterial({ ...editingMaterial, name: e.target.value })} className="col-span-3" />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="edit-m-unit" className="text-right">Unit</Label>
                                            <Select value={editingMaterial.unit} onValueChange={(val) => setEditingMaterial({ ...editingMaterial, unit: val })}>
                                                <SelectTrigger className="col-span-3">
                                                    <SelectValue placeholder="Select unit" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="kg">kg</SelectItem>
                                                    <SelectItem value="l">liters</SelectItem>
                                                    <SelectItem value="m">meters</SelectItem>
                                                    <SelectItem value="pcs">pieces</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="edit-m-cost" className="text-right">Cost</Label>
                                            <Input id="edit-m-cost" type="number" value={editingMaterial.costPerUnit || ''} onChange={(e) => setEditingMaterial({ ...editingMaterial, costPerUnit: parseFloat(e.target.value) || 0 })} className="col-span-3" />
                                        </div>
                                    </div>
                                )}
                                <DialogFooter>
                                    <Button onClick={handleUpdateMaterial}>Save Changes</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </Card>
                </TabsContent>

                {/* --- PRODUCTS TAB --- */}
                <TabsContent value="products" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="space-y-1">
                                <CardTitle>Products Management</CardTitle>
                                <CardDescription>Manage Finished and Semi-Finished goods.</CardDescription>
                            </div>
                            {user?.role === 'ADMIN' && (
                                <Dialog open={isProductOpen} onOpenChange={setIsProductOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="mr-2 h-4 w-4" /> Add Product</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add Product</DialogTitle>
                                            <DialogDescription>Define a new output product.</DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="p-name" className="text-right">Name</Label>
                                                <Input id="p-name" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} className="col-span-3" />
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="sku" className="text-right">SKU</Label>
                                                <Input id="sku" value={newProduct.sku} onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })} className="col-span-3" />
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="type" className="text-right">Type</Label>
                                                <Select value={newProduct.type} onValueChange={(val: any) => setNewProduct({ ...newProduct, type: val })}>
                                                    <SelectTrigger className="col-span-3">
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="FINISHED">Finished Good</SelectItem>
                                                        <SelectItem value="SEMI_FINISHED">Semi-Finished</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="minStock" className="text-right">Min Stock</Label>
                                                <Input id="minStock" type="number" value={newProduct.minStockLevel} onChange={(e) => setNewProduct({ ...newProduct, minStockLevel: parseInt(e.target.value) || 0 })} className="col-span-3" />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button onClick={handleAddProduct}>Save changes</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>SKU</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        {user?.role === 'ADMIN' && <TableHead className="text-right">Actions</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {products.length === 0 ? (
                                        <TableRow><TableCell colSpan={user?.role === 'ADMIN' ? 4 : 3} className="text-center text-muted-foreground">No products defined.</TableCell></TableRow>
                                    ) : products.map((p) => (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-mono text-xs">{p.sku || "-"}</TableCell>
                                            <TableCell className="font-medium">{p.name}</TableCell>
                                            <TableCell>
                                                <Badge variant={p.type === 'FINISHED' ? 'default' : 'secondary'}>
                                                    {p.type === 'FINISHED' ? 'Finished' : 'Semi-Finished'}
                                                </Badge>
                                            </TableCell>
                                            {user?.role === 'ADMIN' && (
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => openEditProductDialog(p)}>
                                                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>

                        {/* Edit Product Dialog */}
                        <Dialog open={isEditProductOpen} onOpenChange={setIsEditProductOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Edit Product</DialogTitle>
                                    <DialogDescription>Update product details.</DialogDescription>
                                </DialogHeader>
                                {editingProduct && (
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="edit-p-name" className="text-right">Name</Label>
                                            <Input id="edit-p-name" value={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} className="col-span-3" />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="edit-sku" className="text-right">SKU</Label>
                                            <Input id="edit-sku" value={editingProduct.sku || ''} onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })} className="col-span-3" />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="edit-type" className="text-right">Type</Label>
                                            <Select value={editingProduct.type} onValueChange={(val: any) => setEditingProduct({ ...editingProduct, type: val })}>
                                                <SelectTrigger className="col-span-3">
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="FINISHED">Finished Good</SelectItem>
                                                    <SelectItem value="SEMI_FINISHED">Semi-Finished</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="edit-minStock" className="text-right">Min Stock</Label>
                                            <Input id="edit-minStock" type="number" value={editingProduct.minStockLevel || 50} onChange={(e) => setEditingProduct({ ...editingProduct, minStockLevel: parseInt(e.target.value) || 0 })} className="col-span-3" />
                                        </div>
                                    </div>
                                )}
                                <DialogFooter>
                                    <Button onClick={handleUpdateProduct}>Save Changes</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </Card>
                </TabsContent>

                {/* --- OPERATORS TAB --- */}
                <TabsContent value="operators" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="space-y-1">
                                <CardTitle>Operators</CardTitle>
                                <CardDescription>Manage authorized personnel.</CardDescription>
                            </div>
                            {user?.role === 'ADMIN' && (
                                <Dialog open={isOperatorOpen} onOpenChange={setIsOperatorOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="mr-2 h-4 w-4" /> Add Operator</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add Operator</DialogTitle>
                                            <DialogDescription>Register a new machine operator.</DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="op-name" className="text-right">Name</Label>
                                                <Input id="op-name" value={newOperator.name} onChange={(e) => setNewOperator({ ...newOperator, name: e.target.value })} className="col-span-3" />
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="role" className="text-right">Role</Label>
                                                <Input id="role" value={newOperator.role} onChange={(e) => setNewOperator({ ...newOperator, role: e.target.value })} className="col-span-3" />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button onClick={handleAddOperator}>Save changes</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Role</TableHead>
                                        {user?.role === 'ADMIN' && <TableHead className="text-right">Actions</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {operators.length === 0 ? (
                                        <TableRow><TableCell colSpan={user?.role === 'ADMIN' ? 4 : 3} className="text-center text-muted-foreground">No operators defined.</TableCell></TableRow>
                                    ) : operators.map((op) => (
                                        <TableRow key={op.id}>
                                            <TableCell className="font-mono text-xs">{op.id}</TableCell>
                                            <TableCell className="font-medium">{op.name}</TableCell>
                                            <TableCell>{op.role}</TableCell>
                                            {user?.role === 'ADMIN' && (
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => openEditOperatorDialog(op)}>
                                                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>

                        {/* Edit Operator Dialog */}
                        <Dialog open={isEditOperatorOpen} onOpenChange={setIsEditOperatorOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Edit Operator</DialogTitle>
                                    <DialogDescription>Update operator details.</DialogDescription>
                                </DialogHeader>
                                {editingOperator && (
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="edit-op-name" className="text-right">Name</Label>
                                            <Input id="edit-op-name" value={editingOperator.name} onChange={(e) => setEditingOperator({ ...editingOperator, name: e.target.value })} className="col-span-3" />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="edit-role" className="text-right">Role</Label>
                                            <Input id="edit-role" value={editingOperator.role} onChange={(e) => setEditingOperator({ ...editingOperator, role: e.target.value })} className="col-span-3" />
                                        </div>
                                    </div>
                                )}
                                <DialogFooter>
                                    <Button onClick={handleUpdateOperator}>Save Changes</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </Card>
                </TabsContent>

                {/* --- USERS TAB (Admin Only) --- */}
                {user?.role === 'ADMIN' && (
                    <TabsContent value="users" className="space-y-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="space-y-1">
                                    <CardTitle>User Management</CardTitle>
                                    <CardDescription>Manage system access and roles.</CardDescription>
                                </div>
                                <Dialog open={isUserOpen} onOpenChange={setIsUserOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="mr-2 h-4 w-4" /> Add User</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add New User</DialogTitle>
                                            <DialogDescription>Create a new user account.</DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="u-username" className="text-right">Username</Label>
                                                <Input id="u-username" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} className="col-span-3" />
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="u-password" className="text-right">Password</Label>
                                                <Input id="u-password" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="col-span-3" />
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="u-name" className="text-right">Full Name</Label>
                                                <Input id="u-name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} className="col-span-3" />
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="u-role" className="text-right">Role</Label>
                                                <Select value={newUser.role} onValueChange={(val: any) => setNewUser({ ...newUser, role: val })}>
                                                    <SelectTrigger className="col-span-3">
                                                        <SelectValue placeholder="Select role" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="OPERATOR">Operator</SelectItem>
                                                        <SelectItem value="ADMIN">Admin</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button onClick={handleAddUser} className="bg-primary text-primary-foreground hover:bg-primary/90">Create User</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Username</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.map((u) => (
                                            <TableRow key={u.id}>
                                                <TableCell className="font-medium">{u.username}</TableCell>
                                                <TableCell>{u.name}</TableCell>
                                                <TableCell>
                                                    <Badge variant={u.role === 'ADMIN' ? 'default' : 'secondary'}>
                                                        {u.role}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => {
                                                            if (confirm(`Are you sure you want to delete user ${u.username}?`)) {
                                                                removeUser(u.id);
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={<div className="p-8">Loading settings...</div>}>
            <SettingsContent />
        </Suspense>
    );
}

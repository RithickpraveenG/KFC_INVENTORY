"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

// --- Types ---
export type Material = {
    id: string;
    name: string;
    unit: string;
    costPerUnit?: number;
};

export type Product = {
    id: string;
    name: string;
    type: 'FINISHED' | 'SEMI_FINISHED';
    sku?: string;
    minStockLevel?: number; // threshold for low stock alert
};

export type Operator = {
    id: string;
    name: string;
    role?: string;
};

interface MasterDataContextType {
    materials: Material[];
    products: Product[];
    operators: Operator[];
    addMaterial: (material: Omit<Material, "id">) => void;
    updateMaterial: (id: string, material: Partial<Material>) => void;
    deleteMaterial: (id: string) => void;
    addProduct: (product: Omit<Product, "id">) => void;
    updateProduct: (id: string, product: Partial<Product>) => void;
    deleteProduct: (id: string) => void;
    addOperator: (operator: Omit<Operator, "id">) => void;
    updateOperator: (id: string, operator: Partial<Operator>) => void;
    deleteOperator: (id: string) => void;
}

const MasterDataContext = createContext<MasterDataContextType | undefined>(undefined);

// --- Default Data (Seed) ---
const defaultMaterials: Material[] = [
    { id: "RM-001", name: "Steel Sheet", unit: "kg", costPerUnit: 2.5 },
    { id: "RM-002", name: "Plastic Granules", unit: "kg", costPerUnit: 1.2 },
    { id: "RM-003", name: "Aluminum Ingot", unit: "kg", costPerUnit: 4.0 },
    { id: "RM-004", name: "Paint (Red)", unit: "l", costPerUnit: 15.0 },
];

const defaultProducts: Product[] = [
    { id: "P-001", name: "Car Door Panel", type: 'FINISHED', sku: "CDP-2024" },
    { id: "P-002", name: "Plastic Container", type: 'FINISHED', sku: "PC-500" },
    { id: "P-003", name: "Engine Casing", type: 'SEMI_FINISHED', sku: "EC-V6" },
];

const defaultOperators: Operator[] = [
    { id: "OP-001", name: "John Doe", role: "Senior Operator" },
    { id: "OP-002", name: "Jane Smith", role: "Inspector" },
    { id: "OP-003", name: "Mike Ross", role: "Operator" },
];

export function MasterDataProvider({ children }: { children: React.ReactNode }) {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [operators, setOperators] = useState<Operator[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Use internal API routes
    const API_URL = '/api';

    // Load from API on mount
    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const [matRes, prodRes, opRes] = await Promise.all([
                    fetch(`${API_URL}/master/materials`),
                    fetch(`${API_URL}/master/products`),
                    fetch(`${API_URL}/master/operators`)
                ]);

                if (matRes.ok) {
                    const data = await matRes.json();
                    setMaterials(Array.isArray(data) ? data : []);
                }
                if (prodRes.ok) {
                    const data = await prodRes.json();
                    setProducts(Array.isArray(data) ? data : []);
                }
                if (opRes.ok) {
                    const data = await opRes.json();
                    setOperators(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                console.error("Failed to fetch master data:", error);
                // Fallback to defaults if API fails?
                // For now, we keep empty or maybe load from local storage as backup
                // setMaterials(defaultMaterials);
                // setProducts(defaultProducts);
                // setOperators(defaultOperators);
            } finally {
                setIsLoaded(true);
            }
        };

        fetchMasterData();
    }, []);

    // Helper for API writes (Basic implementation)
    const syncToApi = async (endpoint: string, method: string, data: any) => {
        try {
            await fetch(`${API_URL}/master/${endpoint}`, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error(`Failed to ${method} to ${endpoint}`, error);
        }
    };

    // --- Actions ---
    const addMaterial = (data: Omit<Material, "id">) => {
        const newId = `RM-${Date.now().toString().slice(-4)}`;
        const newItem = { ...data, id: newId };
        setMaterials([...materials, newItem]);
        syncToApi('materials', 'POST', newItem);
    };

    const updateMaterial = (id: string, data: Partial<Material>) => {
        setMaterials(materials.map(m => m.id === id ? { ...m, ...data } : m));
        syncToApi(`materials/${id}`, 'PUT', data);
    };

    const deleteMaterial = (id: string) => {
        setMaterials(materials.filter(m => m.id !== id));
        syncToApi(`materials/${id}`, 'DELETE', {});
    };

    const addProduct = (data: Omit<Product, "id">) => {
        const newId = `P-${Date.now().toString().slice(-4)}`;
        const newItem = { ...data, id: newId };
        setProducts([...products, newItem]);
        syncToApi('products', 'POST', newItem);
    };

    const updateProduct = (id: string, data: Partial<Product>) => {
        setProducts(products.map(p => p.id === id ? { ...p, ...data } : p));
        syncToApi(`products/${id}`, 'PUT', data);
    };

    const deleteProduct = (id: string) => {
        setProducts(products.filter(p => p.id !== id));
        syncToApi(`products/${id}`, 'DELETE', {});
    };

    const addOperator = (data: Omit<Operator, "id">) => {
        const newId = `OP-${Date.now().toString().slice(-4)}`;
        const newItem = { ...data, id: newId };
        setOperators([...operators, newItem]);
        syncToApi('operators', 'POST', newItem);
    };

    const deleteOperator = (id: string) => {
        setOperators(operators.filter(op => op.id !== id));
        syncToApi(`operators/${id}`, 'DELETE', {});
    };

    const updateOperator = (id: string, data: Partial<Operator>) => {
        setOperators(operators.map(op => op.id === id ? { ...op, ...data } : op));
        syncToApi(`operators/${id}`, 'PUT', data);
    };

    return (
        <MasterDataContext.Provider value={{
            materials, products, operators,
            addMaterial, updateMaterial, deleteMaterial,
            addProduct, updateProduct, deleteProduct,
            addOperator, updateOperator, deleteOperator
        }}>
            {children}
        </MasterDataContext.Provider>
    );
}

export function useMasterData() {
    const context = useContext(MasterDataContext);
    if (context === undefined) {
        throw new Error("useMasterData must be used within a MasterDataProvider");
    }
    return context;
}

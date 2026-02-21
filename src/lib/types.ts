export interface User {
    id: string;
    username: string;
    name: string;
    role: "ADMIN" | "OPERATOR";
    password?: string;
}

export interface Material {
    id: string;
    name: string;
    unit: string;
    minStock?: number;
}

export interface Product {
    id: string;
    name: string;
    category: string;
    minStockLevel?: number;
    type?: 'FINISHED' | 'SEMI_FINISHED' | 'RAW';
}

export interface Operator {
    id: string;
    name: string;
}

export interface ProductionLog {
    id: string;
    date: string;
    operator: string;
    batchId: string;
    productName: string;
    quantity: number;
    type: "produced" | "sent";
}

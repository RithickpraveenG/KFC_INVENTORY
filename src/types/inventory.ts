export interface DispatchRecord {
    id: string;
    date: string; // ISO date string
    productName: string;
    quantity: number;
    destination: 'Plating' | 'Customer';
    destinationDetail?: string; // e.g., Customer Name or Plating Vendor
    notes?: string;
    timestamp: string;
}

export interface ProductStock {
    name: string;
    totalProduced: number;
    totalDispatched: number;
    currentStock: number;
    minStockLevel: number;
    type: 'FINISHED' | 'SEMI_FINISHED' | 'RAW';
}

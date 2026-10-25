export interface MedicineItem {
  id: number;
  name: string;
  batchId: string;
  stockQuantity: number;
  price: number;
  expiryDate: string; // YYYY-MM-DD
}

export interface SaleRecord {
  id: number;
  medicineName: string;
  quantitySelected: number;
  unitCost: number;
  totalBill: number;
  transactionTimestamp: string;
}

export interface AlertSummary {
  totalItems: number;
  lowStockCount: number;
  nearExpiryCount: number;
  totalRevenue: number;
}

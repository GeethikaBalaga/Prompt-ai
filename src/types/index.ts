// Core Types for NOVA CART Smart Inventory

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type AvailabilityStatus = 'available' | 'low_stock' | 'unavailable' | 'paused';
export type DemandTrend = 'increasing' | 'stable' | 'decreasing';

export interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  unit: string;
  price: number;
  currentStock: number;
  avgDailyDemand: number;
  lastUpdated: string; // ISO timestamp
  historicalStockOuts: number;
  demandTrend: DemandTrend;
  riskScore: number;
  riskLevel: RiskLevel;
  availabilityStatus: AvailabilityStatus;
  substituteIds: string[];
  image?: string;
  storeId: string;
}

export interface RiskFactor {
  label: string;
  description: string;
  contribution: number; // 0-100
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ProductRiskDetail {
  productId: string;
  riskScore: number;
  riskLevel: RiskLevel;
  factors: RiskFactor[];
  recommendation: string;
  stockCoverage: number; // days
  lastUpdatedHours: number;
}

export interface Alert {
  id: string;
  productId: string;
  productName: string;
  type: 'critical' | 'high' | 'medium';
  message: string;
  timestamp: string;
  action: string;
}

export interface InventoryUpdate {
  id: string;
  productId: string;
  productName: string;
  previousStock: number;
  newStock: number;
  timestamp: string;
  updatedBy: string;
}

export interface StoreInfo {
  id: string;
  name: string;
  city: string;
  category: string;
  address: string;
  managerName: string;
  managerRole: string;
}

export interface User {
  storeId: string;
  storeName: string;
  role: string;
  managerName: string;
}

export interface DashboardMetrics {
  totalProducts: number;
  availableProducts: number;
  lowStockProducts: number;
  highRiskProducts: number;
  criticalProducts: number;
  recentlyUnavailable: number;
  inventoryAccuracyScore: number;
  estimatedAtRiskOrders: number;
}

export interface BusinessImpactParams {
  monthlyOrders: number;
  cancellationRate: number;
  unavailabilityContribution: number;
  accuracyImprovementAssumption: number;
}

export interface BusinessImpactMetrics {
  totalMonthlyCancellations: number;
  unavailabilityCancellations: number;
  estimatedAvoidableCancellations: number;
  supportTicketsSaved: number;
  unavailabilityTickets: number;
  inventoryAccuracyBefore: number;
  inventoryAccuracyAfter: number;
  revenueAtRisk: number;
  potentialRecovery: number;
  promoSpendProtected: number;
  productsCorrected: number;
  inventoryUpdatesCompleted: number;
}

export interface SubstituteRecommendation {
  product: Product;
  matchScore: number;
  reason: string;
}

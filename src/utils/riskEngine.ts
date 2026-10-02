/**
 * NOVA CART Smart Inventory — Rule-Based Risk Engine
 *
 * Prototype rule-based risk model using inventory freshness, stock coverage,
 * demand velocity and historical stock-out signals.
 *
 * This is NOT a trained machine-learning model. All logic is transparent
 * and explainable rule-based scoring.
 */

import type {
  Product,
  RiskLevel,
  RiskFactor,
  ProductRiskDetail,
  SubstituteRecommendation,
  BusinessImpactParams,
  BusinessImpactMetrics,
} from '../types';

// ── Helper: hours since last update ──────────────────────────────────────────
export function hoursSinceUpdate(lastUpdated: string): number {
  const diff = Date.now() - new Date(lastUpdated).getTime();
  return diff / (1000 * 60 * 60);
}

// ── Helper: stock coverage in days ───────────────────────────────────────────
export function stockCoverageDays(currentStock: number, avgDailyDemand: number): number {
  if (avgDailyDemand <= 0) return 99;
  return currentStock / avgDailyDemand;
}

// ── Risk Score Calculator ─────────────────────────────────────────────────────
export function calculateRiskScore(product: Product): number {
  if (product.availabilityStatus === 'unavailable' || product.availabilityStatus === 'paused') {
    return product.currentStock === 0 ? 95 : 85;
  }

  let score = 0;
  const coverage = stockCoverageDays(product.currentStock, product.avgDailyDemand);
  const hours = hoursSinceUpdate(product.lastUpdated);

  // Factor 1: Stock Coverage (0-40 points)
  // Less coverage = more risk
  if (coverage <= 0) {
    score += 40;
  } else if (coverage < 0.5) {
    score += 36;
  } else if (coverage < 1) {
    score += 30;
  } else if (coverage < 2) {
    score += 20;
  } else if (coverage < 3) {
    score += 12;
  } else if (coverage < 5) {
    score += 6;
  } else {
    score += 0;
  }

  // Factor 2: Update Freshness (0-30 points)
  // Older update = more risk
  if (hours > 48) {
    score += 30;
  } else if (hours > 24) {
    score += 24;
  } else if (hours > 12) {
    score += 16;
  } else if (hours > 6) {
    score += 8;
  } else if (hours > 2) {
    score += 4;
  } else {
    score += 0;
  }

  // Factor 3: Demand Trend (0-15 points)
  if (product.demandTrend === 'increasing') {
    score += 15;
  } else if (product.demandTrend === 'stable') {
    score += 5;
  } else {
    score += 0;
  }

  // Factor 4: Historical Stock-Outs (0-15 points)
  if (product.historicalStockOuts >= 5) {
    score += 15;
  } else if (product.historicalStockOuts >= 3) {
    score += 10;
  } else if (product.historicalStockOuts >= 1) {
    score += 5;
  } else {
    score += 0;
  }

  // Clamp to 0-100
  return Math.min(100, Math.max(0, Math.round(score)));
}

// ── Risk Level from Score ─────────────────────────────────────────────────────
export function getRiskLevel(score: number): RiskLevel {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
}

// ── Availability Status from Stock ────────────────────────────────────────────
export function getAvailabilityStatus(product: Product): 'available' | 'low_stock' | 'unavailable' | 'paused' {
  if (product.availabilityStatus === 'paused') return 'paused';
  if (product.availabilityStatus === 'unavailable') return 'unavailable';
  const coverage = stockCoverageDays(product.currentStock, product.avgDailyDemand);
  if (product.currentStock === 0) return 'unavailable';
  if (coverage < 1 || product.currentStock <= 3) return 'low_stock';
  return 'available';
}

// ── Build Risk Explanation ────────────────────────────────────────────────────
export function buildRiskDetail(product: Product): ProductRiskDetail {
  const score = calculateRiskScore(product);
  const level = getRiskLevel(score);
  const coverage = stockCoverageDays(product.currentStock, product.avgDailyDemand);
  const hours = hoursSinceUpdate(product.lastUpdated);
  const factors: RiskFactor[] = [];

  // Factor 1: Stock Coverage
  let coverageContrib = 0;
  let coverageSeverity: RiskFactor['severity'] = 'low';
  let coverageDesc = '';
  if (coverage <= 0) {
    coverageContrib = 40; coverageSeverity = 'critical';
    coverageDesc = 'Zero stock — product is effectively out of stock';
  } else if (coverage < 0.5) {
    coverageContrib = 36; coverageSeverity = 'critical';
    coverageDesc = `Only ${product.currentStock} unit(s) left — less than half a day of coverage at current demand`;
  } else if (coverage < 1) {
    coverageContrib = 30; coverageSeverity = 'high';
    coverageDesc = `Stock will run out in less than 1 day (${coverage.toFixed(1)} days coverage at avg demand of ${product.avgDailyDemand}/day)`;
  } else if (coverage < 2) {
    coverageContrib = 20; coverageSeverity = 'high';
    coverageDesc = `Less than 2 days of stock remaining (${coverage.toFixed(1)} days at avg ${product.avgDailyDemand}/day)`;
  } else if (coverage < 3) {
    coverageContrib = 12; coverageSeverity = 'medium';
    coverageDesc = `${coverage.toFixed(1)} days of stock coverage — approaching reorder point`;
  } else {
    coverageContrib = 0; coverageSeverity = 'low';
    coverageDesc = `Adequate stock coverage of ${coverage.toFixed(1)} days`;
  }
  factors.push({
    label: 'Stock Coverage',
    description: coverageDesc,
    contribution: coverageContrib,
    severity: coverageSeverity,
  });

  // Factor 2: Update Freshness
  let freshnessContrib = 0;
  let freshnessSeverity: RiskFactor['severity'] = 'low';
  let freshnessDesc = '';
  if (hours > 48) {
    freshnessContrib = 30; freshnessSeverity = 'critical';
    freshnessDesc = `Inventory was last updated ${Math.round(hours)} hours ago — very stale data`;
  } else if (hours > 24) {
    freshnessContrib = 24; freshnessSeverity = 'high';
    freshnessDesc = `Inventory last updated ${Math.round(hours)} hours ago — over 1 day old`;
  } else if (hours > 12) {
    freshnessContrib = 16; freshnessSeverity = 'medium';
    freshnessDesc = `Inventory last updated ${Math.round(hours)} hours ago`;
  } else if (hours > 6) {
    freshnessContrib = 8; freshnessSeverity = 'low';
    freshnessDesc = `Inventory last updated ${Math.round(hours)} hours ago`;
  } else {
    freshnessContrib = 0; freshnessSeverity = 'low';
    freshnessDesc = `Inventory recently updated ${Math.round(hours)} hours ago`;
  }
  factors.push({
    label: 'Inventory Freshness',
    description: freshnessDesc,
    contribution: freshnessContrib,
    severity: freshnessSeverity,
  });

  // Factor 3: Demand Trend
  let trendContrib = 0;
  let trendSeverity: RiskFactor['severity'] = 'low';
  let trendDesc = '';
  if (product.demandTrend === 'increasing') {
    trendContrib = 15; trendSeverity = 'high';
    trendDesc = 'Demand is increasing — stock may deplete faster than expected';
  } else if (product.demandTrend === 'stable') {
    trendContrib = 5; trendSeverity = 'low';
    trendDesc = 'Demand is stable';
  } else {
    trendContrib = 0; trendSeverity = 'low';
    trendDesc = 'Demand is decreasing — lower depletion risk';
  }
  factors.push({
    label: 'Demand Trend',
    description: trendDesc,
    contribution: trendContrib,
    severity: trendSeverity,
  });

  // Factor 4: Historical Stock-Outs
  let stockOutContrib = 0;
  let stockOutSeverity: RiskFactor['severity'] = 'low';
  let stockOutDesc = '';
  if (product.historicalStockOuts >= 5) {
    stockOutContrib = 15; stockOutSeverity = 'critical';
    stockOutDesc = `${product.historicalStockOuts} historical stock-outs — this product frequently runs out`;
  } else if (product.historicalStockOuts >= 3) {
    stockOutContrib = 10; stockOutSeverity = 'high';
    stockOutDesc = `${product.historicalStockOuts} historical stock-outs — moderate stock-out history`;
  } else if (product.historicalStockOuts >= 1) {
    stockOutContrib = 5; stockOutSeverity = 'medium';
    stockOutDesc = `${product.historicalStockOuts} historical stock-out(s)`;
  } else {
    stockOutContrib = 0; stockOutSeverity = 'low';
    stockOutDesc = 'No historical stock-outs';
  }
  factors.push({
    label: 'Historical Stock-Outs',
    description: stockOutDesc,
    contribution: stockOutContrib,
    severity: stockOutSeverity,
  });

  // Generate recommendation
  let recommendation = '';
  if (level === 'critical') {
    recommendation = `Verify stock immediately. Current stock of ${product.currentStock} unit(s) is critically low relative to demand. Update inventory or mark product unavailable to prevent failed orders.`;
  } else if (level === 'high') {
    recommendation = `Check stock within the next few hours. At current demand, stock will run out soon. Consider restocking or updating inventory count.`;
  } else if (level === 'medium') {
    recommendation = `Monitor this product. Stock is adequate for now but reorder soon to maintain healthy coverage. Update inventory count to ensure accuracy.`;
  } else {
    recommendation = `Stock levels are healthy. No immediate action required. Ensure inventory is updated regularly.`;
  }

  return {
    productId: product.id,
    riskScore: score,
    riskLevel: level,
    factors,
    recommendation,
    stockCoverage: coverage,
    lastUpdatedHours: hours,
  };
}

// ── Enrich all products with calculated risk scores ───────────────────────────
export function enrichProducts(products: Product[]): Product[] {
  return products.map((p) => {
    const score = calculateRiskScore(p);
    const level = getRiskLevel(score);
    const status = getAvailabilityStatus(p);
    return {
      ...p,
      riskScore: score,
      riskLevel: level,
      availabilityStatus: p.availabilityStatus === 'paused' ? 'paused'
        : p.availabilityStatus === 'unavailable' ? 'unavailable'
        : status,
    };
  });
}

// ── Substitute Recommender ────────────────────────────────────────────────────
export function getSubstitutes(product: Product, allProducts: Product[]): SubstituteRecommendation[] {
  return product.substituteIds
    .map((id) => {
      const sub = allProducts.find((p) => p.id === id);
      if (!sub || sub.availabilityStatus === 'unavailable') return null;

      let score = 70;
      const reasons: string[] = [];

      if (sub.category === product.category) {
        score += 15;
        reasons.push('Same category');
      }
      if (sub.unit === product.unit) {
        score += 10;
        reasons.push(`Matching unit (${sub.unit})`);
      }
      const priceDiff = Math.abs(sub.price - product.price);
      if (priceDiff <= 20) {
        score += 5;
        reasons.push('Similar price tier');
      }

      return {
        product: sub,
        matchScore: Math.min(98, score),
        reason: reasons.join(' · ') || 'Compatible alternative',
      };
    })
    .filter((rec): rec is SubstituteRecommendation => rec !== null);
}

// ── Dashboard Metrics ─────────────────────────────────────────────────────────
export function computeDashboardMetrics(products: Product[]) {
  const total = products.length;
  const available = products.filter((p) => p.availabilityStatus === 'available').length;
  const lowStock = products.filter((p) => p.availabilityStatus === 'low_stock').length;
  const highRisk = products.filter((p) => p.riskLevel === 'high').length;
  const critical = products.filter((p) => p.riskLevel === 'critical').length;
  const unavailable = products.filter((p) => p.availabilityStatus === 'unavailable').length;

  // Inventory accuracy: proportion of products whose displayed status is likely correct
  // High/Critical risk = potentially inaccurate display
  const atRisk = products.filter((p) => p.riskLevel === 'high' || p.riskLevel === 'critical').length;
  const accuracyScore = Math.round(((total - atRisk * 0.6) / total) * 100);

  // Estimated at-risk orders per day assuming ~1,283 orders/day (38,500/30)
  const ordersPerDay = 1283;
  const inaccuracyRate = atRisk / total;
  const estimatedAtRiskOrders = Math.round(ordersPerDay * inaccuracyRate * 0.35);

  return {
    totalProducts: total,
    availableProducts: available,
    lowStockProducts: lowStock,
    highRiskProducts: highRisk,
    criticalProducts: critical,
    recentlyUnavailable: unavailable,
    inventoryAccuracyScore: Math.max(0, Math.min(100, accuracyScore)),
    estimatedAtRiskOrders,
  };
}

// ── Business Impact Calculator ────────────────────────────────────────────────
export function computeBusinessImpact(
  params: BusinessImpactParams,
  sessionStats: { productsCorrected: number; inventoryUpdates: number }
): BusinessImpactMetrics {
  const monthlyOrders = params.monthlyOrders;
  const cancellationRate = params.cancellationRate / 100;
  const unavailabilityPct = params.unavailabilityContribution / 100;
  const improvementAssumption = params.accuracyImprovementAssumption / 100;

  const totalMonthlyCancellations = Math.round(monthlyOrders * cancellationRate);
  const unavailabilityCancellations = Math.round(totalMonthlyCancellations * unavailabilityPct);
  const estimatedAvoidableCancellations = Math.round(unavailabilityCancellations * improvementAssumption);

  const currentTickets = 5900;
  const unavailabilityTickets = Math.round(currentTickets * 0.19);
  const supportTicketsSaved = Math.round(unavailabilityTickets * improvementAssumption);

  const baseAccuracy = 71;
  const inventoryAccuracyBefore = baseAccuracy;
  const inventoryAccuracyAfter = Math.min(99, Math.round(baseAccuracy + (29 * improvementAssumption)));

  const avgOrderValue = 486;
  const revenueAtRisk = unavailabilityCancellations * avgOrderValue;
  const potentialRecovery = estimatedAvoidableCancellations * avgOrderValue;

  // Promo spend increased from 9.5L to 17L (7.5L excess spend to compensate for churn)
  const promoSpendProtected = Math.round(750000 * improvementAssumption);

  return {
    totalMonthlyCancellations,
    unavailabilityCancellations,
    estimatedAvoidableCancellations,
    supportTicketsSaved,
    unavailabilityTickets,
    inventoryAccuracyBefore,
    inventoryAccuracyAfter,
    revenueAtRisk,
    potentialRecovery,
    promoSpendProtected,
    productsCorrected: sessionStats.productsCorrected,
    inventoryUpdatesCompleted: sessionStats.inventoryUpdates,
  };
}

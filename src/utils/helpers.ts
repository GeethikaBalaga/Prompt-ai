import type { RiskLevel, AvailabilityStatus } from '../types';

export function getRiskBadgeClass(level: RiskLevel): string {
  switch (level) {
    case 'critical': return 'badge badge-critical';
    case 'high':     return 'badge badge-high';
    case 'medium':   return 'badge badge-medium';
    case 'low':      return 'badge badge-low';
    default:         return 'badge';
  }
}

export function getAvailabilityBadgeClass(status: AvailabilityStatus): string {
  switch (status) {
    case 'available':   return 'badge badge-available';
    case 'low_stock':   return 'badge badge-low-stock';
    case 'unavailable': return 'badge badge-unavailable';
    case 'paused':      return 'badge badge-paused';
    default:            return 'badge';
  }
}

export function getRiskLevelLabel(level: RiskLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export function getAvailabilityLabel(status: AvailabilityStatus): string {
  switch (status) {
    case 'available':   return 'Available';
    case 'low_stock':   return 'Low Stock';
    case 'unavailable': return 'Unavailable';
    case 'paused':      return 'Paused';
    default:            return status;
  }
}

export function formatHoursAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const hours = Math.round(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? '1 day ago' : `${days} days ago`;
}

export function formatCoverage(days: number): string {
  if (days >= 99) return 'N/A';
  if (days < 0.1) return '< 2 hrs';
  if (days < 1) return `${Math.round(days * 24)}h`;
  return `${days.toFixed(1)}d`;
}

export function getRiskScoreColor(score: number): string {
  if (score >= 75) return '#dc2626';
  if (score >= 50) return '#ea580c';
  if (score >= 25) return '#ca8a04';
  return '#16a34a';
}

export function getTrendIcon(trend: string): string {
  if (trend === 'increasing') return '↑';
  if (trend === 'decreasing') return '↓';
  return '→';
}

export function getTrendClass(trend: string): string {
  if (trend === 'increasing') return 'trend-up';
  if (trend === 'decreasing') return 'trend-down';
  return 'trend-stable';
}

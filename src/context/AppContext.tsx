/**
 * App-wide State Context for NOVA CART Smart Inventory
 */
import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { Product, User, Alert, BusinessImpactParams, InventoryUpdate } from '../types';
import { INITIAL_PRODUCTS, INITIAL_ALERTS, STORE_INFO } from '../data/inventory';
import { enrichProducts, computeDashboardMetrics } from '../utils/riskEngine';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

export interface AppState {
  isAuthenticated: boolean;
  user: User | null;
  products: Product[];
  alerts: Alert[];
  toasts: Toast[];
  inventoryUpdates: number;
  productsCorrected: number;
  updateHistory: InventoryUpdate[];
  impactParams: BusinessImpactParams;
  mobileMenuOpen: boolean;
}

type Action =
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_STOCK'; payload: { productId: string; newStock: number } }
  | { type: 'MARK_UNAVAILABLE'; payload: string }
  | { type: 'MARK_AVAILABLE'; payload: string }
  | { type: 'PAUSE_PRODUCT'; payload: string }
  | { type: 'CONFIRM_STOCK'; payload: string }
  | { type: 'ADD_TOAST'; payload: Toast }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'RESET_DEMO' }
  | { type: 'UPDATE_IMPACT_PARAMS'; payload: Partial<BusinessImpactParams> }
  | { type: 'DISMISS_ALERT'; payload: string }
  | { type: 'TOGGLE_MOBILE_MENU' }
  | { type: 'CLOSE_MOBILE_MENU' };

// ── Initial State ─────────────────────────────────────────────────────────────
const initialProducts = enrichProducts(INITIAL_PRODUCTS);

function loadState(): AppState {
  try {
    const saved = localStorage.getItem('nc_app_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Re-enrich products to recalculate risk scores with current time
      const products = enrichProducts(parsed.products || initialProducts);
      return {
        ...parsed,
        products,
        productsCorrected: parsed.productsCorrected || parsed.productsCorrectd || 0,
        updateHistory: parsed.updateHistory || [],
        toasts: [],
        mobileMenuOpen: false,
      };
    }
  } catch {
    // ignore
  }
  return {
    isAuthenticated: false,
    user: null,
    products: initialProducts,
    alerts: INITIAL_ALERTS,
    toasts: [],
    inventoryUpdates: 0,
    productsCorrected: 0,
    updateHistory: [],
    impactParams: {
      monthlyOrders: 38500,
      cancellationRate: 11,
      unavailabilityContribution: 35,
      accuracyImprovementAssumption: 20,
    },
    mobileMenuOpen: false,
  };
}

// ── Reducer ───────────────────────────────────────────────────────────────────
function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, isAuthenticated: true, user: action.payload };

    case 'LOGOUT':
      return {
        ...loadState(),
        isAuthenticated: false,
        user: null,
        products: enrichProducts(INITIAL_PRODUCTS),
        alerts: INITIAL_ALERTS,
        inventoryUpdates: 0,
        productsCorrected: 0,
        updateHistory: [],
      };

    case 'UPDATE_STOCK': {
      const target = state.products.find((p) => p.id === action.payload.productId);
      const newEntry: InventoryUpdate = {
        id: `upd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId: action.payload.productId,
        productName: target?.name || action.payload.productId,
        previousStock: target?.currentStock ?? 0,
        newStock: action.payload.newStock,
        timestamp: new Date().toISOString(),
        updatedBy: state.user?.managerName || 'Store Manager',
      };
      const updatedProducts = state.products.map((p) => {
        if (p.id !== action.payload.productId) return p;
        const updated = {
          ...p,
          currentStock: action.payload.newStock,
          lastUpdated: new Date().toISOString(),
          availabilityStatus: p.availabilityStatus === 'paused' ? 'paused' as const : 'available' as const,
        };
        return updated;
      });
      const enriched = enrichProducts(updatedProducts);
      return {
        ...state,
        products: enriched,
        inventoryUpdates: state.inventoryUpdates + 1,
        productsCorrected: state.productsCorrected + 1,
        updateHistory: [newEntry, ...state.updateHistory].slice(0, 50),
      };
    }

    case 'MARK_UNAVAILABLE': {
      const updatedProducts = state.products.map((p) =>
        p.id === action.payload
          ? { ...p, availabilityStatus: 'unavailable' as const, lastUpdated: new Date().toISOString() }
          : p
      );
      return {
        ...state,
        products: enrichProducts(updatedProducts),
        inventoryUpdates: state.inventoryUpdates + 1,
        productsCorrected: state.productsCorrected + 1,
      };
    }

    case 'MARK_AVAILABLE': {
      const updatedProducts = state.products.map((p) =>
        p.id === action.payload
          ? { ...p, availabilityStatus: 'available' as const, lastUpdated: new Date().toISOString() }
          : p
      );
      return {
        ...state,
        products: enrichProducts(updatedProducts),
        inventoryUpdates: state.inventoryUpdates + 1,
      };
    }

    case 'PAUSE_PRODUCT': {
      const updatedProducts = state.products.map((p) =>
        p.id === action.payload
          ? { ...p, availabilityStatus: 'paused' as const, lastUpdated: new Date().toISOString() }
          : p
      );
      return {
        ...state,
        products: enrichProducts(updatedProducts),
        inventoryUpdates: state.inventoryUpdates + 1,
      };
    }

    case 'CONFIRM_STOCK': {
      const updatedProducts = state.products.map((p) =>
        p.id === action.payload
          ? { ...p, lastUpdated: new Date().toISOString() }
          : p
      );
      return {
        ...state,
        products: enrichProducts(updatedProducts),
        inventoryUpdates: state.inventoryUpdates + 1,
        productsCorrected: state.productsCorrected + 1,
      };
    }

    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.payload] };

    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.payload) };

    case 'DISMISS_ALERT':
      return { ...state, alerts: state.alerts.filter((a) => a.id !== action.payload) };

    case 'UPDATE_IMPACT_PARAMS':
      return { ...state, impactParams: { ...state.impactParams, ...action.payload } };

    case 'RESET_DEMO':
      return {
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        products: enrichProducts(INITIAL_PRODUCTS),
        alerts: INITIAL_ALERTS,
        toasts: [],
        inventoryUpdates: 0,
        productsCorrected: 0,
        updateHistory: [],
        impactParams: {
          monthlyOrders: 38500,
          cancellationRate: 11,
          unavailabilityContribution: 35,
          accuracyImprovementAssumption: 20,
        },
        mobileMenuOpen: false,
      };

    case 'TOGGLE_MOBILE_MENU':
      return { ...state, mobileMenuOpen: !state.mobileMenuOpen };

    case 'CLOSE_MOBILE_MENU':
      return { ...state, mobileMenuOpen: false };

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  login: (storeId: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateStock: (productId: string, newStock: number) => void;
  markUnavailable: (productId: string) => void;
  markAvailable: (productId: string) => void;
  pauseProduct: (productId: string) => void;
  confirmStock: (productId: string) => void;
  showToast: (type: Toast['type'], title: string, message?: string) => void;
  resetDemo: () => void;
  setImpactParams: (params: Partial<BusinessImpactParams>) => void;
  metrics: ReturnType<typeof computeDashboardMetrics>;
}

const AppContext = createContext<AppContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, loadState);

  // Persist to localStorage (excluding toasts)
  useEffect(() => {
    const { toasts: _t, mobileMenuOpen: _m, ...persistable } = state;
    localStorage.setItem('nc_app_state', JSON.stringify(persistable));
  }, [state]);

  const login = useCallback(async (storeId: string, password: string): Promise<boolean> => {
    // Simulate API latency
    await new Promise((r) => setTimeout(r, 1200));
    if (storeId === 'store_demo' && password === 'demo123') {
      dispatch({
        type: 'LOGIN',
        payload: {
          storeId: STORE_INFO.id,
          storeName: `${STORE_INFO.name} – ${STORE_INFO.city}`,
          role: STORE_INFO.managerRole,
          managerName: STORE_INFO.managerName,
        },
      });
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    dispatch({ type: 'LOGOUT' });
    localStorage.removeItem('nc_app_state');
  }, []);

  const updateStock = useCallback((productId: string, newStock: number) => {
    dispatch({ type: 'UPDATE_STOCK', payload: { productId, newStock } });
  }, []);

  const markUnavailable = useCallback((productId: string) => {
    dispatch({ type: 'MARK_UNAVAILABLE', payload: productId });
  }, []);

  const markAvailable = useCallback((productId: string) => {
    dispatch({ type: 'MARK_AVAILABLE', payload: productId });
  }, []);

  const pauseProduct = useCallback((productId: string) => {
    dispatch({ type: 'PAUSE_PRODUCT', payload: productId });
  }, []);

  const confirmStock = useCallback((productId: string) => {
    dispatch({ type: 'CONFIRM_STOCK', payload: productId });
  }, []);

  const showToast = useCallback((type: Toast['type'], title: string, message?: string) => {
    const id = Math.random().toString(36).slice(2);
    dispatch({ type: 'ADD_TOAST', payload: { id, type, title, message } });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 4000);
  }, []);

  const resetDemo = useCallback(() => {
    dispatch({ type: 'RESET_DEMO' });
  }, []);

  const setImpactParams = useCallback((params: Partial<BusinessImpactParams>) => {
    dispatch({ type: 'UPDATE_IMPACT_PARAMS', payload: params });
  }, []);

  const metrics = computeDashboardMetrics(state.products);

  const value: AppContextValue = {
    state,
    dispatch,
    login,
    logout,
    updateStock,
    markUnavailable,
    markAvailable,
    pauseProduct,
    confirmStock,
    showToast,
    resetDemo,
    setImpactParams,
    metrics,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, { type CustomerInfo, type PurchasesOffering } from 'react-native-purchases';
import { REVENUECAT_API_KEY_ANDROID, REVENUECAT_API_KEY_IOS } from '../api/config';
import { getCurrentUserId } from '../auth/token-storage';
import { useAuth } from '../auth/AuthContext';
import * as api from '../api/endpoints';

const ENTITLEMENT_ID = 'premium';

interface PurchasesContextValue {
  isPremium: boolean;
  isLoading: boolean;
  offering: PurchasesOffering | null;
  purchasePackage: (packageId: string) => Promise<void>;
  restorePurchases: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

const PurchasesContext = createContext<PurchasesContextValue | undefined>(undefined);

let configured = false;

function configureIfNeeded() {
  if (configured) return;
  const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
  if (!apiKey) return;
  Purchases.configure({ apiKey });
  configured = true;
}

export function PurchasesProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);

  const applyCustomerInfo = (info: CustomerInfo) => {
    setIsPremium(!!info.entitlements.active[ENTITLEMENT_ID]);
  };

  const refreshStatus = useCallback(async () => {
    configureIfNeeded();
    if (!configured) {
      setIsLoading(false);
      return;
    }
    const userId = await getCurrentUserId();
    if (userId) {
      await Purchases.logIn(String(userId));
    }
    try {
      const info = await Purchases.getCustomerInfo();
      applyCustomerInfo(info);
      const offerings = await Purchases.getOfferings();
      setOffering(offerings.current ?? null);
    } catch {
      // Statut premium reel = source de verite backend (webhook), on ne bloque pas l'app
      // si RevenueCat est momentanement injoignable.
      try {
        const status = await api.getSubscriptionStatus();
        setIsPremium(status.isPremium);
      } catch {
        // ignore, on garde le dernier statut connu
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsPremium(false);
      setIsLoading(false);
      if (configured) {
        Purchases.logOut().catch(() => undefined);
      }
      return;
    }
    refreshStatus();
    const listener = (info: CustomerInfo) => applyCustomerInfo(info);
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [isAuthenticated, refreshStatus]);

  const purchasePackage = async (packageId: string) => {
    if (!offering) return;
    const pkg = offering.availablePackages.find((p) => p.identifier === packageId);
    if (!pkg) return;
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    applyCustomerInfo(customerInfo);
  };

  const restorePurchases = async () => {
    const info = await Purchases.restorePurchases();
    applyCustomerInfo(info);
  };

  return (
    <PurchasesContext.Provider value={{ isPremium, isLoading, offering, purchasePackage, restorePurchases, refreshStatus }}>
      {children}
    </PurchasesContext.Provider>
  );
}

export function usePremium(): PurchasesContextValue {
  const context = useContext(PurchasesContext);
  if (!context) {
    throw new Error('usePremium doit etre utilise dans un PurchasesProvider');
  }
  return context;
}

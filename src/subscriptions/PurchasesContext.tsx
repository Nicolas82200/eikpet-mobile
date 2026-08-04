import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import type Purchases from 'react-native-purchases';
import type { CustomerInfo, PurchasesOffering } from 'react-native-purchases';
import { REVENUECAT_API_KEY_ANDROID, REVENUECAT_API_KEY_IOS } from '../api/config';
import { getCurrentUserId } from '../auth/token-storage';
import { useAuth } from '../auth/AuthContext';
import * as api from '../api/endpoints';

const ENTITLEMENT_ID = 'premium';

/**
 * react-native-purchases est un module natif : indisponible dans Expo Go (charge une
 * exception au premier appel natif). On ne le require() que hors Expo Go, pour pouvoir
 * developper/deboguer l'UI avec Expo Go sans configurer un build EAS a chaque fois.
 * Les achats reels ne sont testables que dans un vrai build (development/preview/production).
 * Le try/catch est indispensable : la detection d'environnement seule (Constants.appOwnership)
 * n'est pas fiable a 100% selon la version d'Expo Go, et un require() qui plante ferait
 * planter toute l'app au demarrage plutot que juste desactiver la fonctionnalite.
 */
let PurchasesSdk: typeof Purchases | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  PurchasesSdk = require('react-native-purchases').default as typeof Purchases;
} catch {
  PurchasesSdk = null;
}

interface PurchasesContextValue {
  isPremium: boolean;
  isLoading: boolean;
  isAvailable: boolean;
  offering: PurchasesOffering | null;
  purchasePackage: (packageId: string) => Promise<void>;
  restorePurchases: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

const PurchasesContext = createContext<PurchasesContextValue | undefined>(undefined);

let configured = false;

function configureIfNeeded() {
  if (configured || !PurchasesSdk) return;
  const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
  if (!apiKey) return;
  PurchasesSdk.configure({ apiKey });
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
    if (!PurchasesSdk) {
      // Expo Go (ou SDK non disponible) : le backend reste la source de verite du statut.
      try {
        const status = await api.getSubscriptionStatus();
        setIsPremium(status.isPremium);
      } catch {
        // pas connecte / pas d'abonnement en base, on reste sur false
      } finally {
        setIsLoading(false);
      }
      return;
    }

    configureIfNeeded();
    if (!configured) {
      setIsLoading(false);
      return;
    }
    const userId = await getCurrentUserId();
    if (userId) {
      await PurchasesSdk.logIn(String(userId));
    }
    try {
      const info = await PurchasesSdk.getCustomerInfo();
      applyCustomerInfo(info);
      const offerings = await PurchasesSdk.getOfferings();
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
      if (configured && PurchasesSdk) {
        PurchasesSdk.logOut().catch(() => undefined);
      }
      return;
    }
    refreshStatus();
    if (!PurchasesSdk) {
      return;
    }
    const listener = (info: CustomerInfo) => applyCustomerInfo(info);
    PurchasesSdk.addCustomerInfoUpdateListener(listener);
    return () => {
      PurchasesSdk!.removeCustomerInfoUpdateListener(listener);
    };
  }, [isAuthenticated, refreshStatus]);

  const purchasePackage = async (packageId: string) => {
    if (!PurchasesSdk || !offering) return;
    const pkg = offering.availablePackages.find((p) => p.identifier === packageId);
    if (!pkg) return;
    const { customerInfo } = await PurchasesSdk.purchasePackage(pkg);
    applyCustomerInfo(customerInfo);
  };

  const restorePurchases = async () => {
    if (!PurchasesSdk) return;
    const info = await PurchasesSdk.restorePurchases();
    applyCustomerInfo(info);
  };

  return (
    <PurchasesContext.Provider
      value={{
        isPremium,
        isLoading,
        isAvailable: !!PurchasesSdk,
        offering,
        purchasePackage,
        restorePurchases,
        refreshStatus,
      }}
    >
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

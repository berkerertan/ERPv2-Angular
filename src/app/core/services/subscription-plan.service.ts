import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, delay } from 'rxjs/operators';
import {
  SubscriptionPlan,
  PlanPermissions,
  PlanLimits,
  CreatePlanRequest,
  UpdatePlanRequest,
} from '../models/subscription-plan.model';

// ─────────────────────────────────────────────────────────────────────────────
// İzin setleri
// ─────────────────────────────────────────────────────────────────────────────

const ALL_PERMISSIONS_FALSE: PlanPermissions = {
  pos: false,
  stockManagement: false,
  stockMovements: false,
  cariAccounts: false,
  eFatura: false,
  eArsiv: false,
  purchaseOrders: false,
  salesOrders: false,
  basicReports: false,
  advancedReports: false,
  multiBranch: false,
  multiWarehouse: false,
  apiAccess: false,
  companyManagement: false,
};

const STARTER_PERMISSIONS: PlanPermissions = {
  ...ALL_PERMISSIONS_FALSE,
  pos: true,
  stockManagement: true,
  stockMovements: true,
  salesOrders: true,
  basicReports: true,
};

const PRO_PERMISSIONS: PlanPermissions = {
  ...STARTER_PERMISSIONS,
  cariAccounts: true,
  eFatura: true,
  eArsiv: true,
  purchaseOrders: true,
  advancedReports: true,
  multiBranch: true,
  multiWarehouse: true,
};

const ENTERPRISE_PERMISSIONS: PlanPermissions = {
  pos: true,
  stockManagement: true,
  stockMovements: true,
  cariAccounts: true,
  eFatura: true,
  eArsiv: true,
  purchaseOrders: true,
  salesOrders: true,
  basicReports: true,
  advancedReports: true,
  multiBranch: true,
  multiWarehouse: true,
  apiAccess: true,
  companyManagement: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// Başlangıç plan verisi
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Abone sayıları ve aylık gelir değerleri tenant mock verisinden türetilmiş
 * sabit mock değerlerdir:
 *   - starter : 450 abone  × ₺249 ort. (yıllık ağırlıklı)   ≈ ₺112.050 / ay
 *   - pro     : 680 abone  × ₺609 ort.                        ≈ ₺414.120 / ay
 *   - enterprise: 95 abone × ₺1.374 ort.                      ≈ ₺130.530 / ay
 *
 * Yukarıdaki hesaplar yalnızca tahmindir; bileşen katmanında gerçek tenant
 * verisiyle kolayca güncellenebilir.
 */
const INITIAL_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description:
      'Tek şubeli küçük işletmeler için temel ERP işlevleri. Hızlı kurulum, düşük maliyet.',
    icon: 'rocket_launch',
    monthlyPrice: 299,
    annualPrice: 249,
    annualDiscountPercent: 17,
    isPopular: false,
    isActive: true,
    sortOrder: 1,
    color: 'blue',
    permissions: STARTER_PERMISSIONS,
    limits: {
      maxBranches: 1,
      maxUsers: 3,
      maxProducts: 2000,
      maxTransactionsPerMonth: 5000,
    },
    subscriberCount: 450,
    monthlyRevenue: 112050,
  },
  {
    id: 'pro',
    name: 'Pro',
    description:
      'Büyüyen işletmeler için çoklu şube desteği, e-fatura ve gelişmiş raporlama.',
    icon: 'workspace_premium',
    monthlyPrice: 699,
    annualPrice: 579,
    annualDiscountPercent: 17,
    isPopular: true,
    isActive: true,
    sortOrder: 2,
    color: 'purple',
    permissions: PRO_PERMISSIONS,
    limits: {
      maxBranches: 3,
      maxUsers: 10,
      maxProducts: 10000,
      maxTransactionsPerMonth: 30000,
    },
    subscriberCount: 680,
    monthlyRevenue: 414120,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description:
      'Sınırsız şube, kullanıcı ve ürün. Tüm özellikler açık, API erişimi ve özel destek dahil.',
    icon: 'business_center',
    monthlyPrice: 1499,
    annualPrice: 1249,
    annualDiscountPercent: 17,
    isPopular: false,
    isActive: true,
    sortOrder: 3,
    color: 'gold',
    permissions: ENTERPRISE_PERMISSIONS,
    limits: {
      maxBranches: -1,
      maxUsers: -1,
      maxProducts: -1,
      maxTransactionsPerMonth: -1,
    },
    subscriberCount: 95,
    monthlyRevenue: 130530,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Yardımcı: benzersiz ID üretici
// ─────────────────────────────────────────────────────────────────────────────

function generatePlanId(): string {
  return 'plan-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}

// ─────────────────────────────────────────────────────────────────────────────
// Servis
// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class SubscriptionPlanService {
  private _plans$ = new BehaviorSubject<SubscriptionPlan[]>([...INITIAL_PLANS]);

  /** Tüm plan listesini dışarıya açan observable */
  readonly plans$ = this._plans$.asObservable();

  // ─────────────────────────────────────────────────────────────────────────
  // Okuma
  // ─────────────────────────────────────────────────────────────────────────

  /** Sıralı plan listesi döner */
  getPlans(): Observable<SubscriptionPlan[]> {
    return of(null).pipe(
      delay(200),
      map(() =>
        [...this._plans$.getValue()].sort((a, b) => a.sortOrder - b.sortOrder),
      ),
    );
  }

  /** Tekil plan döner; bulunamazsa null */
  getPlan(id: string): Observable<SubscriptionPlan | null> {
    return of(null).pipe(
      delay(200),
      map(() => {
        const plan = this._plans$.getValue().find((p) => p.id === id);
        return plan ?? null;
      }),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Oluşturma
  // ─────────────────────────────────────────────────────────────────────────

  /** Yeni bir plan oluşturur; otomatik ID ve sıfır abone/gelir atar */
  createPlan(req: CreatePlanRequest): Observable<SubscriptionPlan> {
    return of(null).pipe(
      delay(200),
      map(() => {
        const newPlan: SubscriptionPlan = {
          ...req,
          id: generatePlanId(),
          subscriberCount: 0,
          monthlyRevenue: 0,
        };

        const list = [...this._plans$.getValue(), newPlan];
        this._plans$.next(list);
        return newPlan;
      }),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Güncelleme
  // ─────────────────────────────────────────────────────────────────────────

  /** Planın belirtilen alanlarını kısmen günceller */
  updatePlan(id: string, req: UpdatePlanRequest): Observable<SubscriptionPlan> {
    return of(null).pipe(
      delay(200),
      map(() => {
        const list = this._plans$.getValue();
        const idx = list.findIndex((p) => p.id === id);
        if (idx === -1) {
          throw new Error(`Plan bulunamadı: ${id}`);
        }

        const updated: SubscriptionPlan = { ...list[idx], ...req };
        const newList = [...list];
        newList[idx] = updated;
        this._plans$.next(newList);
        return updated;
      }),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Silme
  // ─────────────────────────────────────────────────────────────────────────

  /** Planı listeden siler */
  deletePlan(id: string): Observable<void> {
    return of(null).pipe(
      delay(200),
      map(() => {
        const list = this._plans$.getValue().filter((p) => p.id !== id);
        this._plans$.next(list);
      }),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // İzinler & Limitler
  // ─────────────────────────────────────────────────────────────────────────

  /** Planın izin setini tamamen günceller */
  updatePermissions(id: string, permissions: PlanPermissions): Observable<SubscriptionPlan> {
    return of(null).pipe(
      delay(200),
      map(() => {
        const list = this._plans$.getValue();
        const idx = list.findIndex((p) => p.id === id);
        if (idx === -1) {
          throw new Error(`Plan bulunamadı: ${id}`);
        }

        const updated: SubscriptionPlan = { ...list[idx], permissions };
        const newList = [...list];
        newList[idx] = updated;
        this._plans$.next(newList);
        return updated;
      }),
    );
  }

  /** Planın limit setini tamamen günceller */
  updateLimits(id: string, limits: PlanLimits): Observable<SubscriptionPlan> {
    return of(null).pipe(
      delay(200),
      map(() => {
        const list = this._plans$.getValue();
        const idx = list.findIndex((p) => p.id === id);
        if (idx === -1) {
          throw new Error(`Plan bulunamadı: ${id}`);
        }

        const updated: SubscriptionPlan = { ...list[idx], limits };
        const newList = [...list];
        newList[idx] = updated;
        this._plans$.next(newList);
        return updated;
      }),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Sıralama
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Plan sıralamasını yeniden düzenler.
   * `ids` dizisi yeni sırayı belirtir (ilk eleman sortOrder = 1).
   * Dizide bulunmayan plan ID'leri listenin sonuna eklenir.
   */
  reorder(ids: string[]): Observable<SubscriptionPlan[]> {
    return of(null).pipe(
      delay(200),
      map(() => {
        const list = this._plans$.getValue();

        // ids içinde geçen planları sırayla güncelle
        const reordered = ids
          .map((id, index) => {
            const plan = list.find((p) => p.id === id);
            if (!plan) return null;
            return { ...plan, sortOrder: index + 1 };
          })
          .filter((p): p is SubscriptionPlan => p !== null);

        // ids içinde yer almayan planları mevcut sıra korunarak sona ekle
        const reorderedIds = new Set(ids);
        const remaining = list
          .filter((p) => !reorderedIds.has(p.id))
          .map((p, index) => ({ ...p, sortOrder: reordered.length + index + 1 }));

        const finalList = [...reordered, ...remaining];
        this._plans$.next(finalList);
        return [...finalList].sort((a, b) => a.sortOrder - b.sortOrder);
      }),
    );
  }
}

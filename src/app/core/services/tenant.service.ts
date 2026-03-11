import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, delay } from 'rxjs/operators';
import {
  Tenant,
  TenantStatus,
  PlanId,
  BillingCycle,
  TenantListFilter,
  TenantListResponse,
  TenantUsageStats,
  UpdateTenantPlanRequest,
  UpdateTenantStatusRequest,
} from '../models/tenant.model';

const PLAN_MONTHLY_PRICE: Record<PlanId, number> = {
  starter: 299,
  pro: 699,
  enterprise: 1499,
};

const PLAN_ANNUAL_MONTHLY_EQUIVALENT: Record<PlanId, number> = {
  starter: 249,
  pro: 579,
  enterprise: 1249,
};

function monthlyRevenue(plan: PlanId, cycle: BillingCycle): number {
  return cycle === 'annual'
    ? PLAN_ANNUAL_MONTHLY_EQUIVALENT[plan]
    : PLAN_MONTHLY_PRICE[plan];
}

const INITIAL_TENANTS: Tenant[] = [
  {
    id: 'tnnt-001',
    companyName: 'Yıldız Elektronik Ticaret A.Ş.',
    ownerName: 'Ahmet Yıldız',
    email: 'ahmet@yildizelektronik.com.tr',
    phone: '+90 212 555 0101',
    plan: 'enterprise',
    status: 'active',
    billingCycle: 'annual',
    trialEndsAt: null,
    subscribedAt: '2023-03-15T09:00:00Z',
    lastActiveAt: '2026-03-10T18:45:00Z',
    monthlyRevenue: monthlyRevenue('enterprise', 'annual'),
    branchCount: 12,
    userCount: 87,
    productCount: 48320,
    transactionCount: 154200,
    city: 'İstanbul',
    notes: 'Büyük ölçekli elektronik zinciri. Yıllık sözleşme otomatik yenilenecek.',
  },
  {
    id: 'tnnt-002',
    companyName: 'Kaya Gıda ve Tarım Ltd. Şti.',
    ownerName: 'Mehmet Kaya',
    email: 'mkaya@kayagida.com.tr',
    phone: '+90 332 555 0202',
    plan: 'pro',
    status: 'active',
    billingCycle: 'monthly',
    trialEndsAt: null,
    subscribedAt: '2023-07-01T10:30:00Z',
    lastActiveAt: '2026-03-10T16:20:00Z',
    monthlyRevenue: monthlyRevenue('pro', 'monthly'),
    branchCount: 3,
    userCount: 18,
    productCount: 7450,
    transactionCount: 32800,
    city: 'Konya',
    notes: 'Toptan gıda dağıtımı yapıyor. E-fatura entegrasyonu aktif.',
  },
  {
    id: 'tnnt-003',
    companyName: 'Demir İnşaat Malzemeleri San. Tic.',
    ownerName: 'Fatma Demir',
    email: 'fdemir@demirinsaat.com.tr',
    phone: '+90 232 555 0303',
    plan: 'pro',
    status: 'active',
    billingCycle: 'annual',
    trialEndsAt: null,
    subscribedAt: '2023-09-20T08:00:00Z',
    lastActiveAt: '2026-03-09T14:55:00Z',
    monthlyRevenue: monthlyRevenue('pro', 'annual'),
    branchCount: 2,
    userCount: 11,
    productCount: 9800,
    transactionCount: 21500,
    city: 'İzmir',
    notes: 'İnşaat malzemeleri toptan satış. Yıllık aboneliğe geçti.',
  },
  {
    id: 'tnnt-004',
    companyName: 'Bozkurt Tekstil ve Konfeksiyon',
    ownerName: 'Ali Bozkurt',
    email: 'ali.bozkurt@bztekstil.com',
    phone: '+90 224 555 0404',
    plan: 'starter',
    status: 'active',
    billingCycle: 'monthly',
    trialEndsAt: null,
    subscribedAt: '2024-01-10T11:00:00Z',
    lastActiveAt: '2026-03-10T11:30:00Z',
    monthlyRevenue: monthlyRevenue('starter', 'monthly'),
    branchCount: 1,
    userCount: 3,
    productCount: 1850,
    transactionCount: 8400,
    city: 'Bursa',
    notes: 'Küçük ölçekli tekstil işletmesi. Starter planı yeterli.',
  },
  {
    id: 'tnnt-005',
    companyName: 'Şahin Otomotiv Yedek Parça',
    ownerName: 'Hasan Şahin',
    email: 'hsahin@sahinoto.com.tr',
    phone: '+90 312 555 0505',
    plan: 'pro',
    status: 'trial',
    billingCycle: 'monthly',
    trialEndsAt: '2026-03-25T23:59:59Z',
    subscribedAt: '2026-03-04T09:15:00Z',
    lastActiveAt: '2026-03-10T10:05:00Z',
    monthlyRevenue: 0,
    branchCount: 1,
    userCount: 5,
    productCount: 4200,
    transactionCount: 310,
    city: 'Ankara',
    notes: 'Deneme süresi aktif. Satış ekibi takipte.',
  },
  {
    id: 'tnnt-006',
    companyName: 'Çelik Market Zinciri A.Ş.',
    ownerName: 'Zeynep Çelik',
    email: 'zcelik@celikmarket.com.tr',
    phone: '+90 322 555 0606',
    plan: 'enterprise',
    status: 'active',
    billingCycle: 'annual',
    trialEndsAt: null,
    subscribedAt: '2022-11-01T07:30:00Z',
    lastActiveAt: '2026-03-10T20:10:00Z',
    monthlyRevenue: monthlyRevenue('enterprise', 'annual'),
    branchCount: 28,
    userCount: 145,
    productCount: 92500,
    transactionCount: 487600,
    city: 'Adana',
    notes: 'Güney bölgesi lideri. Özel destek sözleşmesi mevcut.',
  },
  {
    id: 'tnnt-007',
    companyName: 'Arslan Mobilya ve Dekorasyon',
    ownerName: 'Murat Arslan',
    email: 'murslan@arslanmobilya.com',
    phone: '+90 242 555 0707',
    plan: 'starter',
    status: 'trial',
    billingCycle: 'monthly',
    trialEndsAt: '2026-03-20T23:59:59Z',
    subscribedAt: '2026-03-06T14:00:00Z',
    lastActiveAt: '2026-03-08T16:45:00Z',
    monthlyRevenue: 0,
    branchCount: 1,
    userCount: 2,
    productCount: 620,
    transactionCount: 95,
    city: 'Antalya',
    notes: 'Yeni kayıt. İlk ürün girişlerini yapıyor.',
  },
  {
    id: 'tnnt-008',
    companyName: 'Doğan Eczane ve Optik',
    ownerName: 'Selin Doğan',
    email: 'sdogan@doganeczane.net',
    phone: '+90 352 555 0808',
    plan: 'starter',
    status: 'active',
    billingCycle: 'annual',
    trialEndsAt: null,
    subscribedAt: '2024-05-18T10:00:00Z',
    lastActiveAt: '2026-03-10T09:55:00Z',
    monthlyRevenue: monthlyRevenue('starter', 'annual'),
    branchCount: 1,
    userCount: 3,
    productCount: 1980,
    transactionCount: 12600,
    city: 'Kayseri',
    notes: 'Eczane + optik şubesi tek hesapta yönetiliyor.',
  },
  {
    id: 'tnnt-009',
    companyName: 'Polat Lojistik ve Nakliyat A.Ş.',
    ownerName: 'Emre Polat',
    email: 'epolat@polatlojistik.com.tr',
    phone: '+90 212 555 0909',
    plan: 'enterprise',
    status: 'suspended',
    billingCycle: 'monthly',
    trialEndsAt: null,
    subscribedAt: '2023-02-14T08:45:00Z',
    lastActiveAt: '2026-02-01T12:00:00Z',
    monthlyRevenue: 0,
    branchCount: 7,
    userCount: 42,
    productCount: 18700,
    transactionCount: 89300,
    city: 'İstanbul',
    notes: 'Ödeme gecikme nedeniyle askıya alındı (Şubat 2026). İletişim kuruluyor.',
  },
  {
    id: 'tnnt-010',
    companyName: 'Güneş Tarım Kooperatifi',
    ownerName: 'İbrahim Güneş',
    email: 'iguneskooop@gunestarim.org',
    phone: '+90 382 555 1010',
    plan: 'starter',
    status: 'cancelled',
    billingCycle: 'monthly',
    trialEndsAt: null,
    subscribedAt: '2024-02-20T10:00:00Z',
    lastActiveAt: '2025-11-15T08:30:00Z',
    monthlyRevenue: 0,
    branchCount: 1,
    userCount: 2,
    productCount: 340,
    transactionCount: 1850,
    city: 'Çankırı',
    notes: 'Aboneliği iptal etti. Rakip ürüne geçiş yaptı.',
  },
  {
    id: 'tnnt-011',
    companyName: 'Türk Hırdavat ve Boya Ticaret',
    ownerName: 'Caner Türk',
    email: 'caner@turkhirdavat.com.tr',
    phone: '+90 212 555 1111',
    plan: 'pro',
    status: 'active',
    billingCycle: 'monthly',
    trialEndsAt: null,
    subscribedAt: '2023-12-01T09:00:00Z',
    lastActiveAt: '2026-03-10T17:20:00Z',
    monthlyRevenue: monthlyRevenue('pro', 'monthly'),
    branchCount: 3,
    userCount: 9,
    productCount: 6720,
    transactionCount: 27400,
    city: 'İstanbul',
    notes: 'Hırdavat + boya toptan satış. E-arşiv kullanıyor.',
  },
  {
    id: 'tnnt-012',
    companyName: 'Korkmaz Süt ve Süt Ürünleri',
    ownerName: 'Ayşe Korkmaz',
    email: 'akorkmaz@korkmazsut.com.tr',
    phone: '+90 232 555 1212',
    plan: 'starter',
    status: 'active',
    billingCycle: 'monthly',
    trialEndsAt: null,
    subscribedAt: '2024-08-05T11:30:00Z',
    lastActiveAt: '2026-03-09T07:40:00Z',
    monthlyRevenue: monthlyRevenue('starter', 'monthly'),
    branchCount: 1,
    userCount: 2,
    productCount: 420,
    transactionCount: 5900,
    city: 'İzmir',
    notes: 'Bölgesel süt ürünleri dağıtımı.',
  },
  {
    id: 'tnnt-013',
    companyName: 'Aydın Medikal ve Sağlık Ürünleri',
    ownerName: 'Burak Aydın',
    email: 'baydın@aydinmedikal.com',
    phone: '+90 312 555 1313',
    plan: 'pro',
    status: 'active',
    billingCycle: 'annual',
    trialEndsAt: null,
    subscribedAt: '2023-05-10T09:30:00Z',
    lastActiveAt: '2026-03-10T13:15:00Z',
    monthlyRevenue: monthlyRevenue('pro', 'annual'),
    branchCount: 2,
    userCount: 14,
    productCount: 8900,
    transactionCount: 19600,
    city: 'Ankara',
    notes: 'Medikal malzeme distribütörü. Satın alma modülü yoğun kullanılıyor.',
  },
  {
    id: 'tnnt-014',
    companyName: 'Öz Erzurum Kırtasiye ve Ofis',
    ownerName: 'Derya Öztürk',
    email: 'dozturk@ozerzurumkirtasiye.com',
    phone: '+90 442 555 1414',
    plan: 'starter',
    status: 'suspended',
    billingCycle: 'monthly',
    trialEndsAt: null,
    subscribedAt: '2024-03-22T10:00:00Z',
    lastActiveAt: '2026-01-20T15:00:00Z',
    monthlyRevenue: 0,
    branchCount: 1,
    userCount: 2,
    productCount: 1650,
    transactionCount: 3200,
    city: 'Erzurum',
    notes: 'Ödeme yapılmadı. Hesap askıya alındı.',
  },
  {
    id: 'tnnt-015',
    companyName: 'Kartal Spor Malzemeleri',
    ownerName: 'Serkan Kartal',
    email: 'skartal@kartalspor.com.tr',
    phone: '+90 216 555 1515',
    plan: 'pro',
    status: 'trial',
    billingCycle: 'annual',
    trialEndsAt: '2026-03-28T23:59:59Z',
    subscribedAt: '2026-03-07T10:00:00Z',
    lastActiveAt: '2026-03-10T19:00:00Z',
    monthlyRevenue: 0,
    branchCount: 1,
    userCount: 6,
    productCount: 3100,
    transactionCount: 420,
    city: 'İstanbul',
    notes: 'Pro planı deneme süresi. Yıllık aboneliğe geçmeyi düşünüyor.',
  },
  {
    id: 'tnnt-016',
    companyName: 'Saray Pastanesi ve Unlu Mamüller',
    ownerName: 'Gül Saray',
    email: 'gsaray@saraypastanesi.com.tr',
    phone: '+90 224 555 1616',
    plan: 'starter',
    status: 'active',
    billingCycle: 'annual',
    trialEndsAt: null,
    subscribedAt: '2024-10-15T08:00:00Z',
    lastActiveAt: '2026-03-10T08:30:00Z',
    monthlyRevenue: monthlyRevenue('starter', 'annual'),
    branchCount: 1,
    userCount: 3,
    productCount: 870,
    transactionCount: 9800,
    city: 'Bursa',
    notes: 'Pastane zinciri; günlük yoğun POS kullanımı.',
  },
  {
    id: 'tnnt-017',
    companyName: 'Mega Yapı Market ve Depo',
    ownerName: 'Taner Mega',
    email: 'tmega@megayapi.com.tr',
    phone: '+90 322 555 1717',
    plan: 'enterprise',
    status: 'active',
    billingCycle: 'monthly',
    trialEndsAt: null,
    subscribedAt: '2022-06-01T09:00:00Z',
    lastActiveAt: '2026-03-10T21:00:00Z',
    monthlyRevenue: monthlyRevenue('enterprise', 'monthly'),
    branchCount: 18,
    userCount: 112,
    productCount: 73800,
    transactionCount: 318400,
    city: 'Adana',
    notes: 'Yapı market zinciri. API entegrasyonu ile ERP sisteme bağlı.',
  },
  {
    id: 'tnnt-018',
    companyName: 'Boran Oto Aksesuar ve Yıkama',
    ownerName: 'Kemal Boran',
    email: 'kboran@boranoto.com',
    phone: '+90 462 555 1818',
    plan: 'starter',
    status: 'cancelled',
    billingCycle: 'monthly',
    trialEndsAt: null,
    subscribedAt: '2024-06-01T10:00:00Z',
    lastActiveAt: '2025-12-31T23:59:00Z',
    monthlyRevenue: 0,
    branchCount: 1,
    userCount: 1,
    productCount: 290,
    transactionCount: 1540,
    city: 'Trabzon',
    notes: 'İşletme kapandı. Abonelik iptal edildi.',
  },
  {
    id: 'tnnt-019',
    companyName: 'Anadolu Soğuk Hava ve Lojistik',
    ownerName: 'Pınar Anadolu',
    email: 'panadolu@anasogukhava.com.tr',
    phone: '+90 332 555 1919',
    plan: 'pro',
    status: 'active',
    billingCycle: 'monthly',
    trialEndsAt: null,
    subscribedAt: '2024-04-12T09:00:00Z',
    lastActiveAt: '2026-03-10T15:45:00Z',
    monthlyRevenue: monthlyRevenue('pro', 'monthly'),
    branchCount: 2,
    userCount: 13,
    productCount: 5240,
    transactionCount: 16700,
    city: 'Konya',
    notes: 'Soğuk zincir lojistik. Satın alma ve stok modülleri aktif.',
  },
  {
    id: 'tnnt-020',
    companyName: 'Ege Balık ve Deniz Ürünleri',
    ownerName: 'Deniz Ege',
    email: 'dege@egebalik.com.tr',
    phone: '+90 232 555 2020',
    plan: 'starter',
    status: 'trial',
    billingCycle: 'monthly',
    trialEndsAt: '2026-03-22T23:59:59Z',
    subscribedAt: '2026-03-08T12:00:00Z',
    lastActiveAt: '2026-03-10T12:00:00Z',
    monthlyRevenue: 0,
    branchCount: 1,
    userCount: 2,
    productCount: 180,
    transactionCount: 75,
    city: 'İzmir',
    notes: 'Yeni kayıt. Deneme süresi devam ediyor.',
  },
  {
    id: 'tnnt-021',
    companyName: 'Sönmez Elektrik Malzemeleri',
    ownerName: 'Ramazan Sönmez',
    email: 'rsonmez@sonmezelektrik.com.tr',
    phone: '+90 212 555 2121',
    plan: 'pro',
    status: 'active',
    billingCycle: 'annual',
    trialEndsAt: null,
    subscribedAt: '2023-01-08T09:30:00Z',
    lastActiveAt: '2026-03-10T16:00:00Z',
    monthlyRevenue: monthlyRevenue('pro', 'annual'),
    branchCount: 3,
    userCount: 16,
    productCount: 11200,
    transactionCount: 43800,
    city: 'İstanbul',
    notes: 'Toptan elektrik malzemeleri. Yüksek ürün çeşitliliği.',
  },
  {
    id: 'tnnt-022',
    companyName: 'Hazar Ambalaj ve Kağıt San.',
    ownerName: 'Leyla Hazar',
    email: 'lhazar@hazarambalaj.com.tr',
    phone: '+90 342 555 2222',
    plan: 'starter',
    status: 'active',
    billingCycle: 'monthly',
    trialEndsAt: null,
    subscribedAt: '2025-01-20T10:00:00Z',
    lastActiveAt: '2026-03-09T14:00:00Z',
    monthlyRevenue: monthlyRevenue('starter', 'monthly'),
    branchCount: 1,
    userCount: 3,
    productCount: 1200,
    transactionCount: 6400,
    city: 'Gaziantep',
    notes: 'Ambalaj imalatı ve toptan satış.',
  },
];

@Injectable({ providedIn: 'root' })
export class TenantService {
  private _tenants$ = new BehaviorSubject<Tenant[]>([...INITIAL_TENANTS]);

  /** Tüm tenant listesini dışarıya açan observable */
  readonly tenants$ = this._tenants$.asObservable();

  // ─────────────────────────────────────────────────────────────────────────────
  // Okuma metotları
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Filtreli, sayfalanmış tenant listesi döner.
   * Arama: companyName, email veya ownerName üzerinde case-insensitive yapılır.
   */
  getTenants(filter: TenantListFilter): Observable<TenantListResponse> {
    return of(null).pipe(
      delay(200),
      map(() => {
        let items = [...this._tenants$.getValue()];

        // Arama filtresi
        if (filter.search && filter.search.trim().length > 0) {
          const term = filter.search.trim().toLowerCase();
          items = items.filter(
            (t) =>
              t.companyName.toLowerCase().includes(term) ||
              t.email.toLowerCase().includes(term) ||
              t.ownerName.toLowerCase().includes(term),
          );
        }

        // Durum filtresi
        if (filter.status && filter.status !== 'all') {
          items = items.filter((t) => t.status === filter.status);
        }

        // Plan filtresi
        if (filter.plan && filter.plan !== 'all') {
          items = items.filter((t) => t.plan === filter.plan);
        }

        // Fatura döngüsü filtresi
        if (filter.billingCycle && filter.billingCycle !== 'all') {
          items = items.filter((t) => t.billingCycle === filter.billingCycle);
        }

        const total = items.length;

        // Sayfalama
        const start = (filter.page - 1) * filter.pageSize;
        const pagedItems = items.slice(start, start + filter.pageSize);

        return {
          items: pagedItems,
          total,
          page: filter.page,
          pageSize: filter.pageSize,
        } as TenantListResponse;
      }),
    );
  }

  /** Tekil tenant döner; bulunamazsa null */
  getTenant(id: string): Observable<Tenant | null> {
    return of(null).pipe(
      delay(200),
      map(() => {
        const tenant = this._tenants$.getValue().find((t) => t.id === id);
        return tenant ?? null;
      }),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Durum & Plan güncelleme
  // ─────────────────────────────────────────────────────────────────────────────

  /** Tenant durumunu günceller; güncellenen tenant'ı döner */
  updateTenantStatus(req: UpdateTenantStatusRequest): Observable<Tenant> {
    return of(null).pipe(
      delay(200),
      map(() => {
        const list = this._tenants$.getValue();
        const idx = list.findIndex((t) => t.id === req.tenantId);
        if (idx === -1) {
          throw new Error(`Tenant bulunamadı: ${req.tenantId}`);
        }

        const current = list[idx];

        // Askıya alındığında ya da iptal edildiğinde gelir sıfırlanır
        const revenueReset =
          req.status === 'suspended' || req.status === 'cancelled';

        const updated: Tenant = {
          ...current,
          status: req.status,
          monthlyRevenue: revenueReset
            ? 0
            : monthlyRevenue(current.plan, current.billingCycle),
        };

        const newList = [...list];
        newList[idx] = updated;
        this._tenants$.next(newList);
        return updated;
      }),
    );
  }

  /** Tenant planını ve fatura döngüsünü günceller; aylık geliri otomatik hesaplar */
  updateTenantPlan(req: UpdateTenantPlanRequest): Observable<Tenant> {
    return of(null).pipe(
      delay(200),
      map(() => {
        const list = this._tenants$.getValue();
        const idx = list.findIndex((t) => t.id === req.tenantId);
        if (idx === -1) {
          throw new Error(`Tenant bulunamadı: ${req.tenantId}`);
        }

        const current = list[idx];
        const revenue =
          current.status === 'trial' ||
          current.status === 'suspended' ||
          current.status === 'cancelled'
            ? 0
            : monthlyRevenue(req.newPlan, req.billingCycle);

        const updated: Tenant = {
          ...current,
          plan: req.newPlan,
          billingCycle: req.billingCycle,
          monthlyRevenue: revenue,
        };

        const newList = [...list];
        newList[idx] = updated;
        this._tenants$.next(newList);
        return updated;
      }),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Silme
  // ─────────────────────────────────────────────────────────────────────────────

  /** Tenant'ı listeden siler */
  deleteTenant(id: string): Observable<void> {
    return of(null).pipe(
      delay(200),
      map(() => {
        const list = this._tenants$.getValue().filter((t) => t.id !== id);
        this._tenants$.next(list);
      }),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Kullanım istatistikleri (mock)
  // ─────────────────────────────────────────────────────────────────────────────

  /** Tenant için son 14 güne ait mock kullanım verisini döner */
  getTenantUsageStats(tenantId: string): Observable<TenantUsageStats> {
    return of(null).pipe(
      delay(200),
      map(() => {
        const tenant = this._tenants$.getValue().find((t) => t.id === tenantId);
        if (!tenant) {
          throw new Error(`Tenant bulunamadı: ${tenantId}`);
        }

        // Günlük işlem sayısını tenant'ın toplam işleminden türet
        const dailyBase = Math.round(tenant.transactionCount / 30);
        const today = new Date();
        const dailyTransactions: { date: string; count: number }[] = [];
        for (let i = 13; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          // Hafta sonu düşük trafik simülasyonu
          const dayOfWeek = d.getDay();
          const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.4 : 1;
          const jitter = 0.7 + Math.random() * 0.6;
          dailyTransactions.push({
            date: dateStr,
            count: Math.round(dailyBase * weekendFactor * jitter),
          });
        }

        // Özellik kullanımı — tenant planına göre ağırlıklandırılmış mock değerler
        const featureBase = tenant.transactionCount;
        const topFeatures: { feature: string; usageCount: number }[] = [
          { feature: 'POS Satış', usageCount: Math.round(featureBase * 0.45) },
          { feature: 'Stok Sorgulama', usageCount: Math.round(featureBase * 0.28) },
          { feature: 'Fatura Oluşturma', usageCount: Math.round(featureBase * 0.15) },
          { feature: 'Rapor Görüntüleme', usageCount: Math.round(featureBase * 0.08) },
          { feature: 'Cari Hesap İşlemi', usageCount: Math.round(featureBase * 0.04) },
        ];

        const storageUsedMb =
          Math.round(
            (tenant.productCount * 0.08 + tenant.transactionCount * 0.002) * 10,
          ) / 10;

        const apiCallsThisMonth = Math.round(tenant.transactionCount * 3.2);

        return {
          tenantId,
          dailyTransactions,
          topFeatures,
          storageUsedMb,
          apiCallsThisMonth,
        } as TenantUsageStats;
      }),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Özet istatistikler
  // ─────────────────────────────────────────────────────────────────────────────

  /** Durum bazında tenant sayılarını döner */
  getStats(): Observable<{
    total: number;
    active: number;
    trial: number;
    suspended: number;
    cancelled: number;
  }> {
    return this._tenants$.pipe(
      delay(200),
      map((tenants) => {
        return {
          total: tenants.length,
          active: tenants.filter((t) => t.status === 'active').length,
          trial: tenants.filter((t) => t.status === 'trial').length,
          suspended: tenants.filter((t) => t.status === 'suspended').length,
          cancelled: tenants.filter((t) => t.status === 'cancelled').length,
        };
      }),
    );
  }
}

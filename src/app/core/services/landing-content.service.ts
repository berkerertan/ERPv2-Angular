import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import {
  LandingContent,
  HeroContent,
  StatItem,
  FeatureItem,
  TestimonialItem,
  CtaContent,
  UpdateHeroRequest,
  UpdateCtaRequest,
  UpdateStatsRequest,
  UpdateFeatureRequest,
  UpdateTestimonialRequest,
} from '../models/landing-content.model';

// ─── Initial mock content ─────────────────────────────────────────────────────

const INITIAL_HERO: HeroContent = {
  badge: "Türkiye'nin En Hızlı Büyüyen ERP Platformu",
  title: 'Perakende İşletmenizi',
  titleAccent: 'Dijitalleştirin.',
  description:
    'POS, stok, cari hesap, e-fatura ve daha fazlası tek platformda. Dakikalar içinde kurulum, işletmenize özel abonelik planı.',
  primaryCtaText: '14 Gün Ücretsiz Deneyin',
  secondaryCtaText: 'Nasıl Çalışır?',
};

const INITIAL_STATS: StatItem[] = [
  { value: '1.200+', label: 'Aktif İşletme' },
  { value: '₺892K', label: 'Aylık İşlem Hacmi' },
  { value: '%99.9', label: 'Uptime Garantisi' },
  { value: '14 Gün', label: 'Ücretsiz Deneme' },
];

const INITIAL_FEATURES: FeatureItem[] = [
  {
    id: 'feat-pos',
    icon: 'point_of_sale',
    title: 'Hızlı POS Sistemi',
    description:
      'Barkod okuyucu, dokunmatik ekran ve çoklu ödeme yöntemi desteğiyle kasiyerleriniz saniyeler içinde işlem tamamlar. Stok otomatik güncellenir.',
    stat: '3 sn',
    statLabel: 'Ortalama İşlem Süresi',
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'feat-stok',
    icon: 'inventory_2',
    title: 'Akıllı Stok Yönetimi',
    description:
      'Minimum stok uyarıları, otomatik sipariş önerileri ve anlık stok sayımı ile raf boşluklarını ve fazla stoğu ortadan kaldırın.',
    stat: '%31',
    statLabel: 'Stok Maliyeti Düşüşü',
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'feat-efatura',
    icon: 'receipt_long',
    title: 'e-Fatura & e-Arşiv',
    description:
      'GİB onaylı entegrasyon sayesinde faturalarınızı tek tıkla kesin, gönderin ve arşivleyin. Muhasebe yazılımlarıyla otomatik senkronizasyon.',
    stat: '%100',
    statLabel: 'GİB Uyumluluğu',
    isActive: true,
    sortOrder: 3,
  },
  {
    id: 'feat-cari',
    icon: 'account_balance_wallet',
    title: 'Cari Hesap Takibi',
    description:
      'Müşteri ve tedarikçi borç/alacak durumlarını anlık takip edin. Otomatik ekstre gönderimi ve vadesi geçen alacak uyarılarıyla nakit akışınızı yönetin.',
    stat: '₺0',
    statLabel: 'Geciken Alacak Kaçırmaz',
    isActive: true,
    sortOrder: 4,
  },
  {
    id: 'feat-raporlar',
    icon: 'bar_chart',
    title: 'Gelişmiş Raporlama',
    description:
      'Satış trendleri, en çok satan ürünler, karlılık analizi ve personel performans raporlarını görsel paneller üzerinden anlık izleyin.',
    stat: '40+',
    statLabel: 'Hazır Rapor Şablonu',
    isActive: true,
    sortOrder: 5,
  },
  {
    id: 'feat-sube',
    icon: 'store',
    title: 'Çoklu Şube Yönetimi',
    description:
      'Tüm şubelerinizi tek bir panelden yönetin. Şubeler arası stok transferi, merkezi fiyatlandırma ve konsolide raporlar tek ekranda.',
    stat: 'Sınırsız',
    statLabel: 'Şube Desteği',
    isActive: true,
    sortOrder: 6,
  },
];

const INITIAL_TESTIMONIALS: TestimonialItem[] = [
  {
    id: 'test-001',
    name: 'Mehmet Yılmaz',
    role: 'Kurucu Ortak, Yılmaz Market Zinciri (12 Şube)',
    avatar: 'MY',
    text: '3 yıldır farklı yazılımlarla boğuşuyorduk. ERPv2 ile tüm şubelerimizi tek panelden yönetiyoruz. Stok kayıplarımız %40 azaldı, kasiyerlerimiz ise sistemi iki günde öğrendi.',
    rating: 5,
    isActive: true,
  },
  {
    id: 'test-002',
    name: 'Ayşe Kara',
    role: 'Genel Müdür, Kara Tekstil Toptan',
    avatar: 'AK',
    text: 'e-Fatura entegrasyonu müthiş. Muhasebecimiz artık fatura işlemleri için saatler harcamıyor. Cari hesap modülü sayesinde geciken alacaklarımızı neredeyse sıfırladık.',
    rating: 5,
    isActive: true,
  },
  {
    id: 'test-003',
    name: 'Oğuz Demir',
    role: 'Sahip, Demir Elektronik Mağazaları (4 Şube)',
    avatar: 'OD',
    text: 'Rakip yazılımların yarı fiyatına kurumsal özellikler. Özellikle POS hızı ve barkod okuyucu entegrasyonu beklentilerimin çok üzerinde. Destek ekibi de gerçekten ilgili.',
    rating: 5,
    isActive: true,
  },
];

const INITIAL_CTA: CtaContent = {
  title: 'Bugün Başlayın, Farkı Hissedin',
  description:
    'Kredi kartı gerekmez. 14 günlük ücretsiz deneme süresinde tüm Pro özelliklerine sınırsız erişin. Kurulum 5 dakika.',
  primaryCtaText: '14 Gün Ücretsiz Başla',
  secondaryCtaText: 'Fiyatları Gör',
};

const INITIAL_CONTENT: LandingContent = {
  hero: INITIAL_HERO,
  stats: INITIAL_STATS,
  features: INITIAL_FEATURES,
  testimonials: INITIAL_TESTIMONIALS,
  cta: INITIAL_CTA,
  lastUpdatedAt: '2026-03-11T08:00:00Z',
  updatedBy: 'admin@erpv2.com',
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

@Injectable({
  providedIn: 'root',
})
export class LandingContentService {
  private readonly _content$ = new BehaviorSubject<LandingContent>(
    structuredClone(INITIAL_CONTENT)
  );

  /** Reactive stream of the full landing content. */
  readonly content$ = this._content$.asObservable();

  // ── Getters ────────────────────────────────────────────────────────────────

  getContent(): Observable<LandingContent> {
    return this.content$;
  }

  // ── Hero ───────────────────────────────────────────────────────────────────

  updateHero(req: UpdateHeroRequest): Observable<LandingContent> {
    const current = this._content$.value;
    const updated: LandingContent = {
      ...current,
      hero: { ...current.hero, ...req },
      lastUpdatedAt: nowIso(),
      updatedBy: 'admin@erpv2.com',
    };
    this._content$.next(updated);
    return this.content$;
  }

  // ── Stats ──────────────────────────────────────────────────────────────────

  updateStats(stats: UpdateStatsRequest): Observable<LandingContent> {
    const current = this._content$.value;
    const updated: LandingContent = {
      ...current,
      stats: [...stats],
      lastUpdatedAt: nowIso(),
      updatedBy: 'admin@erpv2.com',
    };
    this._content$.next(updated);
    return this.content$;
  }

  // ── Features ───────────────────────────────────────────────────────────────

  updateFeature(id: string, req: UpdateFeatureRequest): Observable<LandingContent> {
    const current = this._content$.value;
    const features = current.features.map((f) =>
      f.id === id ? { ...f, ...req } : f
    );
    const updated: LandingContent = {
      ...current,
      features,
      lastUpdatedAt: nowIso(),
      updatedBy: 'admin@erpv2.com',
    };
    this._content$.next(updated);
    return this.content$;
  }

  addFeature(feature: Omit<FeatureItem, 'id'>): Observable<LandingContent> {
    const current = this._content$.value;
    const newFeature: FeatureItem = {
      ...feature,
      id: generateId('feat'),
      sortOrder:
        feature.sortOrder ??
        (current.features.length > 0
          ? Math.max(...current.features.map((f) => f.sortOrder)) + 1
          : 1),
    };
    const updated: LandingContent = {
      ...current,
      features: [...current.features, newFeature],
      lastUpdatedAt: nowIso(),
      updatedBy: 'admin@erpv2.com',
    };
    this._content$.next(updated);
    return this.content$;
  }

  deleteFeature(id: string): Observable<LandingContent> {
    const current = this._content$.value;
    const updated: LandingContent = {
      ...current,
      features: current.features.filter((f) => f.id !== id),
      lastUpdatedAt: nowIso(),
      updatedBy: 'admin@erpv2.com',
    };
    this._content$.next(updated);
    return this.content$;
  }

  reorderFeatures(ids: string[]): Observable<LandingContent> {
    const current = this._content$.value;
    const featureMap = new Map(current.features.map((f) => [f.id, f]));
    const reordered: FeatureItem[] = ids
      .filter((id) => featureMap.has(id))
      .map((id, index) => ({ ...featureMap.get(id)!, sortOrder: index + 1 }));

    // Append any features not included in ids at the end (preserving data integrity)
    const includedIds = new Set(ids);
    const remainder = current.features
      .filter((f) => !includedIds.has(f.id))
      .map((f, i) => ({ ...f, sortOrder: reordered.length + i + 1 }));

    const updated: LandingContent = {
      ...current,
      features: [...reordered, ...remainder],
      lastUpdatedAt: nowIso(),
      updatedBy: 'admin@erpv2.com',
    };
    this._content$.next(updated);
    return this.content$;
  }

  // ── Testimonials ───────────────────────────────────────────────────────────

  updateTestimonial(id: string, req: UpdateTestimonialRequest): Observable<LandingContent> {
    const current = this._content$.value;
    const testimonials = current.testimonials.map((t) =>
      t.id === id ? { ...t, ...req } : t
    );
    const updated: LandingContent = {
      ...current,
      testimonials,
      lastUpdatedAt: nowIso(),
      updatedBy: 'admin@erpv2.com',
    };
    this._content$.next(updated);
    return this.content$;
  }

  addTestimonial(t: Omit<TestimonialItem, 'id'>): Observable<LandingContent> {
    const current = this._content$.value;
    const newTestimonial: TestimonialItem = {
      ...t,
      id: generateId('test'),
    };
    const updated: LandingContent = {
      ...current,
      testimonials: [...current.testimonials, newTestimonial],
      lastUpdatedAt: nowIso(),
      updatedBy: 'admin@erpv2.com',
    };
    this._content$.next(updated);
    return this.content$;
  }

  deleteTestimonial(id: string): Observable<LandingContent> {
    const current = this._content$.value;
    const updated: LandingContent = {
      ...current,
      testimonials: current.testimonials.filter((t) => t.id !== id),
      lastUpdatedAt: nowIso(),
      updatedBy: 'admin@erpv2.com',
    };
    this._content$.next(updated);
    return this.content$;
  }

  // ── CTA ────────────────────────────────────────────────────────────────────

  updateCta(req: UpdateCtaRequest): Observable<LandingContent> {
    const current = this._content$.value;
    const updated: LandingContent = {
      ...current,
      cta: { ...current.cta, ...req },
      lastUpdatedAt: nowIso(),
      updatedBy: 'admin@erpv2.com',
    };
    this._content$.next(updated);
    return this.content$;
  }
}

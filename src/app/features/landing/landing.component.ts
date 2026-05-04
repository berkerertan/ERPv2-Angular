import { Component, HostListener, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

interface PricingPlan {
    id: string;
    name: string;
    icon: string;
    description: string;
    monthlyPrice: number;
    annualPrice: number;
    color: string;
    popular: boolean;
    features: { text: string; included: boolean }[];
}

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './landing.component.html',
    styleUrl: './landing.component.css'
})
export class LandingComponent implements OnInit, OnDestroy {
    public authService = inject(AuthService);
    private featureInterval: ReturnType<typeof setInterval> | null = null;
    readonly offlineDownloadUrl = `${environment.apiUrl}/downloads/ERPv2-Offline-Package.zip`;

    isScrolled = signal(false);
    billingAnnual = signal(false);
    activeFeature = signal(0);

    plans: PricingPlan[] = [
        {
            id: 'starter',
            name: 'Başlangıç',
            icon: 'rocket_launch',
            description: 'Tek şubeli küçük işletmeler için ideal başlangıç paketi.',
            monthlyPrice: 299,
            annualPrice: 249,
            color: 'blue',
            popular: false,
            features: [
                { text: '1 şube', included: true },
                { text: '3 kullanıcı', included: true },
                { text: 'POS ve hızlı satış', included: true },
                { text: 'Stok yönetimi', included: true },
                { text: 'Temel raporlar', included: true },
                { text: 'E-posta desteği', included: true },
                { text: 'Cari hesaplar', included: false },
                { text: 'E-Fatura / E-Arşiv', included: false },
                { text: 'Çoklu şube', included: false }
            ]
        },
        {
            id: 'pro',
            name: 'Profesyonel',
            icon: 'workspace_premium',
            description: 'Büyüyen işletmeler için kapsamlı tüm özellikler.',
            monthlyPrice: 699,
            annualPrice: 579,
            color: 'purple',
            popular: true,
            features: [
                { text: '3 şube', included: true },
                { text: '10 kullanıcı', included: true },
                { text: 'POS ve hızlı satış', included: true },
                { text: 'Stok yönetimi', included: true },
                { text: 'Gelişmiş raporlar', included: true },
                { text: 'Öncelikli destek', included: true },
                { text: 'Cari hesaplar', included: true },
                { text: 'E-Fatura / E-Arşiv', included: true },
                { text: 'Çoklu şube', included: false }
            ]
        },
        {
            id: 'enterprise',
            name: 'Kurumsal',
            icon: 'domain',
            description: 'Çok şubeli işletmeler için sınırsız güç ve destek.',
            monthlyPrice: 1499,
            annualPrice: 1249,
            color: 'gold',
            popular: false,
            features: [
                { text: 'Sınırsız şube', included: true },
                { text: 'Sınırsız kullanıcı', included: true },
                { text: 'POS ve hızlı satış', included: true },
                { text: 'Stok yönetimi', included: true },
                { text: 'Gelişmiş raporlar', included: true },
                { text: 'Özel destek hattı', included: true },
                { text: 'Cari hesaplar', included: true },
                { text: 'E-Fatura / E-Arşiv', included: true },
                { text: 'Çoklu şube ve depo', included: true }
            ]
        }
    ];

    features = [
        {
            icon: 'point_of_sale',
            title: 'Hızlı POS Sistemi',
            description: 'Dokunmatik ekran uyumlu, barkod okuyucu destekli hızlı satış. Kasayı saniyeler içinde açın, müşteriyi bekletmeyin.',
            stat: '3x',
            statLabel: 'daha hızlı satış'
        },
        {
            icon: 'inventory_2',
            title: 'Akıllı Stok Yönetimi',
            description: 'Gerçek zamanlı stok takibi, kritik stok uyarıları, stok hareketleri ve çoklu depo desteği.',
            stat: '%40',
            statLabel: 'daha az fire'
        },
        {
            icon: 'receipt_long',
            title: 'E-Fatura ve E-Arşiv',
            description: 'GİB entegrasyonu ile e-fatura ve e-arşiv süreçlerini yöneterek yasal yükümlülüklerinizi kolaylaştırın.',
            stat: '100%',
            statLabel: 'yasal uyumluluk'
        },
        {
            icon: 'people',
            title: 'Cari Hesap Yönetimi',
            description: 'Müşteri ve tedarikçi hesapları, borç/alacak takibi, vade hatırlatmaları ve detaylı hesap ekstresi.',
            stat: '∞',
            statLabel: 'cari kayıt'
        },
        {
            icon: 'bar_chart',
            title: 'Raporlar ve Analiz',
            description: 'Satış, stok, cari ve finans raporlarını tek dashboard üzerinden gerçek zamanlı izleyin.',
            stat: '20+',
            statLabel: 'hazır rapor'
        },
        {
            icon: 'store',
            title: 'Çoklu Şube Yönetimi',
            description: 'Tüm şubelerinizi tek panelden yönetin. Şube bazlı stok, satış ve ekip takibini kolaylaştırın.',
            stat: 'N',
            statLabel: 'sınırsız şube'
        }
    ];

    stats = [
        { value: '1.200+', label: 'Aktif işletme' },
        { value: '850K+', label: 'İşlem / gün' },
        { value: '%99,9', label: 'Çalışma süresi' },
        { value: '4,8/5', label: 'Müşteri puanı' }
    ];

    testimonials = [
        {
            name: 'Ahmet Yılmaz',
            role: 'Market sahibi, İstanbul',
            avatar: 'AY',
            text: 'StokNet sayesinde kasadan stoğa kadar her şeyi tek sistemden yönetiyorum. Aylık ciddi bir iş gücü tasarrufu sağladık.',
            rating: 5
        },
        {
            name: 'Fatma Kaya',
            role: 'Butik sahibi, Ankara',
            avatar: 'FK',
            text: 'E-fatura entegrasyonu çok düzenli çalışıyor. Muhasebe süreçleri hızlandı, ekip olarak daha rahat ilerliyoruz.',
            rating: 5
        },
        {
            name: 'Mehmet Demir',
            role: '3 şubeli eczane, İzmir',
            avatar: 'MD',
            text: 'Çoklu şube özelliği bizim için kritik. Tüm operasyonu tek ekrandan izleyebilmek büyük rahatlık sağlıyor.',
            rating: 5
        }
    ];

    ngOnInit(): void {
        this.featureInterval = setInterval(() => {
            this.activeFeature.update(value => (value + 1) % this.features.length);
        }, 3000);

        this.authService.getSubscriptionPlans().subscribe({
            next: (apiPlans) => {
                const planMap: Record<number, number> = {};
                apiPlans.forEach(plan => {
                    planMap[plan.plan] = plan.monthlyPrice;
                });

                if (planMap[1]) {
                    this.plans[0].monthlyPrice = planMap[1];
                    this.plans[0].annualPrice = Math.round(planMap[1] * 0.83);
                }
                if (planMap[2]) {
                    this.plans[1].monthlyPrice = planMap[2];
                    this.plans[1].annualPrice = Math.round(planMap[2] * 0.83);
                }
                if (planMap[3]) {
                    this.plans[2].monthlyPrice = planMap[3];
                    this.plans[2].annualPrice = Math.round(planMap[3] * 0.83);
                }
            },
            error: () => {
                // API yanıt vermezse ekrandaki varsayılan planlar kullanılmaya devam eder.
            }
        });
    }

    @HostListener('window:scroll')
    onScroll(): void {
        this.isScrolled.set(window.scrollY > 60);
    }

    getPrice(plan: PricingPlan): number {
        return this.billingAnnual() ? plan.annualPrice : plan.monthlyPrice;
    }

    scrollTo(section: string): void {
        document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' });
    }

    getPanelRoute(): string {
        return this.authService.getDefaultPanelRoute();
    }

    logout(): void {
        this.authService.logout();
    }

    ngOnDestroy(): void {
        if (this.featureInterval) {
            clearInterval(this.featureInterval);
        }
    }
}

import { Component, signal, HostListener, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './landing.component.html',
    styleUrl: './landing.component.css'
})
export class LandingComponent implements OnInit, OnDestroy {
    public authService = inject(AuthService);
    private _featureInterval: any = null;
    readonly offlineDownloadUrl = `${environment.apiUrl}/downloads/StokNet-Offline-Package.zip`;

    isScrolled = signal(false);
    billingAnnual = signal(false);
    activeFeature = signal(0);

    plans = [
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
                { text: '1 Şube', included: true },
                { text: '3 Kullanıcı', included: true },
                { text: 'POS & Hızlı Satış', included: true },
                { text: 'Stok Yönetimi', included: true },
                { text: 'Temel Raporlar', included: true },
                { text: 'E-posta Desteği', included: true },
                { text: 'Cari Hesaplar', included: false },
                { text: 'E-Fatura / E-Arşiv', included: false },
                { text: 'Çoklu Şube', included: false },
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
                { text: '3 Şube', included: true },
                { text: '10 Kullanıcı', included: true },
                { text: 'POS & Hızlı Satış', included: true },
                { text: 'Stok Yönetimi', included: true },
                { text: 'Gelişmiş Raporlar', included: true },
                { text: 'Öncelikli Destek', included: true },
                { text: 'Cari Hesaplar', included: true },
                { text: 'E-Fatura / E-Arşiv', included: true },
                { text: 'Çoklu Şube', included: false },
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
                { text: 'Sınırsız Şube', included: true },
                { text: 'Sınırsız Kullanıcı', included: true },
                { text: 'POS & Hızlı Satış', included: true },
                { text: 'Stok Yönetimi', included: true },
                { text: 'Gelişmiş Raporlar', included: true },
                { text: 'Dedike Destek Hattı', included: true },
                { text: 'Cari Hesaplar', included: true },
                { text: 'E-Fatura / E-Arşiv', included: true },
                { text: 'Çoklu Şube & Depo', included: true },
            ]
        }
    ];

    features = [
        {
            icon: 'point_of_sale',
            title: 'Hızlı POS Sistemi',
            description: 'Dokunmatik ekran uyumlu, barkod okuyucu destekli hızlı satış. Kasayı saniyeler içinde açın, müşteri bekletmeyin.',
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
            title: 'E-Fatura & E-Arşiv',
            description: 'GİB entegrasyonu ile e-fatura ve e-arşiv fatura kesme. Yasal yükümlülüklerinizi otomatik karşılayın.',
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
            title: 'Raporlar & Analiz',
            description: 'Satış, stok, cari ve finans raporları. Gerçek zamanlı dashboard ile işletmenizi anlık izleyin.',
            stat: '20+',
            statLabel: 'hazır rapor'
        },
        {
            icon: 'store',
            title: 'Çoklu Şube Yönetimi',
            description: 'Tüm şubelerinizi tek panelden yönetin. Şube bazlı stok, satış ve personel takibi.',
            stat: 'N',
            statLabel: 'sınırsız şube'
        }
    ];

    stats = [
        { value: '1.200+', label: 'Aktif İşletme' },
        { value: '850K+', label: 'İşlem/Gün' },
        { value: '%99.9', label: 'Çalışma Süresi' },
        { value: '4.8/5', label: 'Müşteri Puanı' }
    ];

    testimonials = [
        {
            name: 'Ahmet Yılmaz',
            role: 'Market Sahibi, İstanbul',
            avatar: 'AY',
            text: 'StokNet sayesinde kasadan stoğa kadar her şeyi tek sistemden yönetiyorum. Aylık 15 saat iş gücü tasarrufu sağladım.',
            rating: 5
        },
        {
            name: 'Fatma Kaya',
            role: 'Butik Sahibi, Ankara',
            avatar: 'FK',
            text: 'E-fatura entegrasyonu mükemmel çalışıyor. Muhasebecim artık her şeyi sistemden alıyor, kafam çok rahatladı.',
            rating: 5
        },
        {
            name: 'Mehmet Demir',
            role: '3 Şubeli Eczane, İzmir',
            avatar: 'MD',
            text: 'Çoklu şube özelliği benim için vazgeçilmez. Tüm eczanelerimi tek ekrandan takip ediyorum.',
            rating: 5
        }
    ];

    ngOnInit() {
        this._featureInterval = setInterval(() => {
            this.activeFeature.update(v => (v + 1) % this.features.length);
        }, 3000);

        // Fetch real plan prices from API
        this.authService.getSubscriptionPlans().subscribe({
            next: (apiPlans) => {
                const planMap: Record<number, number> = {};
                apiPlans.forEach(p => planMap[p.plan] = p.monthlyPrice);
                // Update plans with API prices: plan enum 1=starter, 2=pro, 3=enterprise
                if (planMap[1]) { this.plans[0].monthlyPrice = planMap[1]; this.plans[0].annualPrice = Math.round(planMap[1] * 0.83); }
                if (planMap[2]) { this.plans[1].monthlyPrice = planMap[2]; this.plans[1].annualPrice = Math.round(planMap[2] * 0.83); }
                if (planMap[3]) { this.plans[2].monthlyPrice = planMap[3]; this.plans[2].annualPrice = Math.round(planMap[3] * 0.83); }
            },
            error: () => {} // Keep fallback prices on error
        });
    }

    @HostListener('window:scroll')
    onScroll() {
        this.isScrolled.set(window.scrollY > 60);
    }

    getPrice(plan: typeof this.plans[0]): number {
        return this.billingAnnual() ? plan.annualPrice : plan.monthlyPrice;
    }

    getSavings(plan: typeof this.plans[0]): number {
        return Math.round(((plan.monthlyPrice - plan.annualPrice) / plan.monthlyPrice) * 100);
    }

    scrollTo(section: string) {
        document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' });
    }

    getPanelRoute(): string {
        return this.authService.getDefaultPanelRoute();
    }

    logout(): void {
        this.authService.logout();
    }

    ngOnDestroy(): void {
        if (this._featureInterval) clearInterval(this._featureInterval);
    }
}

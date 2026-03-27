import { Component, signal, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { CariDebtItemsComponent } from '../../../../shared/components/cari-debt-items/cari-debt-items.component';

export interface SupplierPurchase {
    id: string;
    productName: string;
    barcode: string;
    category: string;
    quantity: number;
    listPrice: number;
    purchasePrice: number; // alış fiyatı (KDV hariç)
    disc1: number;         // iskonto 1 %
    disc2: number;         // iskonto 2 %
    disc3: number;         // iskonto 3 %
    kdvRate: number;       // KDV %
    payment: number;
    date: string;
    status: 'Received' | 'Pending' | 'Cancelled';
    selected?: boolean;
}

interface QuickAddRow {
    productName: string;
    barcode: string;
    category: string;
    quantity: number;
    listPrice: number;
    purchasePrice: number;
    disc1: number;
    disc2: number;
    disc3: number;
    kdvRate: number;
    date: string;
    status: 'Received' | 'Pending' | 'Cancelled';
}

@Component({
    selector: 'app-supplier-detail',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, CariDebtItemsComponent],
    templateUrl: './supplier-detail.component.html',
    styleUrls: ['./supplier-detail.component.css', '../../../../shared/styles/crud-page.css']
})
export class SupplierDetailComponent implements OnInit {
    supplierId = '';
    searchTerm = '';
    activeTab = signal<'all' | 'Received' | 'Pending' | 'Cancelled'>('all');

    supplier = signal<any>(null);
    purchases = signal<SupplierPurchase[]>([]);
    private navAccount: any = null;
    allSelected = false;
    editingCell = signal<{ id: string; field: string } | null>(null);

    quickAddRows = signal<QuickAddRow[]>([
        this.emptyRow(), this.emptyRow(), this.emptyRow()
    ]);

    showBulkAddModal = signal(false);
    bulkAddText = '';

    // ── Demo supplier GUIDs (seed pattern)
    private readonly S1 = '00000003-0000-0000-0000-000000000001';
    private readonly S2 = '00000003-0000-0000-0000-000000000002';
    private readonly S3 = '00000003-0000-0000-0000-000000000003';
    private readonly S4 = '00000003-0000-0000-0000-000000000004';
    private readonly S5 = '00000003-0000-0000-0000-000000000005';
    private readonly S6 = '00000003-0000-0000-0000-000000000006';
    private readonly S7 = '00000003-0000-0000-0000-000000000007';
    private readonly S8 = '00000003-0000-0000-0000-000000000008';

    private get suppliersData(): Record<string, any> {
        return {
            [this.S1]: { id: this.S1, name: 'Apple Türkiye Ltd. Şti.',                   phone: '0850 200 2753', email: 'b2b@apple.com.tr',            address: 'Levent Mah., Beşiktaş', taxNumber: '1234567890', city: 'İstanbul', isActive: true },
            [this.S2]: { id: this.S2, name: 'Samsung Electronics Türkiye A.Ş.',           phone: '0850 222 7267', email: 'tedarik@samsung.com.tr',       address: 'Ümraniye Mah., Ümraniye', taxNumber: '9876543210', city: 'İstanbul', isActive: true },
            [this.S3]: { id: this.S3, name: 'LG Electronics Türkiye A.Ş.',                phone: '0850 333 5454', email: 'b2b@lg.com.tr',                address: 'Kavacık Mah., Beykoz',    taxNumber: '1122334455', city: 'İstanbul', isActive: true },
            [this.S4]: { id: this.S4, name: 'Bosch Türkiye A.Ş.',                         phone: '0850 222 6724', email: 'tedarik@bosch.com.tr',         address: 'Çerkezköy, Tekirdağ',     taxNumber: '5566778899', city: 'Tekirdağ', isActive: true },
            [this.S5]: { id: this.S5, name: 'HP Türkiye A.Ş.',                            phone: '0850 266 6000', email: 'b2b@hp.com.tr',                address: 'Levent, Beşiktaş',        taxNumber: '2233445566', city: 'İstanbul', isActive: true },
            [this.S6]: { id: this.S6, name: 'Sony Avrupa Türkiye Şb.',                    phone: '0850 222 7669', email: 'tedarik@sony.com.tr',           address: 'Sarıyer, İstanbul',        taxNumber: '3344556677', city: 'İstanbul', isActive: true },
            [this.S7]: { id: this.S7, name: 'Dyson Teknoloji Ltd.',                        phone: '0850 333 9766', email: 'b2b@dyson.com.tr',             address: 'Şişli, İstanbul',          taxNumber: '4455667788', city: 'İstanbul', isActive: true },
            [this.S8]: { id: this.S8, name: 'Dell Technologies Türkiye A.Ş.',             phone: '0850 800 3355', email: 'b2b@dell.com.tr',              address: 'Maslak, Sarıyer',          taxNumber: '6677889900', city: 'İstanbul', isActive: true },
        };
    }

    private get purchasesBySupplier(): Record<string, SupplierPurchase[]> {
        return {
            [this.S1]: [
                { id: 'r1', productName: 'Apple iPhone 15 Pro 256GB',        barcode: '1901995205005', category: 'Akıllı Telefon',     quantity: 20, listPrice: 64999, purchasePrice: 48500, disc1: 3, disc2: 2, disc3: 0, kdvRate: 20, payment: 1078560, date: '2026-01-05', status: 'Received' },
                { id: 'r2', productName: 'Apple iPhone 15 Plus 256GB',       barcode: '1901995205010', category: 'Akıllı Telefon',     quantity: 15, listPrice: 54999, purchasePrice: 41000, disc1: 3, disc2: 2, disc3: 0, kdvRate: 20, payment: 686880,  date: '2026-01-05', status: 'Received' },
                { id: 'r3', productName: 'Apple MacBook Pro M3 14" 512GB',  barcode: '1901995512012', category: 'Dizüstü Bilgisayar', quantity:  8, listPrice: 84999, purchasePrice: 64000, disc1: 4, disc2: 2, disc3: 1, kdvRate: 20, payment: 563645,  date: '2026-01-05', status: 'Received' },
                { id: 'r4', productName: 'Apple iPad Pro 13" M2 WiFi 256GB',barcode: '1901995309009', category: 'Tablet',             quantity: 12, listPrice: 42999, purchasePrice: 32000, disc1: 3, disc2: 0, disc3: 0, kdvRate: 20, payment: 446054,  date: '2026-02-07', status: 'Received' },
                { id: 'r5', productName: 'Apple Watch Ultra 2 49mm',         barcode: '1901995827027', category: 'Akıllı Saat',        quantity: 10, listPrice: 24999, purchasePrice: 18000, disc1: 5, disc2: 0, disc3: 0, kdvRate: 20, payment:      0,  date: '2026-02-07', status: 'Pending'  },
                { id: 'r6', productName: 'Apple AirPods Pro 2. Nesil',       barcode: '1901995900001', category: 'Ses Sistemleri',     quantity: 25, listPrice: 12999, purchasePrice:  9500, disc1: 3, disc2: 2, disc3: 0, kdvRate: 20, payment: 253152,  date: '2026-02-20', status: 'Received' },
                { id: 'r7', productName: 'Apple iPhone 15 Pro 256GB',        barcode: '1901995205005', category: 'Akıllı Telefon',     quantity: 30, listPrice: 64999, purchasePrice: 49000, disc1: 3, disc2: 2, disc3: 0, kdvRate: 20, payment:      0,  date: '2026-03-10', status: 'Pending'  },
                { id: 'r8', productName: 'Apple MacBook Air M2 256GB',       barcode: '1901995513013', category: 'Dizüstü Bilgisayar', quantity:  5, listPrice: 52999, purchasePrice: 38000, disc1: 4, disc2: 1, disc3: 0, kdvRate: 20, payment: 208819,  date: '2026-03-10', status: 'Received' },
            ],
            [this.S2]: [
                { id: 'r1', productName: 'Samsung Galaxy S24 Ultra 512GB',   barcode: '8806094206006', category: 'Akıllı Telefon',     quantity: 18, listPrice: 51999, purchasePrice: 38500, disc1: 4, disc2: 2, disc3: 0, kdvRate: 20, payment: 759715,  date: '2026-01-08', status: 'Received' },
                { id: 'r2', productName: 'Samsung 65" Neo QLED 4K',          barcode: '8806094101001', category: 'TV & Görüntü',       quantity:  8, listPrice: 29900, purchasePrice: 21500, disc1: 3, disc2: 2, disc3: 0, kdvRate: 20, payment: 385258,  date: '2026-01-08', status: 'Received' },
                { id: 'r3', productName: 'Samsung Galaxy Watch 6 Classic',   barcode: '8806094826026', category: 'Akıllı Saat',        quantity: 15, listPrice:  8299, purchasePrice:  5900, disc1: 5, disc2: 0, disc3: 0, kdvRate: 20, payment:  94932,  date: '2026-01-08', status: 'Received' },
                { id: 'r4', productName: 'Samsung Galaxy Tab S9 Ultra',      barcode: '8806094310010', category: 'Tablet',             quantity: 10, listPrice: 34999, purchasePrice: 25000, disc1: 3, disc2: 2, disc3: 0, kdvRate: 20, payment: 282240,  date: '2026-02-15', status: 'Received' },
                { id: 'r5', productName: 'Samsung Galaxy S24 Ultra 512GB',   barcode: '8806094206006', category: 'Akıllı Telefon',     quantity: 25, listPrice: 51999, purchasePrice: 39000, disc1: 4, disc2: 2, disc3: 0, kdvRate: 20, payment:      0,  date: '2026-03-12', status: 'Pending'  },
                { id: 'r6', productName: 'Samsung 85" Neo QLED 8K',          barcode: '8806094102002', category: 'TV & Görüntü',       quantity:  4, listPrice: 74900, purchasePrice: 52000, disc1: 5, disc2: 2, disc3: 0, kdvRate: 20, payment: 232243,  date: '2026-03-12', status: 'Received' },
            ],
            [this.S3]: [
                { id: 'r1', productName: 'LG 55" OLED evo C3 4K Smart TV',  barcode: '8806091102002', category: 'TV & Görüntü',       quantity:  6, listPrice: 37900, purchasePrice: 26500, disc1: 4, disc2: 1, disc3: 0, kdvRate: 20, payment: 183082,  date: '2026-01-10', status: 'Received' },
                { id: 'r2', productName: 'LG 65" OLED evo G3 4K',           barcode: '8806091103003', category: 'TV & Görüntü',       quantity:  4, listPrice: 54900, purchasePrice: 38000, disc1: 4, disc2: 2, disc3: 0, kdvRate: 20, payment: 169011,  date: '2026-01-10', status: 'Received' },
                { id: 'r3', productName: 'LG 600L No-Frost Buzdolabı',       barcode: '8806091819019', category: 'Beyaz Eşya',         quantity:  8, listPrice: 21900, purchasePrice: 14500, disc1: 3, disc2: 2, disc3: 1, kdvRate: 20, payment: 125323,  date: '2026-02-18', status: 'Received' },
                { id: 'r4', productName: 'LG 9kg Çamaşır Makinesi A+++',    barcode: '8806091820020', category: 'Beyaz Eşya',         quantity:  6, listPrice: 18900, purchasePrice: 12800, disc1: 3, disc2: 0, disc3: 0, kdvRate: 20, payment:      0,  date: '2026-03-05', status: 'Pending'  },
            ],
            [this.S4]: [
                { id: 'r1', productName: 'Bosch 10kg Çamaşır Makinesi A+++',barcode: '4242002820020', category: 'Beyaz Eşya',         quantity: 10, listPrice: 16499, purchasePrice: 11200, disc1: 4, disc2: 2, disc3: 0, kdvRate: 20, payment: 254419,  date: '2026-01-15', status: 'Received' },
                { id: 'r2', productName: 'Bosch 9kg Kurutma Makinesi',       barcode: '4242002821021', category: 'Beyaz Eşya',         quantity:  6, listPrice: 19900, purchasePrice: 13500, disc1: 4, disc2: 1, disc3: 0, kdvRate: 20, payment: 88416,   date: '2026-01-15', status: 'Received' },
                { id: 'r3', productName: 'Bosch SMV4ECX26E Bulaşık Makinesi',barcode: '4242002822022', category: 'Beyaz Eşya',         quantity:  8, listPrice: 14999, purchasePrice:  9800, disc1: 3, disc2: 2, disc3: 0, kdvRate: 20, payment:      0,  date: '2026-02-25', status: 'Pending'  },
            ],
            [this.S5]: [
                { id: 'r1', productName: 'HP Spectre x360 14" i7 32GB',     barcode: '1942930715015', category: 'Dizüstü Bilgisayar', quantity:  5, listPrice: 51999, purchasePrice: 37000, disc1: 5, disc2: 2, disc3: 0, kdvRate: 20, payment: 205992,  date: '2026-01-20', status: 'Received' },
                { id: 'r2', productName: 'HP EliteBook 840 G10 i7 16GB',    barcode: '1942930716016', category: 'Dizüstü Bilgisayar', quantity:  8, listPrice: 46999, purchasePrice: 33000, disc1: 5, disc2: 2, disc3: 1, kdvRate: 20, payment: 280742,  date: '2026-01-20', status: 'Received' },
                { id: 'r3', productName: 'HP LaserJet Pro M404dn Yazıcı',   barcode: '1942930900001', category: 'Ofis Ekipmanı',      quantity: 12, listPrice:  8499, purchasePrice:  5800, disc1: 4, disc2: 0, disc3: 0, kdvRate: 20, payment:  79834,  date: '2026-02-10', status: 'Received' },
                { id: 'r4', productName: 'HP Spectre x360 14" i7 32GB',     barcode: '1942930715015', category: 'Dizüstü Bilgisayar', quantity:  6, listPrice: 51999, purchasePrice: 37500, disc1: 5, disc2: 2, disc3: 0, kdvRate: 20, payment:      0,  date: '2026-03-08', status: 'Pending'  },
            ],
            [this.S6]: [
                { id: 'r1', productName: 'Sony WH-1000XM5 Kablosuz Kulaklık',barcode:'4548736816016', category: 'Ses Sistemleri',     quantity: 20, listPrice:  8999, purchasePrice:  6000, disc1: 5, disc2: 2, disc3: 0, kdvRate: 20, payment: 133344,  date: '2026-01-25', status: 'Received' },
                { id: 'r2', productName: 'Sony 75" BRAVIA XR X95L 8K',      barcode: '4548736103003', category: 'TV & Görüntü',       quantity:  3, listPrice: 57900, purchasePrice: 40000, disc1: 4, disc2: 2, disc3: 0, kdvRate: 20, payment: 135475,  date: '2026-01-25', status: 'Received' },
                { id: 'r3', productName: 'Sony WF-1000XM5 TWS Kulaklık',    barcode: '4548736900001', category: 'Ses Sistemleri',     quantity: 15, listPrice:  6299, purchasePrice:  4200, disc1: 5, disc2: 0, disc3: 0, kdvRate: 20, payment:  71442,  date: '2026-02-28', status: 'Received' },
                { id: 'r4', productName: 'Sony A7 IV Aynasız Fotoğraf Makinesi',barcode:'4548736900002',category: 'Fotoğraf',        quantity:  4, listPrice: 89900, purchasePrice: 62000, disc1: 3, disc2: 2, disc3: 0, kdvRate: 20, payment:      0,  date: '2026-03-15', status: 'Pending'  },
            ],
            [this.S7]: [
                { id: 'r1', productName: 'Dyson V15 Detect Süpürge',         barcode: '5025155023023', category: 'Küçük Ev Aletleri', quantity: 10, listPrice: 14499, purchasePrice:  9500, disc1: 4, disc2: 2, disc3: 0, kdvRate: 20, payment: 105523,  date: '2026-02-02', status: 'Received' },
                { id: 'r2', productName: 'Dyson Airwrap Stil Cihazı',        barcode: '5025155900001', category: 'Küçük Ev Aletleri', quantity:  8, listPrice: 17999, purchasePrice: 11500, disc1: 4, disc2: 1, disc3: 0, kdvRate: 20, payment:      0,  date: '2026-02-02', status: 'Pending'  },
                { id: 'r3', productName: 'Dyson V12 Detect Slim',            barcode: '5025155900002', category: 'Küçük Ev Aletleri', quantity:  6, listPrice: 11999, purchasePrice:  7800, disc1: 4, disc2: 2, disc3: 0, kdvRate: 20, payment:  51770,  date: '2026-03-02', status: 'Received' },
            ],
            [this.S8]: [
                { id: 'r1', productName: 'Dell XPS 15 i7 32GB 1TB',         barcode: '8841160513013', category: 'Dizüstü Bilgisayar', quantity:  6, listPrice: 74999, purchasePrice: 54000, disc1: 4, disc2: 2, disc3: 0, kdvRate: 20, payment: 360576,  date: '2026-01-12', status: 'Received' },
                { id: 'r2', productName: 'Dell Latitude 5540 i5 16GB',       barcode: '8841160900001', category: 'Dizüstü Bilgisayar', quantity: 10, listPrice: 38999, purchasePrice: 27000, disc1: 5, disc2: 2, disc3: 0, kdvRate: 20, payment: 302976,  date: '2026-01-12', status: 'Received' },
                { id: 'r3', productName: 'Dell UltraSharp 27" 4K Monitor',   barcode: '8841160900002', category: 'Monitör',            quantity: 12, listPrice: 21999, purchasePrice: 14500, disc1: 4, disc2: 2, disc3: 0, kdvRate: 20, payment:      0,  date: '2026-02-20', status: 'Pending'  },
                { id: 'r4', productName: 'Dell XPS 15 i9 64GB 2TB',         barcode: '8841160513014', category: 'Dizüstü Bilgisayar', quantity:  4, listPrice: 98999, purchasePrice: 72000, disc1: 4, disc2: 2, disc3: 1, kdvRate: 20, payment: 297288,  date: '2026-03-07', status: 'Received' },
            ],
        };
    }

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private location: Location
    ) {
        // Navigation state'i constructor'da oku (ngOnInit'ten önce erişilebilir)
        const state = this.location.getState() as any;
        if (state?.account) {
            this.navAccount = state.account;
        }
    }

    ngOnInit(): void {
        this.supplierId = this.route.snapshot.paramMap.get('id') || '';

        // 1) Demo verisi ile eşleşiyorsa onu kullan
        const demoData = this.suppliersData[this.supplierId];
        if (demoData) {
            this.supplier.set(demoData);
            this.purchases.set([...(this.purchasesBySupplier[this.supplierId] || [])]);
            return;
        }

        // 2) Tedarikçiler listesinden navigation state ile geldiyse (API tedarikçileri)
        if (this.navAccount) {
            this.supplier.set({
                ...this.navAccount,
                email: this.navAccount.email || '',
                phone: this.navAccount.phone || '',
                city: this.navAccount.city || '',
                taxNumber: this.navAccount.taxNumber || '',
                isActive: this.navAccount.isActive !== false
            });
            this.purchases.set([]);
            return;
        }

        // 3) Hiçbiri yoksa listeye geri dön
        this.router.navigate(['/cari-accounts/suppliers']);
    }

    // ── Calculations ─────────────────────────────────────
    calcNetUnit(p: SupplierPurchase): number {
        return p.purchasePrice
            * (1 - p.disc1 / 100)
            * (1 - p.disc2 / 100)
            * (1 - p.disc3 / 100);
    }

    calcNetUnitWithKdv(p: SupplierPurchase): number {
        return this.calcNetUnit(p) * (1 + p.kdvRate / 100);
    }

    calcTotal(p: SupplierPurchase): number {
        return p.quantity * this.calcNetUnitWithKdv(p);
    }

    calcKdvAmount(p: SupplierPurchase): number {
        return p.quantity * this.calcNetUnit(p) * (p.kdvRate / 100);
    }

    calcRemaining(p: SupplierPurchase): number {
        return Math.max(0, this.calcTotal(p) - p.payment);
    }

    // ── Keyboard Shortcuts ───────────────────────────────
    @HostListener('document:keydown', ['$event'])
    handleKeyboard(e: KeyboardEvent): void {
        if (e.ctrlKey && e.key === 'v' && !this.isInInput(e)) {
            this.showBulkAddModal.set(true);
            e.preventDefault();
        }
        if (e.key === 'Escape') {
            this.editingCell.set(null);
            this.showBulkAddModal.set(false);
        }
        if (e.ctrlKey && e.key === 'a' && !this.isInInput(e)) {
            e.preventDefault();
            this.toggleSelectAll();
        }
        if (e.key === 'Delete' && !this.isInInput(e) && this.selectedCount > 0) {
            this.bulkDelete();
        }
    }

    private isInInput(e: KeyboardEvent): boolean {
        const tag = (e.target as HTMLElement)?.tagName;
        return tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';
    }

    // ── Filters ──────────────────────────────────────────
    get filteredPurchases(): SupplierPurchase[] {
        let items = this.purchases();
        const tab = this.activeTab();
        if (tab !== 'all') items = items.filter(p => p.status === tab);
        const term = this.searchTerm.toLowerCase();
        if (term) items = items.filter(p =>
            p.productName.toLowerCase().includes(term) ||
            p.barcode.includes(term) ||
            p.category.toLowerCase().includes(term)
        );
        return items;
    }

    // ── Stats ────────────────────────────────────────────
    get totalCount()    { return this.purchases().length; }
    get receivedCount() { return this.purchases().filter(p => p.status === 'Received').length; }
    get pendingCount()  { return this.purchases().filter(p => p.status === 'Pending').length; }
    get totalAmount()   { return this.purchases().reduce((s, p) => s + this.calcTotal(p), 0); }
    get totalKdv()      { return this.purchases().reduce((s, p) => s + this.calcKdvAmount(p), 0); }
    get selectedCount() { return this.purchases().filter(p => p.selected).length; }
    get selectedTotal() { return this.purchases().filter(p => p.selected).reduce((s, p) => s + this.calcTotal(p), 0); }

    getStatusBadge(s: string) {
        switch (s) {
            case 'Received':  return 'badge-success';
            case 'Pending':   return 'badge-warning';
            case 'Cancelled': return 'badge-danger';
            default: return '';
        }
    }

    getStatusLabel(s: string) {
        switch (s) {
            case 'Received':  return 'Teslim Alındı';
            case 'Pending':   return 'Beklemede';
            case 'Cancelled': return 'İptal';
            default: return s;
        }
    }

    // ── Selection ────────────────────────────────────────
    toggleSelectAll(): void {
        this.allSelected = !this.allSelected;
        const ids = new Set(this.filteredPurchases.map(p => p.id));
        this.purchases.update(items => items.map(p =>
            ids.has(p.id) ? { ...p, selected: this.allSelected } : p
        ));
    }

    toggleSelect(id: string): void {
        this.purchases.update(items => items.map(p =>
            p.id === id ? { ...p, selected: !p.selected } : p
        ));
        this.allSelected = this.filteredPurchases.every(p => p.selected);
    }

    clearSelection(): void {
        this.allSelected = false;
        this.purchases.update(items => items.map(p => ({ ...p, selected: false })));
    }

    // ── Inline Editing ───────────────────────────────────
    startEdit(id: string, field: string): void {
        this.editingCell.set({ id, field });
    }

    isEditing(id: string, field: string): boolean {
        const cell = this.editingCell();
        return cell !== null && cell.id === id && cell.field === field;
    }

    onCellBlur(): void { this.editingCell.set(null); }

    onCellKeydown(e: KeyboardEvent, id: string, field: string): void {
        if (e.key === 'Enter') { e.preventDefault(); this.onCellBlur(); }
        if (e.key === 'Tab') {
            const fields = ['productName', 'barcode', 'category', 'quantity', 'purchasePrice', 'disc1', 'disc2', 'disc3', 'kdvRate'];
            const idx = fields.indexOf(field);
            if (idx < fields.length - 1) { e.preventDefault(); this.editingCell.set({ id, field: fields[idx + 1] }); }
        }
        if (e.key === 'Escape') { this.editingCell.set(null); }
    }

    // ── Quick Add Rows ───────────────────────────────────
    emptyRow(): QuickAddRow {
        return {
            productName: '', barcode: '', category: '', quantity: 1,
            listPrice: 0, purchasePrice: 0, disc1: 0, disc2: 0, disc3: 0, kdvRate: 20,
            date: new Date().toISOString().split('T')[0], status: 'Pending'
        };
    }

    commitQuickRow(index: number): void {
        const rows = this.quickAddRows();
        const row = rows[index];
        if (!row.productName.trim()) return;

        const newItem: SupplierPurchase = {
            id: 'r' + Date.now() + index,
            ...row,
            payment: 0,
        };
        this.purchases.update(items => [...items, newItem]);
        this.quickAddRows.update(r => {
            const updated = [...r];
            updated[index] = this.emptyRow();
            while (updated.length < 3) updated.push(this.emptyRow());
            return updated;
        });
    }

    onQuickRowKeydown(e: KeyboardEvent, index: number): void {
        if (e.key === 'Enter') { e.preventDefault(); this.commitQuickRow(index); }
    }

    addMoreQuickRows(): void {
        this.quickAddRows.update(r => [...r, this.emptyRow(), this.emptyRow(), this.emptyRow()]);
    }

    removeQuickRow(index: number): void {
        this.quickAddRows.update(r => {
            const updated = r.filter((_, i) => i !== index);
            if (updated.length < 3) updated.push(this.emptyRow());
            return updated;
        });
    }

    commitAllQuickRows(): void {
        const validRows = this.quickAddRows().filter(r => r.productName.trim());
        if (!validRows.length) return;
        const newItems: SupplierPurchase[] = validRows.map((r, i) => ({
            id: 'r' + Date.now() + i,
            ...r,
            payment: 0,
        }));
        this.purchases.update(items => [...items, ...newItems]);
        this.quickAddRows.set([this.emptyRow(), this.emptyRow(), this.emptyRow()]);
    }

    get filledQuickRowCount(): number {
        return this.quickAddRows().filter(r => r.productName.trim()).length;
    }

    // ── Bulk Paste ───────────────────────────────────────
    processPaste(): void {
        if (!this.bulkAddText.trim()) return;
        const lines = this.bulkAddText.trim().split('\n');
        const newItems: SupplierPurchase[] = [];

        for (const line of lines) {
            const cols = line.includes('\t') ? line.split('\t') : line.split(';');
            if (cols.length < 2) continue;
            const name = cols[0]?.trim() || '';
            const barcode = cols[1]?.trim() || '';
            const category = cols[2]?.trim() || '';
            const qty = parseFloat(cols[3]?.trim()) || 1;
            const price = parseFloat(cols[4]?.trim()) || 0;
            const disc1 = parseFloat(cols[5]?.trim()) || 0;
            const disc2 = parseFloat(cols[6]?.trim()) || 0;
            const disc3 = parseFloat(cols[7]?.trim()) || 0;
            const kdv  = parseFloat(cols[8]?.trim()) || 20;

            if (name) {
                newItems.push({
                    id: 'r' + Date.now() + newItems.length,
                    productName: name, barcode, category, quantity: qty,
                    listPrice: price, purchasePrice: price,
                    disc1, disc2, disc3, kdvRate: kdv,
                    payment: 0,
                    date: new Date().toISOString().split('T')[0],
                    status: 'Pending'
                });
            }
        }

        if (newItems.length) this.purchases.update(items => [...items, ...newItems]);
        this.bulkAddText = '';
        this.showBulkAddModal.set(false);
    }

    // ── Bulk Actions ─────────────────────────────────────
    bulkDelete(): void {
        this.purchases.update(items => items.filter(p => !p.selected));
        this.allSelected = false;
    }

    bulkMarkReceived(): void {
        this.purchases.update(items => items.map(p =>
            p.selected ? { ...p, status: 'Received' as const, selected: false } : p
        ));
        this.allSelected = false;
    }

    bulkCancel(): void {
        this.purchases.update(items => items.map(p =>
            p.selected ? { ...p, status: 'Cancelled' as const, selected: false } : p
        ));
        this.allSelected = false;
    }

    // ── Single Actions ───────────────────────────────────
    removePurchase(id: string): void {
        this.purchases.update(items => items.filter(p => p.id !== id));
    }

    markReceived(id: string): void {
        this.purchases.update(items => items.map(p =>
            p.id === id ? { ...p, status: 'Received' as const } : p
        ));
    }

    cancelPurchase(id: string): void {
        this.purchases.update(items => items.map(p =>
            p.id === id ? { ...p, status: 'Cancelled' as const } : p
        ));
    }

    duplicatePurchase(p: SupplierPurchase): void {
        const dup: SupplierPurchase = {
            ...p, id: 'r' + Date.now(), selected: false,
            date: new Date().toISOString().split('T')[0], status: 'Pending'
        };
        this.purchases.update(items => [...items, dup]);
    }

    goBack(): void {
        this.router.navigate(['/cari-accounts/suppliers']);
    }

    readonly kdvOptions = [0, 1, 10, 20];
}

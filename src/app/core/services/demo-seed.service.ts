import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CompanyService } from './company.service';
import { BranchService } from './branch.service';
import { WarehouseService } from './warehouse.service';
import { ProductService } from './product.service';
import { CariAccountService } from './cari-account.service';
import { SalesOrderService } from './sales-order.service';
import { PurchaseOrderService } from './purchase-order.service';
import { StockMovementService } from './stock-movement.service';
import { FinanceMovementService } from './finance-movement.service';
import { InvoiceService } from './invoice.service';
import { CariType } from '../models/cari-account.model';
import { StockMovementType } from '../models/stock-movement.model';
import { FinanceMovementType } from '../models/finance-movement.model';
import { InvoiceType, InvoiceCategory } from '../models/invoice.model';

@Injectable({ providedIn: 'root' })
export class DemoSeedService {
    readonly isSeeding = signal(false);
    readonly seedProgress = signal(0);
    readonly seedStep = signal('');

    private company = inject(CompanyService);
    private branch = inject(BranchService);
    private warehouse = inject(WarehouseService);
    private product = inject(ProductService);
    private cari = inject(CariAccountService);
    private so = inject(SalesOrderService);
    private po = inject(PurchaseOrderService);
    private sm = inject(StockMovementService);
    private fm = inject(FinanceMovementService);
    private inv = inject(InvoiceService);

    /** Demo kullanıcısı için seed gerekiyorsa çalıştırır */
    async seedIfNeeded(): Promise<void> {
        try {
            const products = await firstValueFrom(this.product.getAll({ pageSize: 1 }));
            // 10+ ürün varsa zaten seed tamamlanmış
            if (Array.isArray(products) && products.length >= 10) return;
        } catch {
            return;
        }
        await this.runSeed();
    }

    /** Varsa ilk şirket ID'sini döner, yoksa oluşturur */
    private async getOrCreateCompany(): Promise<string> {
        const list = await firstValueFrom(this.company.getAll());
        if (list?.length > 0) return list[0].id;
        return firstValueFrom(this.company.create({ code: 'DEMO', name: 'Demokart Elektronik A.Ş.', taxNumber: '3820594712' }));
    }

    /** Varsa ilk şube ID'sini döner, yoksa oluşturur */
    private async getOrCreateBranch(companyId: string): Promise<string> {
        const list = await firstValueFrom(this.branch.getAll());
        if (list?.length > 0) return list[0].id;
        return firstValueFrom(this.branch.create({ companyId, code: 'MRK', name: 'Merkez Şube' }));
    }

    /** Varsa ilk depo ID'sini döner, yoksa oluşturur */
    private async getOrCreateWarehouse(branchId: string): Promise<string> {
        const list = await firstValueFrom(this.warehouse.getAll());
        if (list?.length > 0) return list[0].id;
        return firstValueFrom(this.warehouse.create({ branchId, code: 'DEP-01', name: 'Merkez Ana Depo' }));
    }

    private step(label: string, progress: number): void {
        this.seedStep.set(label);
        this.seedProgress.set(progress);
    }

    private async runSeed(): Promise<void> {
        this.isSeeding.set(true);
        this.step('Demo veriler hazırlanıyor...', 0);

        try {
            // ── 1. Şirket (varsa al, yoksa oluştur) ──────────────────────────
            this.step('Şirket bilgileri hazırlanıyor...', 2);
            const companyId = await this.getOrCreateCompany();

            // ── 2. Şube (varsa al, yoksa oluştur) ─────────────────────────────
            this.step('Şube bilgileri hazırlanıyor...', 4);
            const branchId = await this.getOrCreateBranch(companyId);
            // İkinci şube — hata olursa geç
            try {
                const branches = await firstValueFrom(this.branch.getAll());
                if (branches?.length < 2) {
                    await firstValueFrom(this.branch.create({ companyId, code: 'AND', name: 'İstanbul Anadolu Şubesi' }));
                }
            } catch { /* ikinci şube opsiyonel */ }

            // ── 3. Depo (varsa al, yoksa oluştur) ─────────────────────────────
            this.step('Depo bilgileri hazırlanıyor...', 7);
            const warehouseId = await this.getOrCreateWarehouse(branchId);
            // İkinci depo — hata olursa geç
            try {
                const warehouses = await firstValueFrom(this.warehouse.getAll());
                if (warehouses?.length < 2) {
                    await firstValueFrom(this.warehouse.create({ branchId, code: 'DEP-02', name: 'Kadıköy Şube Deposu' }));
                }
            } catch { /* ikinci depo opsiyonel */ }

            // ── 4. Ürünler (30 adet) ──────────────────────────────────────────
            this.step('Ürün kataloğu oluşturuluyor...', 10);
            const prodDefs = [
                // TV / Görüntü Sistemleri
                { code: 'TV-001', name: 'Samsung 65" Neo QLED 4K QN90C',         category: 'TV & Görüntü',              brand: 'Samsung',  barcode: '8806094101001', buy: 22000, sell: 27500, min: 15, vat: 0.20 },
                { code: 'TV-002', name: 'LG 55" OLED evo C3 4K Smart TV',         category: 'TV & Görüntü',              brand: 'LG',       barcode: '8806091102002', buy: 28000, sell: 34900, min: 10, vat: 0.20 },
                { code: 'TV-003', name: 'Sony 75" BRAVIA XR 8K MiniLED TV',       category: 'TV & Görüntü',              brand: 'Sony',     barcode: '4548736103003', buy: 45000, sell: 54900, min: 5,  vat: 0.20 },
                { code: 'TV-004', name: 'Philips 50" The One 4K Ambilight TV',    category: 'TV & Görüntü',              brand: 'Philips',  barcode: '8710103104004', buy: 8500,  sell: 10990, min: 20, vat: 0.20 },
                // Telefon
                { code: 'PHN-001', name: 'Apple iPhone 15 Pro 256GB Doğal Titanyum', category: 'Akıllı Telefon',         brand: 'Apple',    barcode: '1901995205005', buy: 48000, sell: 59999, min: 25, vat: 0.20 },
                { code: 'PHN-002', name: 'Samsung Galaxy S24 Ultra 512GB Titanyum', category: 'Akıllı Telefon',          brand: 'Samsung',  barcode: '8806094206006', buy: 38000, sell: 47999, min: 20, vat: 0.20 },
                { code: 'PHN-003', name: 'Xiaomi 14 Pro 256GB Seramik Beyaz',      category: 'Akıllı Telefon',           brand: 'Xiaomi',   barcode: '6941059207007', buy: 24000, sell: 29999, min: 15, vat: 0.20 },
                { code: 'PHN-004', name: 'Google Pixel 8 Pro 256GB Obsidian',      category: 'Akıllı Telefon',           brand: 'Google',   barcode: '0842776108008', buy: 26000, sell: 32999, min: 12, vat: 0.20 },
                // Tablet
                { code: 'TAB-001', name: 'Apple iPad Pro 13" M2 WiFi 256GB',      category: 'Tablet',                   brand: 'Apple',    barcode: '1901995309009', buy: 32000, sell: 39999, min: 15, vat: 0.20 },
                { code: 'TAB-002', name: 'Samsung Galaxy Tab S9 Ultra 512GB',     category: 'Tablet',                   brand: 'Samsung',  barcode: '8806094310010', buy: 25000, sell: 31999, min: 12, vat: 0.20 },
                { code: 'TAB-003', name: 'Lenovo Tab P12 Pro 256GB WiFi',         category: 'Tablet',                   brand: 'Lenovo',   barcode: '1929697411011', buy: 9500,  sell: 12499, min: 10, vat: 0.20 },
                // Dizüstü Bilgisayar
                { code: 'LPT-001', name: 'Apple MacBook Pro M3 14" 512GB Uzay Siyahı', category: 'Dizüstü Bilgisayar',  brand: 'Apple',    barcode: '1901995512012', buy: 65000, sell: 79999, min: 8,  vat: 0.20 },
                { code: 'LPT-002', name: 'Dell XPS 15 9530 i7-13700H 32GB 1TB',   category: 'Dizüstü Bilgisayar',       brand: 'Dell',     barcode: '8841160513013', buy: 55000, sell: 69999, min: 8,  vat: 0.20 },
                { code: 'LPT-003', name: 'Lenovo ThinkPad X1 Carbon Gen 11 i7',   category: 'Dizüstü Bilgisayar',       brand: 'Lenovo',   barcode: '1929697614014', buy: 42000, sell: 52999, min: 6,  vat: 0.20 },
                { code: 'LPT-004', name: 'HP Spectre x360 14" i7-1355U 32GB',     category: 'Dizüstü Bilgisayar',       brand: 'HP',       barcode: '1942930715015', buy: 38000, sell: 47999, min: 6,  vat: 0.20 },
                // Ses Sistemleri
                { code: 'SES-001', name: 'Sony WH-1000XM5 Kablosuz Kulaklık',     category: 'Ses Sistemleri',           brand: 'Sony',     barcode: '4548736816016', buy: 6500,  sell: 8500,  min: 20, vat: 0.20 },
                { code: 'SES-002', name: 'Bose QuietComfort 45 ANC Kulaklık',     category: 'Ses Sistemleri',           brand: 'Bose',     barcode: '0017817817017', buy: 5200,  sell: 6999,  min: 15, vat: 0.20 },
                { code: 'SES-003', name: 'JBL Charge 5 Taşınabilir Hoparlör',     category: 'Ses Sistemleri',           brand: 'JBL',      barcode: '0050036818018', buy: 1800,  sell: 2499,  min: 30, vat: 0.20 },
                // Beyaz Eşya
                { code: 'BE-001', name: 'LG GBB92STAXP 600L No-Frost Buzdolabı', category: 'Beyaz Eşya',               brand: 'LG',       barcode: '8806091819019', buy: 15000, sell: 19900, min: 8,  vat: 0.20 },
                { code: 'BE-002', name: 'Bosch WAX32EH0TR 10kg Çamaşır Makinesi',category: 'Beyaz Eşya',               brand: 'Bosch',    barcode: '4242002820020', buy: 12000, sell: 15500, min: 8,  vat: 0.20 },
                { code: 'BE-003', name: 'Beko DIN 28430 A++ Bulaşık Makinesi',    category: 'Beyaz Eşya',               brand: 'Beko',     barcode: '8690842821021', buy: 7800,  sell: 9999,  min: 10, vat: 0.20 },
                { code: 'BE-004', name: 'Arçelik 6102 HE Buharlı Fırın',         category: 'Beyaz Eşya',               brand: 'Arçelik',  barcode: '8690849822022', buy: 4500,  sell: 5999,  min: 12, vat: 0.20 },
                // Küçük Ev Aletleri
                { code: 'KEA-001', name: 'Dyson V15 Detect Absolute Süpürge',     category: 'Küçük Ev Aletleri',        brand: 'Dyson',    barcode: '5025155023023', buy: 10500, sell: 13500, min: 10, vat: 0.20 },
                { code: 'KEA-002', name: 'Tefal EY801827 ActiFry Genius XL 1.7kg',category: 'Küçük Ev Aletleri',       brand: 'Tefal',    barcode: '3456780824024', buy: 2800,  sell: 3999,  min: 25, vat: 0.20 },
                { code: 'KEA-003', name: 'Philips EP2224/40 Tam Otomatik Kahve',  category: 'Küçük Ev Aletleri',        brand: 'Philips',  barcode: '8710103825025', buy: 4200,  sell: 5999,  min: 18, vat: 0.20 },
                // Akıllı Saat
                { code: 'SAT-001', name: 'Samsung Galaxy Watch 6 Classic 47mm',   category: 'Akıllı Saat',              brand: 'Samsung',  barcode: '8806094826026', buy: 5500,  sell: 7499,  min: 20, vat: 0.20 },
                { code: 'SAT-002', name: 'Apple Watch Ultra 2 49mm Titanyum',     category: 'Akıllı Saat',              brand: 'Apple',    barcode: '1901995827027', buy: 18000, sell: 22999, min: 10, vat: 0.20 },
                { code: 'SAT-003', name: 'Garmin Fenix 7 Pro Solar GPS Saat',     category: 'Akıllı Saat',              brand: 'Garmin',   barcode: '0753759828028', buy: 12000, sell: 15999, min: 8,  vat: 0.20 },
                // Depolama & Aksesuar
                { code: 'DEP-001', name: 'Toshiba HDWL110 1TB 2.5" SSD SATA III',category: 'Depolama',                 brand: 'Toshiba',  barcode: '4547808829029', buy: 1800,  sell: 2499,  min: 40, vat: 0.10 },
                { code: 'ACC-001', name: 'Logitech MX Keys S Advanced Keyboard',  category: 'Bilgisayar Aksesuarı',     brand: 'Logitech', barcode: '5099206830030', buy: 1400,  sell: 1999,  min: 35, vat: 0.10 },
            ];

            const pids: string[] = [];
            for (let i = 0; i < prodDefs.length; i++) {
                const p = prodDefs[i];
                const id = await firstValueFrom(this.product.create({
                    code: p.code, name: p.name, category: p.category, brand: p.brand,
                    barcodeEan13: p.barcode, unit: 'EA', isActive: true,
                    defaultSalePrice: p.sell,
                    lastPurchasePrice: p.buy,
                    lastSalePrice: p.sell,
                    minimumStockLevel: p.min,
                    criticalStockLevel: Math.floor(p.min / 2),
                    purchaseVatRate: p.vat,
                    salesVatRate: p.vat,
                    defaultWarehouseId: warehouseId
                }));
                pids.push(id);
                this.step(`Ürün kataloğu oluşturuluyor... (${i + 1}/30)`, 10 + Math.floor((i + 1) * 16 / 30));
            }
            const [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10,
                   p11, p12, p13, p14, p15, p16, p17, p18, p19, p20,
                   p21, p22, p23, p24, p25, p26, p27, p28, p29, p30] = pids;

            // ── 5. Cari Hesaplar (16 adet) ────────────────────────────────────
            this.step('Cari hesaplar oluşturuluyor...', 27);
            const cariDefs = [
                // Alıcılar (8)
                { code: 'MUS-001', name: 'Teknosa İç ve Dış Ticaret A.Ş.',              type: CariType.Buyer,    riskLimit: 500000,  maturityDays: 30 },
                { code: 'MUS-002', name: 'Media Markt Turkey A.Ş.',                     type: CariType.Buyer,    riskLimit: 750000,  maturityDays: 45 },
                { code: 'MUS-003', name: 'Vatan Bilgisayar Ticaret A.Ş.',               type: CariType.Buyer,    riskLimit: 400000,  maturityDays: 30 },
                { code: 'MUS-004', name: 'Amazon Türkiye Perakende Ltd. Şti.',          type: CariType.Buyer,    riskLimit: 1000000, maturityDays: 30 },
                { code: 'MUS-005', name: 'Hepsiburada Elektronik Ticaret A.Ş.',         type: CariType.Buyer,    riskLimit: 600000,  maturityDays: 45 },
                { code: 'MUS-006', name: 'N11 Ticaret A.Ş.',                            type: CariType.Buyer,    riskLimit: 350000,  maturityDays: 30 },
                { code: 'MUS-007', name: 'ÇiçekSepeti E-Ticaret A.Ş.',                 type: CariType.Buyer,    riskLimit: 200000,  maturityDays: 30 },
                { code: 'MUS-008', name: 'Migros Ticaret A.Ş.',                         type: CariType.Buyer,    riskLimit: 450000,  maturityDays: 30 },
                // Tedarikçiler (6)
                { code: 'TED-001', name: 'Samsung Electronics Türkiye Ltd. Şti.',       type: CariType.Supplier, riskLimit: 2000000, maturityDays: 30 },
                { code: 'TED-002', name: 'Apple Distribution International Ltd.',       type: CariType.Supplier, riskLimit: 3000000, maturityDays: 30 },
                { code: 'TED-003', name: 'Sony Türkiye Ltd.',                           type: CariType.Supplier, riskLimit: 1500000, maturityDays: 30 },
                { code: 'TED-004', name: 'BSH Ev Aletleri San. ve Tic. A.Ş.',          type: CariType.Supplier, riskLimit: 1000000, maturityDays: 45 },
                { code: 'TED-005', name: 'Arçelik A.Ş.',                               type: CariType.Supplier, riskLimit: 800000,  maturityDays: 30 },
                { code: 'TED-006', name: 'Logitech Europe S.A.',                        type: CariType.Supplier, riskLimit: 500000,  maturityDays: 45 },
                // Hem Alıcı Hem Tedarikçi (2)
                { code: 'HEM-001', name: 'Turkcell Teknoloji A.Ş.',                     type: CariType.Both,     riskLimit: 800000,  maturityDays: 30 },
                { code: 'HEM-002', name: 'Koç Sistem Bilgi ve İletişim Hizmetleri A.Ş.',type: CariType.Both,     riskLimit: 600000,  maturityDays: 45 },
            ];
            const cids: string[] = [];
            for (const c of cariDefs) {
                const id = await firstValueFrom(this.cari.create({
                    code: c.code, name: c.name, type: c.type,
                    riskLimit: c.riskLimit, maturityDays: c.maturityDays
                }));
                cids.push(id);
            }
            const [c1, c2, c3, c4, c5, c6, c7, c8,
                   c9, c10, c11, c12, c13, c14, c15, c16] = cids;
            this.step('Cari hesaplar oluşturuldu.', 38);

            // ── 6. Satış Siparişleri (20 adet) ───────────────────────────────
            this.step('Satış siparişleri oluşturuluyor...', 40);
            const soDefs = [
                { no: 'SS-2026-001', cari: c1, items: [{ productId: p5, quantity: 10, unitPrice: 59999 }, { productId: p6, quantity: 8, unitPrice: 47999 }, { productId: p1, quantity: 5, unitPrice: 27500 }] },
                { no: 'SS-2026-002', cari: c2, items: [{ productId: p12, quantity: 5, unitPrice: 79999 }, { productId: p13, quantity: 4, unitPrice: 69999 }, { productId: p5, quantity: 8, unitPrice: 59999 }] },
                { no: 'SS-2026-003', cari: c3, items: [{ productId: p9, quantity: 6, unitPrice: 39999 }, { productId: p10, quantity: 5, unitPrice: 31999 }, { productId: p30, quantity: 20, unitPrice: 1999 }, { productId: p29, quantity: 30, unitPrice: 2499 }] },
                { no: 'SS-2026-004', cari: c4, items: [{ productId: p5, quantity: 15, unitPrice: 59999 }, { productId: p6, quantity: 12, unitPrice: 47999 }, { productId: p27, quantity: 6, unitPrice: 22999 }] },
                { no: 'SS-2026-005', cari: c5, items: [{ productId: p1, quantity: 8, unitPrice: 27500 }, { productId: p3, quantity: 4, unitPrice: 54900 }, { productId: p26, quantity: 10, unitPrice: 7499 }] },
                { no: 'SS-2026-006', cari: c6, items: [{ productId: p16, quantity: 12, unitPrice: 8500 }, { productId: p17, quantity: 10, unitPrice: 6999 }, { productId: p18, quantity: 20, unitPrice: 2499 }] },
                { no: 'SS-2026-007', cari: c7, items: [{ productId: p24, quantity: 15, unitPrice: 3999 }, { productId: p25, quantity: 12, unitPrice: 5999 }] },
                { no: 'SS-2026-008', cari: c8, items: [{ productId: p23, quantity: 6, unitPrice: 13500 }, { productId: p22, quantity: 8, unitPrice: 5999 }, { productId: p21, quantity: 7, unitPrice: 9999 }] },
                { no: 'SS-2026-009', cari: c1, items: [{ productId: p12, quantity: 4, unitPrice: 79999 }, { productId: p15, quantity: 3, unitPrice: 47999 }] },
                { no: 'SS-2026-010', cari: c2, items: [{ productId: p1, quantity: 6, unitPrice: 27500 }, { productId: p2, quantity: 4, unitPrice: 34900 }, { productId: p3, quantity: 2, unitPrice: 54900 }] },
                { no: 'SS-2026-011', cari: c3, items: [{ productId: p6, quantity: 10, unitPrice: 47999 }, { productId: p8, quantity: 8, unitPrice: 32999 }] },
                { no: 'SS-2026-012', cari: c4, items: [{ productId: p9, quantity: 8, unitPrice: 39999 }, { productId: p11, quantity: 10, unitPrice: 12499 }, { productId: p27, quantity: 4, unitPrice: 22999 }] },
                { no: 'SS-2026-013', cari: c5, items: [{ productId: p16, quantity: 8, unitPrice: 8500 }, { productId: p29, quantity: 25, unitPrice: 2499 }, { productId: p30, quantity: 30, unitPrice: 1999 }] },
                { no: 'SS-2026-014', cari: c6, items: [{ productId: p20, quantity: 5, unitPrice: 15500 }, { productId: p19, quantity: 4, unitPrice: 19900 }] },
                { no: 'SS-2026-015', cari: c7, items: [{ productId: p5, quantity: 6, unitPrice: 59999 }, { productId: p26, quantity: 8, unitPrice: 7499 }, { productId: p28, quantity: 5, unitPrice: 15999 }] },
                { no: 'SS-2026-016', cari: c8, items: [{ productId: p17, quantity: 8, unitPrice: 6999 }, { productId: p18, quantity: 15, unitPrice: 2499 }, { productId: p25, quantity: 10, unitPrice: 5999 }] },
                { no: 'SS-2026-017', cari: c15, items: [{ productId: p6, quantity: 20, unitPrice: 47999 }, { productId: p5, quantity: 15, unitPrice: 59999 }, { productId: p9, quantity: 8, unitPrice: 39999 }] },
                { no: 'SS-2026-018', cari: c16, items: [{ productId: p12, quantity: 6, unitPrice: 79999 }, { productId: p13, quantity: 4, unitPrice: 69999 }, { productId: p15, quantity: 3, unitPrice: 47999 }] },
                // Taslak siparişler (onaylanmayacak)
                { no: 'SS-2026-019', cari: c1, items: [{ productId: p1, quantity: 10, unitPrice: 27500 }, { productId: p2, quantity: 5, unitPrice: 34900 }] },
                { no: 'SS-2026-020', cari: c4, items: [{ productId: p5, quantity: 20, unitPrice: 59999 }, { productId: p6, quantity: 15, unitPrice: 47999 }] },
            ];
            const soIds: string[] = [];
            for (const s of soDefs) {
                const id = await firstValueFrom(this.so.create({
                    orderNo: s.no, customerCariAccountId: s.cari, warehouseId, items: s.items
                }));
                soIds.push(id);
            }
            // SS-001..018 onayla (index 0-17), SS-019..020 taslak
            for (let i = 0; i <= 17; i++) {
                await firstValueFrom(this.so.approve(soIds[i]));
            }
            this.step('Satış siparişleri oluşturuldu.', 52);

            // ── 7. Satın Alma Siparişleri (12 adet) ──────────────────────────
            this.step('Satın alma siparişleri oluşturuluyor...', 54);
            const poDefs = [
                { no: 'AS-2026-001', cari: c9,  items: [{ productId: p1, quantity: 15, unitPrice: 22000 }, { productId: p6, quantity: 20, unitPrice: 38000 }, { productId: p10, quantity: 10, unitPrice: 25000 }, { productId: p26, quantity: 20, unitPrice: 5500 }] },
                { no: 'AS-2026-002', cari: c10, items: [{ productId: p5, quantity: 20, unitPrice: 48000 }, { productId: p9, quantity: 10, unitPrice: 32000 }, { productId: p12, quantity: 8, unitPrice: 65000 }] },
                { no: 'AS-2026-003', cari: c10, items: [{ productId: p27, quantity: 10, unitPrice: 18000 }, { productId: p9, quantity: 8, unitPrice: 32000 }] },
                { no: 'AS-2026-004', cari: c11, items: [{ productId: p3, quantity: 5, unitPrice: 45000 }, { productId: p16, quantity: 20, unitPrice: 6500 }] },
                { no: 'AS-2026-005', cari: c12, items: [{ productId: p20, quantity: 10, unitPrice: 12000 }] },
                { no: 'AS-2026-006', cari: c13, items: [{ productId: p21, quantity: 12, unitPrice: 7800 }, { productId: p22, quantity: 15, unitPrice: 4500 }] },
                { no: 'AS-2026-007', cari: c14, items: [{ productId: p30, quantity: 50, unitPrice: 1400 }, { productId: p29, quantity: 30, unitPrice: 1800 }] },
                { no: 'AS-2026-008', cari: c15, items: [{ productId: p2, quantity: 8, unitPrice: 28000 }, { productId: p4, quantity: 20, unitPrice: 8500 }, { productId: p17, quantity: 15, unitPrice: 5200 }] },
                { no: 'AS-2026-009', cari: c15, items: [{ productId: p19, quantity: 8, unitPrice: 15000 }, { productId: p18, quantity: 25, unitPrice: 1800 }, { productId: p25, quantity: 20, unitPrice: 4200 }] },
                { no: 'AS-2026-010', cari: c16, items: [{ productId: p8, quantity: 10, unitPrice: 26000 }, { productId: p11, quantity: 15, unitPrice: 9500 }, { productId: p13, quantity: 6, unitPrice: 55000 }] },
                // Taslak siparişler (onaylanmayacak)
                { no: 'AS-2026-011', cari: c16, items: [{ productId: p7, quantity: 15, unitPrice: 24000 }, { productId: p23, quantity: 8, unitPrice: 10500 }, { productId: p24, quantity: 30, unitPrice: 2800 }] },
                { no: 'AS-2026-012', cari: c9,  items: [{ productId: p1, quantity: 10, unitPrice: 22000 }, { productId: p6, quantity: 15, unitPrice: 38000 }] },
            ];
            const poIds: string[] = [];
            for (const p of poDefs) {
                const id = await firstValueFrom(this.po.create({
                    orderNo: p.no, supplierCariAccountId: p.cari, warehouseId, items: p.items
                }));
                poIds.push(id);
            }
            // AS-001..010 onayla (index 0-9), AS-011..012 taslak
            for (let i = 0; i <= 9; i++) {
                await firstValueFrom(this.po.approve(poIds[i]));
            }
            this.step('Satın alma siparişleri oluşturuldu.', 64);

            // ── 8. Stok Hareketleri (33 adet) ────────────────────────────────
            this.step('Stok hareketleri oluşturuluyor...', 66);
            const smDefs: Array<{ product: string; type: StockMovementType; qty: number; price: number; ref: string }> = [
                // Girişler — tedarikçi alımlarından
                { product: p1,  type: StockMovementType.In,  qty: 15, price: 22000, ref: 'GS-AS-2026-001' },
                { product: p6,  type: StockMovementType.In,  qty: 20, price: 38000, ref: 'GS-AS-2026-001' },
                { product: p10, type: StockMovementType.In,  qty: 10, price: 25000, ref: 'GS-AS-2026-001' },
                { product: p26, type: StockMovementType.In,  qty: 20, price: 5500,  ref: 'GS-AS-2026-001' },
                { product: p5,  type: StockMovementType.In,  qty: 20, price: 48000, ref: 'GS-AS-2026-002' },
                { product: p9,  type: StockMovementType.In,  qty: 10, price: 32000, ref: 'GS-AS-2026-002' },
                { product: p12, type: StockMovementType.In,  qty: 8,  price: 65000, ref: 'GS-AS-2026-002' },
                { product: p27, type: StockMovementType.In,  qty: 10, price: 18000, ref: 'GS-AS-2026-003' },
                { product: p3,  type: StockMovementType.In,  qty: 5,  price: 45000, ref: 'GS-AS-2026-004' },
                { product: p16, type: StockMovementType.In,  qty: 20, price: 6500,  ref: 'GS-AS-2026-004' },
                { product: p20, type: StockMovementType.In,  qty: 10, price: 12000, ref: 'GS-AS-2026-005' },
                { product: p21, type: StockMovementType.In,  qty: 12, price: 7800,  ref: 'GS-AS-2026-006' },
                { product: p22, type: StockMovementType.In,  qty: 15, price: 4500,  ref: 'GS-AS-2026-006' },
                // Çıkışlar — müşteri satışlarından
                { product: p5,  type: StockMovementType.Out, qty: 10, price: 59999, ref: 'CS-SS-2026-001' },
                { product: p6,  type: StockMovementType.Out, qty: 8,  price: 47999, ref: 'CS-SS-2026-001' },
                { product: p1,  type: StockMovementType.Out, qty: 5,  price: 27500, ref: 'CS-SS-2026-001' },
                { product: p12, type: StockMovementType.Out, qty: 5,  price: 79999, ref: 'CS-SS-2026-002' },
                { product: p13, type: StockMovementType.Out, qty: 4,  price: 69999, ref: 'CS-SS-2026-002' },
                { product: p9,  type: StockMovementType.Out, qty: 6,  price: 39999, ref: 'CS-SS-2026-003' },
                { product: p5,  type: StockMovementType.Out, qty: 15, price: 59999, ref: 'CS-SS-2026-004' },
                { product: p6,  type: StockMovementType.Out, qty: 12, price: 47999, ref: 'CS-SS-2026-004' },
                { product: p1,  type: StockMovementType.Out, qty: 8,  price: 27500, ref: 'CS-SS-2026-005' },
                { product: p3,  type: StockMovementType.Out, qty: 4,  price: 54900, ref: 'CS-SS-2026-005' },
                { product: p16, type: StockMovementType.Out, qty: 12, price: 8500,  ref: 'CS-SS-2026-006' },
                { product: p17, type: StockMovementType.Out, qty: 10, price: 6999,  ref: 'CS-SS-2026-006' },
                { product: p24, type: StockMovementType.Out, qty: 15, price: 3999,  ref: 'CS-SS-2026-007' },
                { product: p23, type: StockMovementType.Out, qty: 6,  price: 13500, ref: 'CS-SS-2026-008' },
                { product: p12, type: StockMovementType.Out, qty: 4,  price: 79999, ref: 'CS-SS-2026-009' },
                { product: p6,  type: StockMovementType.Out, qty: 10, price: 47999, ref: 'CS-SS-2026-011' },
                { product: p5,  type: StockMovementType.Out, qty: 6,  price: 59999, ref: 'CS-SS-2026-015' },
                { product: p26, type: StockMovementType.Out, qty: 8,  price: 7499,  ref: 'CS-SS-2026-015' },
                // İade girişi
                { product: p5,  type: StockMovementType.In,  qty: 2,  price: 48000, ref: 'IADE-SS-001' },
                { product: p12, type: StockMovementType.In,  qty: 1,  price: 65000, ref: 'IADE-SS-002' },
            ];
            for (const s of smDefs) {
                await firstValueFrom(this.sm.create({
                    warehouseId, productId: s.product,
                    type: s.type, quantity: s.qty, unitPrice: s.price, referenceNo: s.ref
                }));
            }
            this.step('Stok hareketleri oluşturuldu.', 78);

            // ── 9. Finans Hareketleri (22 adet) ──────────────────────────────
            this.step('Finans hareketleri oluşturuluyor...', 80);
            const fmDefs = [
                // Müşteri tahsilatları
                { cari: c1,  type: FinanceMovementType.Income,  amount: 1889990, desc: 'Teknosa SS-001 tahsilat',           ref: 'TAH-2026-001' },
                { cari: c2,  type: FinanceMovementType.Income,  amount: 1139987, desc: 'Media Markt SS-002 tahsilat',        ref: 'TAH-2026-002' },
                { cari: c3,  type: FinanceMovementType.Income,  amount: 386930,  desc: 'Vatan SS-003 tahsilat',              ref: 'TAH-2026-003' },
                { cari: c4,  type: FinanceMovementType.Income,  amount: 2037976, desc: 'Amazon TR SS-004 tahsilat',          ref: 'TAH-2026-004' },
                { cari: c5,  type: FinanceMovementType.Income,  amount: 444000,  desc: 'Hepsiburada SS-005 kısmi tahsilat',  ref: 'TAH-2026-005' },
                { cari: c6,  type: FinanceMovementType.Income,  amount: 219968,  desc: 'N11 SS-006 tahsilat',                ref: 'TAH-2026-006' },
                { cari: c7,  type: FinanceMovementType.Income,  amount: 131970,  desc: 'ÇiçekSepeti SS-007 tahsilat',       ref: 'TAH-2026-007' },
                { cari: c8,  type: FinanceMovementType.Income,  amount: 189986,  desc: 'Migros SS-008 tahsilat',             ref: 'TAH-2026-008' },
                { cari: c1,  type: FinanceMovementType.Income,  amount: 463993,  desc: 'Teknosa SS-009 tahsilat',            ref: 'TAH-2026-009' },
                { cari: c2,  type: FinanceMovementType.Income,  amount: 374400,  desc: 'Media Markt SS-010 tahsilat',        ref: 'TAH-2026-010' },
                { cari: c15, type: FinanceMovementType.Income,  amount: 1800000, desc: 'Turkcell SS-017 tahsilat',           ref: 'TAH-2026-011' },
                { cari: c16, type: FinanceMovementType.Income,  amount: 950000,  desc: 'Koç Sistem SS-018 avans ödemesi',   ref: 'TAH-2026-012' },
                // Tedarikçi ödemeleri
                { cari: c9,  type: FinanceMovementType.Expense, amount: 2216000, desc: 'Samsung AS-001 ödeme',               ref: 'ODE-2026-001' },
                { cari: c10, type: FinanceMovementType.Expense, amount: 2176000, desc: 'Apple AS-002 ödeme',                 ref: 'ODE-2026-002' },
                { cari: c10, type: FinanceMovementType.Expense, amount: 436000,  desc: 'Apple AS-003 kısmi ödeme',           ref: 'ODE-2026-003' },
                { cari: c11, type: FinanceMovementType.Expense, amount: 355000,  desc: 'Sony AS-004 ödeme',                  ref: 'ODE-2026-004' },
                { cari: c12, type: FinanceMovementType.Expense, amount: 120000,  desc: 'BSH AS-005 ödeme',                   ref: 'ODE-2026-005' },
                { cari: c13, type: FinanceMovementType.Expense, amount: 161100,  desc: 'Arçelik AS-006 ödeme',               ref: 'ODE-2026-006' },
                { cari: c14, type: FinanceMovementType.Expense, amount: 124000,  desc: 'Logitech AS-007 ödeme',              ref: 'ODE-2026-007' },
                { cari: c15, type: FinanceMovementType.Expense, amount: 342400,  desc: 'Turkcell AS-008 ödeme',              ref: 'ODE-2026-008' },
                { cari: c15, type: FinanceMovementType.Expense, amount: 246000,  desc: 'Turkcell AS-009 ödeme',              ref: 'ODE-2026-009' },
                { cari: c16, type: FinanceMovementType.Expense, amount: 687500,  desc: 'Koç Sistem AS-010 ödeme',            ref: 'ODE-2026-010' },
            ];
            for (const f of fmDefs) {
                await firstValueFrom(this.fm.create({
                    cariAccountId: f.cari, type: f.type,
                    amount: f.amount, description: f.desc, referenceNo: f.ref
                }));
            }
            this.step('Finans hareketleri oluşturuldu.', 90);

            // ── 10. Faturalar (18 adet) ───────────────────────────────────────
            this.step('Faturalar oluşturuluyor...', 92);
            const today = new Date().toISOString().split('T')[0];
            const due30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
            const due45 = new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0];
            const invDefs = [
                // Satış faturaları — e-Fatura büyük müşteriler
                { type: InvoiceType.EFatura, cat: InvoiceCategory.Satis, cari: c1,  due: due30, items: [{ productId: p5, quantity: 10, unitPrice: 59999, taxRate: 0.20, discountRate: 0 }, { productId: p6, quantity: 8, unitPrice: 47999, taxRate: 0.20, discountRate: 0 }, { productId: p1, quantity: 5, unitPrice: 27500, taxRate: 0.20, discountRate: 0 }] },
                { type: InvoiceType.EFatura, cat: InvoiceCategory.Satis, cari: c2,  due: due30, items: [{ productId: p12, quantity: 5, unitPrice: 79999, taxRate: 0.20, discountRate: 0 }, { productId: p13, quantity: 4, unitPrice: 69999, taxRate: 0.20, discountRate: 0 }] },
                { type: InvoiceType.EFatura, cat: InvoiceCategory.Satis, cari: c4,  due: due30, items: [{ productId: p5, quantity: 15, unitPrice: 59999, taxRate: 0.20, discountRate: 0 }, { productId: p6, quantity: 12, unitPrice: 47999, taxRate: 0.20, discountRate: 0 }, { productId: p27, quantity: 6, unitPrice: 22999, taxRate: 0.20, discountRate: 0 }] },
                { type: InvoiceType.EFatura, cat: InvoiceCategory.Satis, cari: c15, due: due45, items: [{ productId: p6, quantity: 20, unitPrice: 47999, taxRate: 0.20, discountRate: 0 }, { productId: p5, quantity: 15, unitPrice: 59999, taxRate: 0.20, discountRate: 0 }, { productId: p9, quantity: 8, unitPrice: 39999, taxRate: 0.20, discountRate: 0 }] },
                { type: InvoiceType.EFatura, cat: InvoiceCategory.Satis, cari: c16, due: due45, items: [{ productId: p12, quantity: 6, unitPrice: 79999, taxRate: 0.20, discountRate: 0 }, { productId: p13, quantity: 4, unitPrice: 69999, taxRate: 0.20, discountRate: 0 }, { productId: p15, quantity: 3, unitPrice: 47999, taxRate: 0.20, discountRate: 0 }] },
                // Satış faturaları — e-Arşiv orta/küçük müşteriler
                { type: InvoiceType.EArsiv, cat: InvoiceCategory.Satis, cari: c3,  due: due30, items: [{ productId: p9, quantity: 6, unitPrice: 39999, taxRate: 0.20, discountRate: 0 }, { productId: p10, quantity: 5, unitPrice: 31999, taxRate: 0.20, discountRate: 0 }, { productId: p30, quantity: 20, unitPrice: 1999, taxRate: 0.10, discountRate: 0 }] },
                { type: InvoiceType.EArsiv, cat: InvoiceCategory.Satis, cari: c5,  due: due30, items: [{ productId: p1, quantity: 8, unitPrice: 27500, taxRate: 0.20, discountRate: 0 }, { productId: p3, quantity: 4, unitPrice: 54900, taxRate: 0.20, discountRate: 0 }, { productId: p26, quantity: 10, unitPrice: 7499, taxRate: 0.20, discountRate: 0 }] },
                { type: InvoiceType.EArsiv, cat: InvoiceCategory.Satis, cari: c6,  due: due30, items: [{ productId: p16, quantity: 12, unitPrice: 8500, taxRate: 0.20, discountRate: 0 }, { productId: p17, quantity: 10, unitPrice: 6999, taxRate: 0.20, discountRate: 0 }, { productId: p18, quantity: 20, unitPrice: 2499, taxRate: 0.20, discountRate: 0 }] },
                { type: InvoiceType.EArsiv, cat: InvoiceCategory.Satis, cari: c7,  due: due30, items: [{ productId: p24, quantity: 15, unitPrice: 3999, taxRate: 0.20, discountRate: 0 }, { productId: p25, quantity: 12, unitPrice: 5999, taxRate: 0.20, discountRate: 0 }] },
                { type: InvoiceType.EArsiv, cat: InvoiceCategory.Satis, cari: c8,  due: due30, items: [{ productId: p23, quantity: 6, unitPrice: 13500, taxRate: 0.20, discountRate: 0 }, { productId: p22, quantity: 8, unitPrice: 5999, taxRate: 0.20, discountRate: 0 }, { productId: p21, quantity: 7, unitPrice: 9999, taxRate: 0.20, discountRate: 0 }] },
                { type: InvoiceType.EArsiv, cat: InvoiceCategory.Satis, cari: c1,  due: due30, items: [{ productId: p12, quantity: 4, unitPrice: 79999, taxRate: 0.20, discountRate: 0 }, { productId: p15, quantity: 3, unitPrice: 47999, taxRate: 0.20, discountRate: 0 }] },
                { type: InvoiceType.EArsiv, cat: InvoiceCategory.Satis, cari: c2,  due: due30, items: [{ productId: p1, quantity: 6, unitPrice: 27500, taxRate: 0.20, discountRate: 0 }, { productId: p2, quantity: 4, unitPrice: 34900, taxRate: 0.20, discountRate: 0 }] },
                // Alış faturaları (InvoiceCategory.Tevkifat = 3 → backend Alis)
                { type: InvoiceType.EFatura, cat: InvoiceCategory.Tevkifat, cari: c9,  due: due30, items: [{ productId: p1, quantity: 15, unitPrice: 22000, taxRate: 0.20, discountRate: 0 }, { productId: p6, quantity: 20, unitPrice: 38000, taxRate: 0.20, discountRate: 0 }, { productId: p26, quantity: 20, unitPrice: 5500, taxRate: 0.20, discountRate: 0 }] },
                { type: InvoiceType.EFatura, cat: InvoiceCategory.Tevkifat, cari: c10, due: due30, items: [{ productId: p5, quantity: 20, unitPrice: 48000, taxRate: 0.20, discountRate: 0 }, { productId: p9, quantity: 10, unitPrice: 32000, taxRate: 0.20, discountRate: 0 }, { productId: p12, quantity: 8, unitPrice: 65000, taxRate: 0.20, discountRate: 0 }] },
                { type: InvoiceType.EFatura, cat: InvoiceCategory.Tevkifat, cari: c11, due: due30, items: [{ productId: p3, quantity: 5, unitPrice: 45000, taxRate: 0.20, discountRate: 0 }, { productId: p16, quantity: 20, unitPrice: 6500, taxRate: 0.20, discountRate: 0 }] },
                { type: InvoiceType.EFatura, cat: InvoiceCategory.Tevkifat, cari: c12, due: due45, items: [{ productId: p20, quantity: 10, unitPrice: 12000, taxRate: 0.20, discountRate: 0 }] },
                // İade faturaları
                { type: InvoiceType.EArsiv,  cat: InvoiceCategory.Iade, cari: c1,  due: due30, items: [{ productId: p5, quantity: 2, unitPrice: 59999, taxRate: 0.20, discountRate: 0 }] },
                { type: InvoiceType.EFatura, cat: InvoiceCategory.Iade, cari: c4,  due: due30, items: [{ productId: p12, quantity: 1, unitPrice: 79999, taxRate: 0.20, discountRate: 0 }] },
            ];
            for (const inv of invDefs) {
                await firstValueFrom(this.inv.create({
                    invoiceType: inv.type, invoiceCategory: inv.cat,
                    cariAccountId: inv.cari, issueDate: today, dueDate: inv.due,
                    currency: 'TRY', items: inv.items
                }));
            }

            this.step('Demo hesap hazır! ✓', 100);
            await new Promise(r => setTimeout(r, 800));

        } catch (err) {
            console.error('[DemoSeedService] Seed hatası:', err);
            this.step('Bazı veriler yüklenemedi, devam ediliyor...', 100);
            await new Promise(r => setTimeout(r, 600));
        } finally {
            this.isSeeding.set(false);
        }
    }
}

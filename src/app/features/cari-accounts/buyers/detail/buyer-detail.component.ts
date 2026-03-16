import { Component, signal, OnInit, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

interface BuyerProduct {
    id: string;
    productName: string;
    barcode: string;
    category: string;
    quantity: number;
    listPrice: number;
    unitPrice: number;
    total: number;
    payment: number;
    remainingBalance: number;
    date: string;
    status: 'Delivered' | 'Pending' | 'Cancelled';
    selected?: boolean;
    editing?: boolean;
}

interface QuickAddRow {
    productName: string;
    barcode: string;
    category: string;
    quantity: number;
    listPrice: number;
    unitPrice: number;
    date: string;
    status: 'Delivered' | 'Pending' | 'Cancelled';
}

@Component({
    selector: 'app-buyer-detail',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './buyer-detail.component.html',
    styleUrls: ['./buyer-detail.component.css', '../../../../shared/styles/crud-page.css']
})
export class BuyerDetailComponent implements OnInit {
    buyerId = '';
    searchTerm = '';
    activeTab = signal<'all' | 'Delivered' | 'Pending' | 'Cancelled'>('all');

    // Buyer info
    buyer = signal<any>(null);

    // Products
    products = signal<BuyerProduct[]>([]);

    // Selection
    allSelected = false;

    // Inline editing
    editingCell = signal<{ id: string; field: string } | null>(null);

    // Quick-add rows (Excel-like multiple blank rows at bottom)
    quickAddRows = signal<QuickAddRow[]>([
        this.createEmptyRow(),
        this.createEmptyRow(),
        this.createEmptyRow(),
    ]);

    // Paste mode
    showPasteZone = signal(false);
    pasteContent = '';

    // Bulk add modal
    showBulkAddModal = signal(false);
    bulkAddText = '';

    // Demo cari ID kısayolları
    private readonly C1  = '00000002-0000-0000-0000-000000000001'; // Teknosa
    private readonly C2  = '00000002-0000-0000-0000-000000000002'; // Media Markt
    private readonly C3  = '00000002-0000-0000-0000-000000000003'; // Vatan Bilgisayar
    private readonly C4  = '00000002-0000-0000-0000-000000000004'; // Amazon TR
    private readonly C5  = '00000002-0000-0000-0000-000000000005'; // Hepsiburada
    private readonly C6  = '00000002-0000-0000-0000-000000000006'; // N11
    private readonly C7  = '00000002-0000-0000-0000-000000000007'; // ÇiçekSepeti
    private readonly C8  = '00000002-0000-0000-0000-000000000008'; // Migros
    private readonly C15 = '00000002-0000-0000-0000-000000000015'; // Turkcell
    private readonly C16 = '00000002-0000-0000-0000-000000000016'; // Koç Sistem

    private get buyersData(): Record<string, any> {
        return {
            [this.C1]:  { id: this.C1,  name: 'Teknosa İç ve Dış Ticaret A.Ş.',               phone: '0850 200 9600', email: 'kurumsal@teknosa.com',          address: 'Saray Mah. Örnekköy Sok., Kağıthane', taxNumber: '2831459870', city: 'İstanbul', balance: 661488,  totalSales: 1585475, orderCount: 9,  lastOrder: '2026-03-11', isActive: true  },
            [this.C2]:  { id: this.C2,  name: 'Media Markt Turkey A.Ş.',                      phone: '0850 333 5555', email: 'b2b@mediamarkt.com.tr',          address: 'Nispetiye Cad. 12, Beşiktaş',         taxNumber: '9482130567', city: 'İstanbul', balance: 285583,  totalSales: 1574383, orderCount: 4,  lastOrder: '2026-03-08', isActive: true  },
            [this.C3]:  { id: this.C3,  name: 'Vatan Bilgisayar Ticaret A.Ş.',                phone: '0850 484 2884', email: 'tedarik@vatanbilgisayar.com',    address: 'Kavacık Mah. Rüzgarlıbahçe, Beykoz',  taxNumber: '3740281956', city: 'İstanbul', balance: 126939,  totalSales: 1258921, orderCount: 4,  lastOrder: '2026-02-13', isActive: true  },
            [this.C4]:  { id: this.C4,  name: 'Amazon Türkiye Perakende Ltd. Şti.',           phone: '0800 300 3000', email: 'vendor@amazon.com.tr',           address: 'Sarıyer, İstanbul',                    taxNumber: '6291847503', city: 'İstanbul', balance: 1688127, totalSales: 2150945, orderCount: 6,  lastOrder: '2026-03-14', isActive: true  },
            [this.C5]:  { id: this.C5,  name: 'Hepsiburada Elektronik Ticaret A.Ş.',          phone: '0850 252 4444', email: 'tedarikci@hepsiburada.com',      address: 'Güzelyurt Mah., Küçükçekmece',         taxNumber: '5037826194', city: 'İstanbul', balance: 70571,   totalSales:  705035, orderCount: 4,  lastOrder: '2026-02-22', isActive: true  },
            [this.C6]:  { id: this.C6,  name: 'N11 Ticaret A.Ş.',                             phone: '0850 532 0011', email: 'magaza@n11.com',                  address: 'Çekmeköy Mah., Çekmeköy',              taxNumber: '4826519073', city: 'İstanbul', balance: 221202,  totalSales:  379070, orderCount: 4,  lastOrder: '2026-02-25', isActive: true  },
            [this.C7]:  { id: this.C7,  name: 'ÇiçekSepeti E-Ticaret A.Ş.',                  phone: '0850 222 3434', email: 'tedarikci@ciceksepeti.com',      address: 'Ümraniye Mah., Ümraniye',               taxNumber: '7153924068', city: 'İstanbul', balance: 631954,  totalSales:  631954, orderCount: 4,  lastOrder: '2026-03-01', isActive: true  },
            [this.C8]:  { id: this.C8,  name: 'Migros Ticaret A.Ş.',                          phone: '0850 200 5000', email: 'ticaret@migros.com.tr',           address: 'Levazım Mah., Beşiktaş',               taxNumber: '8264751309', city: 'İstanbul', balance: 50497,   totalSales:  352452, orderCount: 4,  lastOrder: '2026-03-05', isActive: true  },
            [this.C15]: { id: this.C15, name: 'Turkcell Teknoloji A.Ş.',                      phone: '0532 532 0000', email: 'b2b@turkcell.com.tr',             address: 'Maltepe Mah., Maltepe',                taxNumber: '1947385026', city: 'İstanbul', balance: 379957,  totalSales: 2179957, orderCount: 3,  lastOrder: '2026-03-08', isActive: true  },
            [this.C16]: { id: this.C16, name: 'Koç Sistem Bilgi ve İletişim Hizmetleri A.Ş.',phone: '0850 225 5600', email: 'ticaret@kocsistem.com.tr',         address: 'Çobançeşme Mah., Bahçelievler',        taxNumber: '3619280457', city: 'İstanbul', balance: 46013,   totalSales:  903987, orderCount: 3,  lastOrder: '2026-03-11', isActive: true  },
        };
    }

    private get productsByBuyer(): Record<string, BuyerProduct[]> {
        return {
            [this.C1]: [
                { id: 'p1', productName: 'Apple iPhone 15 Pro 256GB',        barcode: '1901995205005', category: 'Akıllı Telefon',      quantity: 10, listPrice: 64999, unitPrice: 59999, total: 599990, payment: 599990, remainingBalance:      0, date: '2026-01-03', status: 'Delivered' },
                { id: 'p2', productName: 'Samsung Galaxy S24 Ultra 512GB',   barcode: '8806094206006', category: 'Akıllı Telefon',      quantity:  8, listPrice: 51999, unitPrice: 47999, total: 383992, payment: 383992, remainingBalance:      0, date: '2026-01-03', status: 'Delivered' },
                { id: 'p3', productName: 'Samsung 65" Neo QLED 4K',         barcode: '8806094101001', category: 'TV & Görüntü',        quantity:  5, listPrice: 29900, unitPrice: 27500, total: 137500, payment: 137500, remainingBalance:      0, date: '2026-01-03', status: 'Delivered' },
                { id: 'p4', productName: 'Apple MacBook Pro M3 14" 512GB',  barcode: '1901995512012', category: 'Dizüstü Bilgisayar',  quantity:  4, listPrice: 84999, unitPrice: 79999, total: 319996, payment: 319996, remainingBalance:      0, date: '2026-02-06', status: 'Delivered' },
                { id: 'p5', productName: 'HP Spectre x360 14" i7 32GB',     barcode: '1942930715015', category: 'Dizüstü Bilgisayar',  quantity:  3, listPrice: 51999, unitPrice: 47999, total: 143997, payment: 143997, remainingBalance:      0, date: '2026-02-06', status: 'Delivered' },
                { id: 'p6', productName: 'Apple iPhone 15 Pro 256GB',        barcode: '1901995205005', category: 'Akıllı Telefon',      quantity:  6, listPrice: 64999, unitPrice: 59999, total: 359994, payment:      0, remainingBalance: 359994, date: '2026-03-01', status: 'Pending'   },
                { id: 'p7', productName: 'Samsung Galaxy Watch 6 Classic',   barcode: '8806094826026', category: 'Akıllı Saat',         quantity:  8, listPrice:  8299, unitPrice:  7499, total:  59992, payment:      0, remainingBalance:  59992, date: '2026-03-01', status: 'Pending'   },
                { id: 'p8', productName: 'Apple Watch Ultra 2 49mm',         barcode: '1901995827027', category: 'Akıllı Saat',         quantity:  3, listPrice: 24999, unitPrice: 22999, total:  68997, payment:  68997, remainingBalance:      0, date: '2026-02-17', status: 'Delivered' },
            ],
            [this.C2]: [
                { id: 'p1', productName: 'Apple MacBook Pro M3 14" 512GB',  barcode: '1901995512012', category: 'Dizüstü Bilgisayar',  quantity:  5, listPrice: 84999, unitPrice: 79999, total: 399995, payment: 399995, remainingBalance:      0, date: '2026-01-06', status: 'Delivered' },
                { id: 'p2', productName: 'Dell XPS 15 i7 32GB 1TB',         barcode: '8841160513013', category: 'Dizüstü Bilgisayar',  quantity:  4, listPrice: 74999, unitPrice: 69999, total: 279996, payment: 279996, remainingBalance:      0, date: '2026-01-06', status: 'Delivered' },
                { id: 'p3', productName: 'Samsung 65" Neo QLED 4K',         barcode: '8806094101001', category: 'TV & Görüntü',        quantity:  6, listPrice: 29900, unitPrice: 27500, total: 165000, payment: 165000, remainingBalance:      0, date: '2026-02-04', status: 'Delivered' },
                { id: 'p4', productName: 'LG 55" OLED evo C3 4K Smart TV',  barcode: '8806091102002', category: 'TV & Görüntü',        quantity:  4, listPrice: 37900, unitPrice: 34900, total: 139600, payment: 139600, remainingBalance:      0, date: '2026-02-04', status: 'Delivered' },
                { id: 'p5', productName: 'Sony 75" BRAVIA XR X95L 8K',      barcode: '4548736103003', category: 'TV & Görüntü',        quantity:  2, listPrice: 57900, unitPrice: 54900, total: 109800, payment:      0, remainingBalance: 109800, date: '2026-02-04', status: 'Pending'   },
                { id: 'p6', productName: 'Apple iPhone 15 Pro 256GB',        barcode: '1901995205005', category: 'Akıllı Telefon',      quantity:  8, listPrice: 64999, unitPrice: 59999, total: 479992, payment: 479992, remainingBalance:      0, date: '2026-03-06', status: 'Delivered' },
            ],
            [this.C3]: [
                { id: 'p1', productName: 'Apple iPad Pro 13" M2 WiFi 256GB',barcode: '1901995309009', category: 'Tablet',              quantity:  6, listPrice: 42999, unitPrice: 39999, total: 239994, payment: 239994, remainingBalance:      0, date: '2026-01-04', status: 'Delivered' },
                { id: 'p2', productName: 'Samsung Galaxy Tab S9 Ultra',      barcode: '8806094310010', category: 'Tablet',              quantity:  5, listPrice: 34999, unitPrice: 31999, total: 159995, payment: 159995, remainingBalance:      0, date: '2026-01-04', status: 'Delivered' },
                { id: 'p3', productName: 'Logitech MX Keys S Advanced Klavye',barcode:'5099206830030',category: 'Bil. Aksesuarı',      quantity: 20, listPrice:  2199, unitPrice:  1999, total:  39980, payment:  39980, remainingBalance:      0, date: '2026-01-04', status: 'Delivered' },
                { id: 'p4', productName: 'Toshiba HDWL110 1TB SSD',          barcode: '4547808829029', category: 'Depolama',            quantity: 30, listPrice:  2699, unitPrice:  2499, total:  74970, payment:  74970, remainingBalance:      0, date: '2026-01-04', status: 'Delivered' },
                { id: 'p5', productName: 'Samsung Galaxy S24 Ultra 512GB',   barcode: '8806094206006', category: 'Akıllı Telefon',      quantity: 10, listPrice: 51999, unitPrice: 47999, total: 479990, payment: 479990, remainingBalance:      0, date: '2026-02-13', status: 'Delivered' },
                { id: 'p6', productName: 'Google Pixel 8 Pro 256GB',         barcode: '0842776108008', category: 'Akıllı Telefon',      quantity:  8, listPrice: 35999, unitPrice: 32999, total: 263992, payment: 137053, remainingBalance: 126939, date: '2026-02-13', status: 'Pending'   },
            ],
            [this.C4]: [
                { id: 'p1', productName: 'Apple iPhone 15 Pro 256GB',        barcode: '1901995205005', category: 'Akıllı Telefon',      quantity: 15, listPrice: 64999, unitPrice: 59999, total: 899985, payment: 899985, remainingBalance:      0, date: '2026-01-28', status: 'Delivered' },
                { id: 'p2', productName: 'Samsung Galaxy S24 Ultra 512GB',   barcode: '8806094206006', category: 'Akıllı Telefon',      quantity: 12, listPrice: 51999, unitPrice: 47999, total: 575988, payment: 575988, remainingBalance:      0, date: '2026-01-28', status: 'Delivered' },
                { id: 'p3', productName: 'Apple Watch Ultra 2 49mm',         barcode: '1901995827027', category: 'Akıllı Saat',         quantity:  6, listPrice: 24999, unitPrice: 22999, total: 137994, payment: 137994, remainingBalance:      0, date: '2026-01-28', status: 'Delivered' },
                { id: 'p4', productName: 'Apple iPad Pro 13" M2 WiFi 256GB',barcode: '1901995309009', category: 'Tablet',              quantity:  8, listPrice: 42999, unitPrice: 39999, total: 319992, payment: 319992, remainingBalance:      0, date: '2026-02-26', status: 'Delivered' },
                { id: 'p5', productName: 'Lenovo Tab P12 Pro 256GB',         barcode: '1929697411011', category: 'Tablet',              quantity: 10, listPrice: 13499, unitPrice: 12499, total: 124990, payment:  33994, remainingBalance:  90996, date: '2026-02-26', status: 'Pending'   },
                { id: 'p6', productName: 'Apple Watch Ultra 2 49mm',         barcode: '1901995827027', category: 'Akıllı Saat',         quantity:  4, listPrice: 24999, unitPrice: 22999, total:  91996, payment:  91996, remainingBalance:      0, date: '2026-02-26', status: 'Delivered' },
                { id: 'p7', productName: 'Apple iPhone 15 Pro 256GB',        barcode: '1901995205005', category: 'Akıllı Telefon',      quantity: 20, listPrice: 64999, unitPrice: 59999, total:1199980, payment:      0, remainingBalance:1199980, date: '2026-03-14', status: 'Pending'   },
                { id: 'p8', productName: 'Samsung Galaxy S24 Ultra 512GB',   barcode: '8806094206006', category: 'Akıllı Telefon',      quantity: 15, listPrice: 51999, unitPrice: 47999, total: 719985, payment: 221834, remainingBalance: 498151, date: '2026-03-14', status: 'Pending'   },
            ],
            [this.C5]: [
                { id: 'p1', productName: 'Samsung 65" Neo QLED 4K',         barcode: '8806094101001', category: 'TV & Görüntü',        quantity:  8, listPrice: 29900, unitPrice: 27500, total: 220000, payment: 220000, remainingBalance:      0, date: '2026-01-18', status: 'Delivered' },
                { id: 'p2', productName: 'Sony 75" BRAVIA XR X95L 8K',      barcode: '4548736103003', category: 'TV & Görüntü',        quantity:  4, listPrice: 57900, unitPrice: 54900, total: 219600, payment: 219600, remainingBalance:      0, date: '2026-01-18', status: 'Delivered' },
                { id: 'p3', productName: 'Samsung Galaxy Watch 6 Classic',   barcode: '8806094826026', category: 'Akıllı Saat',         quantity: 10, listPrice:  8299, unitPrice:  7499, total:  74990, payment:  74990, remainingBalance:      0, date: '2026-01-18', status: 'Delivered' },
                { id: 'p4', productName: 'Sony WH-1000XM5 Kablosuz Kulaklık',barcode:'4548736816016', category: 'Ses Sistemleri',      quantity:  8, listPrice:  8999, unitPrice:  8500, total:  68000, payment:      0, remainingBalance:  68000, date: '2026-02-22', status: 'Pending'   },
                { id: 'p5', productName: 'Toshiba HDWL110 1TB SSD',          barcode: '4547808829029', category: 'Depolama',            quantity: 25, listPrice:  2699, unitPrice:  2499, total:  62475, payment:  62475, remainingBalance:      0, date: '2026-02-22', status: 'Delivered' },
                { id: 'p6', productName: 'Logitech MX Keys S Advanced Klavye',barcode:'5099206830030',category: 'Bil. Aksesuarı',      quantity: 30, listPrice:  2199, unitPrice:  1999, total:  59970, payment:  57904, remainingBalance:   2066, date: '2026-02-22', status: 'Pending'   },
            ],
            [this.C6]: [
                { id: 'p1', productName: 'Sony WH-1000XM5 Kablosuz Kulaklık',barcode:'4548736816016', category: 'Ses Sistemleri',      quantity: 12, listPrice:  8999, unitPrice:  8500, total: 102000, payment: 102000, remainingBalance:      0, date: '2026-02-03', status: 'Delivered' },
                { id: 'p2', productName: 'Bose QuietComfort 45 ANC Kulaklık', barcode:'0017817817017', category: 'Ses Sistemleri',      quantity: 10, listPrice:  7499, unitPrice:  6999, total:  69990, payment:  69990, remainingBalance:      0, date: '2026-02-03', status: 'Delivered' },
                { id: 'p3', productName: 'JBL Charge 5 Bluetooth Hoparlör',  barcode: '0050036818018', category: 'Ses Sistemleri',      quantity: 20, listPrice:  2699, unitPrice:  2499, total:  49980, payment:  49980, remainingBalance:      0, date: '2026-02-03', status: 'Delivered' },
                { id: 'p4', productName: 'Bosch 10kg Çamaşır Makinesi',      barcode: '4242002820020', category: 'Beyaz Eşya',          quantity:  5, listPrice: 16499, unitPrice: 15500, total:  77500, payment:      0, remainingBalance:  77500, date: '2026-02-25', status: 'Pending'   },
                { id: 'p5', productName: 'LG 600L No-Frost Buzdolabı',       barcode: '8806091819019', category: 'Beyaz Eşya',          quantity:  4, listPrice: 21900, unitPrice: 19900, total:  79600, payment:  79600, remainingBalance:      0, date: '2026-02-25', status: 'Delivered' },
            ],
            [this.C7]: [
                { id: 'p1', productName: 'Tefal ActiFry Genius XL Airfryer', barcode: '3456780824024', category: 'Küçük Ev Aletleri',  quantity: 15, listPrice:  4299, unitPrice:  3999, total:  59985, payment:  59985, remainingBalance:      0, date: '2026-02-08', status: 'Delivered' },
                { id: 'p2', productName: 'Philips EP2224 Kahve Makinesi',    barcode: '8710103825025', category: 'Küçük Ev Aletleri',  quantity: 12, listPrice:  6499, unitPrice:  5999, total:  71988, payment:      0, remainingBalance:  71988, date: '2026-02-08', status: 'Pending'   },
                { id: 'p3', productName: 'Apple iPhone 15 Pro 256GB',        barcode: '1901995205005', category: 'Akıllı Telefon',      quantity:  6, listPrice: 64999, unitPrice: 59999, total: 359994, payment: 359994, remainingBalance:      0, date: '2026-03-01', status: 'Delivered' },
                { id: 'p4', productName: 'Samsung Galaxy Watch 6 Classic',   barcode: '8806094826026', category: 'Akıllı Saat',         quantity:  8, listPrice:  8299, unitPrice:  7499, total:  59992, payment:  59992, remainingBalance:      0, date: '2026-03-01', status: 'Delivered' },
                { id: 'p5', productName: 'Garmin Fenix 7 Pro Solar GPS',     barcode: '0753759828028', category: 'Akıllı Saat',         quantity:  5, listPrice: 16999, unitPrice: 15999, total:  79995, payment:      0, remainingBalance:  79995, date: '2026-03-01', status: 'Pending'   },
            ],
            [this.C8]: [
                { id: 'p1', productName: 'Dyson V15 Detect Süpürge',         barcode: '5025155023023', category: 'Küçük Ev Aletleri',  quantity:  6, listPrice: 14499, unitPrice: 13500, total:  81000, payment:  81000, remainingBalance:      0, date: '2026-02-13', status: 'Delivered' },
                { id: 'p2', productName: 'Arçelik 6102 HE Buharlı Fırın',   barcode: '8690849822022', category: 'Beyaz Eşya',          quantity:  8, listPrice:  6499, unitPrice:  5999, total:  47992, payment:  47992, remainingBalance:      0, date: '2026-02-13', status: 'Delivered' },
                { id: 'p3', productName: 'Beko DIN 28430 Bulaşık Makinesi', barcode: '8690842821021', category: 'Beyaz Eşya',          quantity:  7, listPrice: 10999, unitPrice:  9999, total:  69993, payment:  69993, remainingBalance:      0, date: '2026-02-13', status: 'Delivered' },
                { id: 'p4', productName: 'Bose QuietComfort 45 ANC Kulaklık',barcode:'0017817817017', category: 'Ses Sistemleri',      quantity:  8, listPrice:  7499, unitPrice:  6999, total:  55992, payment:      0, remainingBalance:  55992, date: '2026-03-05', status: 'Pending'   },
                { id: 'p5', productName: 'JBL Charge 5 Bluetooth Hoparlör',  barcode: '0050036818018', category: 'Ses Sistemleri',      quantity: 15, listPrice:  2699, unitPrice:  2499, total:  37485, payment:  37485, remainingBalance:      0, date: '2026-03-05', status: 'Delivered' },
                { id: 'p6', productName: 'Philips EP2224 Kahve Makinesi',    barcode: '8710103825025', category: 'Küçük Ev Aletleri',  quantity: 10, listPrice:  6499, unitPrice:  5999, total:  59990, payment:  59990, remainingBalance:      0, date: '2026-03-05', status: 'Delivered' },
            ],
            [this.C15]: [
                { id: 'p1', productName: 'Samsung Galaxy S24 Ultra 512GB',   barcode: '8806094206006', category: 'Akıllı Telefon',      quantity: 20, listPrice: 51999, unitPrice: 47999, total: 959980, payment: 959980, remainingBalance:      0, date: '2026-03-08', status: 'Delivered' },
                { id: 'p2', productName: 'Apple iPhone 15 Pro 256GB',        barcode: '1901995205005', category: 'Akıllı Telefon',      quantity: 15, listPrice: 64999, unitPrice: 59999, total: 899985, payment: 899985, remainingBalance:      0, date: '2026-03-08', status: 'Delivered' },
                { id: 'p3', productName: 'Apple iPad Pro 13" M2 WiFi 256GB',barcode: '1901995309009', category: 'Tablet',              quantity:  8, listPrice: 42999, unitPrice: 39999, total: 319992, payment:  25020, remainingBalance: 294972, date: '2026-03-08', status: 'Pending'   },
            ],
            [this.C16]: [
                { id: 'p1', productName: 'Apple MacBook Pro M3 14" 512GB',  barcode: '1901995512012', category: 'Dizüstü Bilgisayar',  quantity:  6, listPrice: 84999, unitPrice: 79999, total: 479994, payment: 479994, remainingBalance:      0, date: '2026-03-11', status: 'Delivered' },
                { id: 'p2', productName: 'Dell XPS 15 i7 32GB 1TB',         barcode: '8841160513013', category: 'Dizüstü Bilgisayar',  quantity:  4, listPrice: 74999, unitPrice: 69999, total: 279996, payment: 279996, remainingBalance:      0, date: '2026-03-11', status: 'Delivered' },
                { id: 'p3', productName: 'HP Spectre x360 14" i7 32GB',     barcode: '1942930715015', category: 'Dizüstü Bilgisayar',  quantity:  3, listPrice: 51999, unitPrice: 47999, total: 143997, payment: 143997, remainingBalance:      0, date: '2026-03-11', status: 'Delivered' },
                { id: 'p4', productName: 'Lenovo ThinkPad X1 Carbon i7',    barcode: '1929697614014', category: 'Dizüstü Bilgisayar',  quantity:  2, listPrice: 56999, unitPrice: 52999, total: 105998, payment:  59985, remainingBalance:  46013, date: '2026-03-11', status: 'Pending'   },
            ],
        };
    }

    constructor(private route: ActivatedRoute, private router: Router) { }

    ngOnInit(): void {
        this.buyerId = this.route.snapshot.paramMap.get('id') || '';
        const buyerData = this.buyersData[this.buyerId];
        if (buyerData) {
            this.buyer.set(buyerData);
            this.products.set([...(this.productsByBuyer[this.buyerId] || [])]);
        } else {
            this.router.navigate(['/cari-accounts/buyers']);
        }
    }

    // ─── Keyboard Shortcuts ─────────────────────────────
    @HostListener('document:keydown', ['$event'])
    handleKeyboard(e: KeyboardEvent): void {
        // Ctrl+V global paste handler (when not in an input)
        if (e.ctrlKey && e.key === 'v' && !this.isInInput(e)) {
            this.showBulkAddModal.set(true);
            e.preventDefault();
        }
        // Escape: close modals / deselect
        if (e.key === 'Escape') {
            this.editingCell.set(null);
            this.showBulkAddModal.set(false);
        }
        // Ctrl+A: select all (when not in input)
        if (e.ctrlKey && e.key === 'a' && !this.isInInput(e)) {
            e.preventDefault();
            this.toggleSelectAll();
        }
        // Delete: delete selected
        if (e.key === 'Delete' && !this.isInInput(e) && this.selectedCount > 0) {
            this.bulkDelete();
        }
    }

    private isInInput(e: KeyboardEvent): boolean {
        const tag = (e.target as HTMLElement)?.tagName;
        return tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';
    }

    // ─── Filters ────────────────────────────────────────
    get filteredProducts(): BuyerProduct[] {
        let items = this.products();
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

    // ─── Stats ──────────────────────────────────────────
    get totalProductCount() { return this.products().length; }
    get deliveredCount() { return this.products().filter(p => p.status === 'Delivered').length; }
    get pendingCount() { return this.products().filter(p => p.status === 'Pending').length; }
    get totalAmount() { return this.products().reduce((s, p) => s + p.total, 0); }
    get selectedCount() { return this.products().filter(p => p.selected).length; }
    get selectedTotal() { return this.products().filter(p => p.selected).reduce((s, p) => s + p.total, 0); }

    getStatusBadge(s: string) {
        switch (s) {
            case 'Delivered': return 'badge-success';
            case 'Pending': return 'badge-warning';
            case 'Cancelled': return 'badge-danger';
            default: return '';
        }
    }

    getStatusLabel(s: string) {
        switch (s) {
            case 'Delivered': return 'Teslim Edildi';
            case 'Pending': return 'Beklemede';
            case 'Cancelled': return 'İptal';
            default: return s;
        }
    }

    // ─── Selection ──────────────────────────────────────
    toggleSelectAll(): void {
        this.allSelected = !this.allSelected;
        const filtered = this.filteredProducts;
        const ids = new Set(filtered.map(p => p.id));
        this.products.update(items => items.map(p =>
            ids.has(p.id) ? { ...p, selected: this.allSelected } : p
        ));
    }

    toggleSelect(id: string): void {
        this.products.update(items => items.map(p =>
            p.id === id ? { ...p, selected: !p.selected } : p
        ));
        this.allSelected = this.filteredProducts.every(p => p.selected);
    }

    clearSelection(): void {
        this.allSelected = false;
        this.products.update(items => items.map(p => ({ ...p, selected: false })));
    }

    // ─── Inline Editing ─────────────────────────────────
    startEdit(id: string, field: string): void {
        this.editingCell.set({ id, field });
    }

    isEditing(id: string, field: string): boolean {
        const cell = this.editingCell();
        return cell !== null && cell.id === id && cell.field === field;
    }

    onCellBlur(): void {
        // Recalculate total
        this.products.update(items => items.map(p => ({ ...p, total: p.quantity * p.unitPrice })));
        this.editingCell.set(null);
    }

    onCellKeydown(e: KeyboardEvent, id: string, field: string): void {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.onCellBlur();
        }
        if (e.key === 'Tab') {
            // Move to next field
            const fields = ['productName', 'barcode', 'category', 'quantity', 'unitPrice'];
            const idx = fields.indexOf(field);
            if (idx < fields.length - 1) {
                e.preventDefault();
                this.editingCell.set({ id, field: fields[idx + 1] });
            }
        }
        if (e.key === 'Escape') {
            this.editingCell.set(null);
        }
    }

    // ─── Quick Add Rows (Excel bottom rows) ─────────────
    createEmptyRow(): QuickAddRow {
        return {
            productName: '', barcode: '', category: '', quantity: 1, listPrice: 0, unitPrice: 0,
            date: new Date().toISOString().split('T')[0], status: 'Pending'
        };
    }

    commitQuickRow(index: number): void {
        const rows = this.quickAddRows();
        const row = rows[index];
        if (!row.productName.trim()) return;

        const total = row.quantity * row.unitPrice;
        const newProduct: BuyerProduct = {
            id: 'p' + Date.now() + index,
            ...row,
            total,
            payment: 0,
            remainingBalance: total,
        };
        this.products.update(items => [...items, newProduct]);

        // Reset the row & ensure there's always an empty row at the end
        this.quickAddRows.update(r => {
            const updated = [...r];
            updated[index] = this.createEmptyRow();
            // Always keep at least 3 empty rows
            while (updated.length < 3) updated.push(this.createEmptyRow());
            return updated;
        });
    }

    onQuickRowKeydown(e: KeyboardEvent, index: number): void {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.commitQuickRow(index);
        }
    }

    addMoreQuickRows(): void {
        this.quickAddRows.update(r => [...r, this.createEmptyRow(), this.createEmptyRow(), this.createEmptyRow()]);
    }

    removeQuickRow(index: number): void {
        this.quickAddRows.update(r => {
            const updated = r.filter((_, i) => i !== index);
            if (updated.length < 3) updated.push(this.createEmptyRow());
            return updated;
        });
    }

    commitAllQuickRows(): void {
        const rows = this.quickAddRows();
        const validRows = rows.filter(r => r.productName.trim());
        if (validRows.length === 0) return;

        const newProducts: BuyerProduct[] = validRows.map((r, i) => {
            const total = r.quantity * r.unitPrice;
            return {
                id: 'p' + Date.now() + i,
                ...r,
                total,
                payment: 0,
                remainingBalance: total,
            };
        });
        this.products.update(items => [...items, ...newProducts]);

        // Reset quick add rows
        this.quickAddRows.set([
            this.createEmptyRow(),
            this.createEmptyRow(),
            this.createEmptyRow(),
        ]);
    }

    get filledQuickRowCount(): number {
        return this.quickAddRows().filter(r => r.productName.trim()).length;
    }

    // ─── Bulk Paste from Excel ──────────────────────────
    processPaste(): void {
        if (!this.bulkAddText.trim()) return;

        const lines = this.bulkAddText.trim().split('\n');
        const newProducts: BuyerProduct[] = [];

        for (const line of lines) {
            // Support tab-separated or semicolon-separated
            const cols = line.includes('\t') ? line.split('\t') : line.split(';');
            if (cols.length < 2) continue; // At least name and quantity

            const name = cols[0]?.trim() || '';
            const barcode = cols[1]?.trim() || '';
            const category = cols[2]?.trim() || '';
            const qty = parseFloat(cols[3]?.trim()) || 1;
            const price = parseFloat(cols[4]?.trim()) || 0;

            if (name) {
                const total = qty * price;
                newProducts.push({
                    id: 'p' + Date.now() + newProducts.length,
                    productName: name,
                    barcode,
                    category,
                    quantity: qty,
                    listPrice: price,
                    unitPrice: price,
                    total,
                    payment: 0,
                    remainingBalance: total,
                    date: new Date().toISOString().split('T')[0],
                    status: 'Pending'
                });
            }
        }

        if (newProducts.length > 0) {
            this.products.update(items => [...items, ...newProducts]);
        }

        this.bulkAddText = '';
        this.showBulkAddModal.set(false);
    }

    // ─── Bulk Actions ───────────────────────────────────
    bulkDelete(): void {
        this.products.update(items => items.filter(p => !p.selected));
        this.allSelected = false;
    }

    bulkMarkDelivered(): void {
        this.products.update(items => items.map(p =>
            p.selected ? { ...p, status: 'Delivered' as const, selected: false } : p
        ));
        this.allSelected = false;
    }

    bulkCancel(): void {
        this.products.update(items => items.map(p =>
            p.selected ? { ...p, status: 'Cancelled' as const, selected: false } : p
        ));
        this.allSelected = false;
    }

    // ─── Single Actions ─────────────────────────────────
    removeProduct(id: string): void {
        this.products.update(items => items.filter(p => p.id !== id));
    }

    markDelivered(id: string): void {
        this.products.update(items => items.map(p => p.id === id ? { ...p, status: 'Delivered' as const } : p));
    }

    cancelProduct(id: string): void {
        this.products.update(items => items.map(p => p.id === id ? { ...p, status: 'Cancelled' as const } : p));
    }

    duplicateProduct(p: BuyerProduct): void {
        const dup: BuyerProduct = {
            ...p,
            id: 'p' + Date.now(),
            selected: false,
            date: new Date().toISOString().split('T')[0],
            status: 'Pending'
        };
        this.products.update(items => [...items, dup]);
    }

    goBack(): void {
        this.router.navigate(['/cari-accounts/buyers']);
    }
}

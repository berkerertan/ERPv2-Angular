/**
 * demo-data.ts
 * Demo kullanıcısı için tüm mock veriler.
 * DemoInterceptor tarafından backend'e istek atmadan döndürülür.
 */

import { CariType } from '../models/cari-account.model';
import { OrderStatus } from '../models/sales-order.model';
import { StockMovementType } from '../models/stock-movement.model';
import { FinanceMovementType } from '../models/finance-movement.model';
import { InvoiceType, InvoiceCategory, InvoiceStatus } from '../models/invoice.model';

// ── Tarih yardımcıları ────────────────────────────────────────────────────────
const ago = (days: number): string => {
    const dt = new Date(); dt.setDate(dt.getDate() - days); return dt.toISOString();
};
const fwd = (days: number): string => {
    const dt = new Date(); dt.setDate(dt.getDate() + days); return dt.toISOString().split('T')[0];
};

// ── ID yardımcıları ───────────────────────────────────────────────────────────
const pid  = (n: number) => `00000001-0000-0000-0000-${String(n).padStart(12,'0')}`;
const cid  = (n: number) => `00000002-0000-0000-0000-${String(n).padStart(12,'0')}`;
const soid = (n: number) => `00000003-0000-0000-0000-${String(n).padStart(12,'0')}`;
const poid = (n: number) => `00000004-0000-0000-0000-${String(n).padStart(12,'0')}`;
const smid = (n: number) => `00000005-0000-0000-0000-${String(n).padStart(12,'0')}`;
const fmid = (n: number) => `00000006-0000-0000-0000-${String(n).padStart(12,'0')}`;
const ivid = (n: number) => `00000007-0000-0000-0000-${String(n).padStart(12,'0')}`;

export const DEMO_WH_ID  = '00000010-0000-0000-0000-000000000001';
export const DEMO_WH2_ID = '00000010-0000-0000-0000-000000000002';
const BR1 = '00000009-0000-0000-0000-000000000001';
const BR2 = '00000009-0000-0000-0000-000000000002';
const CO1 = '00000008-0000-0000-0000-000000000001';

// ── Fatura toplam hesaplayıcı ─────────────────────────────────────────────────
function ivTotals(items: { qty: number; price: number; tax: number }[]) {
    const sub = items.reduce((s, i) => s + i.qty * i.price, 0);
    const tax = items.reduce((s, i) => s + i.qty * i.price * i.tax, 0);
    return { subtotal: sub, taxTotal: Math.round(tax), discountTotal: 0, grandTotal: Math.round(sub + tax) };
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. ŞİRKET / ŞUBE / DEPO
// ═════════════════════════════════════════════════════════════════════════════
export const DEMO_COMPANY = { id: CO1, code: 'DEMO', name: 'Demokart Elektronik A.Ş.', taxNumber: '3820594712' };

export const DEMO_BRANCHES = [
    { id: BR1, companyId: CO1, code: 'MRK', name: 'Merkez Şube' },
    { id: BR2, companyId: CO1, code: 'AND', name: 'İstanbul Anadolu Şubesi' },
];

export const DEMO_WAREHOUSES = [
    { id: DEMO_WH_ID,  branchId: BR1, code: 'DEP-01', name: 'Merkez Ana Depo' },
    { id: DEMO_WH2_ID, branchId: BR2, code: 'DEP-02', name: 'Kadıköy Şube Deposu' },
];

// ═════════════════════════════════════════════════════════════════════════════
// 2. ÜRÜNLER (30 adet)
// ═════════════════════════════════════════════════════════════════════════════
const mkP = (n: number, code: string, name: string, cat: string, brand: string, bar: string,
             buy: number, sell: number, min: number, vat: number) => ({
    id: pid(n), code, name, category: cat, brand, barcodeEan13: bar,
    unit: 'EA', isActive: true,
    defaultSalePrice: sell, lastPurchasePrice: buy, lastSalePrice: sell,
    minimumStockLevel: min, criticalStockLevel: Math.floor(min / 2),
    purchaseVatRate: vat, salesVatRate: vat, defaultWarehouseId: DEMO_WH_ID,
});

export const DEMO_PRODUCTS = [
    mkP( 1,'TV-001', 'Samsung 65" Neo QLED 4K QN90C',          'TV & Görüntü',          'Samsung', '8806094101001', 22000, 27500, 15, 0.20),
    mkP( 2,'TV-002', 'LG 55" OLED evo C3 4K Smart TV',          'TV & Görüntü',          'LG',      '8806091102002', 28000, 34900, 10, 0.20),
    mkP( 3,'TV-003', 'Sony 75" BRAVIA XR X95L 8K MiniLED',      'TV & Görüntü',          'Sony',    '4548736103003', 45000, 54900,  5, 0.20),
    mkP( 4,'TV-004', 'Philips 50" The One 4K Ambilight TV',      'TV & Görüntü',          'Philips', '8710103104004',  8500, 10990, 20, 0.20),
    mkP( 5,'PHN-001','Apple iPhone 15 Pro 256GB Doğal Titanyum', 'Akıllı Telefon',        'Apple',   '1901995205005', 48000, 59999, 25, 0.20),
    mkP( 6,'PHN-002','Samsung Galaxy S24 Ultra 512GB Titanyum',  'Akıllı Telefon',        'Samsung', '8806094206006', 38000, 47999, 20, 0.20),
    mkP( 7,'PHN-003','Xiaomi 14 Pro 256GB Seramik Beyaz',        'Akıllı Telefon',        'Xiaomi',  '6941059207007', 24000, 29999, 15, 0.20),
    mkP( 8,'PHN-004','Google Pixel 8 Pro 256GB Obsidian',        'Akıllı Telefon',        'Google',  '0842776108008', 26000, 32999, 12, 0.20),
    mkP( 9,'TAB-001','Apple iPad Pro 13" M2 WiFi 256GB',         'Tablet',                'Apple',   '1901995309009', 32000, 39999, 15, 0.20),
    mkP(10,'TAB-002','Samsung Galaxy Tab S9 Ultra 512GB',        'Tablet',                'Samsung', '8806094310010', 25000, 31999, 12, 0.20),
    mkP(11,'TAB-003','Lenovo Tab P12 Pro 256GB WiFi',            'Tablet',                'Lenovo',  '1929697411011',  9500, 12499, 10, 0.20),
    mkP(12,'LPT-001','Apple MacBook Pro M3 14" 512GB Uzay Siyahı','Dizüstü Bilgisayar',  'Apple',   '1901995512012', 65000, 79999,  8, 0.20),
    mkP(13,'LPT-002','Dell XPS 15 9530 i7-13700H 32GB 1TB',     'Dizüstü Bilgisayar',   'Dell',    '8841160513013', 55000, 69999,  8, 0.20),
    mkP(14,'LPT-003','Lenovo ThinkPad X1 Carbon Gen 11 i7',     'Dizüstü Bilgisayar',   'Lenovo',  '1929697614014', 42000, 52999,  6, 0.20),
    mkP(15,'LPT-004','HP Spectre x360 14" i7-1355U 32GB',       'Dizüstü Bilgisayar',   'HP',      '1942930715015', 38000, 47999,  6, 0.20),
    mkP(16,'SES-001','Sony WH-1000XM5 Kablosuz ANC Kulaklık',   'Ses Sistemleri',        'Sony',    '4548736816016',  6500,  8500, 20, 0.20),
    mkP(17,'SES-002','Bose QuietComfort 45 ANC Kulaklık',       'Ses Sistemleri',        'Bose',    '0017817817017',  5200,  6999, 15, 0.20),
    mkP(18,'SES-003','JBL Charge 5 Taşınabilir Bluetooth Hoparlör','Ses Sistemleri',     'JBL',     '0050036818018',  1800,  2499, 30, 0.20),
    mkP(19,'BE-001', 'LG GBB92STAXP 600L No-Frost Buzdolabı',   'Beyaz Eşya',           'LG',      '8806091819019', 15000, 19900,  8, 0.20),
    mkP(20,'BE-002', 'Bosch WAX32EH0TR 10kg Çamaşır Makinesi',  'Beyaz Eşya',           'Bosch',   '4242002820020', 12000, 15500,  8, 0.20),
    mkP(21,'BE-003', 'Beko DIN 28430 A++ Bulaşık Makinesi',     'Beyaz Eşya',           'Beko',    '8690842821021',  7800,  9999, 10, 0.20),
    mkP(22,'BE-004', 'Arçelik 6102 HE Buharlı Fırın',           'Beyaz Eşya',           'Arçelik', '8690849822022',  4500,  5999, 12, 0.20),
    mkP(23,'KEA-001','Dyson V15 Detect Absolute Kablosuz Süpürge','Küçük Ev Aletleri',  'Dyson',   '5025155023023', 10500, 13500, 10, 0.20),
    mkP(24,'KEA-002','Tefal EY801827 ActiFry Genius XL 1.7kg',  'Küçük Ev Aletleri',   'Tefal',   '3456780824024',  2800,  3999, 25, 0.20),
    mkP(25,'KEA-003','Philips EP2224/40 Tam Otomatik Kahve Makinesi','Küçük Ev Aletleri','Philips', '8710103825025',  4200,  5999, 18, 0.20),
    mkP(26,'SAT-001','Samsung Galaxy Watch 6 Classic 47mm',      'Akıllı Saat',          'Samsung', '8806094826026',  5500,  7499, 20, 0.20),
    mkP(27,'SAT-002','Apple Watch Ultra 2 49mm Titanyum',        'Akıllı Saat',          'Apple',   '1901995827027', 18000, 22999, 10, 0.20),
    mkP(28,'SAT-003','Garmin Fenix 7 Pro Solar GPS Saat',        'Akıllı Saat',          'Garmin',  '0753759828028', 12000, 15999,  8, 0.20),
    mkP(29,'DEP-001','Toshiba HDWL110 1TB 2.5" SSD SATA III',   'Depolama',             'Toshiba', '4547808829029',  1800,  2499, 40, 0.10),
    mkP(30,'ACC-001','Logitech MX Keys S Advanced Klavye',       'Bilgisayar Aksesuarı', 'Logitech','5099206830030',  1400,  1999, 35, 0.10),
];

// ═════════════════════════════════════════════════════════════════════════════
// 3. CARİ HESAPLAR (16 adet)
// ═════════════════════════════════════════════════════════════════════════════
export const DEMO_CARIS = [
    { id:cid(1),  code:'MUS-001', name:'Teknosa İç ve Dış Ticaret A.Ş.',               type:CariType.Buyer,    riskLimit:500000,  maturityDays:30, currentBalance: 661488 },
    { id:cid(2),  code:'MUS-002', name:'Media Markt Turkey A.Ş.',                      type:CariType.Buyer,    riskLimit:750000,  maturityDays:45, currentBalance: 285583 },
    { id:cid(3),  code:'MUS-003', name:'Vatan Bilgisayar Ticaret A.Ş.',                type:CariType.Buyer,    riskLimit:400000,  maturityDays:30, currentBalance: 126939 },
    { id:cid(4),  code:'MUS-004', name:'Amazon Türkiye Perakende Ltd. Şti.',           type:CariType.Buyer,    riskLimit:1000000, maturityDays:30, currentBalance: 1688127},
    { id:cid(5),  code:'MUS-005', name:'Hepsiburada Elektronik Ticaret A.Ş.',          type:CariType.Buyer,    riskLimit:600000,  maturityDays:45, currentBalance:  70571 },
    { id:cid(6),  code:'MUS-006', name:'N11 Ticaret A.Ş.',                             type:CariType.Buyer,    riskLimit:350000,  maturityDays:30, currentBalance: 221202 },
    { id:cid(7),  code:'MUS-007', name:'ÇiçekSepeti E-Ticaret A.Ş.',                  type:CariType.Buyer,    riskLimit:200000,  maturityDays:30, currentBalance: 631954 },
    { id:cid(8),  code:'MUS-008', name:'Migros Ticaret A.Ş.',                          type:CariType.Buyer,    riskLimit:450000,  maturityDays:30, currentBalance:  50497 },
    { id:cid(9),  code:'TED-001', name:'Samsung Electronics Türkiye Ltd. Şti.',        type:CariType.Supplier, riskLimit:2000000, maturityDays:30, currentBalance:-1450000},
    { id:cid(10), code:'TED-002', name:'Apple Distribution International Ltd.',        type:CariType.Supplier, riskLimit:3000000, maturityDays:30, currentBalance: -910000},
    { id:cid(11), code:'TED-003', name:'Sony Türkiye Ltd.',                            type:CariType.Supplier, riskLimit:1500000, maturityDays:30, currentBalance:       0},
    { id:cid(12), code:'TED-004', name:'BSH Ev Aletleri San. ve Tic. A.Ş.',           type:CariType.Supplier, riskLimit:1000000, maturityDays:45, currentBalance:       0},
    { id:cid(13), code:'TED-005', name:'Arçelik A.Ş.',                                type:CariType.Supplier, riskLimit:800000,  maturityDays:30, currentBalance:       0},
    { id:cid(14), code:'TED-006', name:'Logitech Europe S.A.',                         type:CariType.Supplier, riskLimit:500000,  maturityDays:45, currentBalance:       0},
    { id:cid(15), code:'HEM-001', name:'Turkcell Teknoloji A.Ş.',                      type:CariType.Both,     riskLimit:800000,  maturityDays:30, currentBalance: -250000},
    { id:cid(16), code:'HEM-002', name:'Koç Sistem Bilgi ve İletişim Hizmetleri A.Ş.',type:CariType.Both,     riskLimit:600000,  maturityDays:45, currentBalance:  -46013},
];

export const DEMO_BUYERS    = DEMO_CARIS.filter(c => c.type === CariType.Buyer || c.type === CariType.Both);
export const DEMO_SUPPLIERS = DEMO_CARIS.filter(c => c.type === CariType.Supplier || c.type === CariType.Both);

// ── Alıcı zengin görüntü verisi (liste sayfası için) ─────────────────────────
export const DEMO_BUYER_EXTRA: Record<string, {
    phone: string; email: string; address: string; taxNumber: string; city: string;
    totalSales: number; totalPayments: number; orderCount: number; lastOrder: string;
}> = {
    [cid(1)]:  { phone:'0850 200 9600', email:'kurumsal@teknosa.com',        address:'Saray Mah. Örnekköy Sok., Kağıthane',  taxNumber:'2831459870', city:'İstanbul', totalSales:1585475, totalPayments: 923987, orderCount:9, lastOrder:'2026-03-11' },
    [cid(2)]:  { phone:'0850 333 5555', email:'b2b@mediamarkt.com.tr',       address:'Nispetiye Cad. 12, Beşiktaş',           taxNumber:'9482130567', city:'İstanbul', totalSales:1574383, totalPayments:1288800, orderCount:4, lastOrder:'2026-03-08' },
    [cid(3)]:  { phone:'0850 484 2884', email:'tedarik@vatanbilgisayar.com', address:'Kavacık Mah. Rüzgarlıbahçe, Beykoz',   taxNumber:'3740281956', city:'İstanbul', totalSales:1258921, totalPayments:1131982, orderCount:4, lastOrder:'2026-02-13' },
    [cid(4)]:  { phone:'0800 300 3000', email:'vendor@amazon.com.tr',        address:'Sarıyer, İstanbul',                     taxNumber:'6291847503', city:'İstanbul', totalSales:2150945, totalPayments: 462818, orderCount:6, lastOrder:'2026-03-14' },
    [cid(5)]:  { phone:'0850 252 4444', email:'tedarikci@hepsiburada.com',   address:'Güzelyurt Mah., Küçükçekmece',          taxNumber:'5037826194', city:'İstanbul', totalSales: 705035, totalPayments: 634464, orderCount:4, lastOrder:'2026-02-22' },
    [cid(6)]:  { phone:'0850 532 0011', email:'magaza@n11.com',              address:'Çekmeköy Mah., Çekmeköy',               taxNumber:'4826519073', city:'İstanbul', totalSales: 379070, totalPayments: 157868, orderCount:4, lastOrder:'2026-02-25' },
    [cid(7)]:  { phone:'0850 222 3434', email:'tedarikci@ciceksepeti.com',   address:'Ümraniye Mah., Ümraniye',               taxNumber:'7153924068', city:'İstanbul', totalSales: 631954, totalPayments: 479971, orderCount:4, lastOrder:'2026-03-01' },
    [cid(8)]:  { phone:'0850 200 5000', email:'ticaret@migros.com.tr',       address:'Levazım Mah., Beşiktaş',                taxNumber:'8264751309', city:'İstanbul', totalSales: 352452, totalPayments: 301955, orderCount:4, lastOrder:'2026-03-05' },
    [cid(15)]: { phone:'0532 532 0000', email:'b2b@turkcell.com.tr',         address:'Maltepe Mah., Maltepe',                 taxNumber:'1947385026', city:'İstanbul', totalSales:2179957, totalPayments:1800000, orderCount:3, lastOrder:'2026-03-08' },
    [cid(16)]: { phone:'0850 225 5600', email:'ticaret@kocsistem.com.tr',    address:'Çobançeşme Mah., Bahçelievler',         taxNumber:'3619280457', city:'İstanbul', totalSales: 903987, totalPayments: 857974, orderCount:3, lastOrder:'2026-03-11' },
};

// ═════════════════════════════════════════════════════════════════════════════
// 4. SATIŞ SİPARİŞLERİ (20 adet)
// ═════════════════════════════════════════════════════════════════════════════
export const DEMO_SALES_ORDERS = [
    { id:soid(1),  orderNo:'SS-2026-001', customerCariAccountId:cid(1),  warehouseId:DEMO_WH_ID, status:OrderStatus.Approved, orderDateUtc:ago(72), totalAmount:1121482 },
    { id:soid(2),  orderNo:'SS-2026-002', customerCariAccountId:cid(2),  warehouseId:DEMO_WH_ID, status:OrderStatus.Approved, orderDateUtc:ago(68), totalAmount:1159983 },
    { id:soid(3),  orderNo:'SS-2026-003', customerCariAccountId:cid(3),  warehouseId:DEMO_WH_ID, status:OrderStatus.Approved, orderDateUtc:ago(65), totalAmount:514939  },
    { id:soid(4),  orderNo:'SS-2026-004', customerCariAccountId:cid(4),  warehouseId:DEMO_WH_ID, status:OrderStatus.Approved, orderDateUtc:ago(60), totalAmount:1613967 },
    { id:soid(5),  orderNo:'SS-2026-005', customerCariAccountId:cid(5),  warehouseId:DEMO_WH_ID, status:OrderStatus.Approved, orderDateUtc:ago(55), totalAmount:514590  },
    { id:soid(6),  orderNo:'SS-2026-006', customerCariAccountId:cid(6),  warehouseId:DEMO_WH_ID, status:OrderStatus.Approved, orderDateUtc:ago(50), totalAmount:221970  },
    { id:soid(7),  orderNo:'SS-2026-007', customerCariAccountId:cid(7),  warehouseId:DEMO_WH_ID, status:OrderStatus.Approved, orderDateUtc:ago(45), totalAmount:131973  },
    { id:soid(8),  orderNo:'SS-2026-008', customerCariAccountId:cid(8),  warehouseId:DEMO_WH_ID, status:OrderStatus.Approved, orderDateUtc:ago(42), totalAmount:198985  },
    { id:soid(9),  orderNo:'SS-2026-009', customerCariAccountId:cid(1),  warehouseId:DEMO_WH_ID, status:OrderStatus.Approved, orderDateUtc:ago(38), totalAmount:463993  },
    { id:soid(10), orderNo:'SS-2026-010', customerCariAccountId:cid(2),  warehouseId:DEMO_WH_ID, status:OrderStatus.Approved, orderDateUtc:ago(35), totalAmount:414400  },
    { id:soid(11), orderNo:'SS-2026-011', customerCariAccountId:cid(3),  warehouseId:DEMO_WH_ID, status:OrderStatus.Approved, orderDateUtc:ago(30), totalAmount:743982  },
    { id:soid(12), orderNo:'SS-2026-012', customerCariAccountId:cid(4),  warehouseId:DEMO_WH_ID, status:OrderStatus.Approved, orderDateUtc:ago(28), totalAmount:536978  },
    { id:soid(13), orderNo:'SS-2026-013', customerCariAccountId:cid(5),  warehouseId:DEMO_WH_ID, status:OrderStatus.Approved, orderDateUtc:ago(22), totalAmount:190445  },
    { id:soid(14), orderNo:'SS-2026-014', customerCariAccountId:cid(6),  warehouseId:DEMO_WH_ID, status:OrderStatus.Approved, orderDateUtc:ago(18), totalAmount:157100  },
    { id:soid(15), orderNo:'SS-2026-015', customerCariAccountId:cid(7),  warehouseId:DEMO_WH_ID, status:OrderStatus.Approved, orderDateUtc:ago(14), totalAmount:499981  },
    { id:soid(16), orderNo:'SS-2026-016', customerCariAccountId:cid(8),  warehouseId:DEMO_WH_ID, status:OrderStatus.Approved, orderDateUtc:ago(10), totalAmount:153467  },
    { id:soid(17), orderNo:'SS-2026-017', customerCariAccountId:cid(15), warehouseId:DEMO_WH_ID, status:OrderStatus.Approved, orderDateUtc:ago( 7), totalAmount:2179957 },
    { id:soid(18), orderNo:'SS-2026-018', customerCariAccountId:cid(16), warehouseId:DEMO_WH_ID, status:OrderStatus.Approved, orderDateUtc:ago( 4), totalAmount:903987  },
    { id:soid(19), orderNo:'SS-2026-019', customerCariAccountId:cid(1),  warehouseId:DEMO_WH_ID, status:OrderStatus.Draft,    orderDateUtc:ago( 2), totalAmount:449500  },
    { id:soid(20), orderNo:'SS-2026-020', customerCariAccountId:cid(4),  warehouseId:DEMO_WH_ID, status:OrderStatus.Draft,    orderDateUtc:ago( 1), totalAmount:1919965 },
];

// ═════════════════════════════════════════════════════════════════════════════
// 5. SATIN ALMA SİPARİŞLERİ (12 adet)
// ═════════════════════════════════════════════════════════════════════════════
export const DEMO_PURCHASE_ORDERS = [
    { id:poid(1),  orderNo:'AS-2026-001', supplierCariAccountId:cid(9),  warehouseId:DEMO_WH_ID, status:OrderStatus.Approved, orderDateUtc:ago(80), totalAmount:1450000 },
    { id:poid(2),  orderNo:'AS-2026-002', supplierCariAccountId:cid(10), warehouseId:DEMO_WH_ID, status:OrderStatus.Approved, orderDateUtc:ago(75), totalAmount:1800000 },
    { id:poid(3),  orderNo:'AS-2026-003', supplierCariAccountId:cid(10), warehouseId:DEMO_WH_ID, status:OrderStatus.Approved, orderDateUtc:ago(70), totalAmount:436000  },
    { id:poid(4),  orderNo:'AS-2026-004', supplierCariAccountId:cid(11), warehouseId:DEMO_WH_ID, status:OrderStatus.Approved, orderDateUtc:ago(65), totalAmount:355000  },
    { id:poid(5),  orderNo:'AS-2026-005', supplierCariAccountId:cid(12), warehouseId:DEMO_WH_ID, status:OrderStatus.Approved, orderDateUtc:ago(60), totalAmount:120000  },
    { id:poid(6),  orderNo:'AS-2026-006', supplierCariAccountId:cid(13), warehouseId:DEMO_WH_ID, status:OrderStatus.Approved, orderDateUtc:ago(55), totalAmount:161100  },
    { id:poid(7),  orderNo:'AS-2026-007', supplierCariAccountId:cid(14), warehouseId:DEMO_WH_ID, status:OrderStatus.Approved, orderDateUtc:ago(48), totalAmount:124000  },
    { id:poid(8),  orderNo:'AS-2026-008', supplierCariAccountId:cid(15), warehouseId:DEMO_WH_ID, status:OrderStatus.Approved, orderDateUtc:ago(40), totalAmount:472000  },
    { id:poid(9),  orderNo:'AS-2026-009', supplierCariAccountId:cid(15), warehouseId:DEMO_WH_ID, status:OrderStatus.Approved, orderDateUtc:ago(32), totalAmount:249000  },
    { id:poid(10), orderNo:'AS-2026-010', supplierCariAccountId:cid(16), warehouseId:DEMO_WH_ID, status:OrderStatus.Approved, orderDateUtc:ago(20), totalAmount:732500  },
    { id:poid(11), orderNo:'AS-2026-011', supplierCariAccountId:cid(16), warehouseId:DEMO_WH_ID, status:OrderStatus.Draft,    orderDateUtc:ago( 5), totalAmount:528000  },
    { id:poid(12), orderNo:'AS-2026-012', supplierCariAccountId:cid(9),  warehouseId:DEMO_WH_ID, status:OrderStatus.Draft,    orderDateUtc:ago( 2), totalAmount:790000  },
];

// ═════════════════════════════════════════════════════════════════════════════
// 6. STOK HAREKETLERİ (33 adet)
// ═════════════════════════════════════════════════════════════════════════════
export const DEMO_STOCK_MOVEMENTS = [
    // Girişler
    { id:smid(1),  warehouseId:DEMO_WH_ID, productId:pid(1),  type:StockMovementType.In,  quantity:15, unitPrice:22000, movementDateUtc:ago(79), referenceNo:'GS-AS-2026-001' },
    { id:smid(2),  warehouseId:DEMO_WH_ID, productId:pid(6),  type:StockMovementType.In,  quantity:20, unitPrice:38000, movementDateUtc:ago(79), referenceNo:'GS-AS-2026-001' },
    { id:smid(3),  warehouseId:DEMO_WH_ID, productId:pid(10), type:StockMovementType.In,  quantity:10, unitPrice:25000, movementDateUtc:ago(79), referenceNo:'GS-AS-2026-001' },
    { id:smid(4),  warehouseId:DEMO_WH_ID, productId:pid(26), type:StockMovementType.In,  quantity:20, unitPrice:5500,  movementDateUtc:ago(79), referenceNo:'GS-AS-2026-001' },
    { id:smid(5),  warehouseId:DEMO_WH_ID, productId:pid(5),  type:StockMovementType.In,  quantity:20, unitPrice:48000, movementDateUtc:ago(74), referenceNo:'GS-AS-2026-002' },
    { id:smid(6),  warehouseId:DEMO_WH_ID, productId:pid(9),  type:StockMovementType.In,  quantity:10, unitPrice:32000, movementDateUtc:ago(74), referenceNo:'GS-AS-2026-002' },
    { id:smid(7),  warehouseId:DEMO_WH_ID, productId:pid(12), type:StockMovementType.In,  quantity: 8, unitPrice:65000, movementDateUtc:ago(74), referenceNo:'GS-AS-2026-002' },
    { id:smid(8),  warehouseId:DEMO_WH_ID, productId:pid(27), type:StockMovementType.In,  quantity:10, unitPrice:18000, movementDateUtc:ago(69), referenceNo:'GS-AS-2026-003' },
    { id:smid(9),  warehouseId:DEMO_WH_ID, productId:pid(3),  type:StockMovementType.In,  quantity: 5, unitPrice:45000, movementDateUtc:ago(64), referenceNo:'GS-AS-2026-004' },
    { id:smid(10), warehouseId:DEMO_WH_ID, productId:pid(16), type:StockMovementType.In,  quantity:20, unitPrice:6500,  movementDateUtc:ago(64), referenceNo:'GS-AS-2026-004' },
    { id:smid(11), warehouseId:DEMO_WH_ID, productId:pid(20), type:StockMovementType.In,  quantity:10, unitPrice:12000, movementDateUtc:ago(59), referenceNo:'GS-AS-2026-005' },
    { id:smid(12), warehouseId:DEMO_WH_ID, productId:pid(21), type:StockMovementType.In,  quantity:12, unitPrice:7800,  movementDateUtc:ago(54), referenceNo:'GS-AS-2026-006' },
    { id:smid(13), warehouseId:DEMO_WH_ID, productId:pid(22), type:StockMovementType.In,  quantity:15, unitPrice:4500,  movementDateUtc:ago(54), referenceNo:'GS-AS-2026-006' },
    // Çıkışlar
    { id:smid(14), warehouseId:DEMO_WH_ID, productId:pid(5),  type:StockMovementType.Out, quantity:10, unitPrice:59999, movementDateUtc:ago(71), referenceNo:'CS-SS-2026-001' },
    { id:smid(15), warehouseId:DEMO_WH_ID, productId:pid(6),  type:StockMovementType.Out, quantity: 8, unitPrice:47999, movementDateUtc:ago(71), referenceNo:'CS-SS-2026-001' },
    { id:smid(16), warehouseId:DEMO_WH_ID, productId:pid(1),  type:StockMovementType.Out, quantity: 5, unitPrice:27500, movementDateUtc:ago(71), referenceNo:'CS-SS-2026-001' },
    { id:smid(17), warehouseId:DEMO_WH_ID, productId:pid(12), type:StockMovementType.Out, quantity: 5, unitPrice:79999, movementDateUtc:ago(67), referenceNo:'CS-SS-2026-002' },
    { id:smid(18), warehouseId:DEMO_WH_ID, productId:pid(13), type:StockMovementType.Out, quantity: 4, unitPrice:69999, movementDateUtc:ago(67), referenceNo:'CS-SS-2026-002' },
    { id:smid(19), warehouseId:DEMO_WH_ID, productId:pid(9),  type:StockMovementType.Out, quantity: 6, unitPrice:39999, movementDateUtc:ago(64), referenceNo:'CS-SS-2026-003' },
    { id:smid(20), warehouseId:DEMO_WH_ID, productId:pid(5),  type:StockMovementType.Out, quantity:15, unitPrice:59999, movementDateUtc:ago(59), referenceNo:'CS-SS-2026-004' },
    { id:smid(21), warehouseId:DEMO_WH_ID, productId:pid(6),  type:StockMovementType.Out, quantity:12, unitPrice:47999, movementDateUtc:ago(59), referenceNo:'CS-SS-2026-004' },
    { id:smid(22), warehouseId:DEMO_WH_ID, productId:pid(1),  type:StockMovementType.Out, quantity: 8, unitPrice:27500, movementDateUtc:ago(54), referenceNo:'CS-SS-2026-005' },
    { id:smid(23), warehouseId:DEMO_WH_ID, productId:pid(3),  type:StockMovementType.Out, quantity: 4, unitPrice:54900, movementDateUtc:ago(54), referenceNo:'CS-SS-2026-005' },
    { id:smid(24), warehouseId:DEMO_WH_ID, productId:pid(16), type:StockMovementType.Out, quantity:12, unitPrice:8500,  movementDateUtc:ago(49), referenceNo:'CS-SS-2026-006' },
    { id:smid(25), warehouseId:DEMO_WH_ID, productId:pid(17), type:StockMovementType.Out, quantity:10, unitPrice:6999,  movementDateUtc:ago(49), referenceNo:'CS-SS-2026-006' },
    { id:smid(26), warehouseId:DEMO_WH_ID, productId:pid(24), type:StockMovementType.Out, quantity:15, unitPrice:3999,  movementDateUtc:ago(44), referenceNo:'CS-SS-2026-007' },
    { id:smid(27), warehouseId:DEMO_WH_ID, productId:pid(23), type:StockMovementType.Out, quantity: 6, unitPrice:13500, movementDateUtc:ago(41), referenceNo:'CS-SS-2026-008' },
    { id:smid(28), warehouseId:DEMO_WH_ID, productId:pid(12), type:StockMovementType.Out, quantity: 4, unitPrice:79999, movementDateUtc:ago(37), referenceNo:'CS-SS-2026-009' },
    { id:smid(29), warehouseId:DEMO_WH_ID, productId:pid(6),  type:StockMovementType.Out, quantity:10, unitPrice:47999, movementDateUtc:ago(29), referenceNo:'CS-SS-2026-011' },
    { id:smid(30), warehouseId:DEMO_WH_ID, productId:pid(5),  type:StockMovementType.Out, quantity: 6, unitPrice:59999, movementDateUtc:ago(13), referenceNo:'CS-SS-2026-015' },
    { id:smid(31), warehouseId:DEMO_WH_ID, productId:pid(26), type:StockMovementType.Out, quantity: 8, unitPrice:7499,  movementDateUtc:ago(13), referenceNo:'CS-SS-2026-015' },
    // İade girişleri
    { id:smid(32), warehouseId:DEMO_WH_ID, productId:pid(5),  type:StockMovementType.In,  quantity: 2, unitPrice:48000, movementDateUtc:ago( 9), referenceNo:'IADE-SS-001' },
    { id:smid(33), warehouseId:DEMO_WH_ID, productId:pid(12), type:StockMovementType.In,  quantity: 1, unitPrice:65000, movementDateUtc:ago( 3), referenceNo:'IADE-SS-002' },
];

// ═════════════════════════════════════════════════════════════════════════════
// 7. FİNANS HAREKETLERİ (22 adet)
// ═════════════════════════════════════════════════════════════════════════════
export const DEMO_FINANCE_MOVEMENTS = [
    { id:fmid(1),  cariAccountId:cid(1),  type:FinanceMovementType.Income,  amount:1121482, movementDateUtc:ago(70), description:'Teknosa SS-2026-001 tahsilat',          referenceNo:'TAH-2026-001' },
    { id:fmid(2),  cariAccountId:cid(2),  type:FinanceMovementType.Income,  amount:1159983, movementDateUtc:ago(66), description:'Media Markt SS-2026-002 tahsilat',       referenceNo:'TAH-2026-002' },
    { id:fmid(3),  cariAccountId:cid(3),  type:FinanceMovementType.Income,  amount:388000,  movementDateUtc:ago(63), description:'Vatan SS-2026-003 tahsilat',              referenceNo:'TAH-2026-003' },
    { id:fmid(4),  cariAccountId:cid(4),  type:FinanceMovementType.Income,  amount:1613967, movementDateUtc:ago(58), description:'Amazon TR SS-2026-004 tahsilat',          referenceNo:'TAH-2026-004' },
    { id:fmid(5),  cariAccountId:cid(5),  type:FinanceMovementType.Income,  amount:444019,  movementDateUtc:ago(53), description:'Hepsiburada SS-2026-005 kısmi tahsilat',  referenceNo:'TAH-2026-005' },
    { id:fmid(6),  cariAccountId:cid(6),  type:FinanceMovementType.Income,  amount:221970,  movementDateUtc:ago(48), description:'N11 SS-2026-006 tahsilat',                referenceNo:'TAH-2026-006' },
    { id:fmid(7),  cariAccountId:cid(7),  type:FinanceMovementType.Income,  amount:131973,  movementDateUtc:ago(43), description:'ÇiçekSepeti SS-2026-007 tahsilat',        referenceNo:'TAH-2026-007' },
    { id:fmid(8),  cariAccountId:cid(8),  type:FinanceMovementType.Income,  amount:148488,  movementDateUtc:ago(40), description:'Migros SS-2026-008 kısmi ödeme',          referenceNo:'TAH-2026-008' },
    { id:fmid(9),  cariAccountId:cid(1),  type:FinanceMovementType.Income,  amount:463993,  movementDateUtc:ago(36), description:'Teknosa SS-2026-009 tahsilat',             referenceNo:'TAH-2026-009' },
    { id:fmid(10), cariAccountId:cid(2),  type:FinanceMovementType.Income,  amount:414400,  movementDateUtc:ago(33), description:'Media Markt SS-2026-010 tahsilat',        referenceNo:'TAH-2026-010' },
    { id:fmid(11), cariAccountId:cid(15), type:FinanceMovementType.Income,  amount:1800000, movementDateUtc:ago( 6), description:'Turkcell SS-2026-017 tahsilat',            referenceNo:'TAH-2026-011' },
    { id:fmid(12), cariAccountId:cid(16), type:FinanceMovementType.Income,  amount:950000,  movementDateUtc:ago( 3), description:'Koç Sistem SS-2026-018 avans ödemesi',    referenceNo:'TAH-2026-012' },
    { id:fmid(13), cariAccountId:cid(9),  type:FinanceMovementType.Expense, amount:1450000, movementDateUtc:ago(78), description:'Samsung AS-2026-001 ödeme',                referenceNo:'ODE-2026-001' },
    { id:fmid(14), cariAccountId:cid(10), type:FinanceMovementType.Expense, amount:1800000, movementDateUtc:ago(73), description:'Apple AS-2026-002 ödeme',                  referenceNo:'ODE-2026-002' },
    { id:fmid(15), cariAccountId:cid(10), type:FinanceMovementType.Expense, amount:436000,  movementDateUtc:ago(68), description:'Apple AS-2026-003 kısmi ödeme',            referenceNo:'ODE-2026-003' },
    { id:fmid(16), cariAccountId:cid(11), type:FinanceMovementType.Expense, amount:355000,  movementDateUtc:ago(63), description:'Sony AS-2026-004 ödeme',                   referenceNo:'ODE-2026-004' },
    { id:fmid(17), cariAccountId:cid(12), type:FinanceMovementType.Expense, amount:120000,  movementDateUtc:ago(58), description:'BSH AS-2026-005 ödeme',                    referenceNo:'ODE-2026-005' },
    { id:fmid(18), cariAccountId:cid(13), type:FinanceMovementType.Expense, amount:161100,  movementDateUtc:ago(53), description:'Arçelik AS-2026-006 ödeme',                referenceNo:'ODE-2026-006' },
    { id:fmid(19), cariAccountId:cid(14), type:FinanceMovementType.Expense, amount:124000,  movementDateUtc:ago(46), description:'Logitech AS-2026-007 ödeme',               referenceNo:'ODE-2026-007' },
    { id:fmid(20), cariAccountId:cid(15), type:FinanceMovementType.Expense, amount:472000,  movementDateUtc:ago(38), description:'Turkcell AS-2026-008 ödeme',               referenceNo:'ODE-2026-008' },
    { id:fmid(21), cariAccountId:cid(15), type:FinanceMovementType.Expense, amount:249000,  movementDateUtc:ago(30), description:'Turkcell AS-2026-009 ödeme',               referenceNo:'ODE-2026-009' },
    { id:fmid(22), cariAccountId:cid(16), type:FinanceMovementType.Expense, amount:732500,  movementDateUtc:ago(18), description:'Koç Sistem AS-2026-010 ödeme',             referenceNo:'ODE-2026-010' },
];

// ═════════════════════════════════════════════════════════════════════════════
// 8. FATURALAR (18 adet — EFatura + EArsiv karışık)
// ═════════════════════════════════════════════════════════════════════════════
const mkInv = (n: number, type: InvoiceType, cat: InvoiceCategory, cariIdx: number,
               cariName: string,
               rawItems: { qty: number; price: number; tax: number; pIdx: number }[],
               issueDaysAgo: number, dueDaysFromNow: number) => {
    const t = ivTotals(rawItems);
    const invoiceId = ivid(n);
    const items = rawItems.map((ri, i) => {
        const p = DEMO_PRODUCTS[ri.pIdx - 1]!;
        const base = ri.qty * ri.price;
        const taxAmt = Math.round(base * ri.tax);
        return {
            id: `0000000a-${String(n).padStart(4,'0')}-0000-0000-${String(i+1).padStart(12,'0')}`,
            invoiceId,
            productId: p.id,
            productName: p.name,
            barcode: p.barcodeEan13 || '',
            quantity: ri.qty,
            unit: 'Adet',
            unitPrice: ri.price,
            discountRate: 0,
            discountAmount: 0,
            taxRate: Math.round(ri.tax * 100),
            taxAmount: taxAmt,
            lineTotal: base + taxAmt,
        };
    });
    return {
        id: invoiceId,
        invoiceNumber: `${type === InvoiceType.EFatura ? 'EF' : 'EA'}2026${String(n).padStart(6,'0')}`,
        invoiceType: type, invoiceCategory: cat,
        status: InvoiceStatus.Approved,
        cariAccountId: cid(cariIdx), cariAccountName: cariName, taxNumber: '',
        issueDate: ago(issueDaysAgo).split('T')[0],
        dueDate: fwd(dueDaysFromNow),
        ...t, currency: 'TRY',
        createdAt: ago(issueDaysAgo),
        items,
    };
};

// EFatura — büyük müşteriler ve tedarikçiler
const EF_INVOICES = [
    mkInv( 1, InvoiceType.EFatura, InvoiceCategory.Satis,  1, 'Teknosa İç ve Dış Ticaret A.Ş.',               [{qty:10,price:59999,tax:0.20,pIdx:5},{qty:8,price:47999,tax:0.20,pIdx:6},{qty:5,price:27500,tax:0.20,pIdx:1}],                    71, 30),
    mkInv( 2, InvoiceType.EFatura, InvoiceCategory.Satis,  2, 'Media Markt Turkey A.Ş.',                       [{qty:5,price:79999,tax:0.20,pIdx:12},{qty:4,price:69999,tax:0.20,pIdx:13}],                                                    67, 30),
    mkInv( 3, InvoiceType.EFatura, InvoiceCategory.Satis,  4, 'Amazon Türkiye Perakende Ltd. Şti.',            [{qty:15,price:59999,tax:0.20,pIdx:5},{qty:12,price:47999,tax:0.20,pIdx:6},{qty:6,price:22999,tax:0.20,pIdx:27}],               59, 30),
    mkInv( 4, InvoiceType.EFatura, InvoiceCategory.Satis, 15, 'Turkcell Teknoloji A.Ş.',                       [{qty:20,price:47999,tax:0.20,pIdx:6},{qty:15,price:59999,tax:0.20,pIdx:5},{qty:8,price:39999,tax:0.20,pIdx:9}],                6, 45),
    mkInv( 5, InvoiceType.EFatura, InvoiceCategory.Satis, 16, 'Koç Sistem Bilgi ve İletişim Hizmetleri A.Ş.', [{qty:6,price:79999,tax:0.20,pIdx:12},{qty:4,price:69999,tax:0.20,pIdx:13},{qty:3,price:47999,tax:0.20,pIdx:15}],               3, 45),
    mkInv( 6, InvoiceType.EFatura, InvoiceCategory.Iade,   4, 'Amazon Türkiye Perakende Ltd. Şti.',            [{qty:1,price:79999,tax:0.20,pIdx:12}],                                                                                        20, 15),
    mkInv( 7, InvoiceType.EFatura, InvoiceCategory.Tevkifat,  9, 'Samsung Electronics Türkiye Ltd. Şti.',      [{qty:15,price:22000,tax:0.20,pIdx:1},{qty:20,price:38000,tax:0.20,pIdx:6},{qty:20,price:5500,tax:0.20,pIdx:26}],               78,  0),
    mkInv( 8, InvoiceType.EFatura, InvoiceCategory.Tevkifat, 10, 'Apple Distribution International Ltd.',      [{qty:20,price:48000,tax:0.20,pIdx:5},{qty:10,price:32000,tax:0.20,pIdx:9},{qty:8,price:65000,tax:0.20,pIdx:12}],              73,  0),
    mkInv( 9, InvoiceType.EFatura, InvoiceCategory.Tevkifat, 11, 'Sony Türkiye Ltd.',                          [{qty:5,price:45000,tax:0.20,pIdx:3},{qty:20,price:6500,tax:0.20,pIdx:16}],                                                    63,  0),
    mkInv(10, InvoiceType.EFatura, InvoiceCategory.Tevkifat, 12, 'BSH Ev Aletleri San. ve Tic. A.Ş.',         [{qty:10,price:12000,tax:0.20,pIdx:20}],                                                                                       58,  0),
];

// EArsiv — orta/küçük müşteriler
const EA_INVOICES = [
    mkInv(11, InvoiceType.EArsiv, InvoiceCategory.Satis,  3, 'Vatan Bilgisayar Ticaret A.Ş.',          [{qty:6,price:39999,tax:0.20,pIdx:9},{qty:5,price:31999,tax:0.20,pIdx:10},{qty:20,price:1999,tax:0.10,pIdx:30}],     64, 30),
    mkInv(12, InvoiceType.EArsiv, InvoiceCategory.Satis,  5, 'Hepsiburada Elektronik Ticaret A.Ş.',    [{qty:8,price:27500,tax:0.20,pIdx:1},{qty:4,price:54900,tax:0.20,pIdx:3},{qty:10,price:7499,tax:0.20,pIdx:26}],      54, 30),
    mkInv(13, InvoiceType.EArsiv, InvoiceCategory.Satis,  6, 'N11 Ticaret A.Ş.',                       [{qty:12,price:8500,tax:0.20,pIdx:16},{qty:10,price:6999,tax:0.20,pIdx:17},{qty:20,price:2499,tax:0.20,pIdx:18}],   49, 30),
    mkInv(14, InvoiceType.EArsiv, InvoiceCategory.Satis,  7, 'ÇiçekSepeti E-Ticaret A.Ş.',            [{qty:15,price:3999,tax:0.20,pIdx:24},{qty:12,price:5999,tax:0.20,pIdx:22}],                                        44, 30),
    mkInv(15, InvoiceType.EArsiv, InvoiceCategory.Satis,  8, 'Migros Ticaret A.Ş.',                    [{qty:6,price:13500,tax:0.20,pIdx:23},{qty:8,price:5999,tax:0.20,pIdx:25},{qty:7,price:9999,tax:0.20,pIdx:21}],    41, 30),
    mkInv(16, InvoiceType.EArsiv, InvoiceCategory.Satis,  1, 'Teknosa İç ve Dış Ticaret A.Ş.',        [{qty:4,price:79999,tax:0.20,pIdx:12},{qty:3,price:47999,tax:0.20,pIdx:15}],                                        37, 30),
    mkInv(17, InvoiceType.EArsiv, InvoiceCategory.Satis,  2, 'Media Markt Turkey A.Ş.',                [{qty:6,price:27500,tax:0.20,pIdx:1},{qty:4,price:34900,tax:0.20,pIdx:2}],                                         34, 30),
    mkInv(18, InvoiceType.EArsiv, InvoiceCategory.Iade,   1, 'Teknosa İç ve Dış Ticaret A.Ş.',        [{qty:2,price:59999,tax:0.20,pIdx:5}],                                                                              25, 15),
];

export const DEMO_EFATURA_INVOICES = EF_INVOICES;
export const DEMO_EARSIV_INVOICES  = EA_INVOICES;
export const DEMO_ALL_INVOICES     = [...EF_INVOICES, ...EA_INVOICES];

// ═════════════════════════════════════════════════════════════════════════════
// 9. RAPOR VERİLERİ
// ═════════════════════════════════════════════════════════════════════════════

export const DEMO_SALES_REPORT = [
    { date: ago(75).split('T')[0], orderCount: 3, totalAmount:1270000, topProduct: 'Apple iPhone 15 Pro 256GB' },
    { date: ago(60).split('T')[0], orderCount: 5, totalAmount:2128557, topProduct: 'Samsung Galaxy S24 Ultra 512GB' },
    { date: ago(45).split('T')[0], orderCount: 4, totalAmount: 816958, topProduct: 'Apple MacBook Pro M3 14"' },
    { date: ago(30).split('T')[0], orderCount: 6, totalAmount:1483360, topProduct: 'Apple iPhone 15 Pro 256GB' },
    { date: ago(15).split('T')[0], orderCount: 5, totalAmount:2839402, topProduct: 'Samsung Galaxy S24 Ultra 512GB' },
    { date: ago( 7).split('T')[0], orderCount: 3, totalAmount:3083944, topProduct: 'Apple MacBook Pro M3 14"' },
];

export const DEMO_PURCHASES_REPORT = [
    { date: ago(80).split('T')[0], orderCount: 2, totalAmount:1450000, topSupplier: 'Samsung Electronics Türkiye Ltd. Şti.' },
    { date: ago(65).split('T')[0], orderCount: 3, totalAmount:2591000, topSupplier: 'Apple Distribution International Ltd.' },
    { date: ago(50).split('T')[0], orderCount: 2, totalAmount: 281100, topSupplier: 'Arçelik A.Ş.' },
    { date: ago(35).split('T')[0], orderCount: 2, totalAmount: 721000, topSupplier: 'Turkcell Teknoloji A.Ş.' },
    { date: ago(18).split('T')[0], orderCount: 1, totalAmount: 732500, topSupplier: 'Koç Sistem Bilgi ve İletişim Hizmetleri A.Ş.' },
];

export const DEMO_STOCK_REPORT = [
    { productId:pid(1),  productName:'Samsung 65" Neo QLED 4K QN90C',          barcode:'8806094101001', warehouseName:'Merkez Ana Depo',  balance: 12, unit:'EA', totalValue: 264000  },
    { productId:pid(3),  productName:'Sony 75" BRAVIA XR X95L 8K MiniLED',     barcode:'4548736103003', warehouseName:'Merkez Ana Depo',  balance:  4, unit:'EA', totalValue: 180000  },
    { productId:pid(5),  productName:'Apple iPhone 15 Pro 256GB',               barcode:'1901995205005', warehouseName:'Merkez Ana Depo',  balance:  9, unit:'EA', totalValue: 432000  },
    { productId:pid(6),  productName:'Samsung Galaxy S24 Ultra 512GB',          barcode:'8806094206006', warehouseName:'Merkez Ana Depo',  balance: 10, unit:'EA', totalValue: 380000  },
    { productId:pid(9),  productName:'Apple iPad Pro 13" M2 WiFi 256GB',        barcode:'1901995309009', warehouseName:'Merkez Ana Depo',  balance: 12, unit:'EA', totalValue: 384000  },
    { productId:pid(10), productName:'Samsung Galaxy Tab S9 Ultra 512GB',       barcode:'8806094310010', warehouseName:'Merkez Ana Depo',  balance: 10, unit:'EA', totalValue: 250000  },
    { productId:pid(12), productName:'Apple MacBook Pro M3 14" 512GB',          barcode:'1901995512012', warehouseName:'Merkez Ana Depo',  balance:  5, unit:'EA', totalValue: 325000  },
    { productId:pid(16), productName:'Sony WH-1000XM5 Kablosuz ANC Kulaklık',   barcode:'4548736816016', warehouseName:'Merkez Ana Depo',  balance: 16, unit:'EA', totalValue: 104000  },
    { productId:pid(20), productName:'Bosch WAX32EH0TR 10kg Çamaşır Makinesi', barcode:'4242002820020', warehouseName:'Merkez Ana Depo',  balance: 10, unit:'EA', totalValue: 120000  },
    { productId:pid(21), productName:'Beko DIN 28430 A++ Bulaşık Makinesi',    barcode:'8690842821021', warehouseName:'Merkez Ana Depo',  balance: 12, unit:'EA', totalValue:  93600  },
    { productId:pid(22), productName:'Arçelik 6102 HE Buharlı Fırın',          barcode:'8690849822022', warehouseName:'Merkez Ana Depo',  balance: 15, unit:'EA', totalValue:  67500  },
    { productId:pid(26), productName:'Samsung Galaxy Watch 6 Classic 47mm',     barcode:'8806094826026', warehouseName:'Merkez Ana Depo',  balance: 14, unit:'EA', totalValue:  77000  },
    { productId:pid(27), productName:'Apple Watch Ultra 2 49mm Titanyum',       barcode:'1901995827027', warehouseName:'Merkez Ana Depo',  balance: 10, unit:'EA', totalValue: 180000  },
    { productId:pid(29), productName:'Toshiba HDWL110 1TB 2.5" SSD',           barcode:'4547808829029', warehouseName:'Merkez Ana Depo',  balance: 40, unit:'EA', totalValue:  72000  },
    { productId:pid(30), productName:'Logitech MX Keys S Advanced Klavye',      barcode:'5099206830030', warehouseName:'Merkez Ana Depo',  balance: 35, unit:'EA', totalValue:  49000  },
];

export const DEMO_CARI_BALANCES = DEMO_CARIS.map(c => ({
    cariAccountId: c.id,
    name: c.name,
    type: c.type === CariType.Buyer ? 'Alıcı' : c.type === CariType.Supplier ? 'Tedarikçi' : 'Her İkisi',
    balance: c.currentBalance,
    lastTransaction: ago(Math.floor(Math.random() * 30 + 1)).split('T')[0],
}));

export const DEMO_CARI_AGING = [
    { cariAccountId:cid(1),  name:'Teknosa İç ve Dış Ticaret A.Ş.',       current:463993, days30:197495, days60:0,      days90:0,     over90:0,      total:661488 },
    { cariAccountId:cid(2),  name:'Media Markt Turkey A.Ş.',               current:414400, days30:0,      days60:285583, days90:0,     over90:0,      total:285583 },
    { cariAccountId:cid(3),  name:'Vatan Bilgisayar Ticaret A.Ş.',         current:743982, days30:0,      days60:0,      days90:0,     over90:126939, total:126939 },
    { cariAccountId:cid(4),  name:'Amazon Türkiye Perakende Ltd. Şti.',    current:536978, days30:0,      days60:536978, days90:0,     over90:0,      total:1688127},
    { cariAccountId:cid(7),  name:'ÇiçekSepeti E-Ticaret A.Ş.',           current:631954, days30:499981, days60:131973, days90:0,     over90:0,      total:631954 },
];

export const DEMO_INCOME_EXPENSE = {
    totalIncome:  8878222,
    totalExpense: 4569600,
    netProfit:    4308622,
    items: [
        { date: ago(75).split('T')[0], income:1270000, expense:1450000 },
        { date: ago(60).split('T')[0], income:2128557, expense:2236000 },
        { date: ago(45).split('T')[0], income: 816958, expense: 521100 },
        { date: ago(30).split('T')[0], income:1483360, expense: 362500 },
        { date: ago(15).split('T')[0], income:2839402, expense:       0 },
        { date: ago( 3).split('T')[0], income: 339945, expense:       0 },
    ],
};

export const DEMO_CASH_FLOW = [
    { date: fwd(7),  expectedIn: 661488, expectedOut:       0, net:  661488 },
    { date: fwd(15), expectedIn: 285583, expectedOut:  910000, net: -624417 },
    { date: fwd(30), expectedIn:1688127, expectedOut: 528000,  net: 1160127 },
    { date: fwd(45), expectedIn: 903987, expectedOut: 790000,  net:  113987 },
];

export const DEMO_DUE_LIST = [
    { cariAccountId:cid(3),  cariCode:'MUS-003', cariName:'Vatan Bilgisayar Ticaret A.Ş.',      dueDate: ago(15).split('T')[0], openAmount:126939, overdueDays:15 },
    { cariAccountId:cid(2),  cariCode:'MUS-002', cariName:'Media Markt Turkey A.Ş.',             dueDate: ago( 5).split('T')[0], openAmount:285583, overdueDays: 5 },
    { cariAccountId:cid(1),  cariCode:'MUS-001', cariName:'Teknosa İç ve Dış Ticaret A.Ş.',     dueDate: fwd( 8).split('T')[0], openAmount:661488, overdueDays: 0 },
    { cariAccountId:cid(4),  cariCode:'MUS-004', cariName:'Amazon Türkiye Perakende Ltd. Şti.', dueDate: fwd(15).split('T')[0], openAmount:1688127,overdueDays: 0 },
];

export const DEMO_PRODUCT_PROFITABILITY = [
    { productId:pid(5),  productCode:'PHN-001', productName:'Apple iPhone 15 Pro 256GB',        quantity:56, revenue:3359944, cost:2688000, profit: 671944, marginPercent:20.0 },
    { productId:pid(6),  productCode:'PHN-002', productName:'Samsung Galaxy S24 Ultra 512GB',   quantity:50, revenue:2399950, cost:1900000, profit: 499950, marginPercent:20.8 },
    { productId:pid(12), productCode:'LPT-001', productName:'Apple MacBook Pro M3 14" 512GB',   quantity:18, revenue:1439982, cost:1170000, profit: 269982, marginPercent:18.8 },
    { productId:pid(13), productCode:'LPT-002', productName:'Dell XPS 15 i7 32GB 1TB',          quantity:12, revenue: 839988, cost: 660000, profit: 179988, marginPercent:21.4 },
    { productId:pid(1),  productCode:'TV-001',  productName:'Samsung 65" Neo QLED 4K QN90C',    quantity:13, revenue: 357500, cost: 286000, profit:  71500, marginPercent:20.0 },
    { productId:pid(3),  productCode:'TV-003',  productName:'Sony 75" BRAVIA XR X95L 8K',       quantity: 4, revenue: 219600, cost: 180000, profit:  39600, marginPercent:18.0 },
];

export const DEMO_CUSTOMER_PROFITABILITY = [
    { cariAccountId:cid(4),  cariCode:'MUS-004', cariName:'Amazon Türkiye Perakende Ltd. Şti.', revenue:2150945, cost:1674750, profit: 476195, marginPercent:22.1 },
    { cariAccountId:cid(15), cariCode:'HEM-001', cariName:'Turkcell Teknoloji A.Ş.',            revenue:2179957, cost:1742500, profit: 437457, marginPercent:20.1 },
    { cariAccountId:cid(1),  cariCode:'MUS-001', cariName:'Teknosa İç ve Dış Ticaret A.Ş.',    revenue:1585475, cost:1265750, profit: 319725, marginPercent:20.2 },
    { cariAccountId:cid(2),  cariCode:'MUS-002', cariName:'Media Markt Turkey A.Ş.',            revenue:1574383, cost:1238800, profit: 335583, marginPercent:21.3 },
    { cariAccountId:cid(16), cariCode:'HEM-002', cariName:'Koç Sistem Bilgi ve İletişim A.Ş.', revenue: 903987, cost: 725000, profit: 178987, marginPercent:19.8 },
];

export const DEMO_BRANCH_PROFITABILITY = [
    { branchId:BR1, branchCode:'MRK', branchName:'Merkez Şube',             revenue:10876753, cost:8701402, profit:2175351, marginPercent:20.0 },
    { branchId:BR2, branchCode:'AND', branchName:'İstanbul Anadolu Şubesi', revenue: 2179957, cost:1742500, profit: 437457, marginPercent:20.1 },
];

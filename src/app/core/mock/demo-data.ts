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

// ── Aktivite Logları (Tenant) ─────────────────────────────────────────────────
const alid = (n: number) => `0000000b-0000-0000-0000-${String(n).padStart(12,'0')}`;
const agoH = (days: number, h: number, m = 0): string => {
    const dt = new Date('2026-03-17T00:00:00Z');
    dt.setDate(dt.getDate() - days);
    dt.setUTCHours(h, m, 0, 0);
    return dt.toISOString();
};

type AL = { id:string; userId:string; userName:string; httpMethod:string; path:string; statusCode:number; durationMs:number; ipAddress:string; occurredAtUtc:string };
const al = (n:number, user:string, uid:string, m:string, path:string, status:number, ms:number, days:number, h:number, min=0): AL => ({
    id: alid(n), userId: uid, userName: user,
    httpMethod: m, path, statusCode: status, durationMs: ms,
    ipAddress: `192.168.1.${10 + (n % 20)}`,
    occurredAtUtc: agoH(days, h, min)
});

const U0 = '00000099-0000-0000-0000-000000000000'; // demo (giriş yapan kullanıcı)
const U1 = '00000099-0001-0000-0000-000000000001'; // test.admin
const U2 = '00000099-0002-0000-0000-000000000002'; // kasiyer1
const U3 = '00000099-0003-0000-0000-000000000003'; // muhasebe1

// Demo kullanıcısının kendi aktiviteleri (tenant bireysel görünüm)
export const DEMO_MY_ACTIVITY_LOGS: AL[] = [
    al(101, 'demo', U0, 'GET',    '/api/products',                         200,  91,  0, 15),
    al(102, 'demo', U0, 'GET',    '/api/invoices/e-fatura',                200, 118,  0, 14, 40),
    al(103, 'demo', U0, 'GET',    '/api/sales-orders',                     200, 104,  0, 14, 10),
    al(104, 'demo', U0, 'GET',    '/api/reports/sales',                    200, 298,  1, 16,  0),
    al(105, 'demo', U0, 'GET',    '/api/reports/stock',                    200, 276,  1, 16, 12),
    al(106, 'demo', U0, 'POST',   '/api/invoices',                         201, 423,  1, 11,  0),
    al(107, 'demo', U0, 'POST',   '/api/invoices/00000007-0000-0000-0000-000000000002/send', 200, 411, 1, 11, 15),
    al(108, 'demo', U0, 'GET',    '/api/cari-accounts/buyers',             200, 137,  2, 15, 30),
    al(109, 'demo', U0, 'POST',   '/api/cari-accounts',                    201, 245,  2, 15, 50),
    al(110, 'demo', U0, 'GET',    '/api/finance-movements',                200,  88,  2,  9, 45),
    al(111, 'demo', U0, 'POST',   '/api/finance-movements',                201, 214,  2, 10,  0),
    al(112, 'demo', U0, 'POST',   '/api/sales-orders',                     201, 198,  3, 13, 15),
    al(113, 'demo', U0, 'POST',   '/api/sales-orders/00000003-0000-0000-0000-000000000001/approve', 200, 156, 3, 13, 20),
    al(114, 'demo', U0, 'GET',    '/api/stock-movements',                  200,  95,  4, 10,  0),
    al(115, 'demo', U0, 'POST',   '/api/products',                         201, 312,  4, 11, 30),
    al(116, 'demo', U0, 'PUT',    '/api/products/00000001-0000-0000-0000-000000000002', 204, 167, 4, 11, 45),
    al(117, 'demo', U0, 'POST',   '/api/invoices',                         500, 1180, 5, 14,  0), // hata
    al(118, 'demo', U0, 'GET',    '/api/invoices/e-arsiv',                 200, 112,  5,  9, 20),
    al(119, 'demo', U0, 'POST',   '/api/purchase-orders',                  201, 289,  6, 14, 10),
    al(120, 'demo', U0, 'GET',    '/api/reports/cari-balances',            200, 334,  7, 15, 30),
    al(121, 'demo', U0, 'GET',    '/api/reports/income-expense',           200, 312,  7, 15, 45),
    al(122, 'demo', U0, 'POST',   '/api/stock-movements',                  201, 201,  8, 11,  0),
    al(123, 'demo', U0, 'DELETE', '/api/products/00000001-0000-0000-0000-000000000015', 204, 143, 10, 16, 0),
    al(124, 'demo', U0, 'GET',    '/api/cari-accounts/suppliers',          200, 109, 12, 10, 30),
    al(125, 'demo', U0, 'POST',   '/api/invoices',                         201, 398, 14, 11,  0),
    al(126, 'demo', U0, 'POST',   '/api/invoices/00000007-0000-0000-0000-000000000004/send', 200, 445, 14, 11, 20),
    al(127, 'demo', U0, 'GET',    '/api/reports/sales',                    200, 287, 20, 15,  0),
    al(128, 'demo', U0, 'PUT',    '/api/cari-accounts/00000002-0000-0000-0000-000000000003', 204, 178, 25, 10, 0),
    al(129, 'demo', U0, 'POST',   '/api/products',                         201, 356, 28, 14,  0),
    al(130, 'demo', U0, 'POST',   '/api/products',                         400, 134, 28, 14, 20), // hata
];

export const DEMO_MY_ACTIVITY_SUMMARY = {
    totalCount:        DEMO_MY_ACTIVITY_LOGS.length,
    todayCount:        3,
    errorCount:        DEMO_MY_ACTIVITY_LOGS.filter(l => l.statusCode >= 400).length,
    averageDurationMs: Math.round(DEMO_MY_ACTIVITY_LOGS.reduce((s,l) => s + l.durationMs, 0) / DEMO_MY_ACTIVITY_LOGS.length),
    lastActivityAtUtc: '2026-03-17T15:00:00.000Z',
};

export const DEMO_ACTIVITY_LOGS: AL[] = [
    // Bugün
    al( 1, 'test.admin',  U1, 'GET',    '/api/products',                        200,  87,  0, 14),
    al( 2, 'test.admin',  U1, 'GET',    '/api/sales-orders',                    200, 112,  0, 13, 45),
    al( 3, 'kasiyer1',    U2, 'POST',   '/api/sales-orders',                    201, 243,  0, 11, 20),
    al( 4, 'kasiyer1',    U2, 'GET',    '/api/products',                        200,  65,  0, 11, 18),
    al( 5, 'muhasebe1',   U3, 'GET',    '/api/invoices/e-fatura',               200, 134,  0,  9, 30),
    al( 6, 'muhasebe1',   U3, 'POST',   '/api/invoices/00000007-0000-0000-0000-000000000001/send', 200, 389, 0, 9, 35),
    // 1 gün önce
    al( 7, 'test.admin',  U1, 'POST',   '/api/products',                        201, 178,  1, 16),
    al( 8, 'test.admin',  U1, 'PUT',    '/api/products/00000001-0000-0000-0000-000000000003', 204, 155, 1, 16, 12),
    al( 9, 'kasiyer1',    U2, 'POST',   '/api/stock-movements',                 201, 203,  1, 14, 22),
    al(10, 'muhasebe1',   U3, 'GET',    '/api/finance-movements',               200,  98,  1, 10,  5),
    al(11, 'muhasebe1',   U3, 'POST',   '/api/finance-movements',               201, 221,  1, 10, 15),
    al(12, 'kasiyer1',    U2, 'GET',    '/api/sales-orders',                    200,  77,  1,  9, 48),
    al(13, 'kasiyer1',    U2, 'POST',   '/api/sales-orders/00000003-0000-0000-0000-000000000002/approve', 200, 145, 1, 9, 51),
    // 2 gün önce
    al(14, 'test.admin',  U1, 'GET',    '/api/reports/sales',                   200, 312,  2, 15, 30),
    al(15, 'test.admin',  U1, 'GET',    '/api/reports/stock',                   200, 287,  2, 15, 35),
    al(16, 'muhasebe1',   U3, 'POST',   '/api/invoices',                        201, 445,  2, 11,  0),
    al(17, 'muhasebe1',   U3, 'GET',    '/api/invoices/e-arsiv',                200, 101,  2, 10, 50),
    al(18, 'kasiyer1',    U2, 'POST',   '/api/purchase-orders',                 201, 334,  2,  9, 15),
    // 3 gün önce
    al(19, 'test.admin',  U1, 'GET',    '/api/cari-accounts/buyers',            200, 134,  3, 16, 20),
    al(20, 'test.admin',  U1, 'POST',   '/api/cari-accounts',                   201, 267,  3, 16, 35),
    al(21, 'kasiyer1',    U2, 'POST',   '/api/sales-orders',                    201, 198,  3, 13, 10),
    al(22, 'kasiyer1',    U2, 'GET',    '/api/stock-movements/balance',         200,  89,  3, 11,  0),
    al(23, 'muhasebe1',   U3, 'GET',    '/api/finance-movements',               200,  93,  3,  9, 45),
    al(24, 'muhasebe1',   U3, 'DELETE', '/api/finance-movements/00000006-0000-0000-0000-000000000005', 204, 113, 3, 9, 50),
    // 5 gün önce
    al(25, 'test.admin',  U1, 'GET',    '/api/products',                        200,  72,  5, 10,  0),
    al(26, 'test.admin',  U1, 'PUT',    '/api/cari-accounts/00000002-0000-0000-0000-000000000001', 204, 189, 5, 10, 20),
    al(27, 'kasiyer1',    U2, 'POST',   '/api/sales-orders',                    201, 222,  5, 14, 30),
    al(28, 'muhasebe1',   U3, 'POST',   '/api/invoices/00000007-0000-0000-0000-000000000003/send', 200, 402, 5, 11, 0),
    al(29, 'kasiyer1',    U2, 'POST',   '/api/products',                        400, 134,  5, 15, 10), // hata: eksik alan
    // 7 gün önce
    al(30, 'test.admin',  U1, 'GET',    '/api/reports/purchases',               200, 298,  7, 16,  0),
    al(31, 'test.admin',  U1, 'GET',    '/api/reports/cari-balances',           200, 243,  7, 16, 10),
    al(32, 'muhasebe1',   U3, 'GET',    '/api/invoices/e-fatura',               200, 119,  7,  9, 30),
    al(33, 'muhasebe1',   U3, 'POST',   '/api/finance-movements',               201, 209,  7, 10,  0),
    al(34, 'kasiyer1',    U2, 'POST',   '/api/purchase-orders/00000004-0000-0000-0000-000000000001/approve', 200, 167, 7, 11, 0),
    // 10 gün önce
    al(35, 'test.admin',  U1, 'POST',   '/api/products',                        201, 312, 10, 14,  0),
    al(36, 'test.admin',  U1, 'POST',   '/api/products',                        201, 289, 10, 14, 20),
    al(37, 'kasiyer1',    U2, 'POST',   '/api/stock-movements',                 201, 198, 10, 11, 45),
    al(38, 'muhasebe1',   U3, 'GET',    '/api/reports/income-expense',          200, 334, 10,  9, 20),
    al(39, 'kasiyer1',    U2, 'POST',   '/api/invoices',                        500, 1203,10, 15, 30), // hata: sunucu hatası
    // 14 gün önce
    al(40, 'test.admin',  U1, 'GET',    '/api/cari-accounts/suppliers',        200, 112, 14, 15,  0),
    al(41, 'test.admin',  U1, 'PUT',    '/api/products/00000001-0000-0000-0000-000000000007', 204, 145, 14, 15, 20),
    al(42, 'muhasebe1',   U3, 'POST',   '/api/invoices',                        201, 389, 14, 10,  0),
    al(43, 'muhasebe1',   U3, 'POST',   '/api/invoices/00000007-0000-0000-0000-000000000005/send', 200, 445, 14, 10, 15),
    al(44, 'kasiyer1',    U2, 'POST',   '/api/sales-orders',                    201, 212, 14, 13, 30),
    // 20 gün önce
    al(45, 'test.admin',  U1, 'DELETE', '/api/products/00000001-0000-0000-0000-000000000015', 204, 134, 20, 11,  0),
    al(46, 'test.admin',  U1, 'POST',   '/api/warehouses',                      201, 198, 20, 11, 20),
    al(47, 'muhasebe1',   U3, 'GET',    '/api/finance-movements',               200,  88, 20,  9, 45),
    al(48, 'kasiyer1',    U2, 'POST',   '/api/purchase-orders',                 201, 267, 20, 14,  0),
    // 30 gün önce
    al(49, 'test.admin',  U1, 'GET',    '/api/reports/sales',                   200, 312, 30, 16,  0),
    al(50, 'muhasebe1',   U3, 'POST',   '/api/invoices',                        201, 401, 30, 10,  0),
];

export const DEMO_ACTIVITY_SUMMARY = {
    totalCount:        DEMO_ACTIVITY_LOGS.length,
    todayCount:        DEMO_ACTIVITY_LOGS.filter(l => new Date(l.occurredAtUtc).toDateString() === new Date().toDateString()).length,
    errorCount:        DEMO_ACTIVITY_LOGS.filter(l => l.statusCode >= 400).length,
    uniqueUsers:       3,
    averageDurationMs: Math.round(DEMO_ACTIVITY_LOGS.reduce((s,l) => s + l.durationMs, 0) / DEMO_ACTIVITY_LOGS.length),
};

// ── Platform Admin — Tenant (Abone) Listesi ───────────────────────────────────
import { SubscriptionPlan, SubscriptionStatus } from '../models/user.model';

const paAgo = (days: number): string => {
    const d = new Date('2026-03-18T12:00:00Z');
    d.setDate(d.getDate() - days);
    return d.toISOString();
};

export const DEMO_PLATFORM_TENANTS = [
    { tenantId: 'aa000001-0000-0000-0000-000000000001', name: 'Altın Market A.Ş.',      code: 'ALTINMKT', plan: SubscriptionPlan.Pro,        assignedRole: '2. Kademe', status: SubscriptionStatus.Active,    maxUsers: 10, currentUserCount: 4,  subscriptionStartAtUtc: paAgo(180), lastActivityAtUtc: paAgo(0),  monthlyPrice: 1499 },
    { tenantId: 'aa000001-0000-0000-0000-000000000002', name: 'Yıldız Gıda Ltd. Şti.',  code: 'YLDIZGID', plan: SubscriptionPlan.Starter,    assignedRole: '1. Kademe', status: SubscriptionStatus.Active,    maxUsers:  5, currentUserCount: 2,  subscriptionStartAtUtc: paAgo(90),  lastActivityAtUtc: paAgo(1),  monthlyPrice: 499  },
    { tenantId: 'aa000001-0000-0000-0000-000000000003', name: 'Mavi Tekstil San. Tic.',  code: 'MAVITEKS', plan: SubscriptionPlan.Enterprise, assignedRole: '3. Kademe', status: SubscriptionStatus.Active,    maxUsers: 25, currentUserCount: 9,  subscriptionStartAtUtc: paAgo(365), lastActivityAtUtc: paAgo(0),  monthlyPrice: 3999 },
    { tenantId: 'aa000001-0000-0000-0000-000000000004', name: 'Güneş Elektronik',        code: 'GUNESELK', plan: SubscriptionPlan.Pro,        assignedRole: '2. Kademe', status: SubscriptionStatus.Trial,     maxUsers: 10, currentUserCount: 1,  subscriptionStartAtUtc: paAgo(14),  lastActivityAtUtc: paAgo(2),  monthlyPrice: 1499 },
    { tenantId: 'aa000001-0000-0000-0000-000000000005', name: 'Kaya İnşaat Malzemeleri', code: 'KAYAINST', plan: SubscriptionPlan.Starter,    assignedRole: '1. Kademe', status: SubscriptionStatus.Cancelled, maxUsers:  5, currentUserCount: 3,  subscriptionStartAtUtc: paAgo(60),  lastActivityAtUtc: paAgo(15), monthlyPrice: 499  },
    { tenantId: 'aa000001-0000-0000-0000-000000000006', name: 'Demir Otomotiv',           code: 'DEMIROTO', plan: SubscriptionPlan.Pro,        assignedRole: '2. Kademe', status: SubscriptionStatus.Active,    maxUsers: 10, currentUserCount: 5,  subscriptionStartAtUtc: paAgo(200), lastActivityAtUtc: paAgo(0),  monthlyPrice: 1499 },
    { tenantId: 'aa000001-0000-0000-0000-000000000007', name: 'Çiçek Pastanesi',          code: 'CICEKPST', plan: SubscriptionPlan.Starter,    assignedRole: '1. Kademe', status: SubscriptionStatus.Active,    maxUsers:  5, currentUserCount: 2,  subscriptionStartAtUtc: paAgo(45),  lastActivityAtUtc: paAgo(3),  monthlyPrice: 499  },
    { tenantId: 'aa000001-0000-0000-0000-000000000008', name: 'Bora Mobilya',             code: 'BORAMOB',  plan: SubscriptionPlan.Enterprise, assignedRole: '3. Kademe', status: SubscriptionStatus.Active,    maxUsers: 25, currentUserCount: 12, subscriptionStartAtUtc: paAgo(500), lastActivityAtUtc: paAgo(0),  monthlyPrice: 3999 },
    { tenantId: 'aa000001-0000-0000-0000-000000000009', name: 'Petek Eczanesi',           code: 'PETEKEZC', plan: SubscriptionPlan.Starter,    assignedRole: '1. Kademe', status: SubscriptionStatus.Cancelled, maxUsers:  5, currentUserCount: 0,  subscriptionStartAtUtc: paAgo(30),  lastActivityAtUtc: paAgo(30), monthlyPrice: 499  },
    { tenantId: 'aa000001-0000-0000-0000-000000000010', name: 'Ege Turizm A.Ş.',         code: 'EGETURZM', plan: SubscriptionPlan.Pro,        assignedRole: '2. Kademe', status: SubscriptionStatus.Trial,     maxUsers: 10, currentUserCount: 2,  subscriptionStartAtUtc: paAgo(7),   lastActivityAtUtc: paAgo(1),  monthlyPrice: 1499 },
];

export const DEMO_PLATFORM_OVERVIEW = {
    totalSubscribers:            DEMO_PLATFORM_TENANTS.length,
    activeSubscribers:           DEMO_PLATFORM_TENANTS.filter(t => t.status === SubscriptionStatus.Active).length,
    suspendedSubscribers:        0,
    cancelledSubscribers:        DEMO_PLATFORM_TENANTS.filter(t => t.status === SubscriptionStatus.Cancelled).length,
    totalUsers:                  DEMO_PLATFORM_TENANTS.reduce((s, t) => s + t.currentUserCount, 0),
    totalMonthlyRecurringRevenue:DEMO_PLATFORM_TENANTS.filter(t => t.status === SubscriptionStatus.Active).reduce((s, t) => s + t.monthlyPrice, 0),
    todayActiveUsers:            14,
    todayRequestCount:           340,
};

// ═════════════════════════════════════════════════════════════════════════════
// 11. TEKLİFLER (8 adet)
// ═════════════════════════════════════════════════════════════════════════════
import { QuoteStatus } from '../models/quote.model';
const qid = (n: number) => `0000000d-0000-0000-0000-${String(n).padStart(12,'0')}`;
const qiid = (q: number, i: number) => `0000000d-${String(q).padStart(4,'0')}-0000-0000-${String(i).padStart(12,'0')}`;

const mkQItem = (q: number, i: number, pName: string, unit: string, qty: number, price: number, disc: number) => {
    const lineTotal = qty * price * (1 - disc / 100);
    return { id: qiid(q, i), productId: pid(i), productName: pName, unit, quantity: qty, unitPrice: price, discountPercent: disc, lineTotal: Math.round(lineTotal), sortOrder: i };
};

export const DEMO_QUOTES = [
    {
        id: qid(1), quoteNumber: 'TKF-2026-001', cariAccountId: cid(1), cariCode: 'MUS-001', cariName: 'Teknosa İç ve Dış Ticaret A.Ş.',
        customerName: 'Teknosa İç ve Dış Ticaret A.Ş.', customerPhone: '0850 200 9600', customerEmail: 'kurumsal@teknosa.com',
        status: QuoteStatus.Accepted, quoteDateUtc: ago(45), validUntilUtc: ago(15),
        overallDiscountPercent: 5, taxPercent: 20, notes: 'Yıllık toplu alım indirimi uygulanmıştır.',
        convertedSalesOrderId: soid(1),
        items: [mkQItem(1,5,'Apple iPhone 15 Pro 256GB','EA',20,59999,5), mkQItem(1,6,'Samsung Galaxy S24 Ultra','EA',15,47999,5), mkQItem(1,1,'Samsung 65" Neo QLED 4K','EA',5,27500,5)],
        subTotal: 2116730, discountAmount: 105836, taxAmount: 402179, grandTotal: 2413073, itemCount: 3, createdAtUtc: ago(45)
    },
    {
        id: qid(2), quoteNumber: 'TKF-2026-002', cariAccountId: cid(2), cariCode: 'MUS-002', cariName: 'Media Markt Turkey A.Ş.',
        customerName: 'Media Markt Turkey A.Ş.', customerPhone: '0850 333 5555', customerEmail: 'b2b@mediamarkt.com.tr',
        status: QuoteStatus.Sent, quoteDateUtc: ago(20), validUntilUtc: fwd(10),
        overallDiscountPercent: 3, taxPercent: 20, notes: 'Dizüstü bilgisayar kampanyası.',
        items: [mkQItem(2,12,'Apple MacBook Pro M3 14"','EA',8,79999,3), mkQItem(2,13,'Dell XPS 15 i7 32GB','EA',6,69999,3)],
        subTotal: 1059988, discountAmount: 31800, taxAmount: 205638, grandTotal: 1233826, itemCount: 2, createdAtUtc: ago(20)
    },
    {
        id: qid(3), quoteNumber: 'TKF-2026-003', cariAccountId: cid(4), cariCode: 'MUS-004', cariName: 'Amazon Türkiye Perakende Ltd. Şti.',
        customerName: 'Amazon Türkiye Perakende Ltd. Şti.', customerPhone: '0800 300 3000', customerEmail: 'vendor@amazon.com.tr',
        status: QuoteStatus.Draft, quoteDateUtc: ago(5), validUntilUtc: fwd(25),
        overallDiscountPercent: 0, taxPercent: 20, notes: 'Akıllı telefon sezon fiyatlandırması.',
        items: [mkQItem(3,5,'Apple iPhone 15 Pro 256GB','EA',30,59999,0), mkQItem(3,6,'Samsung Galaxy S24 Ultra','EA',25,47999,0), mkQItem(3,8,'Google Pixel 8 Pro 256GB','EA',10,32999,0)],
        subTotal: 3129960, discountAmount: 0, taxAmount: 625992, grandTotal: 3755952, itemCount: 3, createdAtUtc: ago(5)
    },
    {
        id: qid(4), quoteNumber: 'TKF-2026-004', cariAccountId: cid(15), cariCode: 'HEM-001', cariName: 'Turkcell Teknoloji A.Ş.',
        customerName: 'Turkcell Teknoloji A.Ş.', customerPhone: '0532 532 0000', customerEmail: 'b2b@turkcell.com.tr',
        status: QuoteStatus.ConvertedToOrder, quoteDateUtc: ago(55), validUntilUtc: ago(25),
        overallDiscountPercent: 8, taxPercent: 20, notes: 'Kurumsal cihaz yenileme projesi.',
        convertedSalesOrderId: soid(17),
        items: [mkQItem(4,6,'Samsung Galaxy S24 Ultra','EA',20,47999,8), mkQItem(4,5,'Apple iPhone 15 Pro','EA',15,59999,8), mkQItem(4,9,'Apple iPad Pro 13" M2','EA',8,39999,8)],
        subTotal: 2549760, discountAmount: 203981, taxAmount: 469156, grandTotal: 2814935, itemCount: 3, createdAtUtc: ago(55)
    },
    {
        id: qid(5), quoteNumber: 'TKF-2026-005', cariAccountId: cid(3), cariCode: 'MUS-003', cariName: 'Vatan Bilgisayar Ticaret A.Ş.',
        customerName: 'Vatan Bilgisayar Ticaret A.Ş.', customerPhone: '0850 484 2884', customerEmail: 'tedarik@vatanbilgisayar.com',
        status: QuoteStatus.Rejected, quoteDateUtc: ago(30), validUntilUtc: ago(5),
        overallDiscountPercent: 2, taxPercent: 20, notes: 'Rakip fiyatları nedeniyle reddedildi.',
        items: [mkQItem(5,9,'Apple iPad Pro 13" M2','EA',10,39999,2), mkQItem(5,10,'Samsung Galaxy Tab S9 Ultra','EA',8,31999,2)],
        subTotal: 655992, discountAmount: 13120, taxAmount: 128574, grandTotal: 771446, itemCount: 2, createdAtUtc: ago(30)
    },
    {
        id: qid(6), quoteNumber: 'TKF-2026-006', cariAccountId: cid(7), cariCode: 'MUS-007', cariName: 'ÇiçekSepeti E-Ticaret A.Ş.',
        customerName: 'ÇiçekSepeti E-Ticaret A.Ş.', customerPhone: '0850 222 3434', customerEmail: 'tedarikci@ciceksepeti.com',
        status: QuoteStatus.Expired, quoteDateUtc: ago(65), validUntilUtc: ago(35),
        overallDiscountPercent: 0, taxPercent: 20, notes: 'Geçerlilik süresi doldu.',
        items: [mkQItem(6,24,'Tefal ActiFry Genius XL','EA',20,3999,0), mkQItem(6,25,'Philips Tam Otomatik Kahve','EA',15,5999,0)],
        subTotal: 169975, discountAmount: 0, taxAmount: 33995, grandTotal: 203970, itemCount: 2, createdAtUtc: ago(65)
    },
    {
        id: qid(7), quoteNumber: 'TKF-2026-007', cariAccountId: cid(16), cariCode: 'HEM-002', cariName: 'Koç Sistem Bilgi ve İletişim Hizmetleri A.Ş.',
        customerName: 'Koç Sistem Bilgi ve İletişim Hizmetleri A.Ş.', customerPhone: '0850 225 5600', customerEmail: 'ticaret@kocsistem.com.tr',
        status: QuoteStatus.Accepted, quoteDateUtc: ago(12), validUntilUtc: fwd(18),
        overallDiscountPercent: 4, taxPercent: 20, notes: 'Yönetici ofis kurulum paketi.',
        convertedSalesOrderId: soid(18),
        items: [mkQItem(7,12,'Apple MacBook Pro M3 14"','EA',6,79999,4), mkQItem(7,13,'Dell XPS 15 i7 32GB','EA',4,69999,4), mkQItem(7,15,'HP Spectre x360 14"','EA',3,47999,4)],
        subTotal: 906964, discountAmount: 36279, taxAmount: 174137, grandTotal: 1044822, itemCount: 3, createdAtUtc: ago(12)
    },
    {
        id: qid(8), quoteNumber: 'TKF-2026-008', cariAccountId: cid(5), cariCode: 'MUS-005', cariName: 'Hepsiburada Elektronik Ticaret A.Ş.',
        customerName: 'Hepsiburada Elektronik Ticaret A.Ş.', customerPhone: '0850 252 4444', customerEmail: 'tedarikci@hepsiburada.com',
        status: QuoteStatus.Sent, quoteDateUtc: ago(3), validUntilUtc: fwd(27),
        overallDiscountPercent: 0, taxPercent: 20, notes: 'Sezon sonu ses sistemi teklifi.',
        items: [mkQItem(8,16,'Sony WH-1000XM5 Kulaklık','EA',25,8500,0), mkQItem(8,17,'Bose QC45 ANC Kulaklık','EA',20,6999,0), mkQItem(8,18,'JBL Charge 5 Hoparlör','EA',30,2499,0)],
        subTotal: 427460, discountAmount: 0, taxAmount: 85492, grandTotal: 512952, itemCount: 3, createdAtUtc: ago(3)
    },
];

// ═════════════════════════════════════════════════════════════════════════════
// 12. ÇEK / SENET (10 adet — alacak + borç, farklı durumlar)
// ═════════════════════════════════════════════════════════════════════════════
import { CheckNoteType, CheckNoteDirection, CheckNoteStatus, TreasuryChannel } from '../models/check-bill.model';
const cnid = (n: number) => `0000000c-0000-0000-0000-${String(n).padStart(12,'0')}`;
const baid = (n: number) => `0000000e-0000-0000-0000-${String(n).padStart(12,'0')}`;

export const DEMO_CHECK_NOTES = [
    {
        id: cnid(1), code: 'CEK-2026-001', type: CheckNoteType.Check, direction: CheckNoteDirection.Receivable,
        status: CheckNoteStatus.Portfolio, cariAccountId: cid(1), cariCode: 'MUS-001', cariName: 'Teknosa İç ve Dış Ticaret A.Ş.',
        amount: 463993, currency: 'TRY', issueDateUtc: ago(38), dueDateUtc: fwd(8),
        bankName: 'Garanti BBVA', branchName: 'Levent Şubesi', accountNo: '123456789', serialNo: 'TR-2026-001234',
        description: 'SS-2026-009 ciro çeki', lastActionNote: null, relatedFinanceMovementId: null, settledAtUtc: null, createdAtUtc: ago(38)
    },
    {
        id: cnid(2), code: 'CEK-2026-002', type: CheckNoteType.Check, direction: CheckNoteDirection.Receivable,
        status: CheckNoteStatus.Portfolio, cariAccountId: cid(4), cariCode: 'MUS-004', cariName: 'Amazon Türkiye Perakende Ltd. Şti.',
        amount: 1688127, currency: 'TRY', issueDateUtc: ago(28), dueDateUtc: fwd(15),
        bankName: 'İş Bankası', branchName: 'Sarıyer Şubesi', accountNo: '987654321', serialNo: 'TR-2026-002345',
        description: 'SS-2026-004+012 bakiye çeki', lastActionNote: null, relatedFinanceMovementId: null, settledAtUtc: null, createdAtUtc: ago(28)
    },
    {
        id: cnid(3), code: 'CEK-2026-003', type: CheckNoteType.Check, direction: CheckNoteDirection.Receivable,
        status: CheckNoteStatus.Collected, cariAccountId: cid(2), cariCode: 'MUS-002', cariName: 'Media Markt Turkey A.Ş.',
        amount: 414400, currency: 'TRY', issueDateUtc: ago(38), dueDateUtc: ago(8),
        bankName: 'Yapı Kredi', branchName: 'Beşiktaş Şubesi', accountNo: '111222333', serialNo: 'TR-2026-003456',
        description: 'SS-2026-010 tahsil edildi', lastActionNote: 'Garanti BBVA hesabına yatırıldı.', relatedFinanceMovementId: fmid(10), settledAtUtc: ago(8), createdAtUtc: ago(38)
    },
    {
        id: cnid(4), code: 'CEK-2026-004', type: CheckNoteType.Check, direction: CheckNoteDirection.Receivable,
        status: CheckNoteStatus.Endorsed, cariAccountId: cid(7), cariCode: 'MUS-007', cariName: 'ÇiçekSepeti E-Ticaret A.Ş.',
        amount: 631954, currency: 'TRY', issueDateUtc: ago(44), dueDateUtc: fwd(20),
        bankName: 'Ziraat Bankası', branchName: 'Ümraniye Şubesi', accountNo: '444555666', serialNo: 'TR-2026-004567',
        description: 'SS-2026-007+015 ciro edildi', lastActionNote: 'Samsung ödemesine ciro edildi.', relatedFinanceMovementId: null, settledAtUtc: null, createdAtUtc: ago(44)
    },
    {
        id: cnid(5), code: 'SEN-2026-001', type: CheckNoteType.PromissoryNote, direction: CheckNoteDirection.Receivable,
        status: CheckNoteStatus.Protested, cariAccountId: cid(3), cariCode: 'MUS-003', cariName: 'Vatan Bilgisayar Ticaret A.Ş.',
        amount: 126939, currency: 'TRY', issueDateUtc: ago(60), dueDateUtc: ago(15),
        bankName: null, branchName: null, accountNo: null, serialNo: 'SEN-2026-005678',
        description: 'Vadesi geçmiş alacak senedi — protestolu', lastActionNote: 'İcra takibi başlatıldı.', relatedFinanceMovementId: null, settledAtUtc: null, createdAtUtc: ago(60)
    },
    {
        id: cnid(6), code: 'CEK-2026-005', type: CheckNoteType.Check, direction: CheckNoteDirection.Payable,
        status: CheckNoteStatus.Portfolio, cariAccountId: cid(9), cariCode: 'TED-001', cariName: 'Samsung Electronics Türkiye Ltd. Şti.',
        amount: 790000, currency: 'TRY', issueDateUtc: ago(2), dueDateUtc: fwd(28),
        bankName: 'Garanti BBVA', branchName: 'Levent Şubesi', accountNo: '123456789', serialNo: 'TR-2026-006789',
        description: 'AS-2026-012 sipariş avans çeki', lastActionNote: null, relatedFinanceMovementId: null, settledAtUtc: null, createdAtUtc: ago(2)
    },
    {
        id: cnid(7), code: 'CEK-2026-006', type: CheckNoteType.Check, direction: CheckNoteDirection.Payable,
        status: CheckNoteStatus.Paid, cariAccountId: cid(10), cariCode: 'TED-002', cariName: 'Apple Distribution International Ltd.',
        amount: 436000, currency: 'TRY', issueDateUtc: ago(70), dueDateUtc: ago(2),
        bankName: 'İş Bankası', branchName: 'Levent Şubesi', accountNo: '987654321', serialNo: 'TR-2026-007890',
        description: 'AS-2026-003 ödeme çeki', lastActionNote: 'Hesaptan karşılandı.', relatedFinanceMovementId: fmid(15), settledAtUtc: ago(2), createdAtUtc: ago(70)
    },
    {
        id: cnid(8), code: 'SEN-2026-002', type: CheckNoteType.PromissoryNote, direction: CheckNoteDirection.Payable,
        status: CheckNoteStatus.Portfolio, cariAccountId: cid(16), cariCode: 'HEM-002', cariName: 'Koç Sistem Bilgi ve İletişim Hizmetleri A.Ş.',
        amount: 528000, currency: 'TRY', issueDateUtc: ago(5), dueDateUtc: fwd(40),
        bankName: null, branchName: null, accountNo: null, serialNo: 'SEN-2026-008901',
        description: 'AS-2026-011 uzun vadeli senet', lastActionNote: null, relatedFinanceMovementId: null, settledAtUtc: null, createdAtUtc: ago(5)
    },
    {
        id: cnid(9), code: 'CEK-2026-007', type: CheckNoteType.Check, direction: CheckNoteDirection.Receivable,
        status: CheckNoteStatus.Portfolio, cariAccountId: cid(15), cariCode: 'HEM-001', cariName: 'Turkcell Teknoloji A.Ş.',
        amount: 379957, currency: 'TRY', issueDateUtc: ago(7), dueDateUtc: fwd(45),
        bankName: 'Akbank', branchName: 'Maltepe Şubesi', accountNo: '222333444', serialNo: 'TR-2026-009012',
        description: 'SS-2026-017 kalan bakiye çeki', lastActionNote: null, relatedFinanceMovementId: null, settledAtUtc: null, createdAtUtc: ago(7)
    },
    {
        id: cnid(10), code: 'CEK-2026-008', type: CheckNoteType.Check, direction: CheckNoteDirection.Receivable,
        status: CheckNoteStatus.Portfolio, cariAccountId: cid(6), cariCode: 'MUS-006', cariName: 'N11 Ticaret A.Ş.',
        amount: 221202, currency: 'TRY', issueDateUtc: ago(18), dueDateUtc: fwd(12),
        bankName: 'Garanti BBVA', branchName: 'Çekmeköy Şubesi', accountNo: '555666777', serialNo: 'TR-2026-010123',
        description: 'SS-2026-006+014 bakiye çeki', lastActionNote: null, relatedFinanceMovementId: null, settledAtUtc: null, createdAtUtc: ago(18)
    },
];

// ═════════════════════════════════════════════════════════════════════════════
// 13. BANKA HESAPLARI & İŞLEMLERİ
// ═════════════════════════════════════════════════════════════════════════════
const btid = (n: number) => `0000000f-0000-0000-0000-${String(n).padStart(12,'0')}`;

export const DEMO_BANK_ACCOUNTS = [
    { id: baid(1), bankName: 'Garanti BBVA', branchName: 'Levent Kurumsal Şubesi', iban: 'TR320006100519786457841326', currency: 'TRY', balance: 4250000, createdAtUtc: ago(365) },
    { id: baid(2), bankName: 'İş Bankası', branchName: 'Sarıyer Ticari Şubesi', iban: 'TR930006400000114090204462', currency: 'TRY', balance: 1875000, createdAtUtc: ago(300) },
];

export const DEMO_BANK_TRANSACTIONS = [
    { id: btid(1),  bankAccountId: baid(1), cariAccountId: cid(1),  financeMovementId: fmid(1),  type: 1/*Deposit*/,    amount: 1121482, transactionDateUtc: ago(70), description: 'Teknosa SS-2026-001 tahsilat',          referenceNo: 'TAH-2026-001', createdAtUtc: ago(70) },
    { id: btid(2),  bankAccountId: baid(1), cariAccountId: cid(2),  financeMovementId: fmid(2),  type: 1/*Deposit*/,    amount: 1159983, transactionDateUtc: ago(66), description: 'Media Markt SS-2026-002 tahsilat',       referenceNo: 'TAH-2026-002', createdAtUtc: ago(66) },
    { id: btid(3),  bankAccountId: baid(1), cariAccountId: cid(3),  financeMovementId: fmid(3),  type: 1/*Deposit*/,    amount: 388000,  transactionDateUtc: ago(63), description: 'Vatan SS-2026-003 tahsilat',              referenceNo: 'TAH-2026-003', createdAtUtc: ago(63) },
    { id: btid(4),  bankAccountId: baid(1), cariAccountId: cid(9),  financeMovementId: fmid(13), type: 2/*Withdrawal*/, amount: 1450000, transactionDateUtc: ago(78), description: 'Samsung AS-2026-001 tedarikçi ödemesi',    referenceNo: 'ODE-2026-001', createdAtUtc: ago(78) },
    { id: btid(5),  bankAccountId: baid(1), cariAccountId: cid(10), financeMovementId: fmid(14), type: 2/*Withdrawal*/, amount: 1800000, transactionDateUtc: ago(73), description: 'Apple AS-2026-002 tedarikçi ödemesi',      referenceNo: 'ODE-2026-002', createdAtUtc: ago(73) },
    { id: btid(6),  bankAccountId: baid(2), cariAccountId: cid(4),  financeMovementId: fmid(4),  type: 1/*Deposit*/,    amount: 1613967, transactionDateUtc: ago(58), description: 'Amazon SS-2026-004 tahsilat',              referenceNo: 'TAH-2026-004', createdAtUtc: ago(58) },
    { id: btid(7),  bankAccountId: baid(2), cariAccountId: cid(5),  financeMovementId: fmid(5),  type: 1/*Deposit*/,    amount: 444019,  transactionDateUtc: ago(53), description: 'Hepsiburada SS-2026-005 kısmi tahsilat',  referenceNo: 'TAH-2026-005', createdAtUtc: ago(53) },
    { id: btid(8),  bankAccountId: baid(2), cariAccountId: cid(11), financeMovementId: fmid(16), type: 2/*Withdrawal*/, amount: 355000,  transactionDateUtc: ago(63), description: 'Sony AS-2026-004 ödemesi',                 referenceNo: 'ODE-2026-004', createdAtUtc: ago(63) },
    { id: btid(9),  bankAccountId: baid(1), cariAccountId: cid(15), financeMovementId: fmid(11), type: 1/*Deposit*/,    amount: 1800000, transactionDateUtc: ago(6),  description: 'Turkcell SS-2026-017 tahsilat',            referenceNo: 'TAH-2026-011', createdAtUtc: ago(6) },
    { id: btid(10), bankAccountId: baid(1), cariAccountId: cid(16), financeMovementId: fmid(12), type: 1/*Deposit*/,    amount: 950000,  transactionDateUtc: ago(3),  description: 'Koç Sistem SS-2026-018 avans ödemesi',    referenceNo: 'TAH-2026-012', createdAtUtc: ago(3) },
];

// ═════════════════════════════════════════════════════════════════════════════
// 14. KASA HESAPLARI & İŞLEMLERİ
// ═════════════════════════════════════════════════════════════════════════════
const caid = (n: number) => `00000011-0000-0000-0000-${String(n).padStart(12,'0')}`;
const ctid = (n: number) => `00000012-0000-0000-0000-${String(n).padStart(12,'0')}`;

export const DEMO_CASH_ACCOUNTS = [
    { id: caid(1), code: 'KASA-01', name: 'Merkez Ana Kasası',       currency: 'TRY', balance: 185000, createdAtUtc: ago(365) },
    { id: caid(2), code: 'KASA-02', name: 'Anadolu Şubesi Kasası',   currency: 'TRY', balance:  42500, createdAtUtc: ago(290) },
];

export const DEMO_CASH_TRANSACTIONS = [
    { id: ctid(1), cashAccountId: caid(1), cariAccountId: cid(8), financeMovementId: fmid(8), type: 1/*Income*/,  amount: 148488, transactionDateUtc: ago(40), description: 'Migros SS-2026-008 nakit tahsilat',   referenceNo: 'TAH-2026-008', createdAtUtc: ago(40) },
    { id: ctid(2), cashAccountId: caid(1), cariAccountId: cid(6), financeMovementId: fmid(6), type: 1/*Income*/,  amount: 221970, transactionDateUtc: ago(48), description: 'N11 SS-2026-006 nakit tahsilat',       referenceNo: 'TAH-2026-006', createdAtUtc: ago(48) },
    { id: ctid(3), cashAccountId: caid(1), cariAccountId: cid(12),financeMovementId: fmid(17),type: 2/*Expense*/, amount: 120000, transactionDateUtc: ago(58), description: 'BSH AS-2026-005 nakit ödeme',           referenceNo: 'ODE-2026-005', createdAtUtc: ago(58) },
    { id: ctid(4), cashAccountId: caid(1), cariAccountId: null,   financeMovementId: null,    type: 2/*Expense*/, amount:  12500, transactionDateUtc: ago(20), description: 'Kırtasiye ve ofis giderleri',          referenceNo: 'GID-2026-001', createdAtUtc: ago(20) },
    { id: ctid(5), cashAccountId: caid(2), cariAccountId: cid(7), financeMovementId: fmid(7), type: 1/*Income*/,  amount: 131973, transactionDateUtc: ago(43), description: 'ÇiçekSepeti SS-2026-007 nakit tahsilat', referenceNo: 'TAH-2026-007', createdAtUtc: ago(43) },
    { id: ctid(6), cashAccountId: caid(2), cariAccountId: null,   financeMovementId: null,    type: 2/*Expense*/,  amount:   8500, transactionDateUtc: ago(15), description: 'Şube masrafları',                        referenceNo: 'GID-2026-002', createdAtUtc: ago(15) },
];

// ═════════════════════════════════════════════════════════════════════════════
// 15. HESAP PLANI (Temel Muhasebe Hesapları)
// ═════════════════════════════════════════════════════════════════════════════
const coaid = (n: number) => `00000013-0000-0000-0000-${String(n).padStart(12,'0')}`;

export const DEMO_CHART_OF_ACCOUNTS = [
    // Varlıklar (1)
    { id: coaid(1),  code: '100', name: 'Kasa',                          type: 1/*Asset*/,     isActive: true, createdAtUtc: ago(365) },
    { id: coaid(2),  code: '102', name: 'Banka',                         type: 1/*Asset*/,     isActive: true, createdAtUtc: ago(365) },
    { id: coaid(3),  code: '120', name: 'Alıcılar',                      type: 1/*Asset*/,     isActive: true, createdAtUtc: ago(365) },
    { id: coaid(4),  code: '121', name: 'Alacak Senetleri',              type: 1/*Asset*/,     isActive: true, createdAtUtc: ago(365) },
    { id: coaid(5),  code: '153', name: 'Ticari Mallar',                 type: 1/*Asset*/,     isActive: true, createdAtUtc: ago(365) },
    { id: coaid(6),  code: '191', name: 'İndirilecek KDV',               type: 1/*Asset*/,     isActive: true, createdAtUtc: ago(365) },
    // Borçlar (2)
    { id: coaid(7),  code: '320', name: 'Satıcılar',                     type: 2/*Liability*/, isActive: true, createdAtUtc: ago(365) },
    { id: coaid(8),  code: '321', name: 'Borç Senetleri',                type: 2/*Liability*/, isActive: true, createdAtUtc: ago(365) },
    { id: coaid(9),  code: '360', name: 'Ödenecek Vergiler ve Fonlar',   type: 2/*Liability*/, isActive: true, createdAtUtc: ago(365) },
    { id: coaid(10), code: '391', name: 'Hesaplanan KDV',                type: 2/*Liability*/, isActive: true, createdAtUtc: ago(365) },
    // Özkaynak (3)
    { id: coaid(11), code: '500', name: 'Sermaye',                       type: 3/*Equity*/,    isActive: true, createdAtUtc: ago(365) },
    { id: coaid(12), code: '590', name: 'Dönem Net Kârı',                type: 3/*Equity*/,    isActive: true, createdAtUtc: ago(365) },
    // Gelirler (4)
    { id: coaid(13), code: '600', name: 'Yurt İçi Satışlar',             type: 4/*Revenue*/,   isActive: true, createdAtUtc: ago(365) },
    { id: coaid(14), code: '601', name: 'Yurt Dışı Satışlar',            type: 4/*Revenue*/,   isActive: false, createdAtUtc: ago(365) },
    { id: coaid(15), code: '602', name: 'Diğer Gelirler',                type: 4/*Revenue*/,   isActive: true, createdAtUtc: ago(365) },
    // Giderler (5)
    { id: coaid(16), code: '620', name: 'Satılan Ticari Mallar Maliyeti',type: 5/*Expense*/,   isActive: true, createdAtUtc: ago(365) },
    { id: coaid(17), code: '631', name: 'Pazarlama Satış Dağıtım Giderleri', type: 5/*Expense*/, isActive: true, createdAtUtc: ago(365) },
    { id: coaid(18), code: '632', name: 'Genel Yönetim Giderleri',       type: 5/*Expense*/,   isActive: true, createdAtUtc: ago(365) },
    { id: coaid(19), code: '660', name: 'Kısa Vadeli Borçlanma Giderleri', type: 5/*Expense*/, isActive: true, createdAtUtc: ago(365) },
    { id: coaid(20), code: '780', name: 'Finansman Giderleri',           type: 5/*Expense*/,   isActive: true, createdAtUtc: ago(365) },
];

// ═════════════════════════════════════════════════════════════════════════════
// 16. CARİ BORÇ KALEMLERİ / DÉTAY (buyer-detail için zengin veri)
// ═════════════════════════════════════════════════════════════════════════════
const diid = (cari: number, i: number) => `00000014-${String(cari).padStart(4,'0')}-0000-0000-${String(i).padStart(12,'0')}`;

export const DEMO_CARI_DEBT_ITEMS: Record<string, any[]> = {
    [cid(1)]: [
        { id: diid(1,1), cariAccountId: cid(1), materialDescription: 'Apple iPhone 15 Pro 256GB Doğal Titanyum (×10)', quantity: 10, listPrice: 59999, salePrice: 59999, totalAmount: 599990, payment: 599990, remainingBalance: 0,      transactionDate: ago(71) },
        { id: diid(1,2), cariAccountId: cid(1), materialDescription: 'Samsung Galaxy S24 Ultra 512GB (×8)',             quantity:  8, listPrice: 47999, salePrice: 47999, totalAmount: 383992, payment: 383992, remainingBalance: 0,      transactionDate: ago(71) },
        { id: diid(1,3), cariAccountId: cid(1), materialDescription: 'Samsung 65" Neo QLED 4K QN90C (×5)',              quantity:  5, listPrice: 27500, salePrice: 27500, totalAmount: 137500, payment: 137500, remainingBalance: 0,      transactionDate: ago(71) },
        { id: diid(1,4), cariAccountId: cid(1), materialDescription: 'Apple MacBook Pro M3 14" 512GB (×4)',             quantity:  4, listPrice: 79999, salePrice: 79999, totalAmount: 319996, payment:       0, remainingBalance: 319996, transactionDate: ago(37) },
        { id: diid(1,5), cariAccountId: cid(1), materialDescription: 'HP Spectre x360 14" i7-1355U 32GB (×3)',         quantity:  3, listPrice: 47999, salePrice: 47999, totalAmount: 143997, payment:       0, remainingBalance: 143997, transactionDate: ago(37) },
    ],
    [cid(2)]: [
        { id: diid(2,1), cariAccountId: cid(2), materialDescription: 'Apple MacBook Pro M3 14" 512GB (×5)',             quantity:  5, listPrice: 79999, salePrice: 79999, totalAmount: 399995, payment: 399995, remainingBalance: 0,      transactionDate: ago(67) },
        { id: diid(2,2), cariAccountId: cid(2), materialDescription: 'Dell XPS 15 9530 i7-13700H 32GB (×4)',            quantity:  4, listPrice: 69999, salePrice: 69999, totalAmount: 279996, payment: 279996, remainingBalance: 0,      transactionDate: ago(67) },
        { id: diid(2,3), cariAccountId: cid(2), materialDescription: 'Samsung 65" Neo QLED (×6)',                       quantity:  6, listPrice: 27500, salePrice: 27500, totalAmount: 165000, payment:       0, remainingBalance: 165000, transactionDate: ago(34) },
        { id: diid(2,4), cariAccountId: cid(2), materialDescription: 'LG 55" OLED evo C3 4K (×4)',                     quantity:  4, listPrice: 34900, salePrice: 34900, totalAmount: 139600, payment:  18017, remainingBalance: 120583,  transactionDate: ago(34) },
    ],
    [cid(4)]: [
        { id: diid(4,1), cariAccountId: cid(4), materialDescription: 'Apple iPhone 15 Pro 256GB (×15)',                 quantity: 15, listPrice: 59999, salePrice: 59999, totalAmount: 899985, payment: 899985, remainingBalance: 0,       transactionDate: ago(59) },
        { id: diid(4,2), cariAccountId: cid(4), materialDescription: 'Samsung Galaxy S24 Ultra 512GB (×12)',            quantity: 12, listPrice: 47999, salePrice: 47999, totalAmount: 575988, payment: 575988, remainingBalance: 0,       transactionDate: ago(59) },
        { id: diid(4,3), cariAccountId: cid(4), materialDescription: 'Apple Watch Ultra 2 49mm Titanyum (×6)',          quantity:  6, listPrice: 22999, salePrice: 22999, totalAmount: 137994, payment:       0, remainingBalance: 137994, transactionDate: ago(59) },
        { id: diid(4,4), cariAccountId: cid(4), materialDescription: 'Apple MacBook Pro M3 14" (×6)',                   quantity:  6, listPrice: 79999, salePrice: 79999, totalAmount: 479994, payment:       0, remainingBalance: 479994, transactionDate: ago(28) },
        { id: diid(4,5), cariAccountId: cid(4), materialDescription: 'Dell XPS 15 9530 i7 32GB (×4)',                   quantity:  4, listPrice: 69999, salePrice: 69999, totalAmount: 279996, payment:       0, remainingBalance: 279996, transactionDate: ago(28) },
        { id: diid(4,6), cariAccountId: cid(4), materialDescription: 'Lenovo ThinkPad X1 Carbon Gen 11 (×4)',           quantity:  4, listPrice: 52999, salePrice: 52999, totalAmount: 211996, payment:  21842, remainingBalance: 190143,  transactionDate: ago(28) },
    ],
    [cid(15)]: [
        { id: diid(15,1), cariAccountId: cid(15), materialDescription: 'Samsung Galaxy S24 Ultra (×20)',                quantity: 20, listPrice: 47999, salePrice: 47999, totalAmount: 959980, payment: 959980, remainingBalance: 0,       transactionDate: ago(7) },
        { id: diid(15,2), cariAccountId: cid(15), materialDescription: 'Apple iPhone 15 Pro (×15)',                     quantity: 15, listPrice: 59999, salePrice: 59999, totalAmount: 899985, payment: 840028, remainingBalance: 59957,   transactionDate: ago(7) },
        { id: diid(15,3), cariAccountId: cid(15), materialDescription: 'Apple iPad Pro 13" M2 WiFi (×8)',               quantity:  8, listPrice: 39999, salePrice: 39999, totalAmount: 319992, payment:       0, remainingBalance: 319992, transactionDate: ago(7) },
    ],
    [cid(16)]: [
        { id: diid(16,1), cariAccountId: cid(16), materialDescription: 'Apple MacBook Pro M3 14" (×6)',                 quantity:  6, listPrice: 79999, salePrice: 79999, totalAmount: 479994, payment: 479994, remainingBalance: 0,       transactionDate: ago(4) },
        { id: diid(16,2), cariAccountId: cid(16), materialDescription: 'Dell XPS 15 i7 32GB (×4)',                      quantity:  4, listPrice: 69999, salePrice: 69999, totalAmount: 279996, payment: 279996, remainingBalance: 0,       transactionDate: ago(4) },
        { id: diid(16,3), cariAccountId: cid(16), materialDescription: 'HP Spectre x360 14" i7 32GB (×3)',              quantity:  3, listPrice: 47999, salePrice: 47999, totalAmount: 143997, payment: 143997, remainingBalance: 0,       transactionDate: ago(4) },
        { id: diid(16,4), cariAccountId: cid(16), materialDescription: 'Lenovo ThinkPad X1 Carbon (×2)',                quantity:  2, listPrice: 52999, salePrice: 52999, totalAmount: 105998, payment:  59985, remainingBalance: 46013,  transactionDate: ago(4) },
    ],
};

// ═════════════════════════════════════════════════════════════════════════════
// 17. DASHBOARD SUMMARY (KPI özeti)
// ═════════════════════════════════════════════════════════════════════════════
export const DEMO_DASHBOARD_SUMMARY = {
    totalSalesAmount:       11622283,   // DEMO_SALES_ORDERS Approved toplamı
    totalOrderCount:        20,
    totalProductCount:      30,
    totalActiveCariCount:   16,
    totalBankBalance:       DEMO_BANK_ACCOUNTS.reduce((s, b) => s + b.balance, 0),   // 6_125_000
    totalCashBalance:       DEMO_CASH_ACCOUNTS.reduce((s, c) => s + c.balance, 0),   // 227_500
    overdueReceivables:     DEMO_DUE_LIST.filter(d => d.overdueDays > 0).reduce((s, d) => s + d.openAmount, 0),  // 412_522
    overdueCheckNoteCount:  DEMO_CHECK_NOTES.filter(n => n.status === CheckNoteStatus.Protested).length,          // 1
    pendingQuoteCount:      DEMO_QUOTES.filter(q => q.status === QuoteStatus.Draft || q.status === QuoteStatus.Sent).length, // 3
};


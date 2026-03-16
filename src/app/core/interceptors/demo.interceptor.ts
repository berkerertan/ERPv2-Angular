/**
 * demo.interceptor.ts
 * Demo kullanıcısı (userName === 'demo') için tüm API isteklerini keser
 * ve backend'e istek atmadan mock veri döner.
 */

import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import {
    DEMO_PRODUCTS, DEMO_CARIS, DEMO_BUYERS, DEMO_SUPPLIERS,
    DEMO_SALES_ORDERS, DEMO_PURCHASE_ORDERS,
    DEMO_STOCK_MOVEMENTS, DEMO_FINANCE_MOVEMENTS,
    DEMO_EFATURA_INVOICES, DEMO_EARSIV_INVOICES, DEMO_ALL_INVOICES,
    DEMO_COMPANY, DEMO_BRANCHES, DEMO_WAREHOUSES,
    DEMO_SALES_REPORT, DEMO_PURCHASES_REPORT, DEMO_STOCK_REPORT,
    DEMO_CARI_BALANCES, DEMO_CARI_AGING, DEMO_INCOME_EXPENSE,
    DEMO_CASH_FLOW, DEMO_DUE_LIST,
    DEMO_PRODUCT_PROFITABILITY, DEMO_CUSTOMER_PROFITABILITY, DEMO_BRANCH_PROFITABILITY,
} from '../mock/demo-data';
import { InvoiceType } from '../models/invoice.model';

// ── Demo kullanıcı kontrolü ───────────────────────────────────────────────────
function isDemoUser(): boolean {
    try {
        const u = localStorage.getItem('erp_user');
        return !!u && JSON.parse(u)?.userName === 'demo';
    } catch { return false; }
}

// ── Sahte UUID döndürür (create işlemleri için) ───────────────────────────────
let _mockSeq = 900;
function newMockId(): string {
    return `99999999-0000-0000-0000-${String(++_mockSeq).padStart(12, '0')}`;
}

// ── Yardımcı: 200 OK yanıtı ───────────────────────────────────────────────────
const ok = (body: unknown) => of(new HttpResponse({ status: 200, body }));

// ── Yardımcı: 204 No Content ──────────────────────────────────────────────────
const noContent = () => of(new HttpResponse<null>({ status: 204, body: null }));

// ── Yardımcı: path çıkar ─────────────────────────────────────────────────────
function getPath(url: string): string {
    try { return new URL(url).pathname; }
    catch { return url; }
}

// ═════════════════════════════════════════════════════════════════════════════
// ANA INTERCEPTOR
// ═════════════════════════════════════════════════════════════════════════════
export const demoInterceptor: HttpInterceptorFn = (req, next) => {
    if (!isDemoUser()) return next(req);

    // Auth endpoint'leri geçir (login/logout/refresh backend'e gitmeli)
    const url = req.url;
    if (url.includes('/api/Auth') || url.includes('/api/auth')) return next(req);

    const path   = getPath(url);
    const method = req.method.toUpperCase();

    // ── Yazma işlemleri — genel fallback ─────────────────────────────────────
    if (method === 'DELETE' || method === 'PUT' || method === 'PATCH') {
        return noContent();
    }

    // ── ÜRÜNLER ───────────────────────────────────────────────────────────────
    if (path.startsWith('/api/products')) {
        if (path === '/api/products/suggest' || path.includes('/suggest')) {
            const q = (req.params.get('q') || '').toLowerCase();
            const hits = DEMO_PRODUCTS
                .filter(p => !q || p.name.toLowerCase().includes(q) || (p.code ?? '').toLowerCase().includes(q))
                .slice(0, 10)
                .map(p => ({ id: p.id, code: p.code, name: p.name, label: p.name, subtitle: p.brand }));
            return ok(hits);
        }
        if (method === 'POST') return ok(`"${newMockId()}"`);
        // GET /api/products/:id
        const idSeg = path.replace('/api/products/', '').split('/')[0];
        if (idSeg && idSeg !== 'bulk-price-update' && idSeg !== 'bulk-stock-update') {
            const found = DEMO_PRODUCTS.find(p => p.id === idSeg);
            return ok(found ?? DEMO_PRODUCTS[0]);
        }
        return ok(DEMO_PRODUCTS);
    }

    // ── CARİ HESAPLAR ─────────────────────────────────────────────────────────
    if (path.startsWith('/api/cari-accounts')) {
        // Suggest endpoints
        if (path.includes('/buyers/suggest'))    { return ok(suggestCari(DEMO_BUYERS,    req.params.get('q'))); }
        if (path.includes('/suppliers/suggest')) { return ok(suggestCari(DEMO_SUPPLIERS, req.params.get('q'))); }
        if (path.includes('/suggest'))           { return ok(suggestCari(DEMO_CARIS,     req.params.get('q'))); }

        if (path.endsWith('/buyers'))    return ok(DEMO_BUYERS);
        if (path.endsWith('/suppliers')) return ok(DEMO_SUPPLIERS);

        if (method === 'POST') return ok(`"${newMockId()}"`);

        // /api/cari-accounts/:id/details
        if (path.includes('/details')) {
            const cariId = path.split('/').slice(-2)[0];
            const account = DEMO_CARIS.find(c => c.id === cariId) ?? DEMO_CARIS[0];
            return ok({ account, items: [] });
        }
        // /api/cari-accounts/:id/debt-items
        if (path.includes('/debt-items')) {
            if (method === 'GET') return ok([]);
            return ok(`"${newMockId()}"`);
        }
        // /api/cari-accounts/:id
        const cariId = path.replace('/api/cari-accounts/', '').split('/')[0];
        if (cariId) {
            const found = DEMO_CARIS.find(c => c.id === cariId);
            if (found) return ok(found);
        }
        // /api/cari-accounts (list)
        return ok(DEMO_CARIS);
    }

    // ── SATIŞ SİPARİŞLERİ ────────────────────────────────────────────────────
    if (path.startsWith('/api/sales-orders')) {
        if (method === 'POST') {
            if (path.includes('/approve') || path.includes('/cancel')) return noContent();
            return ok(`"${newMockId()}"`);
        }
        const soId = path.replace('/api/sales-orders/', '').split('/')[0];
        if (soId) {
            const found = DEMO_SALES_ORDERS.find(s => s.id === soId);
            return ok(found ?? DEMO_SALES_ORDERS[0]);
        }
        return ok(DEMO_SALES_ORDERS);
    }

    // ── SATIN ALMA SİPARİŞLERİ ───────────────────────────────────────────────
    if (path.startsWith('/api/purchase-orders')) {
        if (method === 'POST') {
            if (path.includes('/approve') || path.includes('/cancel')) return noContent();
            return ok(`"${newMockId()}"`);
        }
        const poId = path.replace('/api/purchase-orders/', '').split('/')[0];
        if (poId) {
            const found = DEMO_PURCHASE_ORDERS.find(p => p.id === poId);
            return ok(found ?? DEMO_PURCHASE_ORDERS[0]);
        }
        return ok(DEMO_PURCHASE_ORDERS);
    }

    // ── STOK HAREKETLERİ ─────────────────────────────────────────────────────
    if (path.startsWith('/api/stock-movements')) {
        if (method === 'POST') return ok(`"${newMockId()}"`);
        if (path.includes('/balance')) {
            return ok(DEMO_STOCK_REPORT.map(s => ({
                productId: s.productId, productName: s.productName,
                barcode: s.barcode, warehouseName: s.warehouseName,
                balance: s.balance, unit: s.unit, totalValue: s.totalValue,
            })));
        }
        if (path.includes('/critical-alerts')) return ok([]);
        if (path.includes('/transfer'))        return ok({ outMovementId: newMockId(), inMovementId: newMockId() });
        return ok(DEMO_STOCK_MOVEMENTS);
    }

    // ── FİNANS HAREKETLERİ ───────────────────────────────────────────────────
    if (path.startsWith('/api/finance-movements')) {
        if (method === 'POST') return ok(`"${newMockId()}"`);
        return ok(DEMO_FINANCE_MOVEMENTS);
    }

    // ── FATURALAR ─────────────────────────────────────────────────────────────
    if (path.startsWith('/api/invoices')) {
        if (path.includes('/summary')) {
            const invType = req.params.get('invoiceType');
            const list = invType === String(InvoiceType.EFatura) ? DEMO_EFATURA_INVOICES
                       : invType === String(InvoiceType.EArsiv)  ? DEMO_EARSIV_INVOICES
                       : DEMO_ALL_INVOICES;
            return ok({
                totalCount:    list.length,
                draftCount:    0,
                sentCount:     0,
                approvedCount: list.length,
                rejectedCount: 0,
                totalAmount:   list.reduce((s, i) => s + i.grandTotal, 0),
            });
        }
        if (path.includes('/items'))        return ok([]);
        if (path.includes('/pdf'))          return ok(new Blob(['mock']));
        if (path.includes('/xml'))          return ok(new Blob(['mock']));
        if (path.includes('/send'))         return ok(DEMO_ALL_INVOICES[0]);
        if (path.includes('/cancel'))       return ok(DEMO_ALL_INVOICES[0]);
        if (path.includes('/from-sales-order') || path.includes('/from-purchase-order')) {
            return ok({ ...DEMO_ALL_INVOICES[0], id: newMockId() });
        }
        if (method === 'POST') {
            return ok({ ...DEMO_ALL_INVOICES[0], id: newMockId() });
        }
        // GET /api/invoices?invoiceType=1 veya 2
        const invTypeParam = req.params.get('invoiceType');
        if (invTypeParam === String(InvoiceType.EFatura)) return ok(DEMO_EFATURA_INVOICES);
        if (invTypeParam === String(InvoiceType.EArsiv))  return ok(DEMO_EARSIV_INVOICES);
        // GET /api/invoices/:id
        const invId = path.replace('/api/invoices/', '').split('/')[0];
        if (invId) {
            const found = DEMO_ALL_INVOICES.find(i => i.id === invId);
            return ok(found ?? DEMO_ALL_INVOICES[0]);
        }
        return ok(DEMO_ALL_INVOICES);
    }

    // ── RAPORLAR ─────────────────────────────────────────────────────────────
    if (path.startsWith('/api/reports')) {
        if (path.includes('/sales'))                              return ok(DEMO_SALES_REPORT);
        if (path.includes('/purchases'))                          return ok(DEMO_PURCHASES_REPORT);
        if (path.includes('/stock'))                              return ok(DEMO_STOCK_REPORT);
        if (path.includes('/cari-balances'))                      return ok(DEMO_CARI_BALANCES);
        if (path.includes('/cari-aging'))                         return ok(DEMO_CARI_AGING);
        if (path.includes('/income-expense'))                     return ok(DEMO_INCOME_EXPENSE);
        if (path.includes('/cash-flow-forecast'))                 return ok(DEMO_CASH_FLOW);
        if (path.includes('/due-list'))                           return ok(DEMO_DUE_LIST);
        if (path.includes('/profitability/products'))             return ok(DEMO_PRODUCT_PROFITABILITY);
        if (path.includes('/profitability/customers'))            return ok(DEMO_CUSTOMER_PROFITABILITY);
        if (path.includes('/profitability/branches'))             return ok(DEMO_BRANCH_PROFITABILITY);
        return ok([]);
    }

    // ── ŞİRKET / ŞUBE / DEPO ─────────────────────────────────────────────────
    if (path.startsWith('/api/companies')) {
        if (method === 'POST') return ok(`"${newMockId()}"`);
        return ok([DEMO_COMPANY]);
    }
    if (path.startsWith('/api/branches')) {
        if (method === 'POST') return ok(`"${newMockId()}"`);
        return ok(DEMO_BRANCHES);
    }
    if (path.startsWith('/api/warehouses')) {
        if (method === 'POST') return ok(`"${newMockId()}"`);
        return ok(DEMO_WAREHOUSES);
    }

    // ── Muhasebe ─────────────────────────────────────────────────────────────
    if (path.startsWith('/api/accounting')) {
        return ok([]);
    }

    // ── Bilinmeyen GET → boş dizi; POST → sahte UUID ──────────────────────────
    if (method === 'GET')  return ok([]);
    if (method === 'POST') return ok(`"${newMockId()}"`);
    return noContent();
};

// ── Cari suggest yardımcısı ───────────────────────────────────────────────────
function suggestCari(list: typeof DEMO_CARIS, q: string | null) {
    const query = (q || '').toLowerCase();
    return list
        .filter(c => !query || c.name.toLowerCase().includes(query) || (c.code ?? '').toLowerCase().includes(query))
        .slice(0, 10)
        .map(c => ({ id: c.id, code: c.code, name: c.name, label: c.name, subtitle: c.code, type: c.type }));
}

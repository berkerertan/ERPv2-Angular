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
    DEMO_COMPANY, DEMO_BRANCHES, DEMO_WAREHOUSES, DEMO_WH_ID, DEMO_WH2_ID,
    DEMO_SALES_REPORT, DEMO_PURCHASES_REPORT, DEMO_STOCK_REPORT,
    DEMO_CARI_BALANCES, DEMO_CARI_AGING, DEMO_INCOME_EXPENSE,
    DEMO_CASH_FLOW, DEMO_DUE_LIST,
    DEMO_PRODUCT_PROFITABILITY, DEMO_CUSTOMER_PROFITABILITY, DEMO_BRANCH_PROFITABILITY,
    DEMO_ACTIVITY_LOGS, DEMO_ACTIVITY_SUMMARY,
    DEMO_MY_ACTIVITY_LOGS, DEMO_MY_ACTIVITY_SUMMARY,
    DEMO_PLATFORM_TENANTS, DEMO_PLATFORM_OVERVIEW,
    DEMO_QUOTES,
    DEMO_CHECK_NOTES,
    DEMO_BANK_ACCOUNTS, DEMO_BANK_TRANSACTIONS,
    DEMO_CASH_ACCOUNTS, DEMO_CASH_TRANSACTIONS,
    DEMO_CHART_OF_ACCOUNTS,
    DEMO_CARI_DEBT_ITEMS, DEMO_BUYER_EXTRA,
    DEMO_DASHBOARD_SUMMARY,
    DEMO_POS_CARTS,
} from '../mock/demo-data';
import { InvoiceType } from '../models/invoice.model';

// ── Demo kullanıcı kontrolü ───────────────────────────────────────────────────
function isDemoUser(): boolean {
    try {
        const u = localStorage.getItem('stoknet_user');
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
    if (url.toLowerCase().includes('/api/documentscanner')) return next(req);

    const path   = getPath(url);
    const method = req.method.toUpperCase();

    if (path.startsWith('/api/supplier-quote-requests')) {
        if (method === 'POST' && path.endsWith('/convert-selected-offer')) {
            return ok({ purchaseOrderId: newMockId(), orderNo: `AS-2026-${String(++_mockSeq).padStart(3, '0')}` });
        }
        if (method === 'POST' && path.endsWith('/select-offer')) return noContent();
        if (method === 'PUT' && path.includes('/offers/')) return noContent();
        if (method === 'POST') return ok(`"${newMockId()}"`);
        const reqId = path.replace('/api/supplier-quote-requests/', '').split('/')[0];
        if (reqId && reqId !== 'api' && reqId !== 'supplier-quote-requests') {
            const found = buildDemoSupplierQuoteRequests().find(x => x.id === reqId);
            return ok(found ?? buildDemoSupplierQuoteRequests()[0]);
        }
        return ok(buildDemoSupplierQuoteRequestList());
    }

    if (path.startsWith('/api/collection-plans')) {
        if (method === 'POST') {
            if (path.endsWith('/upsert')) return ok(`"${newMockId()}"`);
            return noContent();
        }
        if (path.endsWith('/dashboard')) return ok(buildDemoCollectionPlanDashboard());
    }

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
            const extra   = DEMO_BUYER_EXTRA[account.id];
            const items   = DEMO_CARI_DEBT_ITEMS[account.id] ?? [];
            return ok({ account: { ...account, ...(extra ?? {}) }, items });
        }
        // /api/cari-accounts/:id/debt-items
        if (path.includes('/debt-items')) {
            const cariId = path.split('/').slice(-2)[0];
            if (method === 'GET') return ok(DEMO_CARI_DEBT_ITEMS[cariId] ?? []);
            return ok(`"${newMockId()}"`);
        }
        // /api/cari-accounts/import-buyers-batch (POST via FormData)
        if (path.includes('/import-buyers-batch') && method === 'POST') {
            return ok({
                totalFileCount: 1, totalCreatedCount: 12, totalFailedCount: 0,
                files: [{ fileName: 'demo_import.xlsx', createdCount: 12, failedCount: 0, errors: [] }]
            });
        }
        // /api/cari-accounts/:id/import-excel
        if (path.includes('/import-excel') && method === 'POST') {
            return ok({ createdCount: 8, failedCount: 0, errors: [] });
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
        // Yeni liste endpoint'leri
        if (path.endsWith('/e-fatura')) return ok(DEMO_EFATURA_INVOICES.map(toListDto));
        if (path.endsWith('/e-arsiv'))  return ok(DEMO_EARSIV_INVOICES.map(toListDto));

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
                totalAmount:   list.reduce((s: number, i: any) => s + i.grandTotal, 0),
            });
        }
        // Detay endpoint: /api/invoices/{id}/detail
        if (path.endsWith('/detail')) {
            const invId = path.split('/')[3];
            const inv = DEMO_ALL_INVOICES.find((i: any) => i.id === invId) ?? DEMO_ALL_INVOICES[0];
            return ok({
                invoice: inv,
                items:   (inv as any).items ?? [],
                customerCariAccountId: (inv as any).cariAccountId,
                customerName:          (inv as any).cariAccountName,
            });
        }
        // Preview HTML
        if (path.includes('/preview-html')) {
            const invId = path.split('/')[3];
            const inv = DEMO_ALL_INVOICES.find((i: any) => i.id === invId) ?? DEMO_ALL_INVOICES[0];
            return ok(buildInvoicePreviewHtml(inv as any));
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
        // GET /api/invoices?invoiceType=1 veya 2 (eski endpoint uyumu)
        const invTypeParam = req.params.get('invoiceType');
        if (invTypeParam === String(InvoiceType.EFatura)) return ok(DEMO_EFATURA_INVOICES);
        if (invTypeParam === String(InvoiceType.EArsiv))  return ok(DEMO_EARSIV_INVOICES);
        // GET /api/invoices/:id
        const invId = path.replace('/api/invoices/', '').split('/')[0];
        if (invId) {
            const found = DEMO_ALL_INVOICES.find((i: any) => i.id === invId);
            return ok(found ?? DEMO_ALL_INVOICES[0]);
        }
        return ok(DEMO_ALL_INVOICES);
    }

    // ── TEKLİFLER ─────────────────────────────────────────────────────────────
    if (path.startsWith('/api/quotes')) {
        if (method === 'POST') {
            // convert-to-order
            if (path.includes('/convert-to-order')) return ok(`"${newMockId()}"`);
            // change-status
            if (path.includes('/change-status')) return noContent();
            return ok(`"${newMockId()}"`);
        }
        const qSeg = path.replace('/api/quotes/', '').split('/')[0];
        if (qSeg && !path.endsWith('/quotes')) {
            const found = DEMO_QUOTES.find(q => q.id === qSeg);
            return ok(found ?? DEMO_QUOTES[0]);
        }
        // QuoteListItem shape (id, quoteNumber, customerName, status, dates, itemCount, grandTotal)
        return ok(DEMO_QUOTES.map(q => ({
            id: q.id, quoteNumber: q.quoteNumber, customerName: q.customerName,
            status: q.status, quoteDateUtc: q.quoteDateUtc, validUntilUtc: q.validUntilUtc,
            itemCount: q.itemCount, grandTotal: q.grandTotal, createdAtUtc: q.createdAtUtc
        })));
    }

    // ── RAPORLAR ─────────────────────────────────────────────────────────────
    if (path.startsWith('/api/reports')) {
        if (path.includes('/dashboard-summary'))                  return ok(DEMO_DASHBOARD_SUMMARY);
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

    // ── AKTİVİTE LOGLARI (Tenant — sadece kendi işlemleri) ──────────────────
    if (path.startsWith('/api/activity-logs/me')) {
        if (path.endsWith('/summary')) return ok(DEMO_MY_ACTIVITY_SUMMARY);
        if (path.endsWith('/export') || path.endsWith('/export/excel') || path.endsWith('/export/pdf')) {
            return ok(new Blob(['demo-export']));
        }
        const logId = path.replace('/api/activity-logs/me/', '').split('/')[0];
        if (logId && logId !== 'summary') {
            const found = DEMO_MY_ACTIVITY_LOGS.find(l => l.id === logId);
            return ok(found ?? DEMO_MY_ACTIVITY_LOGS[0]);
        }
        let logs = [...DEMO_MY_ACTIVITY_LOGS];
        const onlyErrors = req.params.get('onlyErrors');
        if (onlyErrors === 'true') logs = logs.filter(l => l.statusCode >= 400);
        const page     = parseInt(req.params.get('page')     || '1');
        const pageSize = parseInt(req.params.get('pageSize') || '100');
        return ok(logs.slice((page-1)*pageSize, page*pageSize));
    }

    // ── PLATFORM ADMIN — DASHBOARD OVERVIEW ──────────────────────────────────
    if (path === '/api/platform-admin/dashboard/overview') {
        return ok(DEMO_PLATFORM_OVERVIEW);
    }

    // ── PLATFORM ADMIN — ABONE LİSTESİ & DETAY ───────────────────────────────
    if (path.startsWith('/api/platform-admin/subscribers')) {
        // Abone aktiviteleri: /subscribers/{id}/activities
        if (/\/subscribers\/[^/]+\/activities/.test(path)) {
            const page     = parseInt(req.params.get('page')     || '1');
            const pageSize = parseInt(req.params.get('pageSize') || '20');
            return ok(DEMO_ACTIVITY_LOGS.slice((page-1)*pageSize, page*pageSize));
        }
        // Abone detay: /subscribers/{id}
        const tenantId = path.split('/').pop();
        if (tenantId && tenantId !== 'subscribers') {
            const found = DEMO_PLATFORM_TENANTS.find(t => t.tenantId === tenantId);
            return ok(found ? { ...found, features: ['Stok', 'Fatura', 'Raporlar'], recentActivities: [] } : null);
        }
        // Abone listesi + filtreleme
        let tenants = [...DEMO_PLATFORM_TENANTS];
        const q      = (req.params.get('q') || '').toLowerCase();
        const plan   = req.params.get('plan');
        const status = req.params.get('status');
        if (q)      tenants = tenants.filter(t => (t.name || '').toLowerCase().includes(q) || (t.code || '').toLowerCase().includes(q));
        if (plan)   tenants = tenants.filter(t => String(t.plan) === plan);
        if (status) tenants = tenants.filter(t => String(t.status) === status);
        const page     = parseInt(req.params.get('page')     || '1');
        const pageSize = parseInt(req.params.get('pageSize') || '50');
        return ok(tenants.slice((page-1)*pageSize, page*pageSize));
    }

    // ── PLATFORM ADMIN — DENETİM KAYITLARI (tüm kullanıcılar) ───────────────
    if (path.startsWith('/api/platform-admin/audit-logs')) {
        if (path.endsWith('/summary')) return ok(DEMO_ACTIVITY_SUMMARY);
        const logId = path.replace('/api/platform-admin/audit-logs/', '').split('/')[0];
        if (logId && logId !== 'summary') {
            const found = DEMO_ACTIVITY_LOGS.find(l => l.id === logId);
            return ok(found ?? DEMO_ACTIVITY_LOGS[0]);
        }
        let logs = [...DEMO_ACTIVITY_LOGS];
        const onlyErrors = req.params.get('onlyErrors');
        const q          = (req.params.get('q') || '').toLowerCase();
        const userId     = req.params.get('userId');
        if (onlyErrors === 'true') logs = logs.filter(l => l.statusCode >= 400);
        if (q) logs = logs.filter(l =>
            (l.userName || '').toLowerCase().includes(q) ||
            (l.path     || '').toLowerCase().includes(q)
        );
        if (userId) logs = logs.filter(l => l.userId === userId);
        const page     = parseInt(req.params.get('page')     || '1');
        const pageSize = parseInt(req.params.get('pageSize') || '50');
        return ok(logs.slice((page-1)*pageSize, page*pageSize));
    }

    // ── POS SEPETLERİ ────────────────────────────────────────────────────────
    if (path.toLowerCase().startsWith('/api/poscart')) {
        // GET /api/PosCart/ByToken/{token} — AllowAnonymous, paylaşım linki
        if (path.toLowerCase().includes('/bytoken/')) {
            const token = path.split('/').pop()?.toUpperCase() ?? '';
            const found = DEMO_POS_CARTS.find(c => c.shareToken === token);
            if (found) {
                return ok({
                    id: found.id, shareToken: found.shareToken, label: found.label,
                    buyerId: found.buyerId, buyerName: found.buyerName,
                    paymentMethod: found.paymentMethod, warehouseId: 'demo-wh-01',
                    items: found.items, createdAt: found.createdAt, updatedAt: found.updatedAt,
                });
            }
            return ok(null);
        }
        // POST /api/PosCart/Save
        if (method === 'POST') {
            const body: any = req.body ?? {};
            const newId = newMockId();
            const newToken = 'DM' + Math.random().toString(36).substring(2, 8).toUpperCase();
            const label = body.label || 'Demo Sepet';
            return ok({ id: newId, shareToken: newToken, label, updatedAt: new Date().toISOString() });
        }
        // GET /api/PosCart/List
        if (method === 'GET') {
            return ok(DEMO_POS_CARTS.map(c => ({
                id: c.id, shareToken: c.shareToken, label: c.label,
                buyerName: c.buyerName, paymentMethod: c.paymentMethod,
                itemCount: c.items.length,
                grandTotal: c.items.reduce((s: number, i: any) => s + i.total, 0),
                createdAt: c.createdAt, updatedAt: c.updatedAt,
            })));
        }
        return noContent();
    }

    // ── MUHASEBE ─────────────────────────────────────────────────────────────
    if (path.startsWith('/api/accounting')) {
        // Çek/Senet
        if (path.includes('/check-notes')) {
            if (method === 'POST') {
                if (path.includes('/settle'))        return ok({ cariBalance: 0, treasuryBalance: 0 });
                if (path.includes('/change-status')) return noContent();
                return ok(`"${newMockId()}"`);
            }
            const cnSeg = path.split('/check-notes/').pop()?.split('/')[0] ?? '';
            if (cnSeg && cnSeg !== 'check-notes') {
                const found = DEMO_CHECK_NOTES.find(n => n.id === cnSeg);
                return ok(found ?? DEMO_CHECK_NOTES[0]);
            }
            if (path.includes('/due-list')) return ok(DEMO_CHECK_NOTES.filter(n => n.status === 1 || n.status === 2));
            return ok(DEMO_CHECK_NOTES);
        }
        // Banka Hesapları
        if (path.includes('/bank-accounts')) {
            if (method === 'POST') return ok(`"${newMockId()}"`);
            if (path.includes('/transactions')) {
                const baSeg = path.split('/bank-accounts/').pop()?.split('/')[0] ?? '';
                return ok(DEMO_BANK_TRANSACTIONS.filter(t => !baSeg || t.bankAccountId === baSeg));
            }
            const baSeg = path.split('/bank-accounts/').pop()?.split('/')[0] ?? '';
            if (baSeg && !baSeg.includes('bank-accounts')) {
                const found = DEMO_BANK_ACCOUNTS.find(b => b.id === baSeg);
                return ok(found ?? DEMO_BANK_ACCOUNTS[0]);
            }
            return ok(DEMO_BANK_ACCOUNTS);
        }
        // Kasa Hesapları
        if (path.includes('/cash-accounts')) {
            if (method === 'POST') return ok(`"${newMockId()}"`);
            if (path.includes('/transactions')) {
                const caSeg = path.split('/cash-accounts/').pop()?.split('/')[0] ?? '';
                return ok(DEMO_CASH_TRANSACTIONS.filter(t => !caSeg || t.cashAccountId === caSeg));
            }
            const caSeg = path.split('/cash-accounts/').pop()?.split('/')[0] ?? '';
            if (caSeg && !caSeg.includes('cash-accounts')) {
                const found = DEMO_CASH_ACCOUNTS.find(c => c.id === caSeg);
                return ok(found ?? DEMO_CASH_ACCOUNTS[0]);
            }
            return ok(DEMO_CASH_ACCOUNTS);
        }
        // Banka İşlemleri (direkt)
        if (path.includes('/bank-transactions') && method === 'POST') return ok(`"${newMockId()}"`);
        // Kasa İşlemleri (direkt)
        if (path.includes('/cash-transactions') && method === 'POST') return ok(`"${newMockId()}"`);
        // Tahsilat/Ödeme
        if (path.includes('/collection-payment') && method === 'POST') {
            return ok({ financeMovementId: newMockId(), cashTransactionId: newMockId(), bankTransactionId: newMockId(), cariBalance: 0, treasuryBalance: 0 });
        }
        // Hesap Planı
        if (path.includes('/chart-of-accounts')) {
            if (method === 'POST') return ok(`"${newMockId()}"`);
            const coaSeg = path.split('/chart-of-accounts/').pop()?.split('/')[0] ?? '';
            if (coaSeg && !coaSeg.includes('chart-of-accounts')) {
                return ok(DEMO_CHART_OF_ACCOUNTS.find(a => a.id === coaSeg) ?? DEMO_CHART_OF_ACCOUNTS[0]);
            }
            return ok(DEMO_CHART_OF_ACCOUNTS);
        }
        // Muhasebe Fişleri (journal entries)
        if (path.includes('/journal-entries')) {
            if (method === 'POST') return ok(`"${newMockId()}"`);
            return ok([]);
        }
        // Genel fallback
        return ok([]);
    }

    // ── Bilinmeyen GET → boş dizi; POST → sahte UUID ──────────────────────────
    if (method === 'GET')  return ok([]);
    if (method === 'POST') return ok(`"${newMockId()}"`);
    return noContent();
};

// ── Fatura liste DTO dönüştürücü ─────────────────────────────────────────────
function toListDto(inv: any) {
    return {
        id:              inv.id,
        invoiceNumber:   inv.invoiceNumber,
        invoiceCategory: inv.invoiceCategory,
        customerName:    inv.cariAccountName,
        taxNumber:       inv.taxNumber || '',
        totalAmount:     inv.grandTotal,
        taxTotal:        inv.taxTotal,
        status:          inv.status,
        issueDate:       inv.issueDate,
    };
}

// ── Fatura HTML önizleme oluşturucu ──────────────────────────────────────────
function buildInvoicePreviewHtml(inv: any): string {
    const typeLabel = inv.invoiceType === 1 ? 'E-FATURA' : 'E-ARŞİV FATURA';
    const catLabel  = inv.invoiceCategory === 1 ? 'SATIŞ'
                    : inv.invoiceCategory === 2 ? 'İADE'
                    : inv.invoiceCategory === 3 ? 'TEVKİFATLI' : 'STANDART';
    const items: any[] = inv.items ?? [];
    const rows = items.map((it: any, i: number) => `
        <tr>
            <td>${i+1}</td>
            <td>${it.productName}</td>
            <td style="text-align:right">${it.quantity}</td>
            <td>Adet</td>
            <td style="text-align:right">₺${it.unitPrice.toLocaleString('tr-TR')}</td>
            <td style="text-align:center">%${it.taxRate}</td>
            <td style="text-align:right">₺${it.taxAmount.toLocaleString('tr-TR')}</td>
            <td style="text-align:right;font-weight:600">₺${it.lineTotal.toLocaleString('tr-TR')}</td>
        </tr>`).join('');
    return `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8">
<title>Fatura – ${inv.invoiceNumber}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;font-size:12px;color:#1a1a1a;padding:28px}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #1e40af}
.co-name{font-size:18px;font-weight:700;color:#1e293b}.co-sub{color:#64748b;margin-top:4px;font-size:11px}
.inv-title{font-size:24px;font-weight:800;color:#1e40af;text-align:right}
.inv-num{font-size:13px;color:#334155;text-align:right;margin-top:4px}
.inv-cat{font-size:10px;font-weight:700;letter-spacing:.1em;color:#64748b;text-align:right;margin-top:4px}
.parties{display:flex;gap:16px;margin-bottom:20px}
.party{flex:1;border:1px solid #e2e8f0;border-radius:6px;padding:12px}
.party-lbl{font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#94a3b8;margin-bottom:6px}
.party-name{font-size:13px;font-weight:600;color:#1e293b;margin-bottom:4px}
.party-sub{font-size:11px;color:#64748b}
table{width:100%;border-collapse:collapse;margin-bottom:20px}
thead th{background:#f8fafc;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#64748b;padding:8px;border-bottom:2px solid #e2e8f0;text-align:left}
tbody td{padding:7px 8px;border-bottom:1px solid #f1f5f9;font-size:12px}
tbody tr:last-child td{border-bottom:none}
.totals{float:right;min-width:260px;margin-bottom:24px}
.t-row{display:flex;justify-content:space-between;padding:5px 0;font-size:12px;color:#475569}
.t-grand{font-size:14px;font-weight:700;color:#1e293b;padding-top:8px;border-top:2px solid #1e293b;margin-top:4px}
.footer{clear:both;font-size:10px;color:#94a3b8;text-align:center;padding-top:16px;border-top:1px solid #e2e8f0}
@media print{body{padding:12px}.hdr{page-break-after:avoid}}
</style></head><body>
<div class="hdr">
  <div>
    <div class="co-name">Demokart Elektronik A.Ş.</div>
    <div class="co-sub">VKN: 3820594712 · İstanbul, Türkiye</div>
    <div class="co-sub" style="margin-top:6px">Tarih: ${inv.issueDate}${inv.dueDate && inv.invoiceCategory !== 3 ? ' &nbsp;|&nbsp; Vade: '+inv.dueDate : ''}</div>
  </div>
  <div>
    <div class="inv-title">${typeLabel}</div>
    <div class="inv-num">${inv.invoiceNumber}</div>
    <div class="inv-cat">${catLabel} FATURASI</div>
  </div>
</div>
<div class="parties">
  <div class="party">
    <div class="party-lbl">Satıcı</div>
    <div class="party-name">Demokart Elektronik A.Ş.</div>
    <div class="party-sub">VKN: 3820594712</div>
    <div class="party-sub">İstanbul, Türkiye</div>
  </div>
  <div class="party">
    <div class="party-lbl">${inv.invoiceCategory === 3 ? 'Tedarikçi' : 'Alıcı'}</div>
    <div class="party-name">${inv.cariAccountName}</div>
    ${inv.taxNumber ? '<div class="party-sub">VKN/TCKN: '+inv.taxNumber+'</div>' : ''}
  </div>
</div>
<table>
  <thead><tr><th>#</th><th>Ürün / Hizmet</th><th style="text-align:right">Miktar</th><th>Birim</th><th style="text-align:right">Birim Fiyat</th><th style="text-align:center">KDV%</th><th style="text-align:right">KDV Tutarı</th><th style="text-align:right">Toplam</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="totals">
  <div class="t-row"><span>Ara Toplam</span><span>₺${inv.subtotal.toLocaleString('tr-TR')}</span></div>
  <div class="t-row"><span>KDV Toplam</span><span>₺${inv.taxTotal.toLocaleString('tr-TR')}</span></div>
  <div class="t-row t-grand"><span>Genel Toplam</span><span>₺${inv.grandTotal.toLocaleString('tr-TR')}</span></div>
</div>
<div class="footer">Bu belge elektronik ortamda oluşturulmuştur. Demokart Elektronik A.Ş. &copy; 2026</div>
</body></html>`;
}

// ── Cari suggest yardımcısı ───────────────────────────────────────────────────
function suggestCari(list: typeof DEMO_CARIS, q: string | null) {
    const query = (q || '').toLowerCase();
    return list
        .filter(c => !query || c.name.toLowerCase().includes(query) || (c.code ?? '').toLowerCase().includes(query))
        .slice(0, 10)
        .map(c => ({ id: c.id, code: c.code, name: c.name, label: c.name, subtitle: c.code, type: c.type }));
}

function buildDemoSupplierQuoteRequestList() {
    return buildDemoSupplierQuoteRequests().map((x: any) => ({
        id: x.id,
        requestNo: x.requestNo,
        title: x.title,
        warehouseId: x.warehouseId,
        warehouseName: x.warehouseName,
        neededByDateUtc: x.neededByDateUtc,
        status: x.status,
        supplierCount: x.offers.length,
        receivedOfferCount: x.offers.filter((o: any) => o.status === 2).length,
        estimatedBestTotal: Math.min(...x.offers.map((o: any) => o.totalAmount)),
        createdByUserName: x.createdByUserName,
        createdAtUtc: x.createdAtUtc,
    }));
}

function buildDemoSupplierQuoteRequests() {
    const products = DEMO_PRODUCTS.slice(0, 6);
    const suppliers = DEMO_SUPPLIERS.slice(0, 3);
    return [
        {
            id: '70000000-0000-0000-0000-000000000001',
            requestNo: 'TT-20260505-001',
            title: 'May�s telefon al�m�',
            warehouseId: DEMO_WH_ID,
            warehouseName: DEMO_WAREHOUSES[0].name,
            neededByDateUtc: new Date(Date.now() + 7 * 86400000).toISOString(),
            status: 3,
            notes: 'Bayi kampanyas� �ncesi fiyat toplan�yor.',
            createdByUserName: 'demo',
            createdAtUtc: new Date(Date.now() - 2 * 86400000).toISOString(),
            selectedSupplierCariAccountId: suppliers[0].id,
            selectedOfferId: '70000000-0000-0000-0000-000000000011',
            items: [
                { productId: products[4].id, productCode: products[4].code, productName: products[4].name, unit: products[4].unit, quantity: 20, targetUnitPrice: 47000, notes: '' },
                { productId: products[5].id, productCode: products[5].code, productName: products[5].name, unit: products[5].unit, quantity: 12, targetUnitPrice: 37500, notes: '' }
            ],
            offers: suppliers.map((supplier, index) => ({
                id: `70000000-0000-0000-0000-00000000001${index + 1}`,
                supplierCariAccountId: supplier.id,
                supplierName: supplier.name,
                status: 2,
                leadTimeDays: 5 + index * 2,
                notes: index === 0 ? 'En iyi toplam fiyat.' : 'Parcali sevkiyat yapabilir.',
                respondedAtUtc: new Date(Date.now() - (index + 1) * 3600000).toISOString(),
                totalAmount: (46500 + index * 1200) * 20 + (37200 + index * 800) * 12,
                isSelected: index === 0,
                items: [
                    { productId: products[4].id, productCode: products[4].code, productName: products[4].name, offeredQuantity: 20, unitPrice: 46500 + index * 1200, minimumOrderQuantity: 10, lineTotal: (46500 + index * 1200) * 20 },
                    { productId: products[5].id, productCode: products[5].code, productName: products[5].name, offeredQuantity: 12, unitPrice: 37200 + index * 800, minimumOrderQuantity: 6, lineTotal: (37200 + index * 800) * 12 }
                ]
            }))
        },
        {
            id: '70000000-0000-0000-0000-000000000002',
            requestNo: 'TT-20260505-002',
            title: 'Beyaz e�ya sezon a��l���',
            warehouseId: DEMO_WH2_ID,
            warehouseName: DEMO_WAREHOUSES[1].name,
            neededByDateUtc: new Date(Date.now() + 14 * 86400000).toISOString(),
            status: 2,
            notes: 'Kad�k�y �ube i�in stok haz�rlan�yor.',
            createdByUserName: 'demo',
            createdAtUtc: new Date(Date.now() - 86400000).toISOString(),
            selectedSupplierCariAccountId: null,
            selectedOfferId: null,
            items: [
                { productId: DEMO_PRODUCTS[18].id, productCode: DEMO_PRODUCTS[18].code, productName: DEMO_PRODUCTS[18].name, unit: DEMO_PRODUCTS[18].unit, quantity: 8, targetUnitPrice: 14500, notes: '' },
                { productId: DEMO_PRODUCTS[19].id, productCode: DEMO_PRODUCTS[19].code, productName: DEMO_PRODUCTS[19].name, unit: DEMO_PRODUCTS[19].unit, quantity: 10, targetUnitPrice: 11800, notes: '' }
            ],
            offers: suppliers.slice(1).map((supplier, index) => ({
                id: `70000000-0000-0000-0000-00000000002${index + 1}`,
                supplierCariAccountId: supplier.id,
                supplierName: supplier.name,
                status: index === 0 ? 2 : 1,
                leadTimeDays: 7 + index * 2,
                notes: '',
                respondedAtUtc: index === 0 ? new Date(Date.now() - 7200000).toISOString() : null,
                totalAmount: index === 0 ? 232000 : 0,
                isSelected: false,
                items: [
                    { productId: DEMO_PRODUCTS[18].id, productCode: DEMO_PRODUCTS[18].code, productName: DEMO_PRODUCTS[18].name, offeredQuantity: 8, unitPrice: 14400, minimumOrderQuantity: 4, lineTotal: 115200 },
                    { productId: DEMO_PRODUCTS[19].id, productCode: DEMO_PRODUCTS[19].code, productName: DEMO_PRODUCTS[19].name, offeredQuantity: 10, unitPrice: 11680, minimumOrderQuantity: 5, lineTotal: 116800 }
                ]
            }))
        }
    ];
}

function buildDemoCollectionPlanDashboard() {
    const items = DEMO_BUYERS.slice(0, 6).map((buyer, index) => ({
        cariAccountId: buyer.id,
        cariCode: buyer.code,
        cariName: buyer.name,
        currentBalance: buyer.currentBalance,
        riskLimit: buyer.riskLimit,
        overdueAmount: Math.max(25000, Math.round(Math.abs(buyer.currentBalance) * (0.18 + index * 0.07))),
        overdueDays: 8 + index * 9,
        riskUsageRate: buyer.riskLimit > 0 ? buyer.currentBalance / buyer.riskLimit : 1,
        suggestedPriority: index < 2 ? 4 : index < 4 ? 3 : 2,
        suggestedAction: index < 2 ? 'Yoneticiye eskale et' : index < 4 ? 'Odeme sozu al' : 'Musteriyi ara',
        planEntryId: index % 2 === 0 ? `80000000-0000-0000-0000-00000000000${index + 1}` : null,
        title: `Tahsilat takibi - ${buyer.name}`,
        priority: index < 2 ? 4 : index < 4 ? 3 : 2,
        status: index === 0 ? 5 : index === 1 ? 3 : index === 2 ? 2 : 1,
        nextActionDateUtc: new Date(Date.now() + (index + 1) * 86400000).toISOString(),
        promiseDateUtc: index < 2 ? new Date(Date.now() + (index + 3) * 86400000).toISOString() : null,
        assignedToUserName: index % 2 === 0 ? 'demo' : 'finans.operasyon',
        notes: 'Musteri ile tahsilat plan� konu�uldu.',
        lastContactAtUtc: new Date(Date.now() - index * 86400000).toISOString(),
        lastContactNote: 'Nakit ak���na g�re d�n�� bekleniyor.'
    }));

    return {
        summary: {
            totalAccountCount: items.length,
            plannedCount: items.filter((x: any) => !!x.planEntryId).length,
            criticalCount: items.filter((x: any) => x.priority === 4).length,
            totalOverdueAmount: items.reduce((sum: number, x: any) => sum + x.overdueAmount, 0),
            plannedAmount: items.filter((x: any) => !!x.planEntryId).reduce((sum: number, x: any) => sum + x.overdueAmount, 0)
        },
        items
    };
}

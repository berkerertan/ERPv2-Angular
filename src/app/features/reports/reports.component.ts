import { Component, signal, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import {
    ReportService,
    StockReportItem,
    SalesReportItem,
    CariBalanceReport,
    CariAgingReport,
    IncomeExpenseReport,
    PurchaseReportItem,
    DashboardSummaryDto,
} from '../../core/services/report.service';
import { AuthService } from '../../core/services/auth.service';

type PeriodType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
type ReportType = 'summary' | 'sales' | 'purchases' | 'stock' | 'cari-balances' | 'cari-aging' | 'income-expense';

interface DateRange { start: string; end: string; label: string; }

@Component({
    selector: 'app-reports',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './reports.component.html',
    styleUrls: ['../../shared/styles/crud-page.css', './reports.component.css']
})
export class ReportsComponent implements OnInit {
    private reportService = inject(ReportService);
    private authService  = inject(AuthService);

    // ── State ────────────────────────────────────────────────────────────────
    activeReport    = signal<ReportType>('summary');
    activePeriod    = signal<PeriodType>('monthly');
    customStart     = signal<string>(this.firstDayOfMonth());
    customEnd       = signal<string>(this.today());
    isLoading       = signal(false);
    isExporting     = signal(false);
    errorMessage    = signal('');

    // ── Data ─────────────────────────────────────────────────────────────────
    summaryData        = signal<DashboardSummaryDto | null>(null);
    salesData          = signal<SalesReportItem[]>([]);
    purchasesData      = signal<PurchaseReportItem[]>([]);
    stockData          = signal<StockReportItem[]>([]);
    cariBalancesData   = signal<CariBalanceReport[]>([]);
    cariAgingData      = signal<CariAgingReport[]>([]);
    incomeExpenseData  = signal<IncomeExpenseReport | null>(null);

    // ── Computed ─────────────────────────────────────────────────────────────
    dateRange = computed<DateRange>(() => this.computeDateRange());

    companyName = computed(() => {
        const user = this.authService.currentUser();
        return user?.tenantName || user?.userName || 'Şirket';
    });

    // ── Config ───────────────────────────────────────────────────────────────
    reportTypes: { id: ReportType; label: string; icon: string; description: string }[] = [
        { id: 'summary',        label: 'Genel Özet',       icon: 'dashboard',              description: 'Tüm modüllerin özet KPI\'ları' },
        { id: 'sales',          label: 'Satış Raporu',     icon: 'trending_up',            description: 'Dönem bazlı satış analizi' },
        { id: 'purchases',      label: 'Alış Raporu',      icon: 'local_shipping',         description: 'Tedarikçi alım raporu' },
        { id: 'stock',          label: 'Stok Raporu',      icon: 'inventory_2',            description: 'Depo bazlı stok durumu' },
        { id: 'cari-balances',  label: 'Cari Bakiyeler',   icon: 'account_balance_wallet', description: 'Cari hesap bakiyeleri' },
        { id: 'cari-aging',     label: 'Yaşlandırma',      icon: 'schedule',               description: 'Vade bazlı alacak analizi' },
        { id: 'income-expense', label: 'Gelir-Gider',      icon: 'bar_chart',              description: 'Nakit akış karşılaştırması' },
    ];

    periods: { id: PeriodType; label: string }[] = [
        { id: 'daily',     label: 'Bugün' },
        { id: 'weekly',    label: 'Bu Hafta' },
        { id: 'monthly',   label: 'Bu Ay' },
        { id: 'quarterly', label: 'Bu Çeyrek' },
        { id: 'yearly',    label: 'Bu Yıl' },
        { id: 'custom',    label: 'Özel Dönem' },
    ];

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    ngOnInit(): void {
        this.loadCurrentReport();
    }

    // ── Actions ───────────────────────────────────────────────────────────────
    selectReport(id: ReportType): void {
        this.activeReport.set(id);
        this.loadCurrentReport();
    }

    selectPeriod(id: PeriodType): void {
        this.activePeriod.set(id);
        if (id !== 'custom') this.loadCurrentReport();
    }

    applyCustomRange(): void {
        this.loadCurrentReport();
    }

    loadCurrentReport(): void {
        this.isLoading.set(true);
        this.errorMessage.set('');
        const { start, end } = this.dateRange();

        switch (this.activeReport()) {
            case 'summary':
                this.reportService.getDashboardSummary().pipe(catchError(() => of(null))).subscribe(d => {
                    this.summaryData.set(d);
                    this.isLoading.set(false);
                });
                break;

            case 'sales':
                this.reportService.getSalesReport(start, end).pipe(catchError(() => of([]))).subscribe(d => {
                    this.salesData.set(d as SalesReportItem[]);
                    this.isLoading.set(false);
                });
                break;

            case 'purchases':
                this.reportService.getPurchasesReport(start, end).pipe(catchError(() => of([]))).subscribe(d => {
                    this.purchasesData.set(d as PurchaseReportItem[]);
                    this.isLoading.set(false);
                });
                break;

            case 'stock':
                this.reportService.getStockReport().pipe(catchError(() => of([]))).subscribe(d => {
                    this.stockData.set(d as StockReportItem[]);
                    this.isLoading.set(false);
                });
                break;

            case 'cari-balances':
                this.reportService.getCariBalances().pipe(catchError(() => of([]))).subscribe(d => {
                    this.cariBalancesData.set(d as CariBalanceReport[]);
                    this.isLoading.set(false);
                });
                break;

            case 'cari-aging':
                this.reportService.getCariAging().pipe(catchError(() => of([]))).subscribe(d => {
                    this.cariAgingData.set(d as CariAgingReport[]);
                    this.isLoading.set(false);
                });
                break;

            case 'income-expense':
                this.reportService.getIncomeExpense(start, end).pipe(catchError(() => of(null))).subscribe(d => {
                    this.incomeExpenseData.set(d as IncomeExpenseReport | null);
                    this.isLoading.set(false);
                });
                break;

            default:
                this.isLoading.set(false);
        }
    }

    // ── PDF Export ────────────────────────────────────────────────────────────
    exportPdf(): void {
        this.isExporting.set(true);
        const html = this.buildPdfHtml();
        const win  = window.open('', '_blank', 'width=900,height=700');
        if (!win) { this.isExporting.set(false); return; }

        win.document.write(html);
        win.document.close();
        win.onload = () => {
            setTimeout(() => {
                win.focus();
                win.print();
                this.isExporting.set(false);
            }, 300);
        };
    }

    // ── Formatters ─────────────────────────────────────────────────────────────
    fc(n: number) {
        return '₺' + (n ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    pct(n: number) { return (n ?? 0).toFixed(1) + '%'; }
    num(n: number) { return (n ?? 0).toLocaleString('tr-TR'); }

    getReportLabel() {
        return this.reportTypes.find(r => r.id === this.activeReport())?.label ?? '';
    }

    // ── Computed Totals (sales) ────────────────────────────────────────────────
    get salesTotalAmount() { return this.salesData().reduce((s, r) => s + r.totalAmount, 0); }
    get salesTotalOrders() { return this.salesData().reduce((s, r) => s + r.orderCount, 0); }
    get purchasesTotalAmount() { return this.purchasesData().reduce((s, r) => s + r.totalAmount, 0); }
    get purchasesTotalOrders() { return this.purchasesData().reduce((s, r) => s + r.orderCount, 0); }
    get stockTotalValue() { return this.stockData().reduce((s, r) => s + r.totalValue, 0); }
    get stockTotalUnits() { return this.stockData().reduce((s, r) => s + r.balance, 0); }
    get cariTotalBalance() { return this.cariBalancesData().reduce((s, r) => s + r.balance, 0); }

    // ── Date Helpers ─────────────────────────────────────────────────────────
    private computeDateRange(): DateRange {
        const now = new Date();
        const fmt = (d: Date) => d.toISOString().split('T')[0];

        switch (this.activePeriod()) {
            case 'daily': {
                const t = fmt(now);
                return { start: t, end: t, label: `${t} (Günlük)` };
            }
            case 'weekly': {
                const day  = now.getDay() || 7;
                const mon  = new Date(now); mon.setDate(now.getDate() - day + 1);
                const sun  = new Date(mon); sun.setDate(mon.getDate() + 6);
                return { start: fmt(mon), end: fmt(sun), label: `${fmt(mon)} – ${fmt(sun)} (Haftalık)` };
            }
            case 'monthly': {
                const s = new Date(now.getFullYear(), now.getMonth(), 1);
                const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                return { start: fmt(s), end: fmt(e), label: `${now.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })} (Aylık)` };
            }
            case 'quarterly': {
                const q  = Math.floor(now.getMonth() / 3);
                const s  = new Date(now.getFullYear(), q * 3, 1);
                const e  = new Date(now.getFullYear(), q * 3 + 3, 0);
                return { start: fmt(s), end: fmt(e), label: `${now.getFullYear()} Q${q + 1} (Çeyreklik)` };
            }
            case 'yearly': {
                const s = new Date(now.getFullYear(), 0, 1);
                const e = new Date(now.getFullYear(), 11, 31);
                return { start: fmt(s), end: fmt(e), label: `${now.getFullYear()} (Yıllık)` };
            }
            case 'custom':
                return { start: this.customStart(), end: this.customEnd(), label: `${this.customStart()} – ${this.customEnd()}` };
        }
    }

    private today() { return new Date().toISOString().split('T')[0]; }
    private firstDayOfMonth() {
        const n = new Date();
        return new Date(n.getFullYear(), n.getMonth(), 1).toISOString().split('T')[0];
    }

    // ── PDF HTML Builder ─────────────────────────────────────────────────────
    private buildPdfHtml(): string {
        const type   = this.activeReport();
        const range  = this.dateRange();
        const titled = this.getReportLabel();
        const comp   = this.companyName();
        const now    = new Date().toLocaleString('tr-TR');

        const header = `
<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8">
<title>${titled} — ${comp}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Arial,sans-serif;font-size:11px;color:#1e293b;padding:20px 28px;background:#fff}
  .page-header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:14px;border-bottom:3px solid #3b82f6;margin-bottom:20px}
  .co-name{font-size:18px;font-weight:700;color:#1e293b}
  .co-sub{color:#64748b;font-size:10px;margin-top:3px}
  .rpt-title{font-size:22px;font-weight:800;color:#3b82f6;text-align:right}
  .rpt-sub{font-size:10px;color:#64748b;text-align:right;margin-top:3px}
  .meta-bar{display:flex;gap:24px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;padding:8px 12px;margin-bottom:16px;font-size:10px;color:#0369a1}
  .meta-bar span{font-weight:600}
  table{width:100%;border-collapse:collapse;margin-bottom:20px}
  thead th{background:#1e40af;color:#fff;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;padding:7px 8px;text-align:left}
  tbody tr:nth-child(even){background:#f8fafc}
  tbody td{padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:10px}
  .text-right{text-align:right}
  .text-center{text-align:center}
  .total-row td{background:#eff6ff!important;font-weight:700;border-top:2px solid #3b82f6;color:#1e40af}
  .kpi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px}
  .kpi-card{border:1px solid #e2e8f0;border-radius:8px;padding:14px;background:#f8fafc}
  .kpi-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:6px}
  .kpi-val{font-size:18px;font-weight:800;color:#1e293b}
  .kpi-sub{font-size:9px;color:#94a3b8;margin-top:3px}
  .section-title{font-size:12px;font-weight:700;color:#1e293b;border-left:4px solid #3b82f6;padding-left:8px;margin:18px 0 10px}
  .badge{display:inline-block;padding:2px 8px;border-radius:9999px;font-size:9px;font-weight:700}
  .badge-pos{background:#dcfce7;color:#16a34a} .badge-neg{background:#fee2e2;color:#dc2626}
  .footer{margin-top:24px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:9px;color:#94a3b8;display:flex;justify-content:space-between}
  @media print{body{padding:12px}@page{size:A4;margin:15mm}}
</style></head><body>
<div class="page-header">
  <div>
    <div class="co-name">${comp}</div>
    <div class="co-sub">ERP Yönetim Sistemi</div>
  </div>
  <div>
    <div class="rpt-title">${titled.toUpperCase()}</div>
    <div class="rpt-sub">${range.label}</div>
    <div class="rpt-sub" style="margin-top:2px">Oluşturma: ${now}</div>
  </div>
</div>`;

        const footer = `<div class="footer"><span>${comp} — Gizlilik Dereceli</span><span>Sayfa 1</span></div></body></html>`;

        let body = '';

        if (type === 'summary') {
            const s = this.summaryData();
            if (s) {
                body = `<div class="kpi-grid">
  <div class="kpi-card"><div class="kpi-label">Toplam Satış</div><div class="kpi-val">${this.fc(s.totalSalesAmount)}</div><div class="kpi-sub">${this.num(s.totalOrderCount)} sipariş</div></div>
  <div class="kpi-card"><div class="kpi-label">Banka Bakiyesi</div><div class="kpi-val">${this.fc(s.totalBankBalance)}</div><div class="kpi-sub">Konsolide banka</div></div>
  <div class="kpi-card"><div class="kpi-label">Kasa Bakiyesi</div><div class="kpi-val">${this.fc(s.totalCashBalance)}</div><div class="kpi-sub">Toplam nakit</div></div>
  <div class="kpi-card"><div class="kpi-label">Vadesi Geç. Alacak</div><div class="kpi-val">${this.fc(s.overdueReceivables)}</div><div class="kpi-sub" style="color:#dc2626">Tahsil edilmemiş</div></div>
  <div class="kpi-card"><div class="kpi-label">Bekleyen Teklif</div><div class="kpi-val">${this.num(s.pendingQuoteCount)}</div><div class="kpi-sub">Onay bekliyor</div></div>
  <div class="kpi-card"><div class="kpi-label">Aktif Cari</div><div class="kpi-val">${this.num(s.totalActiveCariCount)}</div><div class="kpi-sub">${this.num(s.totalProductCount)} ürün</div></div>
</div>`;
            }
        }

        else if (type === 'sales') {
            const rows = this.salesData().map(r => `<tr>
  <td>${r.date}</td><td class="text-right">${this.num(r.orderCount)}</td>
  <td class="text-right">${this.fc(r.totalAmount)}</td><td>${r.topProduct ?? '—'}</td>
</tr>`).join('');
            body = `<table><thead><tr><th>Tarih</th><th class="text-right">Sipariş</th><th class="text-right">Tutar</th><th>Öne Çıkan Ürün</th></tr></thead>
<tbody>${rows}
<tr class="total-row"><td>TOPLAM</td><td class="text-right">${this.num(this.salesTotalOrders)}</td><td class="text-right">${this.fc(this.salesTotalAmount)}</td><td></td></tr>
</tbody></table>`;
        }

        else if (type === 'purchases') {
            const rows = this.purchasesData().map(r => `<tr>
  <td>${r.date}</td><td class="text-right">${this.num(r.orderCount)}</td>
  <td class="text-right">${this.fc(r.totalAmount)}</td><td>${r.topSupplier ?? '—'}</td>
</tr>`).join('');
            body = `<table><thead><tr><th>Tarih</th><th class="text-right">Sipariş</th><th class="text-right">Tutar</th><th>Öne Çıkan Tedarikçi</th></tr></thead>
<tbody>${rows}
<tr class="total-row"><td>TOPLAM</td><td class="text-right">${this.num(this.purchasesTotalOrders)}</td><td class="text-right">${this.fc(this.purchasesTotalAmount)}</td><td></td></tr>
</tbody></table>`;
        }

        else if (type === 'stock') {
            const rows = this.stockData().map(r => `<tr>
  <td>${r.productName}</td><td>${r.barcode ?? '—'}</td><td>${r.warehouseName}</td>
  <td class="text-right">${this.num(r.balance)}</td><td>${r.unit}</td>
  <td class="text-right">${this.fc(r.totalValue)}</td>
</tr>`).join('');
            body = `<table><thead><tr><th>Ürün</th><th>Barkod</th><th>Depo</th><th class="text-right">Miktar</th><th>Birim</th><th class="text-right">Değer</th></tr></thead>
<tbody>${rows}
<tr class="total-row"><td colspan="3">TOPLAM</td><td class="text-right">${this.num(this.stockTotalUnits)}</td><td></td><td class="text-right">${this.fc(this.stockTotalValue)}</td></tr>
</tbody></table>`;
        }

        else if (type === 'cari-balances') {
            const rows = this.cariBalancesData().map(r => `<tr>
  <td>${r.name}</td><td>${r.type}</td>
  <td class="text-right"><span class="badge ${r.balance >= 0 ? 'badge-neg' : 'badge-pos'}">${this.fc(r.balance)}</span></td>
  <td>${r.lastTransaction ?? '—'}</td>
</tr>`).join('');
            body = `<table><thead><tr><th>Cari Ad</th><th>Tür</th><th class="text-right">Bakiye</th><th>Son İşlem</th></tr></thead>
<tbody>${rows}
<tr class="total-row"><td colspan="2">TOPLAM</td><td class="text-right">${this.fc(this.cariTotalBalance)}</td><td></td></tr>
</tbody></table>`;
        }

        else if (type === 'cari-aging') {
            const rows = this.cariAgingData().map(r => `<tr>
  <td>${r.name}</td>
  <td class="text-right">${this.fc(r.current)}</td><td class="text-right">${this.fc(r.days30)}</td>
  <td class="text-right">${this.fc(r.days60)}</td><td class="text-right">${this.fc(r.days90)}</td>
  <td class="text-right">${this.fc(r.over90)}</td><td class="text-right"><b>${this.fc(r.total)}</b></td>
</tr>`).join('');
            body = `<table><thead><tr><th>Cari</th><th class="text-right">Cari</th><th class="text-right">0-30 Gün</th><th class="text-right">31-60 Gün</th><th class="text-right">61-90 Gün</th><th class="text-right">>90 Gün</th><th class="text-right">Toplam</th></tr></thead>
<tbody>${rows}</tbody></table>`;
        }

        else if (type === 'income-expense') {
            const ie = this.incomeExpenseData();
            if (ie) {
                const kpis = `<div class="kpi-grid" style="grid-template-columns:repeat(3,1fr)">
  <div class="kpi-card"><div class="kpi-label">Toplam Gelir</div><div class="kpi-val" style="color:#16a34a">${this.fc(ie.totalIncome)}</div></div>
  <div class="kpi-card"><div class="kpi-label">Toplam Gider</div><div class="kpi-val" style="color:#dc2626">${this.fc(ie.totalExpense)}</div></div>
  <div class="kpi-card"><div class="kpi-label">Net Kâr</div><div class="kpi-val" style="color:${ie.netProfit >= 0 ? '#16a34a' : '#dc2626'}">${this.fc(ie.netProfit)}</div></div>
</div>`;
                const detailRows = (ie.items ?? []).map(i => `<tr>
  <td>${i.date}</td><td class="text-right" style="color:#16a34a">${this.fc(i.income)}</td>
  <td class="text-right" style="color:#dc2626">${this.fc(i.expense)}</td>
  <td class="text-right"><b>${this.fc(i.income - i.expense)}</b></td>
</tr>`).join('');
                const detail = detailRows ? `<div class="section-title">Dönem Detayı</div>
<table><thead><tr><th>Dönem</th><th class="text-right">Gelir</th><th class="text-right">Gider</th><th class="text-right">Net</th></tr></thead>
<tbody>${detailRows}</tbody></table>` : '';
                body = kpis + detail;
            }
        }

        return header + body + footer;
    }
}

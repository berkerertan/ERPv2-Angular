import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuoteService } from '../../core/services/quote.service';
import {
    Quote,
    QuoteListItem,
    QuoteStatus,
    UpsertQuoteRequest,
    UpsertQuoteItemRequest,
    UpdateQuoteStatusRequest
} from '../../core/models/quote.model';
import { ProductService } from '../../core/services/product.service';
import { CariAccountService } from '../../core/services/cari-account.service';
import { WarehouseService } from '../../core/services/warehouse.service';
import { CariAccount } from '../../core/models/cari-account.model';
import { ConfirmService } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../core/services/toast.service';

interface ProductCatalog {
    id: string; name: string; unit: string; unitPrice: number; categoryName: string;
}

interface FormLine {
    tempId: string;
    productId?: string;
    productName: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    discountPercent: number;
}

@Component({
    selector: 'app-quotes',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './quotes.component.html',
    styleUrls: ['./quotes.component.css', '../../shared/styles/crud-page.css']
})
export class QuotesComponent implements OnInit {
    private quoteService = inject(QuoteService);
    private productService = inject(ProductService);
    private cariAccountService = inject(CariAccountService);
    private warehouseService = inject(WarehouseService);
    private confirmService = inject(ConfirmService);
    private toastService = inject(ToastService);

    today = new Date().toISOString().split('T')[0];

    // ── Şirket bilgileri (TODO: tenant bilgisinden çekilecek) ───
    companyName    = 'ABC Teknoloji A.Ş.';
    companyPhone   = '0212 111 22 33';
    companyEmail   = 'info@abc.com';
    companyAddress = 'Levent, İstanbul';
    companyTaxNo   = '1234567890';

    // ── Ürün kataloğu ───────────────────────────────────────────
    catalog = signal<ProductCatalog[]>([]);
    catalogSearch = '';
    get filteredCatalog() {
        const q = this.catalogSearch.toLowerCase().trim();
        return !q ? this.catalog() : this.catalog().filter(p =>
            p.name.toLowerCase().includes(q) || p.categoryName.toLowerCase().includes(q)
        );
    }

    // ── Cari hesaplar & depolar ─────────────────────────────────
    cariAccounts = signal<CariAccount[]>([]);
    warehouses = signal<any[]>([]);

    // ── Teklif listesi ──────────────────────────────────────────
    sortColumn = '';
    sortDir: 'asc' | 'desc' = 'asc';
    searchTerm = '';

    quotes = signal<QuoteListItem[]>([]);

    get filteredQuotes() {
        let list = this.quotes();
        const q = this.searchTerm.toLowerCase();
        if (q) list = list.filter(x =>
            x.quoteNumber.toLowerCase().includes(q) ||
            x.customerName.toLowerCase().includes(q)
        );
        if (this.sortColumn) {
            const dir = this.sortDir === 'asc' ? 1 : -1;
            const col = this.sortColumn as keyof QuoteListItem;
            list = [...list].sort((a, b) => {
                const av = a[col] ?? '';
                const bv = b[col] ?? '';
                return typeof av === 'number'
                    ? dir * ((av as number) - (bv as number))
                    : dir * String(av).localeCompare(String(bv), 'tr');
            });
        }
        return list;
    }

    sort(col: string): void {
        if (this.sortColumn === col) { this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'; }
        else { this.sortColumn = col; this.sortDir = 'asc'; }
    }

    // ── İstatistikler ───────────────────────────────────────────
    get acceptedCount()  { return this.quotes().filter(q => q.status === QuoteStatus.Accepted).length; }
    get pendingCount()   { return this.quotes().filter(q => q.status === QuoteStatus.Draft || q.status === QuoteStatus.Sent).length; }
    get totalValue()     { return this.quotes().reduce((s, q) => s + q.grandTotal, 0); }

    // ── Lifecycle ───────────────────────────────────────────────
    ngOnInit(): void {
        this.loadQuotes();
        this.loadProducts();
        this.loadCariAccounts();
        this.loadWarehouses();
    }

    loadQuotes(): void {
        this.quoteService.getAll().subscribe({
            next: data => this.quotes.set(data),
            error: () => this.toastService.error('Hata', 'Teklifler yüklenemedi.')
        });
    }

    private loadProducts(): void {
        this.productService.getAll().subscribe({
            next: data => this.catalog.set(data.map(p => ({
                id: p.id, name: p.name, unit: p.unit || 'Adet',
                unitPrice: p.unitPrice ?? 0, categoryName: p.categoryName || ''
            }))),
            error: () => {}
        });
    }

    private loadCariAccounts(): void {
        this.cariAccountService.getAll().subscribe({
            next: data => this.cariAccounts.set(data),
            error: () => {}
        });
    }

    private loadWarehouses(): void {
        this.warehouseService.getAll().subscribe({
            next: data => this.warehouses.set(data),
            error: () => {}
        });
    }

    // ── Teklif numarası ─────────────────────────────────────────
    getNextQuoteNumber(): string {
        const year = new Date().getFullYear();
        const count = this.quotes().filter(q => q.quoteNumber.includes(String(year))).length;
        return `TKF-${year}-${String(count + 1).padStart(3, '0')}`;
    }

    // ── Modal ───────────────────────────────────────────────────
    showModal        = signal(false);
    showCatalogPicker = signal(false);
    showConvertModal = signal(false);
    editingId        = signal<string | null>(null);
    isSaving         = signal(false);
    formError        = signal('');

    formData = {
        quoteNumber: '',
        cariAccountId: '',
        customerName: '', customerPhone: '', customerEmail: '',
        date: '', validUntil: '',
        overallDiscountPercent: 0, taxPercent: 18,
        notes: '', status: QuoteStatus.Draft as QuoteStatus,
    };
    formLines = signal<FormLine[]>([]);

    // Convert to order
    convertQuoteId = '';
    convertWarehouseId = '';

    // Form hesaplamalar
    lineTotal(line: FormLine): number {
        return line.quantity * line.unitPrice * (1 - line.discountPercent / 100);
    }
    get subtotal():              number { return this.formLines().reduce((s, l) => s + this.lineTotal(l), 0); }
    get overallDiscountAmount(): number { return this.subtotal * (this.formData.overallDiscountPercent / 100); }
    get afterDiscount():         number { return this.subtotal - this.overallDiscountAmount; }
    get taxAmount():             number { return this.afterDiscount * (this.formData.taxPercent / 100); }
    get grandTotal():            number { return this.afterDiscount + this.taxAmount; }

    openAddModal(): void {
        this.editingId.set(null);
        const today    = new Date().toISOString().split('T')[0];
        const validity = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        this.formData  = { quoteNumber: this.getNextQuoteNumber(), cariAccountId: '', customerName: '', customerPhone: '', customerEmail: '', date: today, validUntil: validity, overallDiscountPercent: 0, taxPercent: 18, notes: '', status: QuoteStatus.Draft };
        this.formLines.set([this.newLine()]);
        this.formError.set('');
        this.showModal.set(true);
    }

    openEditModal(item: QuoteListItem): void {
        this.editingId.set(item.id);
        this.formError.set('');
        // Load full quote details
        this.quoteService.getById(item.id).subscribe({
            next: (q) => {
                this.formData = {
                    quoteNumber: q.quoteNumber,
                    cariAccountId: q.cariAccountId || '',
                    customerName: q.customerName, customerPhone: q.customerPhone || '', customerEmail: q.customerEmail || '',
                    date: q.quoteDateUtc?.split('T')[0] || '', validUntil: q.validUntilUtc?.split('T')[0] || '',
                    overallDiscountPercent: q.overallDiscountPercent, taxPercent: q.taxPercent,
                    notes: q.notes || '', status: q.status
                };
                this.formLines.set(q.items.map(i => ({
                    tempId: i.id,
                    productId: i.productId,
                    productName: i.productName,
                    unit: i.unit,
                    quantity: i.quantity,
                    unitPrice: i.unitPrice,
                    discountPercent: i.discountPercent
                })));
                this.showModal.set(true);
            },
            error: () => this.toastService.error('Hata', 'Teklif detayı yüklenemedi.')
        });
    }

    closeModal(): void { this.showModal.set(false); }

    newLine(): FormLine {
        return { tempId: Date.now().toString() + Math.random(), productName: '', unit: 'Adet', quantity: 1, unitPrice: 0, discountPercent: 0 };
    }

    addLine(): void { this.formLines.update(lines => [...lines, this.newLine()]); }
    removeLine(id: string): void { this.formLines.update(lines => lines.filter(l => l.tempId !== id)); }

    openCatalogPicker(): void { this.catalogSearch = ''; this.showCatalogPicker.set(true); }

    selectFromCatalog(product: ProductCatalog): void {
        const existing = this.formLines().find(l => l.productName === product.name);
        if (existing) {
            this.formLines.update(lines => lines.map(l => l.tempId === existing.tempId ? { ...l, quantity: l.quantity + 1 } : l));
        } else {
            this.formLines.update(lines => [...lines, {
                tempId: Date.now().toString() + Math.random(),
                productId: product.id,
                productName: product.name, unit: product.unit,
                quantity: 1, unitPrice: product.unitPrice, discountPercent: 0
            }]);
        }
        this.showCatalogPicker.set(false);
    }

    saveQuote(): void {
        if (!this.formData.customerName.trim()) {
            this.formError.set('Müşteri adı zorunludur.');
            return;
        }
        if (!this.formData.quoteNumber.trim()) {
            this.formError.set('Teklif numarası zorunludur.');
            return;
        }
        const validLines = this.formLines().filter(l => l.productName.trim());
        if (validLines.length === 0) {
            this.formError.set('En az bir kalem eklenmelidir.');
            return;
        }

        this.isSaving.set(true);
        this.formError.set('');

        const items: UpsertQuoteItemRequest[] = validLines.map(l => ({
            productId: l.productId || undefined,
            productName: l.productName.trim(),
            unit: l.unit || 'Adet',
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            discountPercent: l.discountPercent
        }));

        const req: UpsertQuoteRequest = {
            quoteNumber: this.formData.quoteNumber.trim(),
            cariAccountId: this.formData.cariAccountId || undefined,
            customerName: this.formData.customerName.trim(),
            customerPhone: this.formData.customerPhone || undefined,
            customerEmail: this.formData.customerEmail || undefined,
            quoteDateUtc: this.formData.date || new Date().toISOString(),
            validUntilUtc: this.formData.validUntil,
            overallDiscountPercent: this.formData.overallDiscountPercent,
            taxPercent: this.formData.taxPercent,
            notes: this.formData.notes || undefined,
            items
        };

        const editing = this.editingId();

        if (editing) {
            this.quoteService.update(editing, req).subscribe({
                next: () => { this.isSaving.set(false); this.closeModal(); this.loadQuotes(); this.toastService.success('Güncellendi', 'Teklif güncellendi.'); },
                error: (err) => { this.isSaving.set(false); this.formError.set(err.error?.detail || err.error || 'Güncelleme başarısız.'); }
            });
        } else {
            this.quoteService.create(req).subscribe({
                next: () => { this.isSaving.set(false); this.closeModal(); this.loadQuotes(); this.toastService.success('Oluşturuldu', 'Yeni teklif kaydedildi.'); },
                error: (err) => { this.isSaving.set(false); this.formError.set(err.error?.detail || err.error || 'Kayıt oluşturulamadı.'); }
            });
        }
    }

    async deleteQuote(item: QuoteListItem): Promise<void> {
        const confirmed = await this.confirmService.confirm({
            title: 'Silme Onayı',
            message: `"${item.quoteNumber}" numaralı teklifi silmek istediğinize emin misiniz?`,
            confirmText: 'Sil',
            type: 'danger'
        });
        if (!confirmed) return;
        this.quoteService.delete(item.id).subscribe({
            next: () => { this.loadQuotes(); this.toastService.success('Silindi', 'Teklif silindi.'); },
            error: (err) => this.toastService.error('Hata', err.error?.detail || 'Silme başarısız.')
        });
    }

    // ── Status ──────────────────────────────────────────────────
    changeStatus(item: QuoteListItem, newStatus: QuoteStatus): void {
        this.quoteService.changeStatus(item.id, { status: newStatus }).subscribe({
            next: () => { this.loadQuotes(); this.toastService.success('Güncellendi', `Durum "${this.statusLabel(newStatus)}" olarak değiştirildi.`); },
            error: (err) => this.toastService.error('Hata', err.error || 'Durum değiştirilemedi.')
        });
    }

    // ── Convert to order ────────────────────────────────────────
    openConvertModal(item: QuoteListItem): void {
        this.convertQuoteId = item.id;
        this.convertWarehouseId = '';
        this.showConvertModal.set(true);
    }

    convertToOrder(): void {
        if (!this.convertWarehouseId) return;
        this.quoteService.convertToOrder(this.convertQuoteId, { warehouseId: this.convertWarehouseId }).subscribe({
            next: () => { this.showConvertModal.set(false); this.loadQuotes(); this.toastService.success('Dönüştürüldü', 'Teklif satış siparişine dönüştürüldü.'); },
            error: (err) => this.toastService.error('Hata', err.error || 'Dönüştürme başarısız.')
        });
    }

    // ── Helpers ──────────────────────────────────────────────────
    statusLabel(s: QuoteStatus): string {
        const labels: Record<number, string> = {
            [QuoteStatus.Draft]: 'Taslak',
            [QuoteStatus.Sent]: 'Gönderildi',
            [QuoteStatus.Accepted]: 'Kabul Edildi',
            [QuoteStatus.Rejected]: 'Reddedildi',
            [QuoteStatus.Expired]: 'Süresi Doldu',
            [QuoteStatus.ConvertedToOrder]: 'Siparişe Dönüştü'
        };
        return labels[s] ?? '—';
    }

    statusClass(s: QuoteStatus): string {
        const map: Record<number, string> = {
            [QuoteStatus.Draft]: 'badge-secondary',
            [QuoteStatus.Sent]: 'badge-info',
            [QuoteStatus.Accepted]: 'badge-success',
            [QuoteStatus.Rejected]: 'badge-danger',
            [QuoteStatus.Expired]: 'badge-muted',
            [QuoteStatus.ConvertedToOrder]: 'badge-warning'
        };
        return map[s] ?? 'badge-secondary';
    }

    readonly QuoteStatus = QuoteStatus;

    // ── Yazdırma ────────────────────────────────────────────────
    printPreview(type: 'a4' | 'receipt'): void {
        // Build a temporary Quote-like object from form data for printing
        const tempQuote = {
            quoteNumber: this.formData.quoteNumber || 'ÖNİZLEME',
            customerName: this.formData.customerName,
            customerPhone: this.formData.customerPhone,
            customerEmail: this.formData.customerEmail,
            date: this.formData.date,
            validUntil: this.formData.validUntil,
            lines: this.formLines().filter(l => l.productName.trim()),
            overallDiscountPercent: this.formData.overallDiscountPercent,
            taxPercent: this.formData.taxPercent,
            notes: this.formData.notes,
            status: this.formData.status
        };
        if (type === 'a4') this.printA4(tempQuote);
        else this.printReceipt(tempQuote);
    }

    printFromList(item: QuoteListItem, type: 'a4' | 'receipt'): void {
        this.quoteService.getById(item.id).subscribe({
            next: (q) => {
                const printData = {
                    quoteNumber: q.quoteNumber,
                    customerName: q.customerName,
                    customerPhone: q.customerPhone || '',
                    customerEmail: q.customerEmail || '',
                    date: q.quoteDateUtc?.split('T')[0] || '',
                    validUntil: q.validUntilUtc?.split('T')[0] || '',
                    lines: q.items.map(i => ({
                        productName: i.productName,
                        unit: i.unit,
                        quantity: i.quantity,
                        unitPrice: i.unitPrice,
                        discountPercent: i.discountPercent
                    })),
                    overallDiscountPercent: q.overallDiscountPercent,
                    taxPercent: q.taxPercent,
                    notes: q.notes || '',
                    status: q.status
                };
                if (type === 'a4') this.printA4(printData);
                else this.printReceipt(printData);
            }
        });
    }

    private printA4(q: any): void {
        const w = window.open('', '_blank', 'width=960,height=700');
        if (!w) return;
        w.document.write(this.buildA4Html(q));
        w.document.close();
        w.focus();
        setTimeout(() => { w.print(); }, 600);
    }

    private printReceipt(q: any): void {
        const w = window.open('', '_blank', 'width=380,height=620');
        if (!w) return;
        w.document.write(this.buildReceiptHtml(q));
        w.document.close();
        w.focus();
        setTimeout(() => { w.print(); }, 600);
    }

    private fc(n: number): string {
        return '₺' + n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    private escapeHtml(str: string): string {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    private buildA4Html(q: any): string {
        const sub = q.lines.reduce((s: number, l: any) => s + l.quantity * l.unitPrice * (1 - l.discountPercent / 100), 0);
        const discAmt = sub * (q.overallDiscountPercent / 100);
        const net = sub - discAmt;
        const taxAmt = net * (q.taxPercent / 100);
        const grand = net + taxAmt;
        const fc = this.fc.bind(this);
        const esc = this.escapeHtml.bind(this);

        const linesHtml = q.lines.map((l: any, i: number) => {
            const lt = l.quantity * l.unitPrice * (1 - l.discountPercent / 100);
            return `<tr><td>${i + 1}</td><td>${esc(l.productName)}</td><td style="text-align:center">${l.quantity}</td><td style="text-align:center">${esc(l.unit)}</td><td style="text-align:right">${fc(l.unitPrice)}</td><td style="text-align:center">${l.discountPercent > 0 ? '%' + l.discountPercent : '—'}</td><td style="text-align:right;font-weight:700">${fc(lt)}</td></tr>`;
        }).join('');

        return `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="script-src 'none'"><title>Teklif ${esc(q.quoteNumber)}</title><style>@page{size:A4 portrait;margin:14mm 16mm 20mm 16mm}*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:11pt;color:#1a1a2e;background:#fff}.hdr{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:14px;border-bottom:3px solid #4c6ef5;margin-bottom:18px}.co-name{font-size:18pt;font-weight:900;color:#4c6ef5}.co-info{font-size:8.5pt;color:#555;line-height:1.7;margin-top:4px}.qt-label{font-size:24pt;font-weight:900;color:#1a1a2e;letter-spacing:3px;text-align:right}.qt-num{font-size:11pt;color:#4c6ef5;font-weight:700;text-align:right;margin-top:3px}.meta{display:flex;gap:14px;margin-bottom:18px}.mbox{background:#f7f8ff;border:1px solid #dce4ff;border-radius:6px;padding:9px 13px;flex:1}.mbox label{font-size:7.5pt;color:#888;text-transform:uppercase;letter-spacing:.8px;display:block;margin-bottom:2px}.mbox span{font-size:10pt;font-weight:600;color:#1a1a2e}.sec{font-size:8pt;text-transform:uppercase;letter-spacing:1px;color:#888;font-weight:700;margin-bottom:6px}.cust{background:#f7f8ff;border-left:4px solid #4c6ef5;padding:11px 15px;margin-bottom:18px;border-radius:0 6px 6px 0}.cust-name{font-size:13pt;font-weight:700;color:#1a1a2e}.cust-info{font-size:9pt;color:#555;margin-top:3px}table{width:100%;border-collapse:collapse;margin-bottom:14px}thead tr{background:#4c6ef5;color:#fff}thead th{padding:8px 10px;text-align:left;font-size:9pt;font-weight:700}tbody tr:nth-child(even){background:#f7f8ff}tbody tr{border-bottom:1px solid #e8ecff}tbody td{padding:7px 10px;font-size:10pt;vertical-align:middle}.tot-wrap{display:flex;justify-content:flex-end;margin-bottom:18px}.tot-box{width:290px}.tot-row{display:flex;justify-content:space-between;padding:5px 0;font-size:10pt;border-bottom:1px solid #eee;color:#444}.tot-grand{background:#4c6ef5;color:#fff;padding:10px 13px;border-radius:6px;margin-top:8px;font-size:14pt;font-weight:900;border:none}.notes{background:#fffbf0;border:1px solid #ffd96a;border-radius:6px;padding:10px 14px;margin-bottom:22px;font-size:9.5pt;color:#555}.notes strong{color:#1a1a2e;display:block;margin-bottom:3px;font-size:8pt;text-transform:uppercase;letter-spacing:.8px}.sigs{display:flex;gap:40px;margin-top:32px}.sig{flex:1;border-top:1px solid #ccc;padding-top:8px;text-align:center;font-size:9pt;color:#555}.foot{text-align:center;font-size:8pt;color:#aaa;margin-top:18px;border-top:1px solid #eee;padding-top:9px}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>
<div class="hdr"><div><div class="co-name">${esc(this.companyName)}</div><div class="co-info">${esc(this.companyAddress)}<br>Tel: ${esc(this.companyPhone)} · E-posta: ${esc(this.companyEmail)}<br>Vergi No: ${esc(this.companyTaxNo)}</div></div><div><div class="qt-label">TEKLİF</div><div class="qt-num">${esc(q.quoteNumber)}</div></div></div>
<div class="meta"><div class="mbox"><label>Teklif Tarihi</label><span>${esc(q.date)}</span></div><div class="mbox"><label>Geçerlilik Tarihi</label><span>${esc(q.validUntil)}</span></div><div class="mbox"><label>KDV Oranı</label><span>%${q.taxPercent}</span></div><div class="mbox"><label>Durum</label><span>${esc(this.statusLabel(q.status))}</span></div></div>
<div class="sec">Müşteri Bilgileri</div><div class="cust"><div class="cust-name">${esc(q.customerName)}</div><div class="cust-info">${[q.customerPhone ? 'Tel: ' + esc(q.customerPhone) : '', q.customerEmail ? 'E-posta: ' + esc(q.customerEmail) : ''].filter(Boolean).join(' · ')}</div></div>
<div class="sec">Ürün / Hizmet Detayları</div>
<table><thead><tr><th style="width:30px">#</th><th>Ürün / Açıklama</th><th style="width:55px;text-align:center">Miktar</th><th style="width:55px;text-align:center">Birim</th><th style="width:105px;text-align:right">Birim Fiyat</th><th style="width:70px;text-align:center">İskonto</th><th style="width:115px;text-align:right">Toplam</th></tr></thead><tbody>${linesHtml}</tbody></table>
<div class="tot-wrap"><div class="tot-box"><div class="tot-row"><span>Ara Toplam</span><span>${fc(sub)}</span></div>${q.overallDiscountPercent > 0 ? `<div class="tot-row"><span>Genel İskonto (%${q.overallDiscountPercent})</span><span style="color:#16a34a">— ${fc(discAmt)}</span></div>` : ''}<div class="tot-row"><span>KDV (%${q.taxPercent})</span><span>${fc(taxAmt)}</span></div><div class="tot-row tot-grand"><span>GENEL TOPLAM</span><span>${fc(grand)}</span></div></div></div>
${q.notes ? `<div class="notes"><strong>Notlar</strong>${esc(q.notes)}</div>` : ''}
<div class="sigs"><div class="sig">Teklifi Hazırlayan<br><br><br>${esc(this.companyName)}</div><div class="sig">Müşteri Onayı<br><br><br>${esc(q.customerName)}</div></div>
<div class="foot">Bu teklif ${esc(q.validUntil)} tarihine kadar geçerlidir. · ${esc(this.companyName)} · ${esc(this.companyEmail)}</div>
</body></html>`;
    }

    private buildReceiptHtml(q: any): string {
        const sub = q.lines.reduce((s: number, l: any) => s + l.quantity * l.unitPrice * (1 - l.discountPercent / 100), 0);
        const discAmt = sub * (q.overallDiscountPercent / 100);
        const net = sub - discAmt;
        const taxAmt = net * (q.taxPercent / 100);
        const grand = net + taxAmt;
        const fc2 = (n: number) => n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const esc = this.escapeHtml.bind(this);

        const linesHtml = q.lines.map((l: any) => {
            const lt = l.quantity * l.unitPrice * (1 - l.discountPercent / 100);
            const disc = l.discountPercent > 0 ? ` (-%${l.discountPercent})` : '';
            return `<div class="item-name">${esc(l.productName)}${disc}</div><div class="item-calc"><span>${l.quantity} ${esc(l.unit)} x ${fc2(l.unitPrice)}</span><span><b>${fc2(lt)}</b></span></div>`;
        }).join('<div class="sep-dash"></div>');

        return `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="script-src 'none'"><title>Fiş ${esc(q.quoteNumber)}</title><style>@page{size:80mm auto;margin:2mm}*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Courier New',Courier,monospace;font-size:9pt;width:76mm;color:#000;background:#fff;padding:2mm}.c{text-align:center}.b{font-weight:bold}.lg{font-size:12pt}.dline{border-top:2px solid #000;margin:4px 0}.sline{border-top:1px dashed #555;margin:3px 0}.sep-dash{border-top:1px dotted #999;margin:2px 0}.row{display:flex;justify-content:space-between}.item-name{font-weight:bold;font-size:9pt;margin-top:4px}.item-calc{display:flex;justify-content:space-between;font-size:8.5pt;color:#333;padding-bottom:2px}.tot{display:flex;justify-content:space-between;padding:1px 0;font-size:9pt}.grand{font-size:12.5pt;font-weight:900;margin-top:2px}.ft{font-size:8pt;text-align:center;color:#333;margin-top:3px}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>
<div class="c b lg">${esc(this.companyName)}</div><div class="c" style="font-size:8pt">${esc(this.companyPhone)}</div><div class="c" style="font-size:8pt">${esc(this.companyAddress)}</div><div class="dline"></div><div class="c b" style="font-size:12pt;letter-spacing:4px">TEKLİF</div><div class="sline"></div><div class="row"><span>No :</span><span>${esc(q.quoteNumber)}</span></div><div class="row"><span>Tarih :</span><span>${esc(q.date)}</span></div><div class="row"><span>Gecerlilik :</span><span>${esc(q.validUntil)}</span></div><div class="dline"></div><div class="b">Musteri: ${esc(q.customerName)}</div>${q.customerPhone ? `<div style="font-size:8.5pt">Tel: ${esc(q.customerPhone)}</div>` : ''}<div class="dline"></div>${linesHtml}<div class="dline"></div><div class="tot"><span>Ara Toplam :</span><span>${fc2(sub)}</span></div>${q.overallDiscountPercent > 0 ? `<div class="tot"><span>Iskonto -%${q.overallDiscountPercent} :</span><span>-${fc2(discAmt)}</span></div>` : ''}<div class="tot"><span>KDV %${q.taxPercent} :</span><span>${fc2(taxAmt)}</span></div><div class="dline"></div><div class="tot grand"><span>TOPLAM :</span><span>${fc2(grand)} TL</span></div><div class="dline"></div>${q.notes ? `<div style="font-size:8.5pt;margin-top:3px"><b>Not:</b> ${esc(q.notes)}</div><div class="sline"></div>` : ''}<div class="ft">Bu teklif ${esc(q.validUntil)} tarihine kadar gecerlidir.</div><div class="ft" style="margin-top:6px;font-weight:bold">Tesekkurler!</div><div style="margin-top:14px"></div></body></html>`;
    }
}

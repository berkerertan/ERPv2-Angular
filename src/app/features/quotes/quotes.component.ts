import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ProductCatalog {
    id: string; name: string; unit: string; unitPrice: number; categoryName: string;
}

export interface QuoteLine {
    id: string;
    productName: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    discountPercent: number;
}

export interface Quote {
    id: string;
    quoteNumber: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    date: string;
    validUntil: string;
    lines: QuoteLine[];
    overallDiscountPercent: number;
    taxPercent: number;
    notes: string;
    status: 'draft' | 'sent' | 'accepted' | 'rejected';
}

@Component({
    selector: 'app-quotes',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './quotes.component.html',
    styleUrls: ['./quotes.component.css', '../../shared/styles/crud-page.css']
})
export class QuotesComponent {

    // ── Şirket bilgileri ──────────────────────────────────────────────────────
    companyName    = 'ABC Teknoloji A.Ş.';
    companyPhone   = '0212 111 22 33';
    companyEmail   = 'info@abc.com';
    companyAddress = 'Levent, İstanbul';
    companyTaxNo   = '1234567890';

    // ── Ürün kataloğu (demo) ──────────────────────────────────────────────────
    readonly catalog: ProductCatalog[] = [
        { id: '1',  name: 'Laptop HP ProBook',        unit: 'Adet',  unitPrice: 35000, categoryName: 'Elektronik' },
        { id: '2',  name: 'Samsung Monitor 27"',       unit: 'Adet',  unitPrice: 12500, categoryName: 'Elektronik' },
        { id: '3',  name: 'Mekanik Klavye',            unit: 'Adet',  unitPrice: 2800,  categoryName: 'Aksesuar'   },
        { id: '4',  name: 'USB-C Hub',                 unit: 'Adet',  unitPrice: 1200,  categoryName: 'Aksesuar'   },
        { id: '5',  name: 'A4 Fotokopi Kağıdı',        unit: 'Paket', unitPrice: 180,   categoryName: 'Kırtasiye'  },
        { id: '6',  name: 'Wireless Mouse Logitech',   unit: 'Adet',  unitPrice: 950,   categoryName: 'Aksesuar'   },
        { id: '7',  name: 'Ofis Sandalye Ergonomik',   unit: 'Adet',  unitPrice: 8500,  categoryName: 'Mobilya'    },
        { id: '8',  name: 'Webcam HD 1080p',           unit: 'Adet',  unitPrice: 1800,  categoryName: 'Elektronik' },
        { id: '9',  name: 'Toner HP LaserJet',         unit: 'Adet',  unitPrice: 2200,  categoryName: 'Kırtasiye'  },
        { id: '10', name: 'Ethernet Kablosu Cat6',     unit: 'Metre', unitPrice: 120,   categoryName: 'Aksesuar'   },
    ];

    catalogSearch = '';
    get filteredCatalog() {
        const q = this.catalogSearch.toLowerCase().trim();
        return !q ? this.catalog : this.catalog.filter(p =>
            p.name.toLowerCase().includes(q) || p.categoryName.toLowerCase().includes(q)
        );
    }

    // ── Teklif listesi ────────────────────────────────────────────────────────
    sortColumn = '';
    sortDir: 'asc' | 'desc' = 'asc';
    searchTerm = '';

    quotes = signal<Quote[]>([
        {
            id: '1', quoteNumber: 'TKF-2026-001',
            customerName: 'Turkcell Teknoloji A.Ş.', customerPhone: '0532 532 0000', customerEmail: 'tedarik@turkcell.com.tr',
            date: '2026-03-15', validUntil: '2026-04-15',
            lines: [
                { id: '1', productName: 'Laptop HP ProBook',      unit: 'Adet', quantity: 5, unitPrice: 35000, discountPercent: 10 },
                { id: '2', productName: 'Samsung Monitor 27"',    unit: 'Adet', quantity: 5, unitPrice: 12500, discountPercent: 5  },
                { id: '3', productName: 'Mekanik Klavye',         unit: 'Adet', quantity: 5, unitPrice: 2800,  discountPercent: 0  },
            ],
            overallDiscountPercent: 5, taxPercent: 18,
            notes: 'Teslimat süresi 3-5 iş günüdür.',
            status: 'sent',
        },
        {
            id: '2', quoteNumber: 'TKF-2026-002',
            customerName: 'XYZ Ticaret Ltd.', customerPhone: '0312 444 55 66', customerEmail: 'info@xyz.com',
            date: '2026-03-18', validUntil: '2026-04-18',
            lines: [
                { id: '1', productName: 'Ofis Sandalye Ergonomik', unit: 'Adet',  quantity: 10, unitPrice: 8500, discountPercent: 15 },
                { id: '2', productName: 'A4 Fotokopi Kağıdı',      unit: 'Paket', quantity: 50, unitPrice: 180,  discountPercent: 0  },
            ],
            overallDiscountPercent: 0, taxPercent: 18,
            notes: '',
            status: 'draft',
        },
    ]);

    get filteredQuotes() {
        let list = this.quotes();
        const q = this.searchTerm.toLowerCase();
        if (q) list = list.filter(x =>
            x.quoteNumber.toLowerCase().includes(q) ||
            x.customerName.toLowerCase().includes(q)
        );
        if (this.sortColumn) {
            const dir = this.sortDir === 'asc' ? 1 : -1;
            const col = this.sortColumn;
            list = [...list].sort((a, b) => {
                let av: any = (a as any)[col];
                let bv: any = (b as any)[col];
                if (col === 'grandTotal') { av = this.calcGrandTotal(a); bv = this.calcGrandTotal(b); }
                return typeof av === 'number'
                    ? dir * (av - bv)
                    : dir * String(av).localeCompare(String(bv), 'tr');
            });
        }
        return list;
    }

    sort(col: string): void {
        if (this.sortColumn === col) { this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'; }
        else { this.sortColumn = col; this.sortDir = 'asc'; }
    }

    // ── İstatistikler ─────────────────────────────────────────────────────────
    get acceptedCount()  { return this.quotes().filter(q => q.status === 'accepted').length; }
    get pendingCount()   { return this.quotes().filter(q => q.status === 'draft' || q.status === 'sent').length; }
    get totalValue()     { return this.quotes().reduce((s, q) => s + this.calcGrandTotal(q), 0); }

    calcGrandTotal(q: Quote): number {
        const sub  = q.lines.reduce((s, l) => s + l.quantity * l.unitPrice * (1 - l.discountPercent / 100), 0);
        const disc = sub * (q.overallDiscountPercent / 100);
        const net  = sub - disc;
        return net * (1 + q.taxPercent / 100);
    }

    // ── Teklif numarası ───────────────────────────────────────────────────────
    getNextQuoteNumber(): string {
        const year = new Date().getFullYear();
        const count = this.quotes().filter(q => q.quoteNumber.includes(String(year))).length;
        return `TKF-${year}-${String(count + 1).padStart(3, '0')}`;
    }

    // ── Modal ─────────────────────────────────────────────────────────────────
    showModal        = signal(false);
    showCatalogPicker = signal(false);
    editingId        = signal<string | null>(null);

    formData = {
        customerName: '', customerPhone: '', customerEmail: '',
        date: '', validUntil: '',
        overallDiscountPercent: 0, taxPercent: 18,
        notes: '', status: 'draft' as Quote['status'],
    };
    formLines = signal<QuoteLine[]>([]);

    // Form hesaplamalar
    lineTotal(line: QuoteLine): number {
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
        this.formData  = { customerName: '', customerPhone: '', customerEmail: '', date: today, validUntil: validity, overallDiscountPercent: 0, taxPercent: 18, notes: '', status: 'draft' };
        this.formLines.set([this.newLine()]);
        this.showModal.set(true);
    }

    openEditModal(q: Quote): void {
        this.editingId.set(q.id);
        this.formData = {
            customerName: q.customerName, customerPhone: q.customerPhone, customerEmail: q.customerEmail,
            date: q.date, validUntil: q.validUntil,
            overallDiscountPercent: q.overallDiscountPercent, taxPercent: q.taxPercent,
            notes: q.notes, status: q.status
        };
        this.formLines.set(q.lines.map(l => ({ ...l })));
        this.showModal.set(true);
    }

    closeModal(): void { this.showModal.set(false); }

    newLine(): QuoteLine {
        return { id: Date.now().toString() + Math.random(), productName: '', unit: 'Adet', quantity: 1, unitPrice: 0, discountPercent: 0 };
    }

    addLine(): void { this.formLines.update(lines => [...lines, this.newLine()]); }
    removeLine(id: string): void { this.formLines.update(lines => lines.filter(l => l.id !== id)); }

    openCatalogPicker(): void { this.catalogSearch = ''; this.showCatalogPicker.set(true); }

    selectFromCatalog(product: ProductCatalog): void {
        const existing = this.formLines().find(l => l.productName === product.name);
        if (existing) {
            this.formLines.update(lines => lines.map(l => l.id === existing.id ? { ...l, quantity: l.quantity + 1 } : l));
        } else {
            this.formLines.update(lines => [...lines, {
                id: Date.now().toString() + Math.random(),
                productName: product.name, unit: product.unit,
                quantity: 1, unitPrice: product.unitPrice, discountPercent: 0
            }]);
        }
        this.showCatalogPicker.set(false);
    }

    saveQuote(): void {
        if (!this.formData.customerName.trim() || this.formLines().filter(l => l.productName.trim()).length === 0) return;
        const id = this.editingId() || Date.now().toString();
        const quoteNumber = this.editingId()
            ? this.quotes().find(q => q.id === this.editingId())!.quoteNumber
            : this.getNextQuoteNumber();
        const q: Quote = { id, quoteNumber, ...this.formData, lines: this.formLines().filter(l => l.productName.trim()) };
        if (this.editingId()) {
            this.quotes.update(list => list.map(x => x.id === id ? q : x));
        } else {
            this.quotes.update(list => [...list, q]);
        }
        this.closeModal();
    }

    deleteQuote(id: string): void { this.quotes.update(list => list.filter(q => q.id !== id)); }

    statusLabel(s: Quote['status']): string {
        return { draft: 'Taslak', sent: 'Gönderildi', accepted: 'Kabul Edildi', rejected: 'Reddedildi' }[s];
    }
    statusClass(s: Quote['status']): string {
        return { draft: 'badge-secondary', sent: 'badge-info', accepted: 'badge-success', rejected: 'badge-danger' }[s];
    }

    // ── Yazdırma ─────────────────────────────────────────────────────────────

    /** Modal'dan mevcut form verisiyle önizleme yazdırma */
    printPreview(type: 'a4' | 'receipt'): void {
        const tempQuote: Quote = {
            id: this.editingId() || 'preview',
            quoteNumber: this.editingId()
                ? this.quotes().find(q => q.id === this.editingId())!.quoteNumber
                : this.getNextQuoteNumber(),
            ...this.formData,
            lines: this.formLines().filter(l => l.productName.trim()),
        };
        if (type === 'a4') this.printA4(tempQuote);
        else this.printReceipt(tempQuote);
    }

    printA4(quote: Quote): void {
        const w = window.open('', '_blank', 'width=960,height=700');
        if (!w) return;
        w.document.write(this.buildA4Html(quote));
        w.document.close();
        w.focus();
        setTimeout(() => { w.print(); }, 600);
    }

    printReceipt(quote: Quote): void {
        const w = window.open('', '_blank', 'width=380,height=620');
        if (!w) return;
        w.document.write(this.buildReceiptHtml(quote));
        w.document.close();
        w.focus();
        setTimeout(() => { w.print(); }, 600);
    }

    private fc(n: number): string {
        return '₺' + n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    private buildA4Html(q: Quote): string {
        const sub      = q.lines.reduce((s, l) => s + l.quantity * l.unitPrice * (1 - l.discountPercent / 100), 0);
        const discAmt  = sub * (q.overallDiscountPercent / 100);
        const net      = sub - discAmt;
        const taxAmt   = net * (q.taxPercent / 100);
        const grand    = net + taxAmt;
        const fc       = this.fc.bind(this);

        const linesHtml = q.lines.map((l, i) => {
            const lt = l.quantity * l.unitPrice * (1 - l.discountPercent / 100);
            return `<tr>
                <td>${i + 1}</td>
                <td>${l.productName}</td>
                <td style="text-align:center">${l.quantity}</td>
                <td style="text-align:center">${l.unit}</td>
                <td style="text-align:right">${fc(l.unitPrice)}</td>
                <td style="text-align:center">${l.discountPercent > 0 ? '%' + l.discountPercent : '—'}</td>
                <td style="text-align:right;font-weight:700">${fc(lt)}</td>
            </tr>`;
        }).join('');

        return `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8">
<title>Teklif ${q.quoteNumber}</title>
<style>
  @page { size: A4 portrait; margin: 14mm 16mm 20mm 16mm; }
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;font-size:11pt;color:#1a1a2e;background:#fff}
  .hdr{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:14px;border-bottom:3px solid #4c6ef5;margin-bottom:18px}
  .co-name{font-size:18pt;font-weight:900;color:#4c6ef5;letter-spacing:-0.5px}
  .co-info{font-size:8.5pt;color:#555;line-height:1.7;margin-top:4px}
  .qt-label{font-size:24pt;font-weight:900;color:#1a1a2e;letter-spacing:3px;text-align:right}
  .qt-num{font-size:11pt;color:#4c6ef5;font-weight:700;text-align:right;margin-top:3px}
  .meta{display:flex;gap:14px;margin-bottom:18px}
  .mbox{background:#f7f8ff;border:1px solid #dce4ff;border-radius:6px;padding:9px 13px;flex:1}
  .mbox label{font-size:7.5pt;color:#888;text-transform:uppercase;letter-spacing:.8px;display:block;margin-bottom:2px}
  .mbox span{font-size:10pt;font-weight:600;color:#1a1a2e}
  .sec{font-size:8pt;text-transform:uppercase;letter-spacing:1px;color:#888;font-weight:700;margin-bottom:6px}
  .cust{background:#f7f8ff;border-left:4px solid #4c6ef5;padding:11px 15px;margin-bottom:18px;border-radius:0 6px 6px 0}
  .cust-name{font-size:13pt;font-weight:700;color:#1a1a2e}
  .cust-info{font-size:9pt;color:#555;margin-top:3px}
  table{width:100%;border-collapse:collapse;margin-bottom:14px}
  thead tr{background:#4c6ef5;color:#fff}
  thead th{padding:8px 10px;text-align:left;font-size:9pt;font-weight:700}
  tbody tr:nth-child(even){background:#f7f8ff}
  tbody tr{border-bottom:1px solid #e8ecff}
  tbody td{padding:7px 10px;font-size:10pt;vertical-align:middle}
  .tot-wrap{display:flex;justify-content:flex-end;margin-bottom:18px}
  .tot-box{width:290px}
  .tot-row{display:flex;justify-content:space-between;padding:5px 0;font-size:10pt;border-bottom:1px solid #eee;color:#444}
  .tot-grand{background:#4c6ef5;color:#fff;padding:10px 13px;border-radius:6px;margin-top:8px;font-size:14pt;font-weight:900;border:none}
  .tot-grand span:first-child{color:rgba(255,255,255,.85)}
  .notes{background:#fffbf0;border:1px solid #ffd96a;border-radius:6px;padding:10px 14px;margin-bottom:22px;font-size:9.5pt;color:#555}
  .notes strong{color:#1a1a2e;display:block;margin-bottom:3px;font-size:8pt;text-transform:uppercase;letter-spacing:.8px}
  .sigs{display:flex;gap:40px;margin-top:32px}
  .sig{flex:1;border-top:1px solid #ccc;padding-top:8px;text-align:center;font-size:9pt;color:#555}
  .foot{text-align:center;font-size:8pt;color:#aaa;margin-top:18px;border-top:1px solid #eee;padding-top:9px}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="hdr">
  <div>
    <div class="co-name">${this.companyName}</div>
    <div class="co-info">${this.companyAddress}<br>Tel: ${this.companyPhone} &nbsp;·&nbsp; E-posta: ${this.companyEmail}<br>Vergi No: ${this.companyTaxNo}</div>
  </div>
  <div>
    <div class="qt-label">TEKLİF</div>
    <div class="qt-num">${q.quoteNumber}</div>
  </div>
</div>

<div class="meta">
  <div class="mbox"><label>Teklif Tarihi</label><span>${q.date}</span></div>
  <div class="mbox"><label>Geçerlilik Tarihi</label><span>${q.validUntil}</span></div>
  <div class="mbox"><label>KDV Oranı</label><span>%${q.taxPercent}</span></div>
  <div class="mbox"><label>Durum</label><span>${this.statusLabel(q.status)}</span></div>
</div>

<div class="sec">Müşteri Bilgileri</div>
<div class="cust">
  <div class="cust-name">${q.customerName}</div>
  <div class="cust-info">${[q.customerPhone ? 'Tel: ' + q.customerPhone : '', q.customerEmail ? 'E-posta: ' + q.customerEmail : ''].filter(Boolean).join(' &nbsp;·&nbsp; ')}</div>
</div>

<div class="sec">Ürün / Hizmet Detayları</div>
<table>
  <thead><tr>
    <th style="width:30px">#</th>
    <th>Ürün / Açıklama</th>
    <th style="width:55px;text-align:center">Miktar</th>
    <th style="width:55px;text-align:center">Birim</th>
    <th style="width:105px;text-align:right">Birim Fiyat</th>
    <th style="width:70px;text-align:center">İskonto</th>
    <th style="width:115px;text-align:right">Toplam</th>
  </tr></thead>
  <tbody>${linesHtml}</tbody>
</table>

<div class="tot-wrap"><div class="tot-box">
  <div class="tot-row"><span>Ara Toplam</span><span>${fc(sub)}</span></div>
  ${q.overallDiscountPercent > 0 ? `<div class="tot-row"><span>Genel İskonto (%${q.overallDiscountPercent})</span><span style="color:#16a34a">— ${fc(discAmt)}</span></div>` : ''}
  <div class="tot-row"><span>KDV (%${q.taxPercent})</span><span>${fc(taxAmt)}</span></div>
  <div class="tot-row tot-grand"><span>GENEL TOPLAM</span><span>${fc(grand)}</span></div>
</div></div>

${q.notes ? `<div class="notes"><strong>Notlar</strong>${q.notes}</div>` : ''}

<div class="sigs">
  <div class="sig">Teklifi Hazırlayan<br><br><br>${this.companyName}</div>
  <div class="sig">Müşteri Onayı<br><br><br>${q.customerName}</div>
</div>
<div class="foot">Bu teklif ${q.validUntil} tarihine kadar geçerlidir. &nbsp;·&nbsp; ${this.companyName} &nbsp;·&nbsp; ${this.companyEmail}</div>
</body></html>`;
    }

    private buildReceiptHtml(q: Quote): string {
        const sub     = q.lines.reduce((s, l) => s + l.quantity * l.unitPrice * (1 - l.discountPercent / 100), 0);
        const discAmt = sub * (q.overallDiscountPercent / 100);
        const net     = sub - discAmt;
        const taxAmt  = net * (q.taxPercent / 100);
        const grand   = net + taxAmt;
        const fc2 = (n: number) => n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        const linesHtml = q.lines.map(l => {
            const lt   = l.quantity * l.unitPrice * (1 - l.discountPercent / 100);
            const disc = l.discountPercent > 0 ? ` (-%${l.discountPercent})` : '';
            return `
            <div class="item-name">${l.productName}${disc}</div>
            <div class="item-calc">
                <span>${l.quantity} ${l.unit} x ${fc2(l.unitPrice)}</span>
                <span><b>${fc2(lt)}</b></span>
            </div>`;
        }).join('<div class="sep-dash"></div>');

        return `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8">
<title>Fiş ${q.quoteNumber}</title>
<style>
  @page{size:80mm auto;margin:2mm}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Courier New',Courier,monospace;font-size:9pt;width:76mm;color:#000;background:#fff;padding:2mm}
  .c{text-align:center}
  .b{font-weight:bold}
  .lg{font-size:12pt}
  .dline{border-top:2px solid #000;margin:4px 0}
  .sline{border-top:1px dashed #555;margin:3px 0}
  .sep-dash{border-top:1px dotted #999;margin:2px 0}
  .row{display:flex;justify-content:space-between}
  .item-name{font-weight:bold;font-size:9pt;margin-top:4px}
  .item-calc{display:flex;justify-content:space-between;font-size:8.5pt;color:#333;padding-bottom:2px}
  .tot{display:flex;justify-content:space-between;padding:1px 0;font-size:9pt}
  .grand{font-size:12.5pt;font-weight:900;margin-top:2px}
  .ft{font-size:8pt;text-align:center;color:#333;margin-top:3px}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="c b lg">${this.companyName}</div>
<div class="c" style="font-size:8pt">${this.companyPhone}</div>
<div class="c" style="font-size:8pt">${this.companyAddress}</div>
<div class="dline"></div>
<div class="c b" style="font-size:12pt;letter-spacing:4px">TEKLİF</div>
<div class="sline"></div>
<div class="row"><span>No :</span><span>${q.quoteNumber}</span></div>
<div class="row"><span>Tarih :</span><span>${q.date}</span></div>
<div class="row"><span>Gecerlilik :</span><span>${q.validUntil}</span></div>
<div class="dline"></div>
<div class="b">Musteri: ${q.customerName}</div>
${q.customerPhone ? `<div style="font-size:8.5pt">Tel: ${q.customerPhone}</div>` : ''}
<div class="dline"></div>
${linesHtml}
<div class="dline"></div>
<div class="tot"><span>Ara Toplam :</span><span>${fc2(sub)}</span></div>
${q.overallDiscountPercent > 0 ? `<div class="tot"><span>Iskonto -%${q.overallDiscountPercent} :</span><span>-${fc2(discAmt)}</span></div>` : ''}
<div class="tot"><span>KDV %${q.taxPercent} :</span><span>${fc2(taxAmt)}</span></div>
<div class="dline"></div>
<div class="tot grand"><span>TOPLAM :</span><span>${fc2(grand)} TL</span></div>
<div class="dline"></div>
${q.notes ? `<div style="font-size:8.5pt;margin-top:3px"><b>Not:</b> ${q.notes}</div><div class="sline"></div>` : ''}
<div class="ft">Bu teklif ${q.validUntil} tarihine kadar gecerlidir.</div>
<div class="ft" style="margin-top:6px;font-weight:bold">Tesekkurler!</div>
<div style="margin-top:14px"></div>
</body></html>`;
    }
}

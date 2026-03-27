import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../../core/services/invoice.service';
import { InvoiceType, InvoiceStatus, InvoiceCategory, CreateInvoiceRequest, InvoiceDetailDto } from '../../../core/models/invoice.model';
import { CariAccountService } from '../../../core/services/cari-account.service';
import { CariAccount } from '../../../core/models/cari-account.model';
import { ProductService } from '../../../core/services/product.service';
import { ConfirmService } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
    selector: 'app-invoices-efatura',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './invoices-efatura.component.html',
    styleUrls: ['./invoices-efatura.component.css', '../../../shared/styles/crud-page.css']
})
export class InvoicesEFaturaComponent implements OnInit {
    private invoiceService = inject(InvoiceService);
    private cariAccountService = inject(CariAccountService);
    private productService = inject(ProductService);
    private confirmService = inject(ConfirmService);
    private toastService = inject(ToastService);

    searchTerm = '';
    sortColumn = '';
    sortDir: 'asc' | 'desc' = 'asc';
    activeTab = signal<'all' | 'Draft' | 'Sent' | 'Approved' | 'Rejected' | 'Cancelled'>('all');
    showCreateModal = signal(false);
    showDetailModal = signal(false);
    selectedInvoice = signal<InvoiceDetailDto | null>(null);
    isLoadingDetail = signal(false);
    isSaving = signal(false);
    formError = signal('');

    cariAccounts = signal<CariAccount[]>([]);
    selectedCariAccountId = signal('');
    products = signal<{ id: string; name: string; barcode: string; defaultSalePrice: number }[]>([]);

    formData = {
        invoiceCategory: 'Satis' as 'Satis' | 'Iade',
        taxNumber: '',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        notes: '',
        items: [
            { productId: '', productName: '', quantity: 1, unitPrice: 0, taxRate: 20, unit: 'Adet' }
        ]
    };

    invoices = signal<any[]>([]);

    ngOnInit(): void {
        this.loadInvoices();
        this.loadCariAccounts();
        this.loadProducts();
    }

    private loadCariAccounts(): void {
        this.cariAccountService.getAll().subscribe({
            next: (data) => this.cariAccounts.set(data),
            error: () => {}
        });
    }

    private loadProducts(): void {
        this.productService.getAll().subscribe({
            next: (data) => this.products.set(data.map(p => ({
                id: p.id,
                name: p.name,
                barcode: p.barcodeEan13 || '',
                defaultSalePrice: p.defaultSalePrice || 0
            }))),
            error: () => {}
        });
    }

    onProductSelect(item: any, productId: string): void {
        item.productId = productId;
        const product = this.products().find(p => p.id === productId);
        if (product) {
            item.productName = product.name;
            item.unitPrice = product.defaultSalePrice;
        }
    }

    loadInvoices(): void {
        this.invoiceService.getEFaturaList().subscribe({
            next: (data) => this.invoices.set(data.map(inv => ({
                id:              inv.id,
                invoiceNumber:   inv.invoiceNumber,
                invoiceCategory: inv.invoiceCategory === InvoiceCategory.Satis    ? 'Satis'
                               : inv.invoiceCategory === InvoiceCategory.Iade     ? 'Iade'
                               : inv.invoiceCategory === InvoiceCategory.Tevkifat ? 'Tevkifat'
                               : 'Standart',
                status:          this.mapStatus(inv.status),
                cariAccountName: inv.customerName || inv.supplierName || '—',
                taxNumber:       inv.taxNumber || '',
                issueDate:       inv.issueDate?.split('T')[0] || '',
                grandTotal:      inv.totalAmount,
                taxTotal:        inv.taxTotal,
            }))),
            error: () => this.toastService.error('Hata', 'E-Fatura listesi yüklenemedi.')
        });
    }

    mapStatus(status: InvoiceStatus): string {
        switch (status) {
            case InvoiceStatus.Draft: return 'Draft';
            case InvoiceStatus.Sent: return 'Sent';
            case InvoiceStatus.Approved: return 'Approved';
            case InvoiceStatus.Rejected: return 'Rejected';
            case InvoiceStatus.Cancelled: return 'Cancelled';
            default: return 'Draft';
        }
    }

    sort(col: string): void {
        if (this.sortColumn === col) { this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'; }
        else { this.sortColumn = col; this.sortDir = 'asc'; }
    }

    get filteredInvoices() {
        let items = this.invoices();
        const tab = this.activeTab();
        if (tab !== 'all') items = items.filter(i => i.status === tab);
        const term = this.searchTerm.toLowerCase();
        if (term) items = items.filter(i =>
            i.invoiceNumber.toLowerCase().includes(term) ||
            (i.cariAccountName || '').toLowerCase().includes(term) ||
            (i.taxNumber || '').includes(term)
        );
        if (this.sortColumn) {
            const dir = this.sortDir === 'asc' ? 1 : -1;
            const col = this.sortColumn;
            items = [...items].sort((a, b) => typeof a[col] === 'number' ? dir * (a[col] - b[col]) : dir * String(a[col]).localeCompare(String(b[col]), 'tr'));
        }
        return items;
    }

    getCategoryLabel(cat: string): string {
        switch (cat) {
            case 'Satis': return 'Satış';
            case 'Iade': return 'İade';
            case 'Tevkifat': return 'Tevkifat';
            default: return 'Standart';
        }
    }

    getCategoryBadge(cat: string): string {
        switch (cat) {
            case 'Satis': return 'badge-info';
            case 'Iade': return 'badge-warning';
            case 'Tevkifat': return 'badge-secondary';
            default: return '';
        }
    }

    get totalAmount() { return this.invoices().filter(i => i.status === 'Approved').reduce((s, i) => s + i.grandTotal, 0); }
    get draftCount() { return this.invoices().filter(i => i.status === 'Draft').length; }
    get sentCount() { return this.invoices().filter(i => i.status === 'Sent').length; }
    get approvedCount() { return this.invoices().filter(i => i.status === 'Approved').length; }

    getStatusBadge(s: string) {
        switch (s) {
            case 'Draft': return 'badge-secondary';
            case 'Sent': return 'badge-info';
            case 'Approved': return 'badge-success';
            case 'Rejected': return 'badge-danger';
            case 'Cancelled': return 'badge-warning';
            default: return '';
        }
    }

    getStatusLabel(s: string) {
        switch (s) {
            case 'Draft': return 'Taslak';
            case 'Sent': return 'Gönderildi';
            case 'Approved': return 'Onaylı';
            case 'Rejected': return 'Reddedildi';
            case 'Cancelled': return 'İptal';
            default: return s;
        }
    }

    openCreateModal(): void {
        this.formData = {
            invoiceCategory: 'Satis',
            taxNumber: '',
            issueDate: new Date().toISOString().split('T')[0],
            dueDate: '', notes: '',
            items: [{ productId: '', productName: '', quantity: 1, unitPrice: 0, taxRate: 20, unit: 'Adet' }]
        };
        this.selectedCariAccountId.set('');
        this.formError.set('');
        this.showCreateModal.set(true);
    }

    addItem(): void {
        this.formData.items.push({ productId: '', productName: '', quantity: 1, unitPrice: 0, taxRate: 20, unit: 'Adet' });
    }

    removeItem(index: number): void {
        if (this.formData.items.length > 1) {
            this.formData.items.splice(index, 1);
        }
    }

    getItemTotal(item: any): number {
        const base = item.quantity * item.unitPrice;
        const tax = base * (item.taxRate / 100);
        return base + tax;
    }

    getFormSubtotal(): number {
        return this.formData.items.reduce((s, item) => s + (item.quantity * item.unitPrice), 0);
    }

    getFormTaxTotal(): number {
        return this.formData.items.reduce((s, item) => s + (item.quantity * item.unitPrice * item.taxRate / 100), 0);
    }

    getFormGrandTotal(): number {
        return this.getFormSubtotal() + this.getFormTaxTotal();
    }

    closeCreateModal(): void { this.showCreateModal.set(false); }

    saveInvoice(): void {
        if (!this.selectedCariAccountId()) {
            this.formError.set('Lütfen bir cari hesap seçin.');
            return;
        }
        if (this.formData.items.some(it => !it.productId)) {
            this.formError.set('Tüm kalemlerde ürün seçilmelidir.');
            return;
        }
        if (this.formData.items.some(it => it.unitPrice <= 0)) {
            this.formError.set('Tüm kalemlerde birim fiyat girilmelidir.');
            return;
        }

        this.isSaving.set(true);
        this.formError.set('');

        const request: CreateInvoiceRequest = {
            invoiceType: InvoiceType.EFatura,
            invoiceCategory: this.formData.invoiceCategory === 'Satis' ? InvoiceCategory.Satis : InvoiceCategory.Iade,
            cariAccountId: this.selectedCariAccountId(),
            issueDate: this.formData.issueDate,
            dueDate: this.formData.dueDate || undefined,
            notes: this.formData.notes || undefined,
            items: this.formData.items.map(it => ({
                productId: it.productId,
                quantity: it.quantity,
                unitPrice: it.unitPrice,
                taxRate: it.taxRate,
                discountRate: 0
            }))
        };

        this.invoiceService.create(request).subscribe({
            next: () => {
                this.isSaving.set(false);
                this.closeCreateModal();
                this.loadInvoices();
            },
            error: (err) => {
                this.isSaving.set(false);
                this.formError.set(err.error?.detail || 'Fatura oluşturulamadı.');
            }
        });
    }

    sendInvoice(id: string): void {
        this.invoiceService.send(id).subscribe({
            next: () => this.loadInvoices(),
            error: (err) => this.toastService.error('Hata', err.error?.detail || 'Gönderme başarısız.')
        });
    }

    viewDetail(invoice: any): void {
        this.selectedInvoice.set(null);
        this.isLoadingDetail.set(true);
        this.showDetailModal.set(true);
        this.invoiceService.getDetail(invoice.id).subscribe({
            next: (detail) => { this.selectedInvoice.set(detail); this.isLoadingDetail.set(false); },
            error: () => { this.isLoadingDetail.set(false); this.showDetailModal.set(false); }
        });
    }

    closeDetailModal(): void { this.showDetailModal.set(false); this.selectedInvoice.set(null); }

    openPreview(id: string): void {
        this.invoiceService.getPreviewHtml(id).subscribe(html => {
            const w = window.open('about:blank', '_blank');
            if (w) {
                w.document.open();
                w.document.write('<!DOCTYPE html><html><head><meta http-equiv="Content-Security-Policy" content="script-src \'none\'"></head><body>' + html + '</body></html>');
                w.document.close();
            }
        });
    }

    async deleteInvoice(id: string): Promise<void> {
        const confirmed = await this.confirmService.confirm({
            title: 'Silme Onayı',
            message: 'Bu faturayı silmek istediğinize emin misiniz?',
            confirmText: 'Sil',
            type: 'danger'
        });
        if (!confirmed) return;
        this.invoiceService.delete(id).subscribe({
            next: () => { this.loadInvoices(); this.toastService.success('Silindi', 'Fatura silindi'); },
            error: (err) => this.toastService.error('Hata', err.error?.detail || 'Silme başarısız.')
        });
    }

    downloadPdf(id: string): void {
        this.invoiceService.downloadPdf(id).subscribe({
            next: (blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `efatura-${id}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
            },
            error: (err) => this.toastService.error('Hata', err.error?.detail || 'PDF indirilemedi.')
        });
    }

    downloadXml(id: string): void {
        this.invoiceService.downloadXml(id).subscribe({
            next: (blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `efatura-${id}.xml`;
                a.click();
                URL.revokeObjectURL(url);
            },
            error: (err) => this.toastService.error('Hata', err.error?.detail || 'XML indirilemedi.')
        });
    }
}

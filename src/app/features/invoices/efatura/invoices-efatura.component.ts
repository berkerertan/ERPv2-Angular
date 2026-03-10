import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-invoices-efatura',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './invoices-efatura.component.html',
    styleUrls: ['./invoices-efatura.component.css', '../../../shared/styles/crud-page.css']
})
export class InvoicesEFaturaComponent {
    searchTerm = '';
    activeTab = signal<'all' | 'Draft' | 'Sent' | 'Approved' | 'Rejected' | 'Cancelled'>('all');
    showCreateModal = signal(false);
    showDetailModal = signal(false);
    selectedInvoice = signal<any>(null);

    formData = {
        invoiceCategory: 'Satis' as 'Satis' | 'Iade',
        cariAccountName: '',
        taxNumber: '',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        notes: '',
        items: [
            { productName: '', quantity: 1, unitPrice: 0, taxRate: 20, unit: 'Adet' }
        ]
    };

    invoices = signal([
        { id: '1', invoiceNumber: 'EFT2026000001', invoiceCategory: 'Satis', status: 'Approved', cariAccountName: 'Tedarik A.Ş.', taxNumber: '1234567890', issueDate: '2026-03-08', grandTotal: 45000, taxTotal: 7500, currency: 'TRY', ettn: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
        { id: '2', invoiceNumber: 'EFT2026000002', invoiceCategory: 'Satis', status: 'Sent', cariAccountName: 'Global Elektronik', taxNumber: '0987654321', issueDate: '2026-03-07', grandTotal: 22000, taxTotal: 3666, currency: 'TRY', ettn: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
        { id: '3', invoiceNumber: 'EFT2026000003', invoiceCategory: 'Iade', status: 'Draft', cariAccountName: 'Ahmet Yılmaz', taxNumber: '5556667788', issueDate: '2026-03-07', grandTotal: 3240, taxTotal: 540, currency: 'TRY', ettn: '' },
        { id: '4', invoiceNumber: 'EFT2026000004', invoiceCategory: 'Satis', status: 'Rejected', cariAccountName: 'XYZ Ticaret Ltd.', taxNumber: '1122334455', issueDate: '2026-03-06', grandTotal: 8900, taxTotal: 1483, currency: 'TRY', ettn: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' },
        { id: '5', invoiceNumber: 'EFT2026000005', invoiceCategory: 'Satis', status: 'Approved', cariAccountName: 'Mehmet Kaya', taxNumber: '9988776655', issueDate: '2026-03-05', grandTotal: 15600, taxTotal: 2600, currency: 'TRY', ettn: 'c3d4e5f6-a7b8-9012-cdef-123456789012' },
    ]);

    get filteredInvoices() {
        let items = this.invoices();
        const tab = this.activeTab();
        if (tab !== 'all') items = items.filter(i => i.status === tab);
        const term = this.searchTerm.toLowerCase();
        if (term) items = items.filter(i =>
            i.invoiceNumber.toLowerCase().includes(term) ||
            i.cariAccountName.toLowerCase().includes(term) ||
            i.taxNumber.includes(term)
        );
        return items;
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
            cariAccountName: '', taxNumber: '',
            issueDate: new Date().toISOString().split('T')[0],
            dueDate: '', notes: '',
            items: [{ productName: '', quantity: 1, unitPrice: 0, taxRate: 20, unit: 'Adet' }]
        };
        this.showCreateModal.set(true);
    }

    addItem(): void {
        this.formData.items.push({ productName: '', quantity: 1, unitPrice: 0, taxRate: 20, unit: 'Adet' });
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
        const newInvoice = {
            id: Date.now().toString(),
            invoiceNumber: `EFT2026${String(this.invoices().length + 1).padStart(6, '0')}`,
            invoiceCategory: this.formData.invoiceCategory,
            status: 'Draft',
            cariAccountName: this.formData.cariAccountName,
            taxNumber: this.formData.taxNumber,
            issueDate: this.formData.issueDate,
            grandTotal: this.getFormGrandTotal(),
            taxTotal: this.getFormTaxTotal(),
            currency: 'TRY',
            ettn: ''
        };
        this.invoices.update(list => [newInvoice, ...list]);
        this.closeCreateModal();
    }

    sendInvoice(id: string): void {
        this.invoices.update(list => list.map(i => i.id === id ? { ...i, status: 'Sent', ettn: crypto.randomUUID() } : i));
    }

    viewDetail(invoice: any): void {
        this.selectedInvoice.set(invoice);
        this.showDetailModal.set(true);
    }

    closeDetailModal(): void { this.showDetailModal.set(false); }

    deleteInvoice(id: string): void {
        this.invoices.update(list => list.filter(i => i.id !== id));
    }

    downloadPdf(id: string): void {
        // TODO: API entegrasyonu
        console.log('PDF indir:', id);
    }

    downloadXml(id: string): void {
        // TODO: API entegrasyonu
        console.log('XML indir:', id);
    }
}

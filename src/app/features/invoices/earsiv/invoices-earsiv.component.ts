import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-invoices-earsiv',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './invoices-earsiv.component.html',
    styleUrls: ['./invoices-earsiv.component.css', '../../../shared/styles/crud-page.css']
})
export class InvoicesEArsivComponent {
    searchTerm = '';
    activeTab = signal<'all' | 'Draft' | 'Sent' | 'Cancelled'>('all');
    showCreateModal = signal(false);
    showDetailModal = signal(false);
    selectedInvoice = signal<any>(null);

    formData = {
        invoiceCategory: 'Satis' as 'Satis' | 'Iade',
        customerName: '',
        tcknVkn: '',
        email: '',
        issueDate: new Date().toISOString().split('T')[0],
        notes: '',
        items: [
            { productName: '', quantity: 1, unitPrice: 0, taxRate: 20, unit: 'Adet' }
        ]
    };

    invoices = signal([
        { id: '1', invoiceNumber: 'EAR2026000001', invoiceCategory: 'Satis', status: 'Sent', customerName: 'Ali Veli', tcknVkn: '12345678901', email: 'ali@mail.com', issueDate: '2026-03-08', grandTotal: 1250, taxTotal: 208, currency: 'TRY' },
        { id: '2', invoiceNumber: 'EAR2026000002', invoiceCategory: 'Satis', status: 'Sent', customerName: 'Ayşe Fatma', tcknVkn: '98765432109', email: 'ayse@mail.com', issueDate: '2026-03-08', grandTotal: 3400, taxTotal: 566, currency: 'TRY' },
        { id: '3', invoiceNumber: 'EAR2026000003', invoiceCategory: 'Iade', status: 'Draft', customerName: 'Fatma Çelik', tcknVkn: '11223344556', email: 'fatma@mail.com', issueDate: '2026-03-07', grandTotal: 780, taxTotal: 130, currency: 'TRY' },
        { id: '4', invoiceNumber: 'EAR2026000004', invoiceCategory: 'Satis', status: 'Sent', customerName: 'Peşin Müşteri', tcknVkn: '11111111111', email: '', issueDate: '2026-03-07', grandTotal: 540, taxTotal: 90, currency: 'TRY' },
        { id: '5', invoiceNumber: 'EAR2026000005', invoiceCategory: 'Satis', status: 'Cancelled', customerName: 'Hasan Demir', tcknVkn: '22334455667', email: 'hasan@mail.com', issueDate: '2026-03-06', grandTotal: 12500, taxTotal: 2083, currency: 'TRY' },
    ]);

    get filteredInvoices() {
        let items = this.invoices();
        const tab = this.activeTab();
        if (tab !== 'all') items = items.filter(i => i.status === tab);
        const term = this.searchTerm.toLowerCase();
        if (term) items = items.filter(i =>
            i.invoiceNumber.toLowerCase().includes(term) ||
            i.customerName.toLowerCase().includes(term) ||
            i.tcknVkn.includes(term)
        );
        return items;
    }

    get totalAmount() { return this.invoices().filter(i => i.status === 'Sent').reduce((s, i) => s + i.grandTotal, 0); }
    get draftCount() { return this.invoices().filter(i => i.status === 'Draft').length; }
    get sentCount() { return this.invoices().filter(i => i.status === 'Sent').length; }

    getStatusBadge(s: string) {
        switch (s) {
            case 'Draft': return 'badge-secondary';
            case 'Sent': return 'badge-success';
            case 'Cancelled': return 'badge-warning';
            default: return '';
        }
    }

    getStatusLabel(s: string) {
        switch (s) {
            case 'Draft': return 'Taslak';
            case 'Sent': return 'Düzenlendi';
            case 'Cancelled': return 'İptal';
            default: return s;
        }
    }

    openCreateModal(): void {
        this.formData = {
            invoiceCategory: 'Satis',
            customerName: '', tcknVkn: '', email: '',
            issueDate: new Date().toISOString().split('T')[0],
            notes: '',
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
        return base + (base * item.taxRate / 100);
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
            invoiceNumber: `EAR2026${String(this.invoices().length + 1).padStart(6, '0')}`,
            invoiceCategory: this.formData.invoiceCategory,
            status: 'Draft',
            customerName: this.formData.customerName,
            tcknVkn: this.formData.tcknVkn,
            email: this.formData.email,
            issueDate: this.formData.issueDate,
            grandTotal: this.getFormGrandTotal(),
            taxTotal: this.getFormTaxTotal(),
            currency: 'TRY'
        };
        this.invoices.update(list => [newInvoice, ...list]);
        this.closeCreateModal();
    }

    sendInvoice(id: string): void {
        this.invoices.update(list => list.map(i => i.id === id ? { ...i, status: 'Sent' } : i));
    }

    viewDetail(invoice: any): void {
        this.selectedInvoice.set(invoice);
        this.showDetailModal.set(true);
    }

    closeDetailModal(): void { this.showDetailModal.set(false); }

    deleteInvoice(id: string): void {
        this.invoices.update(list => list.filter(i => i.id !== id));
    }

    cancelInvoice(id: string): void {
        this.invoices.update(list => list.map(i => i.id === id ? { ...i, status: 'Cancelled' } : i));
    }

    downloadPdf(id: string): void {
        console.log('PDF indir:', id);
    }

    sendEmail(id: string): void {
        console.log('E-posta gönder:', id);
    }
}

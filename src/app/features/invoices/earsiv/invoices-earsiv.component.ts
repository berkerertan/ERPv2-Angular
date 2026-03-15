import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../../core/services/invoice.service';
import { Invoice, InvoiceType, InvoiceStatus } from '../../../core/models/invoice.model';

@Component({
    selector: 'app-invoices-earsiv',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './invoices-earsiv.component.html',
    styleUrls: ['./invoices-earsiv.component.css', '../../../shared/styles/crud-page.css']
})
export class InvoicesEArsivComponent implements OnInit {
    private invoiceService = inject(InvoiceService);

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

    invoices = signal<any[]>([]);

    ngOnInit(): void {
        this.loadInvoices();
    }

    loadInvoices(): void {
        this.invoiceService.getAll({ invoiceType: InvoiceType.EArsiv }).subscribe({
            next: (data) => this.invoices.set(data.map(inv => ({
                id: inv.id,
                invoiceNumber: inv.invoiceNumber,
                invoiceCategory: inv.invoiceCategory === 1 ? 'Satis' : 'Iade',
                status: this.mapStatus(inv.status),
                customerName: inv.cariAccountName || '—',
                tcknVkn: inv.taxNumber || '',
                email: '',
                issueDate: inv.issueDate?.split('T')[0] || '',
                grandTotal: inv.grandTotal,
                taxTotal: inv.taxTotal,
                currency: inv.currency || 'TRY'
            }))),
            error: (err) => console.error('E-Arşiv faturaları yüklenemedi:', err.error?.detail || err.message)
        });
    }

    private mapStatus(status: InvoiceStatus): string {
        switch (status) {
            case InvoiceStatus.Draft: return 'Draft';
            case InvoiceStatus.Sent: return 'Sent';
            case InvoiceStatus.Approved: return 'Sent';
            case InvoiceStatus.Rejected: return 'Cancelled';
            case InvoiceStatus.Cancelled: return 'Cancelled';
            default: return 'Draft';
        }
    }

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
        // Note: Create requires cariAccountId, but this form uses free-text customerName
        // For now, keep local creation; full API create needs cariAccount selection
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
        this.invoiceService.send(id).subscribe({
            next: () => this.loadInvoices(),
            error: (err) => alert(err.error?.detail || 'Gönderme başarısız.')
        });
    }

    viewDetail(invoice: any): void {
        this.selectedInvoice.set(invoice);
        this.showDetailModal.set(true);
    }

    closeDetailModal(): void { this.showDetailModal.set(false); }

    deleteInvoice(id: string): void {
        if (!confirm('Bu faturayı silmek istediğinize emin misiniz?')) return;
        this.invoiceService.delete(id).subscribe({
            next: () => this.loadInvoices(),
            error: (err) => alert(err.error?.detail || 'Silme başarısız.')
        });
    }

    cancelInvoice(id: string): void {
        this.invoiceService.cancel(id, 'İptal edildi').subscribe({
            next: () => this.loadInvoices(),
            error: (err) => alert(err.error?.detail || 'İptal başarısız.')
        });
    }

    downloadPdf(id: string): void {
        this.invoiceService.downloadPdf(id).subscribe({
            next: (blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `fatura-${id}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
            },
            error: (err) => alert(err.error?.detail || 'PDF indirilemedi.')
        });
    }

    sendEmail(id: string): void {
        console.log('E-posta gönder:', id);
    }
}

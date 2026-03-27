import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReturnService } from '../../core/services/return.service';
import { Return, ReturnStatus, ReturnType, CreateReturnRequest } from '../../core/models/return.model';
import { CariAccountService } from '../../core/services/cari-account.service';
import { CariAccount } from '../../core/models/cari-account.model';
import { ProductService } from '../../core/services/product.service';
import { WarehouseService } from '../../core/services/warehouse.service';
import { ConfirmService } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../core/services/toast.service';

@Component({
    selector: 'app-returns',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './returns.component.html',
    styleUrls: ['./returns.component.css', '../../shared/styles/crud-page.css']
})
export class ReturnsComponent implements OnInit {
    private returnService = inject(ReturnService);
    private cariAccountService = inject(CariAccountService);
    private productService = inject(ProductService);
    private warehouseService = inject(WarehouseService);
    private confirmService = inject(ConfirmService);
    private toastService = inject(ToastService);

    searchTerm = '';
    sortColumn = '';
    sortDir: 'asc' | 'desc' = 'asc';
    activeTab = signal<'all' | 'Sales' | 'Purchase'>('all');
    statusFilter = signal<'all' | 'Pending' | 'Approved' | 'Rejected'>('all');
    showCreateModal = signal(false);
    isSaving = signal(false);
    formError = signal('');

    returns = signal<any[]>([]);
    buyers = signal<CariAccount[]>([]);
    suppliers = signal<CariAccount[]>([]);
    products = signal<{ id: string; name: string; barcode: string; defaultSalePrice: number }[]>([]);
    warehouses = signal<{ id: string; name: string }[]>([]);
    private cariMap = new Map<string, string>();

    formData = {
        type: ReturnType.Sales,
        cariAccountId: '',
        warehouseId: '',
        reason: '',
        items: [{ productId: '', productName: '', quantity: 1, unitPrice: 0 }]
    };

    readonly ReturnType = ReturnType;

    ngOnInit(): void {
        this.loadCariAccounts();
        this.loadProducts();
        this.loadWarehouses();
    }

    private loadCariAccounts(): void {
        this.cariAccountService.getAll().subscribe({
            next: (data) => {
                data.forEach(c => this.cariMap.set(c.id, c.name));
                this.buyers.set(data.filter(c => c.type === 1 || c.type === 3));
                this.suppliers.set(data.filter(c => c.type === 2 || c.type === 3));
                this.loadReturns();
            },
            error: () => this.loadReturns()
        });
    }

    loadReturns(): void {
        this.returnService.getAll().subscribe({
            next: (data) => this.returns.set(data.map(r => ({
                id: r.id,
                returnNo: r.returnNo,
                type: r.type === ReturnType.Sales ? 'Sales' : 'Purchase',
                cariAccountName: this.cariMap.get(r.cariAccountId) || r.cariAccountId.substring(0, 8) + '...',
                status: this.mapStatus(r.status),
                reason: r.reason || '',
                totalAmount: r.totalAmount,
                returnDate: r.returnDateUtc.split('T')[0]
            }))),
            error: () => this.toastService.error('Hata', 'İadeler yüklenemedi.')
        });
    }

    private loadProducts(): void {
        this.productService.getAll().subscribe({
            next: (data) => this.products.set(data.map(p => ({
                id: p.id, name: p.name, barcode: p.barcodeEan13 || '', defaultSalePrice: p.defaultSalePrice || 0
            }))),
            error: () => {}
        });
    }

    private loadWarehouses(): void {
        this.warehouseService.getAll().subscribe({
            next: (data) => {
                this.warehouses.set(data.map(w => ({ id: w.id, name: w.name })));
                if (data.length > 0) this.formData.warehouseId = data[0].id;
            },
            error: () => {}
        });
    }

    private mapStatus(status: ReturnStatus): string {
        switch (status) {
            case ReturnStatus.Approved: return 'Approved';
            case ReturnStatus.Rejected: return 'Rejected';
            default: return 'Pending';
        }
    }

    sort(col: string): void {
        if (this.sortColumn === col) { this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'; }
        else { this.sortColumn = col; this.sortDir = 'asc'; }
    }

    get availableCariAccounts(): CariAccount[] {
        return this.formData.type === ReturnType.Sales ? this.buyers() : this.suppliers();
    }

    get filteredReturns() {
        let items = this.returns();
        const tab = this.activeTab();
        if (tab !== 'all') items = items.filter(r => r.type === tab);
        const sf = this.statusFilter();
        if (sf !== 'all') items = items.filter(r => r.status === sf);
        const term = this.searchTerm.toLowerCase();
        if (term) items = items.filter(r =>
            r.returnNo.toLowerCase().includes(term) ||
            r.cariAccountName.toLowerCase().includes(term) ||
            r.reason.toLowerCase().includes(term)
        );
        if (this.sortColumn) {
            const dir = this.sortDir === 'asc' ? 1 : -1;
            const col = this.sortColumn;
            items = [...items].sort((a, b) =>
                typeof a[col] === 'number' ? dir * (a[col] - b[col]) :
                dir * String(a[col]).localeCompare(String(b[col]), 'tr')
            );
        }
        return items;
    }

    getStatusBadge(s: string) {
        return s === 'Approved' ? 'badge-success' : s === 'Rejected' ? 'badge-danger' : 'badge-warning';
    }
    getStatusLabel(s: string) {
        return s === 'Approved' ? 'Onaylandı' : s === 'Rejected' ? 'Reddedildi' : 'Beklemede';
    }

    openCreateModal(): void {
        this.formData = {
            type: ReturnType.Sales,
            cariAccountId: '',
            warehouseId: this.warehouses().length > 0 ? this.warehouses()[0].id : '',
            reason: '',
            items: [{ productId: '', productName: '', quantity: 1, unitPrice: 0 }]
        };
        this.formError.set('');
        this.showCreateModal.set(true);
    }

    closeCreateModal(): void { this.showCreateModal.set(false); }

    addItem(): void { this.formData.items.push({ productId: '', productName: '', quantity: 1, unitPrice: 0 }); }
    removeItem(index: number): void { if (this.formData.items.length > 1) this.formData.items.splice(index, 1); }

    onProductSelect(item: any, productId: string): void {
        item.productId = productId;
        const product = this.products().find(p => p.id === productId);
        if (product) { item.productName = product.name; item.unitPrice = product.defaultSalePrice; }
    }

    onTypeChange(): void { this.formData.cariAccountId = ''; }

    getFormTotal(): number { return this.formData.items.reduce((s, it) => s + it.quantity * it.unitPrice, 0); }

    saveReturn(): void {
        if (!this.formData.cariAccountId) { this.formError.set('Lütfen bir cari hesap seçin.'); return; }
        if (!this.formData.warehouseId) { this.formError.set('Lütfen bir depo seçin.'); return; }
        if (this.formData.items.some(it => !it.productId)) { this.formError.set('Tüm kalemlerde ürün seçilmelidir.'); return; }

        this.isSaving.set(true);
        this.formError.set('');

        const now = new Date();
        const returnNo = 'IAD-' + now.getFullYear() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') + '-' +
            String(now.getHours()).padStart(2, '0') +
            String(now.getMinutes()).padStart(2, '0') +
            String(now.getSeconds()).padStart(2, '0');

        const request: CreateReturnRequest = {
            returnNo,
            type: this.formData.type,
            cariAccountId: this.formData.cariAccountId,
            warehouseId: this.formData.warehouseId,
            reason: this.formData.reason || undefined,
            items: this.formData.items.map(it => ({ productId: it.productId, quantity: it.quantity, unitPrice: it.unitPrice }))
        };

        this.returnService.create(request).subscribe({
            next: () => {
                this.isSaving.set(false);
                this.closeCreateModal();
                this.loadReturns();
                this.toastService.success('Oluşturuldu', 'İade talebi başarıyla oluşturuldu.');
            },
            error: (err) => {
                this.isSaving.set(false);
                this.formError.set(err.error?.detail || 'İade oluşturulamadı.');
            }
        });
    }

    approveReturn(id: string): void {
        this.returnService.approve(id).subscribe({
            next: () => { this.loadReturns(); this.toastService.success('Onaylandı', 'İade talebi onaylandı.'); },
            error: (err) => this.toastService.error('Hata', err.error?.detail || 'Onaylama başarısız.')
        });
    }

    rejectReturn(id: string): void {
        this.returnService.reject(id).subscribe({
            next: () => { this.loadReturns(); this.toastService.success('Reddedildi', 'İade talebi reddedildi.'); },
            error: (err) => this.toastService.error('Hata', err.error?.detail || 'İşlem başarısız.')
        });
    }

    async deleteReturn(id: string): Promise<void> {
        const confirmed = await this.confirmService.confirm({
            title: 'Silme Onayı', message: 'Bu iade talebini silmek istediğinize emin misiniz?',
            confirmText: 'Sil', type: 'danger'
        });
        if (!confirmed) return;
        this.returnService.delete(id).subscribe({
            next: () => { this.loadReturns(); this.toastService.success('Silindi', 'İade talebi silindi.'); },
            error: (err) => this.toastService.error('Hata', err.error?.detail || 'Silme başarısız.')
        });
    }
}

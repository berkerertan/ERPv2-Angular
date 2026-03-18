import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PurchaseOrderService } from '../../core/services/purchase-order.service';
import { OrderStatus } from '../../core/models/sales-order.model';
import { CreatePurchaseOrderRequest } from '../../core/models/purchase-order.model';
import { CariAccountService } from '../../core/services/cari-account.service';
import { CariAccount } from '../../core/models/cari-account.model';
import { ProductService } from '../../core/services/product.service';
import { WarehouseService } from '../../core/services/warehouse.service';
import { ConfirmService } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../core/services/toast.service';

@Component({
    selector: 'app-purchase-orders',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './purchase-orders.component.html',
    styleUrls: ['./purchase-orders.component.css', '../../shared/styles/crud-page.css']
})
export class PurchaseOrdersComponent implements OnInit {
    private purchaseOrderService = inject(PurchaseOrderService);
    private cariAccountService = inject(CariAccountService);
    private productService = inject(ProductService);
    private warehouseService = inject(WarehouseService);
    private confirmService = inject(ConfirmService);
    private toastService = inject(ToastService);

    searchTerm = '';
    sortColumn = '';
    sortDir: 'asc' | 'desc' = 'asc';
    activeTab = signal<'all' | 'Draft' | 'Approved' | 'Cancelled'>('all');
    showCreateModal = signal(false);
    isSaving = signal(false);
    formError = signal('');

    orders = signal<any[]>([]);
    suppliers = signal<CariAccount[]>([]);
    products = signal<{ id: string; name: string; barcode: string; defaultSalePrice: number }[]>([]);
    warehouses = signal<{ id: string; name: string }[]>([]);
    private cariMap = new Map<string, string>();

    formData = {
        supplierCariAccountId: '',
        warehouseId: '',
        items: [{ productId: '', productName: '', quantity: 1, unitPrice: 0 }]
    };

    ngOnInit(): void {
        this.loadSuppliers();
        this.loadProducts();
        this.loadWarehouses();
    }

    loadOrders(): void {
        this.purchaseOrderService.getAll().subscribe({
            next: (data) => this.orders.set(data.map(o => ({
                id: o.id,
                orderNumber: o.orderNo || o.id.substring(0, 8),
                cariAccountName: this.cariMap.get(o.supplierCariAccountId) || o.supplierCariAccountId.substring(0, 8) + '...',
                status: this.mapStatus(o.status),
                totalAmount: o.totalAmount,
                createdAt: o.orderDateUtc.split('T')[0]
            }))),
            error: (err) => console.error('Satın alma siparişleri yüklenemedi:', err.error?.detail || err.message)
        });
    }

    private loadSuppliers(): void {
        this.cariAccountService.getSuppliers().subscribe({
            next: (data) => {
                this.suppliers.set(data);
                data.forEach(s => this.cariMap.set(s.id, s.name));
                this.loadOrders();
            },
            error: () => this.loadOrders()
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

    private loadWarehouses(): void {
        this.warehouseService.getAll().subscribe({
            next: (data) => {
                this.warehouses.set(data.map(w => ({ id: w.id, name: w.name })));
                if (data.length > 0) this.formData.warehouseId = data[0].id;
            },
            error: () => {}
        });
    }

    private mapStatus(status: OrderStatus): string {
        switch (status) {
            case OrderStatus.Approved: return 'Approved';
            case OrderStatus.Draft: return 'Draft';
            case OrderStatus.Cancelled: return 'Cancelled';
            default: return 'Draft';
        }
    }

    sort(col: string): void {
        if (this.sortColumn === col) { this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'; }
        else { this.sortColumn = col; this.sortDir = 'asc'; }
    }

    get filteredOrders() {
        let items = this.orders();
        const tab = this.activeTab();
        if (tab !== 'all') items = items.filter(o => o.status === tab);
        const term = this.searchTerm.toLowerCase();
        if (term) items = items.filter(o => o.orderNumber.toLowerCase().includes(term) || o.cariAccountName.toLowerCase().includes(term));
        if (this.sortColumn) {
            const dir = this.sortDir === 'asc' ? 1 : -1;
            const col = this.sortColumn;
            items = [...items].sort((a, b) => typeof a[col] === 'number' ? dir * (a[col] - b[col]) : dir * String(a[col]).localeCompare(String(b[col]), 'tr'));
        }
        return items;
    }

    getStatusBadge(s: string) { return s === 'Approved' ? 'badge-success' : s === 'Draft' ? 'badge-warning' : 'badge-danger'; }
    getStatusLabel(s: string) { return s === 'Approved' ? 'Onaylı' : s === 'Draft' ? 'Taslak' : 'İptal'; }

    openCreateModal(): void {
        this.formData = {
            supplierCariAccountId: '',
            warehouseId: this.warehouses().length > 0 ? this.warehouses()[0].id : '',
            items: [{ productId: '', productName: '', quantity: 1, unitPrice: 0 }]
        };
        this.formError.set('');
        this.showCreateModal.set(true);
    }

    closeCreateModal(): void { this.showCreateModal.set(false); }

    addItem(): void {
        this.formData.items.push({ productId: '', productName: '', quantity: 1, unitPrice: 0 });
    }

    removeItem(index: number): void {
        if (this.formData.items.length > 1) this.formData.items.splice(index, 1);
    }

    onProductSelect(item: any, productId: string): void {
        item.productId = productId;
        const product = this.products().find(p => p.id === productId);
        if (product) {
            item.productName = product.name;
            item.unitPrice = product.defaultSalePrice;
        }
    }

    getFormTotal(): number {
        return this.formData.items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
    }

    saveOrder(): void {
        if (!this.formData.supplierCariAccountId) {
            this.formError.set('Lütfen bir tedarikçi seçin.');
            return;
        }
        if (!this.formData.warehouseId) {
            this.formError.set('Lütfen bir depo seçin.');
            return;
        }
        if (this.formData.items.some(it => !it.productId)) {
            this.formError.set('Tüm kalemlerde ürün seçilmelidir.');
            return;
        }

        this.isSaving.set(true);
        this.formError.set('');

        const now = new Date();
        const orderNo = 'SA-' + now.getFullYear() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') + '-' +
            String(now.getHours()).padStart(2, '0') +
            String(now.getMinutes()).padStart(2, '0') +
            String(now.getSeconds()).padStart(2, '0');

        const request: CreatePurchaseOrderRequest = {
            orderNo,
            supplierCariAccountId: this.formData.supplierCariAccountId,
            warehouseId: this.formData.warehouseId,
            items: this.formData.items.map(it => ({
                productId: it.productId,
                quantity: it.quantity,
                unitPrice: it.unitPrice
            }))
        };

        this.purchaseOrderService.create(request).subscribe({
            next: () => {
                this.isSaving.set(false);
                this.closeCreateModal();
                this.loadOrders();
            },
            error: (err) => {
                this.isSaving.set(false);
                this.formError.set(err.error?.detail || 'Sipariş oluşturulamadı.');
            }
        });
    }

    approveOrder(id: string): void {
        this.purchaseOrderService.approve(id).subscribe({
            next: () => this.loadOrders(),
            error: (err) => this.toastService.error('Hata', err.error?.detail || 'Onaylama başarısız.')
        });
    }

    async deleteOrder(id: string): Promise<void> {
        const confirmed = await this.confirmService.confirm({
            title: 'Silme Onayı',
            message: 'Bu siparişi silmek istediğinize emin misiniz?',
            confirmText: 'Sil',
            type: 'danger'
        });
        if (!confirmed) return;
        this.purchaseOrderService.delete(id).subscribe({
            next: () => { this.loadOrders(); this.toastService.success('Silindi', 'Sipariş silindi'); },
            error: (err) => this.toastService.error('Hata', err.error?.detail || 'Silme başarısız.')
        });
    }
}

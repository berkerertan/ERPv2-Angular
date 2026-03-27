import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WaybillService } from '../../core/services/waybill.service';
import { Waybill, WaybillStatus, WaybillType, CreateWaybillRequest } from '../../core/models/waybill.model';
import { CariAccountService } from '../../core/services/cari-account.service';
import { CariAccount } from '../../core/models/cari-account.model';
import { ProductService } from '../../core/services/product.service';
import { WarehouseService } from '../../core/services/warehouse.service';
import { ConfirmService } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../core/services/toast.service';

@Component({
    selector: 'app-waybills',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './waybills.component.html',
    styleUrls: ['./waybills.component.css', '../../shared/styles/crud-page.css']
})
export class WaybillsComponent implements OnInit {
    private waybillService = inject(WaybillService);
    private cariAccountService = inject(CariAccountService);
    private productService = inject(ProductService);
    private warehouseService = inject(WarehouseService);
    private confirmService = inject(ConfirmService);
    private toastService = inject(ToastService);

    searchTerm = '';
    sortColumn = '';
    sortDir: 'asc' | 'desc' = 'asc';
    activeTab = signal<'all' | 'Draft' | 'Shipped' | 'Delivered' | 'Cancelled'>('all');
    showCreateModal = signal(false);
    isSaving = signal(false);
    formError = signal('');

    waybills = signal<any[]>([]);
    cariAccounts = signal<CariAccount[]>([]);
    products = signal<{ id: string; name: string; barcode: string; defaultSalePrice: number }[]>([]);
    warehouses = signal<{ id: string; name: string }[]>([]);
    private cariMap = new Map<string, string>();

    formData = {
        type: WaybillType.Outgoing,
        cariAccountId: '',
        warehouseId: '',
        deliveryAddress: '',
        notes: '',
        items: [{ productId: '', productName: '', quantity: 1, unitPrice: 0 }]
    };

    readonly WaybillType = WaybillType;

    ngOnInit(): void {
        this.loadCariAccounts();
        this.loadProducts();
        this.loadWarehouses();
    }

    private loadCariAccounts(): void {
        this.cariAccountService.getAll().subscribe({
            next: (data) => {
                this.cariAccounts.set(data);
                data.forEach(c => this.cariMap.set(c.id, c.name));
                this.loadWaybills();
            },
            error: () => this.loadWaybills()
        });
    }

    loadWaybills(): void {
        this.waybillService.getAll().subscribe({
            next: (data) => this.waybills.set(data.map(w => ({
                id: w.id,
                waybillNo: w.waybillNo,
                type: w.type === WaybillType.Outgoing ? 'Outgoing' : 'Incoming',
                cariAccountName: this.cariMap.get(w.cariAccountId) || w.cariAccountId.substring(0, 8) + '...',
                status: this.mapStatus(w.status),
                totalAmount: w.totalAmount,
                shipDate: w.shipDateUtc.split('T')[0],
                deliveryAddress: w.deliveryAddress || ''
            }))),
            error: () => this.toastService.error('Hata', 'İrsaliyeler yüklenemedi.')
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

    private mapStatus(status: WaybillStatus): string {
        switch (status) {
            case WaybillStatus.Draft:     return 'Draft';
            case WaybillStatus.Shipped:   return 'Shipped';
            case WaybillStatus.Delivered: return 'Delivered';
            case WaybillStatus.Cancelled: return 'Cancelled';
            default: return 'Draft';
        }
    }

    sort(col: string): void {
        if (this.sortColumn === col) { this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'; }
        else { this.sortColumn = col; this.sortDir = 'asc'; }
    }

    get filteredWaybills() {
        let items = this.waybills();
        const tab = this.activeTab();
        if (tab !== 'all') items = items.filter(w => w.status === tab);
        const term = this.searchTerm.toLowerCase();
        if (term) items = items.filter(w =>
            w.waybillNo.toLowerCase().includes(term) ||
            w.cariAccountName.toLowerCase().includes(term) ||
            w.deliveryAddress.toLowerCase().includes(term)
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
        switch (s) {
            case 'Delivered': return 'badge-success';
            case 'Shipped':   return 'badge-info';
            case 'Draft':     return 'badge-warning';
            case 'Cancelled': return 'badge-danger';
            default:          return 'badge-warning';
        }
    }

    getStatusLabel(s: string) {
        switch (s) {
            case 'Delivered': return 'Teslim Edildi';
            case 'Shipped':   return 'Yolda';
            case 'Draft':     return 'Taslak';
            case 'Cancelled': return 'İptal';
            default:          return s;
        }
    }

    openCreateModal(): void {
        this.formData = {
            type: WaybillType.Outgoing,
            cariAccountId: '',
            warehouseId: this.warehouses().length > 0 ? this.warehouses()[0].id : '',
            deliveryAddress: '',
            notes: '',
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

    saveWaybill(): void {
        if (!this.formData.cariAccountId) { this.formError.set('Lütfen bir cari hesap seçin.'); return; }
        if (!this.formData.warehouseId)   { this.formError.set('Lütfen bir depo seçin.'); return; }
        if (this.formData.items.some(it => !it.productId)) { this.formError.set('Tüm kalemlerde ürün seçilmelidir.'); return; }

        this.isSaving.set(true);
        this.formError.set('');

        const now = new Date();
        const waybillNo = 'IRS-' + now.getFullYear() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') + '-' +
            String(now.getHours()).padStart(2, '0') +
            String(now.getMinutes()).padStart(2, '0') +
            String(now.getSeconds()).padStart(2, '0');

        const request: CreateWaybillRequest = {
            waybillNo,
            type: this.formData.type,
            cariAccountId: this.formData.cariAccountId,
            warehouseId: this.formData.warehouseId,
            deliveryAddress: this.formData.deliveryAddress || undefined,
            notes: this.formData.notes || undefined,
            items: this.formData.items.map(it => ({
                productId: it.productId,
                quantity: it.quantity,
                unitPrice: it.unitPrice
            }))
        };

        this.waybillService.create(request).subscribe({
            next: () => {
                this.isSaving.set(false);
                this.closeCreateModal();
                this.loadWaybills();
                this.toastService.success('Oluşturuldu', 'İrsaliye başarıyla oluşturuldu.');
            },
            error: (err) => {
                this.isSaving.set(false);
                this.formError.set(err.error?.detail || 'İrsaliye oluşturulamadı.');
            }
        });
    }

    shipWaybill(id: string): void {
        this.waybillService.ship(id).subscribe({
            next: () => { this.loadWaybills(); this.toastService.success('Güncellendi', 'İrsaliye yola çıktı olarak işaretlendi.'); },
            error: (err) => this.toastService.error('Hata', err.error?.detail || 'İşlem başarısız.')
        });
    }

    deliverWaybill(id: string): void {
        this.waybillService.deliver(id).subscribe({
            next: () => { this.loadWaybills(); this.toastService.success('Güncellendi', 'İrsaliye teslim edildi olarak işaretlendi.'); },
            error: (err) => this.toastService.error('Hata', err.error?.detail || 'İşlem başarısız.')
        });
    }

    async deleteWaybill(id: string): Promise<void> {
        const confirmed = await this.confirmService.confirm({
            title: 'Silme Onayı',
            message: 'Bu irsaliyeyi silmek istediğinize emin misiniz?',
            confirmText: 'Sil',
            type: 'danger'
        });
        if (!confirmed) return;
        this.waybillService.delete(id).subscribe({
            next: () => { this.loadWaybills(); this.toastService.success('Silindi', 'İrsaliye silindi.'); },
            error: (err) => this.toastService.error('Hata', err.error?.detail || 'Silme başarısız.')
        });
    }
}

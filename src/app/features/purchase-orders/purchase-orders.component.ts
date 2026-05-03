import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PurchaseOrderService } from '../../core/services/purchase-order.service';
import { OrderStatus } from '../../core/models/sales-order.model';
import {
    CreatePurchaseOrderRequest,
    PurchaseOrder,
    PurchaseRecommendationItem,
    PurchaseRecommendationResponse,
    PurchaseRecommendationSupplierGroup
} from '../../core/models/purchase-order.model';
import { CariAccountService } from '../../core/services/cari-account.service';
import { CariAccount } from '../../core/models/cari-account.model';
import { ProductService } from '../../core/services/product.service';
import { WarehouseService } from '../../core/services/warehouse.service';
import { ConfirmService } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../core/services/toast.service';
import { firstValueFrom } from 'rxjs';

type OrderRow = {
    id: string;
    orderNumber: string;
    cariAccountName: string;
    status: string;
    totalAmount: number;
    createdAt: string;
};

type OrderTimelineItem = {
    label: string;
    at: string;
    by?: string | null;
    tone: 'info' | 'success' | 'danger';
    note?: string | null;
    icon?: string;
};

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
    showRecommendationModal = signal(false);
    showDetailModal = signal(false);
    showRejectModal = signal(false);
    isSaving = signal(false);
    isLoadingRecommendations = signal(false);
    isLoadingDetail = signal(false);
    isRejecting = signal(false);
    formError = signal('');
    recommendationError = signal('');
    rejectError = signal('');

    orders = signal<OrderRow[]>([]);
    suppliers = signal<CariAccount[]>([]);
    products = signal<{ id: string; name: string; barcode: string; defaultSalePrice: number }[]>([]);
    warehouses = signal<{ id: string; name: string }[]>([]);
    recommendations = signal<PurchaseRecommendationItem[]>([]);
    recommendationSummary = signal<PurchaseRecommendationResponse['summary'] | null>(null);
    recommendationGroups = signal<PurchaseRecommendationSupplierGroup[]>([]);
    selectedOrderDetail = signal<PurchaseOrder | null>(null);
    private cariMap = new Map<string, string>();

    recommendationFilters = {
        warehouseId: '',
        supplierCariAccountId: '',
        analysisDays: 30,
        coverageDays: 21,
        maxItems: 20,
        criticalOnly: true
    };

    formData = {
        supplierCariAccountId: '',
        warehouseId: '',
        items: [{ productId: '', productName: '', quantity: 1, unitPrice: 0 }]
    };

    rejectTargetId = signal<string | null>(null);
    rejectReason = '';

    readonly filteredOrders = computed(() => {
        let items = this.orders();
        const tab = this.activeTab();
        if (tab !== 'all') items = items.filter(o => o.status === tab);

        const term = this.searchTerm.toLowerCase();
        if (term) {
            items = items.filter(o =>
                o.orderNumber.toLowerCase().includes(term) ||
                o.cariAccountName.toLowerCase().includes(term)
            );
        }

        if (this.sortColumn) {
            const dir = this.sortDir === 'asc' ? 1 : -1;
            const col = this.sortColumn as keyof OrderRow;
            items = [...items].sort((a, b) =>
                typeof a[col] === 'number'
                    ? dir * ((a[col] as number) - (b[col] as number))
                    : dir * String(a[col]).localeCompare(String(b[col]), 'tr')
            );
        }

        return items;
    });

    ngOnInit(): void {
        this.loadSuppliers();
        this.loadProducts();
        this.loadWarehouses();
    }

    loadOrders(): void {
        this.purchaseOrderService.getAll().subscribe({
            next: data => this.orders.set(data.map(o => ({
                id: o.id,
                orderNumber: o.orderNo || o.id.substring(0, 8),
                cariAccountName: this.cariMap.get(o.supplierCariAccountId) || `${o.supplierCariAccountId.substring(0, 8)}...`,
                status: this.mapStatus(o.status),
                totalAmount: o.totalAmount,
                createdAt: (o.createdAtUtc || o.orderDateUtc).split('T')[0]
            }))),
            error: () => this.toastService.error('Hata', 'Satin alma siparisleri yuklenemedi.')
        });
    }

    private loadSuppliers(): void {
        this.cariAccountService.getSuppliers().subscribe({
            next: data => {
                this.suppliers.set(data);
                data.forEach(s => this.cariMap.set(s.id, s.name));
                this.loadOrders();
            },
            error: () => this.loadOrders()
        });
    }

    private loadProducts(): void {
        this.productService.getAll().subscribe({
            next: data => this.products.set(data.map(p => ({
                id: p.id,
                name: p.name,
                barcode: p.barcodeEan13 || '',
                defaultSalePrice: p.defaultSalePrice || 0
            })))
        });
    }

    private loadWarehouses(): void {
        this.warehouseService.getAll().subscribe({
            next: data => {
                const mapped = data.map(w => ({ id: w.id, name: w.name }));
                this.warehouses.set(mapped);
                if (mapped.length > 0) {
                    this.formData.warehouseId = mapped[0].id;
                    this.recommendationFilters.warehouseId = mapped[0].id;
                }
            }
        });
    }

    mapStatus(status: OrderStatus): string {
        switch (status) {
            case OrderStatus.Approved: return 'Approved';
            case OrderStatus.Draft: return 'Draft';
            case OrderStatus.Cancelled: return 'Cancelled';
            default: return 'Draft';
        }
    }

    sort(col: string): void {
        if (this.sortColumn === col) {
            this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = col;
            this.sortDir = 'asc';
        }
    }

    getStatusBadge(s: string) { return s === 'Approved' ? 'badge-success' : s === 'Draft' ? 'badge-warning' : 'badge-danger'; }
    getStatusLabel(s: string) { return s === 'Approved' ? 'Onayli' : s === 'Draft' ? 'Taslak' : 'Reddedildi'; }
    getApprovedTotal(): number { return this.orders().filter(o => o.status === 'Approved').reduce((sum, o) => sum + o.totalAmount, 0); }
    getPendingCount(): number { return this.orders().filter(o => o.status === 'Draft').length; }
    getRejectedCount(): number { return this.orders().filter(o => o.status === 'Cancelled').length; }

    openCreateModal(): void {
        this.formData = {
            supplierCariAccountId: '',
            warehouseId: this.warehouses().length > 0 ? this.warehouses()[0].id : '',
            items: [{ productId: '', productName: '', quantity: 1, unitPrice: 0 }]
        };
        this.formError.set('');
        this.showCreateModal.set(true);
    }

    closeCreateModal(): void {
        this.showCreateModal.set(false);
    }

    openRecommendationModal(): void {
        if (!this.recommendationFilters.warehouseId && this.warehouses().length > 0) {
            this.recommendationFilters.warehouseId = this.warehouses()[0].id;
        }
        this.showRecommendationModal.set(true);
        this.loadRecommendations();
    }

    closeRecommendationModal(): void {
        this.showRecommendationModal.set(false);
    }

    openOrderDetail(id: string): void {
        this.isLoadingDetail.set(true);
        this.showDetailModal.set(true);
        this.purchaseOrderService.getById(id).subscribe({
            next: order => {
                this.selectedOrderDetail.set(order);
                this.isLoadingDetail.set(false);
            },
            error: err => {
                this.showDetailModal.set(false);
                this.isLoadingDetail.set(false);
                this.toastService.error('Hata', err.error?.detail || 'Siparis detayi yuklenemedi.');
            }
        });
    }

    closeDetailModal(): void {
        this.showDetailModal.set(false);
        this.selectedOrderDetail.set(null);
    }

    openRejectModal(orderId: string): void {
        this.rejectTargetId.set(orderId);
        this.rejectReason = '';
        this.rejectError.set('');
        this.showRejectModal.set(true);
    }

    closeRejectModal(): void {
        this.showRejectModal.set(false);
        this.rejectReason = '';
        this.rejectError.set('');
        this.rejectTargetId.set(null);
    }

    loadRecommendations(): void {
        if (!this.recommendationFilters.warehouseId) {
            this.recommendationError.set('Oneri uretmek icin once depo secin.');
            this.recommendations.set([]);
            return;
        }

        this.isLoadingRecommendations.set(true);
        this.recommendationError.set('');
        this.purchaseOrderService.getRecommendations({
            warehouseId: this.recommendationFilters.warehouseId,
            supplierCariAccountId: this.recommendationFilters.supplierCariAccountId || undefined,
            analysisDays: this.recommendationFilters.analysisDays,
            coverageDays: this.recommendationFilters.coverageDays,
            maxItems: this.recommendationFilters.maxItems,
            criticalOnly: this.recommendationFilters.criticalOnly
        }).subscribe({
            next: response => {
                this.recommendationSummary.set(response.summary);
                this.recommendationGroups.set(response.supplierGroups);
                this.recommendations.set(response.items);
                this.isLoadingRecommendations.set(false);
            },
            error: err => {
                this.recommendationError.set(err?.error?.detail || 'Oneriler yuklenemedi.');
                this.recommendations.set([]);
                this.recommendationSummary.set(null);
                this.recommendationGroups.set([]);
                this.isLoadingRecommendations.set(false);
            }
        });
    }

    applyRecommendationsToDraft(): void {
        const items = this.recommendations();
        if (!items.length) {
            this.toastService.error('Hata', 'Aktarilacak oneri bulunamadi.');
            return;
        }

        const firstSupplierId = this.recommendationFilters.supplierCariAccountId
            || items.find(x => !!x.suggestedSupplierCariAccountId)?.suggestedSupplierCariAccountId
            || '';

        this.formData = {
            supplierCariAccountId: firstSupplierId ?? '',
            warehouseId: this.recommendationFilters.warehouseId,
            items: items.map(item => ({
                productId: item.productId,
                productName: item.productName,
                quantity: item.recommendedOrderQuantity,
                unitPrice: item.suggestedUnitPrice
            }))
        };

        this.formError.set('');
        this.showRecommendationModal.set(false);
        this.showCreateModal.set(true);
        this.toastService.success('Hazir', 'Oneriler taslak satin alma siparisine aktarildi.');
    }

    createSupplierSplitDrafts(): void {
        const items = this.recommendations();
        const warehouseId = this.recommendationFilters.warehouseId;
        if (!warehouseId || !items.length) {
            this.toastService.error('Hata', 'Bolunecek oneri bulunamadi.');
            return;
        }

        const groups = items
            .filter(x => !!x.suggestedSupplierCariAccountId)
            .reduce((map, item) => {
                const key = item.suggestedSupplierCariAccountId as string;
                const list = map.get(key) ?? [];
                list.push(item);
                map.set(key, list);
                return map;
            }, new Map<string, PurchaseRecommendationItem[]>());

        if (!groups.size) {
            this.toastService.error('Hata', 'Tedarikci atanmamis oneriler taslaga bolunemedi.');
            return;
        }

        const skippedCount = items.filter(x => !x.suggestedSupplierCariAccountId).length;
        const requests = Array.from(groups.entries()).map(([supplierId, supplierItems], index) => {
            const now = new Date();
            const orderNo = `SA-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}-${index + 1}`;
            const request: CreatePurchaseOrderRequest = {
                orderNo,
                supplierCariAccountId: supplierId,
                warehouseId,
                items: supplierItems.map(item => ({
                    productId: item.productId,
                    quantity: item.recommendedOrderQuantity,
                    unitPrice: item.suggestedUnitPrice
                }))
            };

            return firstValueFrom(this.purchaseOrderService.create(request));
        });

        Promise.all(requests)
            .then(() => {
                this.closeRecommendationModal();
                this.loadOrders();
                this.toastService.success(
                    'Hazir',
                    `${groups.size} taslak siparis olusturuldu${skippedCount > 0 ? `, ${skippedCount} kalem tedarikcisiz oldugu icin atlandi` : ''}.`);
            })
            .catch(() => {
                this.toastService.error('Hata', 'Tedarikci bazli taslak siparisler olusturulamadi.');
            });
    }

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
            this.formError.set('Lutfen bir tedarikci secin.');
            return;
        }
        if (!this.formData.warehouseId) {
            this.formError.set('Lutfen bir depo secin.');
            return;
        }
        if (this.formData.items.some(it => !it.productId)) {
            this.formError.set('Tum kalemlerde urun secilmelidir.');
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
                this.toastService.success('Basarili', 'Satin alma siparisi olusturuldu.');
            },
            error: err => {
                this.isSaving.set(false);
                this.formError.set(err.error?.detail || 'Siparis olusturulamadi.');
            }
        });
    }

    approveOrder(id: string): void {
        this.purchaseOrderService.approve(id).subscribe({
            next: () => {
                this.loadOrders();
                if (this.selectedOrderDetail()?.id === id) {
                    this.openOrderDetail(id);
                }
                this.toastService.success('Basarili', 'Siparis onaylandi.');
            },
            error: err => this.toastService.error('Hata', err.error?.detail || 'Onaylama basarisiz.')
        });
    }

    confirmRejectOrder(): void {
        const orderId = this.rejectTargetId();
        if (!orderId) {
            this.rejectError.set('Siparis secilemedi.');
            return;
        }
        if (!this.rejectReason.trim()) {
            this.rejectError.set('Red nedeni zorunludur.');
            return;
        }

        this.isRejecting.set(true);
        this.rejectError.set('');
        this.purchaseOrderService.reject(orderId, this.rejectReason.trim()).subscribe({
            next: () => {
                this.isRejecting.set(false);
                this.closeRejectModal();
                this.loadOrders();
                this.toastService.success('Basarili', 'Siparis reddedildi.');
            },
            error: err => {
                this.isRejecting.set(false);
                this.rejectError.set(err.error?.detail || 'Red islemi basarisiz.');
            }
        });
    }

    async deleteOrder(id: string): Promise<void> {
        const confirmed = await this.confirmService.confirm({
            title: 'Silme Onayi',
            message: 'Bu siparisi silmek istediginize emin misiniz?',
            confirmText: 'Sil',
            type: 'danger'
        });
        if (!confirmed) return;

        this.purchaseOrderService.delete(id).subscribe({
            next: () => {
                this.loadOrders();
                this.toastService.success('Silindi', 'Siparis silindi');
            },
            error: err => this.toastService.error('Hata', err.error?.detail || 'Silme basarisiz.')
        });
    }

    getTimeline(order: PurchaseOrder | null): OrderTimelineItem[] {
        if (!order) return [];

        const items: OrderTimelineItem[] = [
            {
                label: 'Olusturuldu',
                at: order.createdAtUtc || order.orderDateUtc,
                tone: 'info',
                icon: 'edit_note'
            }
        ];

        if (order.approvedAtUtc) {
            items.push({
                label: 'Onaylandi',
                at: order.approvedAtUtc,
                by: order.approvedByUserName,
                tone: 'success',
                icon: 'task_alt'
            });
        }

        if (order.cancelledAtUtc) {
            items.push({
                label: 'Reddedildi',
                at: order.cancelledAtUtc,
                by: order.cancelledByUserName,
                tone: 'danger',
                note: order.cancellationReason,
                icon: 'cancel'
            });
        }

        return items;
    }

    getTimelineDuration(order: PurchaseOrder | null): string {
        if (!order) return '-';
        const start = new Date(order.createdAtUtc || order.orderDateUtc).getTime();
        const end = order.approvedAtUtc
            ? new Date(order.approvedAtUtc).getTime()
            : order.cancelledAtUtc
                ? new Date(order.cancelledAtUtc).getTime()
                : Date.now();
        return this.formatDuration(Math.max(0, end - start));
    }

    getTimelineOwner(order: PurchaseOrder | null): string {
        if (!order) return '-';
        return order.approvedByUserName || order.cancelledByUserName || 'Sistem';
    }

    getTimelineStatusHint(order: PurchaseOrder | null): string {
        if (!order) return '-';
        if (order.approvedAtUtc) return 'Siparis tamamlandi';
        if (order.cancelledAtUtc) return 'Siparis reddedildi';
        return 'Onay bekliyor';
    }

    private formatDuration(durationMs: number): string {
        const totalMinutes = Math.max(1, Math.round(durationMs / 60000));
        if (totalMinutes < 60) return `${totalMinutes} dk`;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        if (hours < 24) return minutes ? `${hours} sa ${minutes} dk` : `${hours} sa`;
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        return remainingHours ? `${days} gun ${remainingHours} sa` : `${days} gun`;
    }
}

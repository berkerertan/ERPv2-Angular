import { Component, signal, computed, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { StockMovementService } from '../../core/services/stock-movement.service';
import { StockMovementType, CriticalStockAlertDto, StockBalance } from '../../core/models/stock-movement.model';
import { WarehouseService } from '../../core/services/warehouse.service';
import { ProductService } from '../../core/services/product.service';
import { ConfirmService } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../core/services/toast.service';
import { Warehouse } from '../../core/models/warehouse.model';
import { ProductSuggestionDto } from '../../core/models/product.model';

type TabType = 'movements' | 'balances' | 'alerts' | 'transfer';

interface MovementRow {
    id: string;
    productId: string;
    productName: string;
    warehouseId: string;
    warehouseName: string;
    movementType: 'In' | 'Out';
    quantity: number;
    unitPrice: number;
    description: string;
    createdAt: string;
}

interface MovementFormData {
    movementType: 'In' | 'Out';
    warehouseId: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    referenceNo: string;
}

interface TransferFormData {
    sourceWarehouseId: string;
    destinationWarehouseId: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    referenceNo: string;
}

@Component({
    selector: 'app-stock-movements',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './stock-movements.component.html',
    styleUrls: ['./stock-movements.component.css', '../../shared/styles/crud-page.css']
})
export class StockMovementsComponent implements OnInit, OnDestroy {
    private stockService  = inject(StockMovementService);
    private warehouseService = inject(WarehouseService);
    private productService   = inject(ProductService);
    private confirmService   = inject(ConfirmService);
    private toastService     = inject(ToastService);

    // ── Tabs ──────────────────────────────────────────────────────────────────
    activeTab = signal<TabType>('movements');

    // ── Data ──────────────────────────────────────────────────────────────────
    movements  = signal<MovementRow[]>([]);
    balances   = signal<StockBalance[]>([]);
    alerts     = signal<CriticalStockAlertDto[]>([]);
    warehouses = signal<Warehouse[]>([]);

    // ── Loading flags ─────────────────────────────────────────────────────────
    isLoadingMovements = signal(false);
    isLoadingBalances  = signal(false);
    isLoadingAlerts    = signal(false);
    isSaving           = signal(false);
    isTransferring     = signal(false);

    // ── Filters ───────────────────────────────────────────────────────────────
    searchTerm  = '';
    typeFilter  = signal<'all' | 'In' | 'Out'>('all');
    sortColumn  = '';
    sortDir: 'asc' | 'desc' = 'asc';

    // ── Movement Modal ────────────────────────────────────────────────────────
    showModal = signal(false);
    formData: MovementFormData = this.emptyForm();

    // Product typeahead — movement modal
    productSuggestions      = signal<ProductSuggestionDto[]>([]);
    showProductSuggestions  = signal(false);
    private productSearch$  = new Subject<string>();

    // ── Transfer Modal ────────────────────────────────────────────────────────
    showTransferModal   = signal(false);
    transferData: TransferFormData = this.emptyTransfer();

    // Product typeahead — transfer modal
    transferSuggestions      = signal<ProductSuggestionDto[]>([]);
    showTransferSuggestions  = signal(false);
    private transferSearch$  = new Subject<string>();

    // ── Lookup map ────────────────────────────────────────────────────────────
    private warehouseMap: Record<string, string> = {};
    private productNameMap: Record<string, string> = {};

    // ── Computed stats ────────────────────────────────────────────────────────
    readonly alertCount = computed(() => this.alerts().length);
    readonly inCount    = computed(() => this.movements().filter(m => m.movementType === 'In').length);
    readonly outCount   = computed(() => this.movements().filter(m => m.movementType === 'Out').length);

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    ngOnInit(): void {
        this.loadWarehouses();
        this.loadMovements();
        this.loadBalances();
        this.loadAlerts();
        this.initProductSearch();
        this.initTransferSearch();
    }

    ngOnDestroy(): void {
        this.productSearch$.complete();
        this.transferSearch$.complete();
    }

    // ── Data loading ──────────────────────────────────────────────────────────
    loadWarehouses(): void {
        this.warehouseService.getAll().subscribe({
            next: (whs) => {
                this.warehouses.set(whs);
                whs.forEach(w => this.warehouseMap[w.id] = w.name);
                // refresh names in movements
                this.movements.update(list =>
                    list.map(m => ({ ...m, warehouseName: this.warehouseMap[m.warehouseId] || m.warehouseName }))
                );
            }
        });
    }

    loadMovements(): void {
        this.isLoadingMovements.set(true);
        this.stockService.getAll().subscribe({
            next: (data) => {
                this.movements.set(data.map(m => ({
                    id:           m.id,
                    productId:    m.productId,
                    productName:  this.productNameMap[m.productId] || m.productId.substring(0, 8) + '…',
                    warehouseId:  m.warehouseId,
                    warehouseName: this.warehouseMap[m.warehouseId] || m.warehouseId.substring(0, 8) + '…',
                    movementType: m.type === StockMovementType.In ? 'In' : 'Out',
                    quantity:     m.quantity,
                    unitPrice:    m.unitPrice || 0,
                    description:  m.referenceNo || '',
                    createdAt:    m.movementDateUtc
                        ? new Date(m.movementDateUtc).toLocaleDateString('tr-TR')
                        : '—'
                })));
                this.isLoadingMovements.set(false);
                this.enrichProductNames();
            },
            error: () => {
                this.toastService.error('Hata', 'Stok hareketleri yüklenemedi.');
                this.isLoadingMovements.set(false);
            }
        });
    }

    loadBalances(): void {
        this.isLoadingBalances.set(true);
        this.stockService.getBalances().subscribe({
            next: (data) => {
                this.balances.set(data);
                // Build product name map from balances
                data.forEach(b => { if (b.productId && b.productName) this.productNameMap[b.productId] = b.productName; });
                this.enrichProductNames();
                this.isLoadingBalances.set(false);
            },
            error: () => {
                this.toastService.error('Hata', 'Bakiyeler yüklenemedi.');
                this.isLoadingBalances.set(false);
            }
        });
    }

    loadAlerts(): void {
        this.isLoadingAlerts.set(true);
        this.stockService.getCriticalAlerts().subscribe({
            next:  (data) => { this.alerts.set(data);  this.isLoadingAlerts.set(false); },
            error: ()     => this.isLoadingAlerts.set(false)
        });
    }

    private enrichProductNames(): void {
        if (!Object.keys(this.productNameMap).length) return;
        this.movements.update(list =>
            list.map(m => ({
                ...m,
                productName: this.productNameMap[m.productId] || m.productName
            }))
        );
    }

    // ── Product typeahead ─────────────────────────────────────────────────────
    private initProductSearch(): void {
        this.productSearch$.pipe(
            debounceTime(280),
            distinctUntilChanged(),
            switchMap(q => q.length >= 2 ? this.productService.suggest(q) : of([]))
        ).subscribe(sugs => {
            this.productSuggestions.set(sugs);
            this.showProductSuggestions.set(sugs.length > 0);
        });
    }

    private initTransferSearch(): void {
        this.transferSearch$.pipe(
            debounceTime(280),
            distinctUntilChanged(),
            switchMap(q => q.length >= 2 ? this.productService.suggest(q) : of([]))
        ).subscribe(sugs => {
            this.transferSuggestions.set(sugs);
            this.showTransferSuggestions.set(sugs.length > 0);
        });
    }

    onProductInput(value: string): void {
        this.formData.productName = value;
        this.formData.productId   = '';
        this.productSearch$.next(value);
    }

    selectProduct(s: ProductSuggestionDto): void {
        this.formData.productId   = s.id;
        this.formData.productName = s.label ?? s.name ?? '';
        this.showProductSuggestions.set(false);
    }

    onTransferProductInput(value: string): void {
        this.transferData.productName = value;
        this.transferData.productId   = '';
        this.transferSearch$.next(value);
    }

    selectTransferProduct(s: ProductSuggestionDto): void {
        this.transferData.productId   = s.id;
        this.transferData.productName = s.label ?? s.name ?? '';
        this.showTransferSuggestions.set(false);
    }

    // ── Filtered list ─────────────────────────────────────────────────────────
    get filteredMovements(): MovementRow[] {
        let list = this.movements();
        const term = this.searchTerm.toLowerCase();
        if (term) list = list.filter(m =>
            m.productName.toLowerCase().includes(term) ||
            m.warehouseName.toLowerCase().includes(term) ||
            m.description.toLowerCase().includes(term)
        );
        if (this.typeFilter() !== 'all') list = list.filter(m => m.movementType === this.typeFilter());
        if (this.sortColumn) {
            const dir = this.sortDir === 'asc' ? 1 : -1;
            const col = this.sortColumn as keyof MovementRow;
            list = [...list].sort((a, b) =>
                typeof a[col] === 'number'
                    ? dir * ((a[col] as number) - (b[col] as number))
                    : dir * String(a[col]).localeCompare(String(b[col]), 'tr')
            );
        }
        return list;
    }

    sort(col: string): void {
        if (this.sortColumn === col) this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
        else { this.sortColumn = col; this.sortDir = 'asc'; }
    }

    // ── Movement CRUD ─────────────────────────────────────────────────────────
    openAddModal(): void {
        this.formData = this.emptyForm();
        if (this.warehouses().length) this.formData.warehouseId = this.warehouses()[0].id;
        this.showProductSuggestions.set(false);
        this.showModal.set(true);
    }

    closeModal(): void { this.showModal.set(false); }

    saveMovement(): void {
        if (!this.formData.productId || !this.formData.warehouseId || this.formData.quantity <= 0) {
            this.toastService.error('Eksik Alan', 'Ürün, depo ve miktar zorunludur.');
            return;
        }
        this.isSaving.set(true);
        this.stockService.create({
            productId:   this.formData.productId,
            warehouseId: this.formData.warehouseId,
            type:        this.formData.movementType === 'In' ? StockMovementType.In : StockMovementType.Out,
            quantity:    this.formData.quantity,
            unitPrice:   this.formData.unitPrice || 0,
            referenceNo: this.formData.referenceNo || undefined
        }).subscribe({
            next: () => {
                this.reload();
                this.closeModal();
                this.toastService.success('Kaydedildi', 'Stok hareketi oluşturuldu.');
                this.isSaving.set(false);
            },
            error: (err) => {
                this.toastService.error('Hata', err.error?.detail || 'Kayıt başarısız.');
                this.isSaving.set(false);
            }
        });
    }

    async deleteMovement(id: string): Promise<void> {
        const ok = await this.confirmService.confirm({
            title: 'Hareketi Sil',
            message: 'Bu stok hareketi kalıcı olarak silinecek. Devam edilsin mi?',
            confirmText: 'Sil',
            type: 'danger'
        });
        if (!ok) return;
        this.stockService.delete(id).subscribe({
            next: () => { this.reload(); this.toastService.success('Silindi', 'Stok hareketi silindi.'); },
            error: (err) => this.toastService.error('Hata', err.error?.detail || 'Silme başarısız.')
        });
    }

    // ── Transfer ──────────────────────────────────────────────────────────────
    openTransferModal(): void {
        this.transferData = this.emptyTransfer();
        this.showTransferSuggestions.set(false);
        this.showTransferModal.set(true);
    }

    closeTransferModal(): void { this.showTransferModal.set(false); }

    saveTransfer(): void {
        const d = this.transferData;
        if (!d.productId || !d.sourceWarehouseId || !d.destinationWarehouseId || d.quantity <= 0) {
            this.toastService.error('Eksik Alan', 'Tüm alanlar zorunludur.'); return;
        }
        if (d.sourceWarehouseId === d.destinationWarehouseId) {
            this.toastService.error('Hata', 'Kaynak ve hedef depo aynı olamaz.'); return;
        }
        this.isTransferring.set(true);
        this.stockService.transfer({
            sourceWarehouseId:      d.sourceWarehouseId,
            destinationWarehouseId: d.destinationWarehouseId,
            productId:  d.productId,
            quantity:   d.quantity,
            unitPrice:  d.unitPrice || 0,
            referenceNo: d.referenceNo || undefined
        }).subscribe({
            next: () => {
                this.reload();
                this.closeTransferModal();
                this.toastService.success('Transfer Tamamlandı', 'Stok depolar arasında transfer edildi.');
                this.isTransferring.set(false);
            },
            error: (err) => {
                this.toastService.error('Hata', err.error?.detail || 'Transfer başarısız.');
                this.isTransferring.set(false);
            }
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private reload(): void {
        this.loadMovements();
        this.loadBalances();
        this.loadAlerts();
    }

    private emptyForm(): MovementFormData {
        return { movementType: 'In', warehouseId: '', productId: '', productName: '', quantity: 1, unitPrice: 0, referenceNo: '' };
    }

    private emptyTransfer(): TransferFormData {
        return { sourceWarehouseId: '', destinationWarehouseId: '', productId: '', productName: '', quantity: 1, unitPrice: 0, referenceNo: '' };
    }

    warehouseName(id: string): string {
        return this.warehouseMap[id] || '—';
    }

    alertSeverity(a: CriticalStockAlertDto): 'critical' | 'low' {
        return a.currentQuantity <= 0 ? 'critical' : 'low';
    }
}

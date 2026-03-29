import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockMovementService } from '../../core/services/stock-movement.service';
import { WarehouseService } from '../../core/services/warehouse.service';
import { StockMovementType, StockBalance } from '../../core/models/stock-movement.model';
import { Warehouse } from '../../core/models/warehouse.model';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../shared/components/confirm-dialog/confirm-dialog.component';

export interface CountRow {
    productId:   string;
    productName: string;
    barcode:     string;
    unit:        string;
    warehouseName: string;
    systemQty:   number;
    countedQty:  number | null;   // null = henüz girilmedi
}

@Component({
    selector: 'app-inventory-count',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './inventory-count.component.html',
    styleUrls: ['./inventory-count.component.css', '../../shared/styles/crud-page.css']
})
export class InventoryCountComponent implements OnInit {
    private stockService    = inject(StockMovementService);
    private warehouseService = inject(WarehouseService);
    private toastService    = inject(ToastService);
    private confirmService  = inject(ConfirmService);

    // ── State ─────────────────────────────────────────────────────────────────
    warehouses       = signal<Warehouse[]>([]);
    allBalances      = signal<StockBalance[]>([]);
    rows             = signal<CountRow[]>([]);

    selectedWarehouseId = signal<string>('');
    searchTerm          = signal<string>('');
    showOnlyDiffs       = signal(false);

    isLoadingWarehouses = signal(false);
    isLoadingBalances   = signal(false);
    isSaving            = signal(false);
    countSaved          = signal(false);

    // ── Computed ──────────────────────────────────────────────────────────────
    readonly selectedWarehouseName = computed(() => {
        const wh = this.warehouses().find(w => w.id === this.selectedWarehouseId());
        return wh?.name || '';
    });

    readonly filteredRows = computed(() => {
        let list = this.rows();
        const term = this.searchTerm().toLowerCase();
        if (term) list = list.filter(r =>
            r.productName.toLowerCase().includes(term) ||
            r.barcode.toLowerCase().includes(term)
        );
        if (this.showOnlyDiffs()) list = list.filter(r => r.countedQty !== null && r.countedQty !== r.systemQty);
        return list;
    });

    readonly diffCount = computed(() =>
        this.rows().filter(r => r.countedQty !== null && r.countedQty !== r.systemQty).length
    );

    readonly enteredCount = computed(() =>
        this.rows().filter(r => r.countedQty !== null).length
    );

    readonly totalRows = computed(() => this.rows().length);

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    ngOnInit(): void {
        this.loadWarehouses();
    }

    // ── Data Loading ──────────────────────────────────────────────────────────
    loadWarehouses(): void {
        this.isLoadingWarehouses.set(true);
        this.warehouseService.getAll().subscribe({
            next: (whs) => {
                this.warehouses.set(whs);
                // Auto-select first warehouse
                if (whs.length) {
                    this.selectedWarehouseId.set(whs[0].id);
                    this.loadBalances();
                }
                this.isLoadingWarehouses.set(false);
            },
            error: () => {
                this.toastService.error('Hata', 'Depolar yüklenemedi.');
                this.isLoadingWarehouses.set(false);
            }
        });
    }

    onWarehouseChange(id: string): void {
        this.selectedWarehouseId.set(id);
        this.countSaved.set(false);
        this.loadBalances();
    }

    loadBalances(): void {
        const whId = this.selectedWarehouseId();
        if (!whId) return;
        this.isLoadingBalances.set(true);
        this.stockService.getBalances().subscribe({
            next: (balances) => {
                this.allBalances.set(balances);
                const whName = this.selectedWarehouseName();
                // Filter by selected warehouse (match by warehouseName since balances don't expose warehouseId)
                const filtered = balances.filter(b =>
                    !b.warehouseName || b.warehouseName === whName || whName === ''
                );
                this.rows.set(
                    filtered.map(b => ({
                        productId:    b.productId,
                        productName:  b.productName || b.productId,
                        barcode:      b.barcode || '—',
                        unit:         b.unit || '—',
                        warehouseName: b.warehouseName || '—',
                        systemQty:    b.balance,
                        countedQty:   null
                    }))
                );
                this.isLoadingBalances.set(false);
            },
            error: () => {
                this.toastService.error('Hata', 'Stok bakiyeleri yüklenemedi.');
                this.isLoadingBalances.set(false);
            }
        });
    }

    // ── Counting ──────────────────────────────────────────────────────────────
    setCountedQty(row: CountRow, value: string): void {
        const parsed = value === '' ? null : parseFloat(value);
        this.rows.update(list =>
            list.map(r => r.productId === row.productId ? { ...r, countedQty: parsed } : r)
        );
    }

    getDiff(row: CountRow): number {
        if (row.countedQty === null) return 0;
        return row.countedQty - row.systemQty;
    }

    getDiffClass(row: CountRow): string {
        const d = this.getDiff(row);
        if (d > 0) return 'diff-positive';
        if (d < 0) return 'diff-negative';
        return 'diff-zero';
    }

    fillAllFromSystem(): void {
        this.rows.update(list =>
            list.map(r => ({ ...r, countedQty: r.systemQty }))
        );
    }

    clearAllCounts(): void {
        this.rows.update(list => list.map(r => ({ ...r, countedQty: null })));
    }

    // ── Save Count ────────────────────────────────────────────────────────────
    async saveCount(): Promise<void> {
        const whId = this.selectedWarehouseId();
        if (!whId) { this.toastService.error('Hata', 'Depo seçilmedi.'); return; }

        const diffs = this.rows().filter(r =>
            r.countedQty !== null && r.countedQty !== r.systemQty
        );

        if (!diffs.length) {
            this.toastService.success('Bilgi', 'Fark bulunan ürün yok. Sayım kaydedilmedi.');
            return;
        }

        const ok = await this.confirmService.confirm({
            title: 'Sayımı Onayla',
            message: `${diffs.length} üründe stok farkı var. Bu farklar otomatik giriş/çıkış hareketi olarak kaydedilecek. Devam edilsin mi?`,
            confirmText: 'Kaydet',
            type: 'warning'
        });
        if (!ok) return;

        this.isSaving.set(true);
        let saved = 0;
        let failed = 0;

        // Create movements sequentially
        const processNext = (index: number) => {
            if (index >= diffs.length) {
                this.isSaving.set(false);
                this.countSaved.set(true);
                if (failed === 0) {
                    this.toastService.success('Sayım Tamamlandı', `${saved} ürün için stok düzeltmesi oluşturuldu.`);
                } else {
                    this.toastService.error('Kısmi Hata', `${saved} başarılı, ${failed} başarısız.`);
                }
                this.loadBalances();
                return;
            }

            const row = diffs[index];
            const diff = this.getDiff(row);
            const type = diff > 0 ? StockMovementType.In : StockMovementType.Out;

            this.stockService.create({
                productId:   row.productId,
                warehouseId: whId,
                type,
                quantity:    Math.abs(diff),
                unitPrice:   0,
                referenceNo: `Sayım düzeltmesi — ${new Date().toLocaleDateString('tr-TR')}`
            }).subscribe({
                next:  () => { saved++; processNext(index + 1); },
                error: () => { failed++; processNext(index + 1); }
            });
        };

        processNext(0);
    }
}

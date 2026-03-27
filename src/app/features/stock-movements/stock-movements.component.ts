import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockMovementService } from '../../core/services/stock-movement.service';
import { StockMovementType } from '../../core/models/stock-movement.model';
import { ConfirmService } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../core/services/toast.service';

@Component({
    selector: 'app-stock-movements',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './stock-movements.component.html',
    styleUrls: ['./stock-movements.component.css', '../../shared/styles/crud-page.css']
})
export class StockMovementsComponent implements OnInit {
    private stockService = inject(StockMovementService);
    private confirmService = inject(ConfirmService);
    private toastService = inject(ToastService);

    searchTerm = '';
    sortColumn = '';
    sortDir: 'asc' | 'desc' = 'asc';
    activeTab = signal<'movements' | 'balances'>('movements');
    showModal = signal(false);
    formData = { productId: '', warehouseId: '', movementType: 'In', quantity: 0, description: '' };

    movements = signal<any[]>([]);
    balances = signal<any[]>([]);

    ngOnInit(): void {
        this.loadMovements();
        this.loadBalances();
    }

    loadMovements(): void {
        this.stockService.getAll().subscribe({
            next: (data) => this.movements.set(data.map(m => ({
                id: m.id,
                productName: m.productId.substring(0, 8) + '...',
                warehouseName: m.warehouseId.substring(0, 8) + '...',
                movementType: m.type === StockMovementType.In ? 'In' : 'Out',
                quantity: m.quantity,
                description: m.referenceNo || '',
                createdAt: m.movementDateUtc?.split('T')[0] || ''
            }))),
            error: (err) => this.toastService.error('Hata', 'Stok hareketleri yüklenemedi.')
        });
    }

    loadBalances(): void {
        this.stockService.getBalances().subscribe({
            next: (data) => this.balances.set(data.map(b => ({
                productName: b.productName || b.productId,
                warehouseName: b.warehouseName || '—',
                balance: b.balance
            }))),
            error: (err) => this.toastService.error('Hata', 'Stok bakiyeleri yüklenemedi.')
        });
    }

    sort(col: string): void {
        if (this.sortColumn === col) { this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'; }
        else { this.sortColumn = col; this.sortDir = 'asc'; }
    }

    get filteredMovements() {
        let list = this.movements();
        const term = this.searchTerm.toLowerCase();
        if (term) list = list.filter(m => m.productName.toLowerCase().includes(term) || m.warehouseName.toLowerCase().includes(term));
        if (this.sortColumn) {
            const dir = this.sortDir === 'asc' ? 1 : -1;
            const col = this.sortColumn;
            list = [...list].sort((a, b) => typeof a[col] === 'number' ? dir * (a[col] - b[col]) : dir * String(a[col]).localeCompare(String(b[col]), 'tr'));
        }
        return list;
    }

    openAddModal(): void {
        this.formData = { productId: '', warehouseId: '', movementType: 'In', quantity: 0, description: '' };
        this.showModal.set(true);
    }

    closeModal(): void { this.showModal.set(false); }

    saveMovement(): void {
        if (!this.formData.productId || !this.formData.warehouseId || this.formData.quantity <= 0) return;
        this.stockService.create({
            productId: this.formData.productId,
            warehouseId: this.formData.warehouseId,
            type: this.formData.movementType === 'In' ? StockMovementType.In : StockMovementType.Out,
            quantity: this.formData.quantity,
            unitPrice: 0,
            referenceNo: this.formData.description || undefined
        }).subscribe({
            next: () => { this.loadMovements(); this.loadBalances(); this.closeModal(); },
            error: (err) => this.toastService.error('Hata', err.error?.detail || 'Kayıt başarısız.')
        });
    }

    async deleteMovement(id: string): Promise<void> {
        const confirmed = await this.confirmService.confirm({
            title: 'Silme Onayı',
            message: 'Bu hareketi silmek istediğinize emin misiniz?',
            confirmText: 'Sil',
            type: 'danger'
        });
        if (!confirmed) return;
        this.stockService.delete(id).subscribe({
            next: () => { this.loadMovements(); this.loadBalances(); this.toastService.success('Silindi', 'Stok hareketi silindi'); },
            error: (err) => this.toastService.error('Hata', err.error?.detail || 'Silme başarısız.')
        });
    }
}

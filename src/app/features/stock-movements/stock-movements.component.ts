import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockMovementService } from '../../core/services/stock-movement.service';
import { StockMovementType } from '../../core/models/stock-movement.model';

@Component({
    selector: 'app-stock-movements',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './stock-movements.component.html',
    styleUrls: ['./stock-movements.component.css', '../../shared/styles/crud-page.css']
})
export class StockMovementsComponent implements OnInit {
    private stockService = inject(StockMovementService);

    searchTerm = '';
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
            error: (err) => console.error('Stok hareketleri yüklenemedi:', err.error?.detail || err.message)
        });
    }

    loadBalances(): void {
        this.stockService.getBalances().subscribe({
            next: (data) => this.balances.set(data.map(b => ({
                productName: b.productName || b.productId,
                warehouseName: b.warehouseName || '—',
                balance: b.balance
            }))),
            error: (err) => console.error('Stok bakiyeleri yüklenemedi:', err.error?.detail || err.message)
        });
    }

    get filteredMovements() {
        const term = this.searchTerm.toLowerCase();
        if (!term) return this.movements();
        return this.movements().filter(m => m.productName.toLowerCase().includes(term) || m.warehouseName.toLowerCase().includes(term));
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
            error: (err) => alert(err.error?.detail || 'Kayıt başarısız.')
        });
    }

    deleteMovement(id: string): void {
        if (!confirm('Bu hareketi silmek istediğinize emin misiniz?')) return;
        this.stockService.delete(id).subscribe({
            next: () => { this.loadMovements(); this.loadBalances(); },
            error: (err) => alert(err.error?.detail || 'Silme başarısız.')
        });
    }
}

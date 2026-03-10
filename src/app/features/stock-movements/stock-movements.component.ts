import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-stock-movements',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './stock-movements.component.html',
    styleUrls: ['./stock-movements.component.css', '../../shared/styles/crud-page.css']
})
export class StockMovementsComponent {
    searchTerm = '';
    activeTab = signal<'movements' | 'balances'>('movements');
    showModal = signal(false);
    formData = { productId: '', warehouseId: '', movementType: 'In', quantity: 0, description: '' };

    movements = signal([
        { id: '1', productName: 'Laptop HP ProBook', warehouseName: 'Ana Depo', movementType: 'In', quantity: 50, description: 'İlk stok girişi', createdAt: '2026-03-08' },
        { id: '2', productName: 'Samsung Monitor 27"', warehouseName: 'Ana Depo', movementType: 'In', quantity: 30, description: 'Tedarikçi siparişi', createdAt: '2026-03-07' },
        { id: '3', productName: 'Laptop HP ProBook', warehouseName: 'Şube Depo', movementType: 'Out', quantity: 5, description: 'Satış', createdAt: '2026-03-07' },
        { id: '4', productName: 'Mekanik Klavye', warehouseName: 'Ana Depo', movementType: 'In', quantity: 100, description: 'Toplu alım', createdAt: '2026-03-06' },
        { id: '5', productName: 'USB-C Hub', warehouseName: 'Ana Depo', movementType: 'Out', quantity: 10, description: 'Satış', createdAt: '2026-03-05' },
    ]);

    balances = signal([
        { productName: 'Laptop HP ProBook', warehouseName: 'Ana Depo', balance: 45 },
        { productName: 'Samsung Monitor 27"', warehouseName: 'Ana Depo', balance: 30 },
        { productName: 'Mekanik Klavye', warehouseName: 'Ana Depo', balance: 100 },
        { productName: 'USB-C Hub', warehouseName: 'Ana Depo', balance: 40 },
        { productName: 'Laptop HP ProBook', warehouseName: 'Şube Depo', balance: 5 },
    ]);

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
        this.movements.update(items => [...items, {
            id: Date.now().toString(), productName: 'Yeni Ürün', warehouseName: 'Ana Depo',
            movementType: this.formData.movementType, quantity: this.formData.quantity,
            description: this.formData.description, createdAt: new Date().toISOString().split('T')[0]
        }]);
        this.closeModal();
    }

    deleteMovement(id: string): void {
        this.movements.update(items => items.filter(m => m.id !== id));
    }
}

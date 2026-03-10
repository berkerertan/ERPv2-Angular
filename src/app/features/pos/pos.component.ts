import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface CartItem {
    productId: string;
    name: string;
    barcode: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

@Component({
    selector: 'app-pos',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './pos.component.html',
    styleUrl: './pos.component.css'
})
export class PosComponent {
    barcode = '';
    selectedWarehouseId = '';
    selectedBuyerId = '';
    cart = signal<CartItem[]>([]);
    isScanning = signal(false);

    // Mock data
    warehouses = [
        { id: '1', name: 'Ana Depo' },
        { id: '2', name: 'Şube Depo' }
    ];

    buyers = [
        { id: '1', name: 'Peşin Müşteri' },
        { id: '2', name: 'Ahmet Yılmaz' },
        { id: '3', name: 'Mehmet Kaya' }
    ];

    get cartTotal(): number {
        return this.cart().reduce((sum, item) => sum + item.total, 0);
    }

    get cartItemCount(): number {
        return this.cart().reduce((sum, item) => sum + item.quantity, 0);
    }

    onBarcodeSubmit(): void {
        if (!this.barcode.trim()) return;

        this.isScanning.set(true);

        // Mock scan — will connect to API later
        setTimeout(() => {
            const mockProduct: CartItem = {
                productId: Math.random().toString(36).substr(2, 9),
                name: `Ürün (${this.barcode})`,
                barcode: this.barcode,
                quantity: 1,
                unitPrice: Math.floor(Math.random() * 200 + 10),
                total: 0
            };
            mockProduct.total = mockProduct.unitPrice * mockProduct.quantity;

            const existing = this.cart().find(i => i.barcode === this.barcode);
            if (existing) {
                this.cart.update(items =>
                    items.map(i => i.barcode === this.barcode
                        ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice }
                        : i
                    )
                );
            } else {
                this.cart.update(items => [...items, mockProduct]);
            }

            this.barcode = '';
            this.isScanning.set(false);
        }, 300);
    }

    updateQuantity(item: CartItem, delta: number): void {
        const newQty = item.quantity + delta;
        if (newQty <= 0) {
            this.removeItem(item);
            return;
        }
        this.cart.update(items =>
            items.map(i => i.barcode === item.barcode
                ? { ...i, quantity: newQty, total: newQty * i.unitPrice }
                : i
            )
        );
    }

    removeItem(item: CartItem): void {
        this.cart.update(items => items.filter(i => i.barcode !== item.barcode));
    }

    clearCart(): void {
        this.cart.set([]);
    }

    completeSale(): void {
        if (this.cart().length === 0) return;
        // Will connect to POST /api/pos/quick-sales
        alert('Satış tamamlandı! (API bağlantısı yakında)');
        this.clearCart();
    }
}

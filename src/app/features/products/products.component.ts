import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-products',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './products.component.html',
    styleUrls: ['./products.component.css', '../../shared/styles/crud-page.css']
})
export class ProductsComponent {
    searchTerm = '';
    showModal = signal(false);
    editingProduct = signal<any>(null);
    formData = { name: '', barcode: '', unitPrice: 0, unit: '', categoryName: '', description: '' };

    products = signal([
        { id: '1', name: 'Laptop HP ProBook', barcode: '8690001234567', unitPrice: 35000, unit: 'Adet', categoryName: 'Elektronik', isActive: true },
        { id: '2', name: 'Samsung Monitor 27"', barcode: '8690009876543', unitPrice: 12500, unit: 'Adet', categoryName: 'Elektronik', isActive: true },
        { id: '3', name: 'Mekanik Klavye', barcode: '8690005555555', unitPrice: 2800, unit: 'Adet', categoryName: 'Aksesuar', isActive: true },
        { id: '4', name: 'USB-C Hub', barcode: '8690003333333', unitPrice: 1200, unit: 'Adet', categoryName: 'Aksesuar', isActive: true },
        { id: '5', name: 'A4 Fotokopi Kağıdı', barcode: '8690007777777', unitPrice: 180, unit: 'Paket', categoryName: 'Kırtasiye', isActive: false },
    ]);

    get filteredProducts() {
        const term = this.searchTerm.toLowerCase();
        if (!term) return this.products();
        return this.products().filter(p =>
            p.name.toLowerCase().includes(term) || p.barcode.includes(term) || p.categoryName.toLowerCase().includes(term)
        );
    }

    openAddModal(): void {
        this.editingProduct.set(null);
        this.formData = { name: '', barcode: '', unitPrice: 0, unit: 'Adet', categoryName: '', description: '' };
        this.showModal.set(true);
    }

    openEditModal(product: any): void {
        this.editingProduct.set(product);
        this.formData = { ...product };
        this.showModal.set(true);
    }

    closeModal(): void {
        this.showModal.set(false);
    }

    saveProduct(): void {
        if (this.editingProduct()) {
            this.products.update(items =>
                items.map(p => p.id === this.editingProduct().id ? { ...p, ...this.formData } : p)
            );
        } else {
            this.products.update(items => [...items, {
                id: Date.now().toString(),
                ...this.formData,
                isActive: true
            }]);
        }
        this.closeModal();
    }

    deleteProduct(id: string): void {
        this.products.update(items => items.filter(p => p.id !== id));
    }
}

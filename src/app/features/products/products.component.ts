import { Component, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-products',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './products.component.html',
    styleUrls: ['./products.component.css', '../../shared/styles/crud-page.css']
})
export class ProductsComponent implements OnDestroy {
    searchTerm = '';
    categoryFilter = signal<string>('all');
    showModal = signal(false);
    showBarcodeScanner = signal(false);
    editingProduct = signal<any>(null);
    formData = { name: '', barcode: '', unitPrice: 0, unit: '', categoryName: '', description: '' };

    // Debounce
    private _searchDebounceTimer: any = null;
    debouncedTerm = signal('');
    isSearching = signal(false);

    products = signal([
        { id: '1', name: 'Laptop HP ProBook', barcode: '8690001234567', unitPrice: 35000, unit: 'Adet', categoryName: 'Elektronik', isActive: true },
        { id: '2', name: 'Samsung Monitor 27"', barcode: '8690009876543', unitPrice: 12500, unit: 'Adet', categoryName: 'Elektronik', isActive: true },
        { id: '3', name: 'Mekanik Klavye', barcode: '8690005555555', unitPrice: 2800, unit: 'Adet', categoryName: 'Aksesuar', isActive: true },
        { id: '4', name: 'USB-C Hub', barcode: '8690003333333', unitPrice: 1200, unit: 'Adet', categoryName: 'Aksesuar', isActive: true },
        { id: '5', name: 'A4 Fotokopi Kağıdı', barcode: '8690007777777', unitPrice: 180, unit: 'Paket', categoryName: 'Kırtasiye', isActive: false },
        { id: '6', name: 'Wireless Mouse Logitech', barcode: '8690002222222', unitPrice: 950, unit: 'Adet', categoryName: 'Aksesuar', isActive: true },
        { id: '7', name: 'Ofis Sandalye Ergonomik', barcode: '8690004444444', unitPrice: 8500, unit: 'Adet', categoryName: 'Mobilya', isActive: true },
        { id: '8', name: 'Webcam HD 1080p', barcode: '8690006666666', unitPrice: 1800, unit: 'Adet', categoryName: 'Elektronik', isActive: true },
        { id: '9', name: 'Toner HP LaserJet', barcode: '8690008888888', unitPrice: 2200, unit: 'Adet', categoryName: 'Kırtasiye', isActive: true },
        { id: '10', name: 'Ethernet Kablosu Cat6', barcode: '8690001111111', unitPrice: 120, unit: 'Metre', categoryName: 'Aksesuar', isActive: false },
    ]);

    // Unique categories
    get categories(): string[] {
        const cats = [...new Set(this.products().map(p => p.categoryName))];
        return cats.sort();
    }

    get filteredProducts() {
        let items = this.products();

        // Category filter
        if (this.categoryFilter() !== 'all') {
            items = items.filter(p => p.categoryName === this.categoryFilter());
        }

        // Search filter (debounced)
        const term = this.debouncedTerm().toLowerCase();
        if (term) {
            items = items.filter(p =>
                p.name.toLowerCase().includes(term) ||
                p.barcode.includes(term) ||
                p.categoryName.toLowerCase().includes(term) ||
                p.unit.toLowerCase().includes(term)
            );
        }
        return items;
    }

    get activeCount(): number {
        return this.products().filter(p => p.isActive).length;
    }

    get totalValue(): number {
        return this.products().reduce((sum, p) => sum + p.unitPrice, 0);
    }

    onSearchInput(): void {
        this.isSearching.set(true);
        if (this._searchDebounceTimer) clearTimeout(this._searchDebounceTimer);
        this._searchDebounceTimer = setTimeout(() => {
            this.debouncedTerm.set(this.searchTerm);
            this.isSearching.set(false);
        }, 300);
    }

    clearSearch(): void {
        this.searchTerm = '';
        this.debouncedTerm.set('');
        this.isSearching.set(false);
        if (this._searchDebounceTimer) clearTimeout(this._searchDebounceTimer);
    }

    // Highlight matched text
    highlightMatch(text: string): string {
        const term = this.debouncedTerm();
        if (!term) return text;
        const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<mark class="search-highlight">$1</mark>');
    }

    // ─── Barcode Scanner ───────────────────────────────
    barcodeManualInput = '';

    openBarcodeScanner(): void {
        this.barcodeManualInput = '';
        this.showBarcodeScanner.set(true);
    }

    closeBarcodeScanner(): void {
        this.showBarcodeScanner.set(false);
    }

    applyBarcodeSearch(): void {
        if (this.barcodeManualInput.trim()) {
            this.searchTerm = this.barcodeManualInput.trim();
            this.debouncedTerm.set(this.searchTerm);
        }
        this.closeBarcodeScanner();
    }

    onBarcodeScanKeydown(e: KeyboardEvent): void {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.applyBarcodeSearch();
        }
    }

    // ─── CRUD ──────────────────────────────────────────
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

    toggleStatus(id: string): void {
        this.products.update(items =>
            items.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p)
        );
    }

    deleteProduct(id: string): void {
        this.products.update(items => items.filter(p => p.id !== id));
    }

    ngOnDestroy(): void {
        if (this._searchDebounceTimer) clearTimeout(this._searchDebounceTimer);
    }
}

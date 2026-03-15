import { Component, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ExcelUploadResult {
    totalRows: number;
    createdCount: number;
    failedCount: number;
    errors?: string[];
}

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

    // Excel upload state
    showExcelUploadModal = signal(false);
    excelFile = signal<File | null>(null);
    excelUploading = signal(false);
    excelResult = signal<ExcelUploadResult | null>(null);
    isDragOver = signal(false);

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
        if (!term) return this.escapeHtml(text);
        const safe = this.escapeHtml(text);
        const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return safe.replace(regex, '<mark class="search-highlight">$1</mark>');
    }

    private escapeHtml(str: string): string {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
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

    // ═══════════ Excel Upload ═══════════

    openExcelModal(): void {
        this.excelFile.set(null);
        this.excelResult.set(null);
        this.excelUploading.set(false);
        this.isDragOver.set(false);
        this.showExcelUploadModal.set(true);
    }

    closeExcelModal(): void { this.showExcelUploadModal.set(false); }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) this.setFile(input.files[0]);
    }

    onDragOver(event: DragEvent): void { event.preventDefault(); event.stopPropagation(); this.isDragOver.set(true); }
    onDragLeave(event: DragEvent): void { event.preventDefault(); event.stopPropagation(); this.isDragOver.set(false); }

    onDrop(event: DragEvent): void {
        event.preventDefault(); event.stopPropagation(); this.isDragOver.set(false);
        if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) this.setFile(event.dataTransfer.files[0]);
    }

    private setFile(file: File): void {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(ext || '') || file.size > 5 * 1024 * 1024) return;
        this.excelFile.set(file);
        this.excelResult.set(null);
    }

    removeExcelFile(): void { this.excelFile.set(null); this.excelResult.set(null); }

    uploadExcel(): void {
        if (!this.excelFile()) return;
        this.excelUploading.set(true);
        setTimeout(() => {
            this.excelResult.set({ totalRows: 20, createdCount: 17, failedCount: 3, errors: ['Satır 4: "Ürün Adı" alanı boş.', 'Satır 12: Barkod zaten mevcut.', 'Satır 18: Birim fiyat sayısal olmalı.'] });
            this.excelUploading.set(false);
        }, 2000);
    }

    formatFileSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    ngOnDestroy(): void {
        if (this._searchDebounceTimer) clearTimeout(this._searchDebounceTimer);
    }
}


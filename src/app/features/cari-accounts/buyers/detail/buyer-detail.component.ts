import { Component, signal, OnInit, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

interface BuyerProduct {
    id: string;
    productName: string;
    barcode: string;
    category: string;
    quantity: number;
    listPrice: number;
    unitPrice: number;
    total: number;
    payment: number;
    remainingBalance: number;
    date: string;
    status: 'Delivered' | 'Pending' | 'Cancelled';
    selected?: boolean;
    editing?: boolean;
}

interface QuickAddRow {
    productName: string;
    barcode: string;
    category: string;
    quantity: number;
    listPrice: number;
    unitPrice: number;
    date: string;
    status: 'Delivered' | 'Pending' | 'Cancelled';
}

@Component({
    selector: 'app-buyer-detail',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './buyer-detail.component.html',
    styleUrls: ['./buyer-detail.component.css', '../../../../shared/styles/crud-page.css']
})
export class BuyerDetailComponent implements OnInit {
    buyerId = '';
    searchTerm = '';
    activeTab = signal<'all' | 'Delivered' | 'Pending' | 'Cancelled'>('all');

    // Buyer info
    buyer = signal<any>(null);

    // Products
    products = signal<BuyerProduct[]>([]);

    // Selection
    allSelected = false;

    // Inline editing
    editingCell = signal<{ id: string; field: string } | null>(null);

    // Quick-add rows (Excel-like multiple blank rows at bottom)
    quickAddRows = signal<QuickAddRow[]>([
        this.createEmptyRow(),
        this.createEmptyRow(),
        this.createEmptyRow(),
    ]);

    // Paste mode
    showPasteZone = signal(false);
    pasteContent = '';

    // Bulk add modal
    showBulkAddModal = signal(false);
    bulkAddText = '';

    // Mock buyer data
    private buyersData: Record<string, any> = {
        '1': { id: '1', name: 'Ahmet Yılmaz', phone: '0532 111 22 33', email: 'ahmet@mail.com', address: 'Kadıköy, İstanbul', taxNumber: '12345678901', city: 'İstanbul', balance: 5200, totalSales: 24500, orderCount: 12, lastOrder: '2026-03-08', isActive: true },
        '2': { id: '2', name: 'Mehmet Kaya', phone: '0543 222 33 44', email: 'mehmet@mail.com', address: 'Çankaya, Ankara', taxNumber: '98765432109', city: 'Ankara', balance: 1800, totalSales: 8900, orderCount: 5, lastOrder: '2026-03-07', isActive: true },
        '3': { id: '3', name: 'Fatma Çelik', phone: '0555 444 55 66', email: 'fatma@mail.com', address: 'Bornova, İzmir', taxNumber: '11223344556', city: 'İzmir', balance: 0, totalSales: 3200, orderCount: 2, lastOrder: '2026-03-05', isActive: false },
        '4': { id: '4', name: 'Ali Öztürk', phone: '0532 777 88 99', email: 'ali@mail.com', address: 'Nilüfer, Bursa', taxNumber: '55667788990', city: 'Bursa', balance: 12400, totalSales: 67000, orderCount: 28, lastOrder: '2026-03-08', isActive: true },
        '5': { id: '5', name: 'Zeynep Arslan', phone: '0544 333 22 11', email: 'zeynep@mail.com', address: 'Seyhan, Adana', taxNumber: '99887766554', city: 'Adana', balance: 3600, totalSales: 15200, orderCount: 8, lastOrder: '2026-03-06', isActive: true },
    };

    private productsByBuyer: Record<string, BuyerProduct[]> = {
        '1': [
            { id: 'p1', productName: 'Laptop HP ProBook', barcode: '8680001001', category: 'Elektronik', quantity: 2, listPrice: 5000, unitPrice: 4500, total: 9000, payment: 9000, remainingBalance: 0, date: '2026-03-08', status: 'Delivered' },
            { id: 'p2', productName: 'Samsung Monitor 27"', barcode: '8680001002', category: 'Elektronik', quantity: 3, listPrice: 3200, unitPrice: 2800, total: 8400, payment: 8400, remainingBalance: 0, date: '2026-03-07', status: 'Delivered' },
            { id: 'p3', productName: 'Mekanik Klavye', barcode: '8680001003', category: 'Aksesuar', quantity: 5, listPrice: 500, unitPrice: 450, total: 2250, payment: 2250, remainingBalance: 0, date: '2026-03-05', status: 'Delivered' },
            { id: 'p4', productName: 'USB-C Hub', barcode: '8680001004', category: 'Aksesuar', quantity: 2, listPrice: 400, unitPrice: 350, total: 700, payment: 350, remainingBalance: 350, date: '2026-03-04', status: 'Pending' },
            { id: 'p5', productName: 'Wireless Mouse', barcode: '8680001005', category: 'Aksesuar', quantity: 10, listPrice: 200, unitPrice: 180, total: 1800, payment: 1800, remainingBalance: 0, date: '2026-03-02', status: 'Delivered' },
            { id: 'p6', productName: 'Ofis Sandalye', barcode: '8680001006', category: 'Mobilya', quantity: 1, listPrice: 2800, unitPrice: 2350, total: 2350, payment: 0, remainingBalance: 2350, date: '2026-03-01', status: 'Pending' },
        ],
        '2': [
            { id: 'p1', productName: 'Canon Yazıcı', barcode: '8680002001', category: 'Elektronik', quantity: 1, listPrice: 3500, unitPrice: 3200, total: 3200, payment: 3200, remainingBalance: 0, date: '2026-03-07', status: 'Delivered' },
            { id: 'p2', productName: 'A4 Kağıt (10 paket)', barcode: '8680002002', category: 'Kırtasiye', quantity: 10, listPrice: 130, unitPrice: 120, total: 1200, payment: 1200, remainingBalance: 0, date: '2026-03-05', status: 'Delivered' },
            { id: 'p3', productName: 'Toner Kartuş', barcode: '8680002003', category: 'Kırtasiye', quantity: 3, listPrice: 900, unitPrice: 850, total: 2550, payment: 1000, remainingBalance: 1550, date: '2026-03-03', status: 'Pending' },
        ],
        '3': [
            { id: 'p1', productName: 'Bluetooth Kulaklık', barcode: '8680003001', category: 'Aksesuar', quantity: 1, listPrice: 1400, unitPrice: 1200, total: 1200, payment: 1200, remainingBalance: 0, date: '2026-03-05', status: 'Delivered' },
            { id: 'p2', productName: 'Telefon Kılıfı', barcode: '8680003002', category: 'Aksesuar', quantity: 4, listPrice: 180, unitPrice: 150, total: 600, payment: 0, remainingBalance: 600, date: '2026-03-02', status: 'Cancelled' },
        ],
        '4': [
            { id: 'p1', productName: 'MacBook Air M3', barcode: '8680004001', category: 'Elektronik', quantity: 5, listPrice: 9500, unitPrice: 8500, total: 42500, payment: 42500, remainingBalance: 0, date: '2026-03-08', status: 'Delivered' },
            { id: 'p2', productName: 'iPhone 16 Pro', barcode: '8680004002', category: 'Elektronik', quantity: 3, listPrice: 7200, unitPrice: 6800, total: 20400, payment: 10000, remainingBalance: 10400, date: '2026-03-07', status: 'Pending' },
            { id: 'p3', productName: 'AirPods Pro', barcode: '8680004003', category: 'Aksesuar', quantity: 8, listPrice: 1700, unitPrice: 1500, total: 12000, payment: 12000, remainingBalance: 0, date: '2026-03-06', status: 'Delivered' },
        ],
        '5': [
            { id: 'p1', productName: 'Ofis Masası', barcode: '8680005001', category: 'Mobilya', quantity: 2, listPrice: 3600, unitPrice: 3200, total: 6400, payment: 6400, remainingBalance: 0, date: '2026-03-06', status: 'Delivered' },
            { id: 'p2', productName: 'Çalışma Lambası', barcode: '8680005002', category: 'Elektronik', quantity: 3, listPrice: 500, unitPrice: 450, total: 1350, payment: 1350, remainingBalance: 0, date: '2026-03-04', status: 'Delivered' },
        ],
    };

    constructor(private route: ActivatedRoute, private router: Router) { }

    ngOnInit(): void {
        this.buyerId = this.route.snapshot.paramMap.get('id') || '';
        const buyerData = this.buyersData[this.buyerId];
        if (buyerData) {
            this.buyer.set(buyerData);
            this.products.set([...(this.productsByBuyer[this.buyerId] || [])]);
        } else {
            this.router.navigate(['/cari-accounts/buyers']);
        }
    }

    // ─── Keyboard Shortcuts ─────────────────────────────
    @HostListener('document:keydown', ['$event'])
    handleKeyboard(e: KeyboardEvent): void {
        // Ctrl+V global paste handler (when not in an input)
        if (e.ctrlKey && e.key === 'v' && !this.isInInput(e)) {
            this.showBulkAddModal.set(true);
            e.preventDefault();
        }
        // Escape: close modals / deselect
        if (e.key === 'Escape') {
            this.editingCell.set(null);
            this.showBulkAddModal.set(false);
        }
        // Ctrl+A: select all (when not in input)
        if (e.ctrlKey && e.key === 'a' && !this.isInInput(e)) {
            e.preventDefault();
            this.toggleSelectAll();
        }
        // Delete: delete selected
        if (e.key === 'Delete' && !this.isInInput(e) && this.selectedCount > 0) {
            this.bulkDelete();
        }
    }

    private isInInput(e: KeyboardEvent): boolean {
        const tag = (e.target as HTMLElement)?.tagName;
        return tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';
    }

    // ─── Filters ────────────────────────────────────────
    get filteredProducts(): BuyerProduct[] {
        let items = this.products();
        const tab = this.activeTab();
        if (tab !== 'all') items = items.filter(p => p.status === tab);
        const term = this.searchTerm.toLowerCase();
        if (term) items = items.filter(p =>
            p.productName.toLowerCase().includes(term) ||
            p.barcode.includes(term) ||
            p.category.toLowerCase().includes(term)
        );
        return items;
    }

    // ─── Stats ──────────────────────────────────────────
    get totalProductCount() { return this.products().length; }
    get deliveredCount() { return this.products().filter(p => p.status === 'Delivered').length; }
    get pendingCount() { return this.products().filter(p => p.status === 'Pending').length; }
    get totalAmount() { return this.products().reduce((s, p) => s + p.total, 0); }
    get selectedCount() { return this.products().filter(p => p.selected).length; }
    get selectedTotal() { return this.products().filter(p => p.selected).reduce((s, p) => s + p.total, 0); }

    getStatusBadge(s: string) {
        switch (s) {
            case 'Delivered': return 'badge-success';
            case 'Pending': return 'badge-warning';
            case 'Cancelled': return 'badge-danger';
            default: return '';
        }
    }

    getStatusLabel(s: string) {
        switch (s) {
            case 'Delivered': return 'Teslim Edildi';
            case 'Pending': return 'Beklemede';
            case 'Cancelled': return 'İptal';
            default: return s;
        }
    }

    // ─── Selection ──────────────────────────────────────
    toggleSelectAll(): void {
        this.allSelected = !this.allSelected;
        const filtered = this.filteredProducts;
        const ids = new Set(filtered.map(p => p.id));
        this.products.update(items => items.map(p =>
            ids.has(p.id) ? { ...p, selected: this.allSelected } : p
        ));
    }

    toggleSelect(id: string): void {
        this.products.update(items => items.map(p =>
            p.id === id ? { ...p, selected: !p.selected } : p
        ));
        this.allSelected = this.filteredProducts.every(p => p.selected);
    }

    clearSelection(): void {
        this.allSelected = false;
        this.products.update(items => items.map(p => ({ ...p, selected: false })));
    }

    // ─── Inline Editing ─────────────────────────────────
    startEdit(id: string, field: string): void {
        this.editingCell.set({ id, field });
    }

    isEditing(id: string, field: string): boolean {
        const cell = this.editingCell();
        return cell !== null && cell.id === id && cell.field === field;
    }

    onCellBlur(): void {
        // Recalculate total
        this.products.update(items => items.map(p => ({ ...p, total: p.quantity * p.unitPrice })));
        this.editingCell.set(null);
    }

    onCellKeydown(e: KeyboardEvent, id: string, field: string): void {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.onCellBlur();
        }
        if (e.key === 'Tab') {
            // Move to next field
            const fields = ['productName', 'barcode', 'category', 'quantity', 'unitPrice'];
            const idx = fields.indexOf(field);
            if (idx < fields.length - 1) {
                e.preventDefault();
                this.editingCell.set({ id, field: fields[idx + 1] });
            }
        }
        if (e.key === 'Escape') {
            this.editingCell.set(null);
        }
    }

    // ─── Quick Add Rows (Excel bottom rows) ─────────────
    createEmptyRow(): QuickAddRow {
        return {
            productName: '', barcode: '', category: '', quantity: 1, listPrice: 0, unitPrice: 0,
            date: new Date().toISOString().split('T')[0], status: 'Pending'
        };
    }

    commitQuickRow(index: number): void {
        const rows = this.quickAddRows();
        const row = rows[index];
        if (!row.productName.trim()) return;

        const total = row.quantity * row.unitPrice;
        const newProduct: BuyerProduct = {
            id: 'p' + Date.now() + index,
            ...row,
            total,
            payment: 0,
            remainingBalance: total,
        };
        this.products.update(items => [...items, newProduct]);

        // Reset the row & ensure there's always an empty row at the end
        this.quickAddRows.update(r => {
            const updated = [...r];
            updated[index] = this.createEmptyRow();
            // Always keep at least 3 empty rows
            while (updated.length < 3) updated.push(this.createEmptyRow());
            return updated;
        });
    }

    onQuickRowKeydown(e: KeyboardEvent, index: number): void {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.commitQuickRow(index);
        }
    }

    addMoreQuickRows(): void {
        this.quickAddRows.update(r => [...r, this.createEmptyRow(), this.createEmptyRow(), this.createEmptyRow()]);
    }

    removeQuickRow(index: number): void {
        this.quickAddRows.update(r => {
            const updated = r.filter((_, i) => i !== index);
            if (updated.length < 3) updated.push(this.createEmptyRow());
            return updated;
        });
    }

    commitAllQuickRows(): void {
        const rows = this.quickAddRows();
        const validRows = rows.filter(r => r.productName.trim());
        if (validRows.length === 0) return;

        const newProducts: BuyerProduct[] = validRows.map((r, i) => {
            const total = r.quantity * r.unitPrice;
            return {
                id: 'p' + Date.now() + i,
                ...r,
                total,
                payment: 0,
                remainingBalance: total,
            };
        });
        this.products.update(items => [...items, ...newProducts]);

        // Reset quick add rows
        this.quickAddRows.set([
            this.createEmptyRow(),
            this.createEmptyRow(),
            this.createEmptyRow(),
        ]);
    }

    get filledQuickRowCount(): number {
        return this.quickAddRows().filter(r => r.productName.trim()).length;
    }

    // ─── Bulk Paste from Excel ──────────────────────────
    processPaste(): void {
        if (!this.bulkAddText.trim()) return;

        const lines = this.bulkAddText.trim().split('\n');
        const newProducts: BuyerProduct[] = [];

        for (const line of lines) {
            // Support tab-separated or semicolon-separated
            const cols = line.includes('\t') ? line.split('\t') : line.split(';');
            if (cols.length < 2) continue; // At least name and quantity

            const name = cols[0]?.trim() || '';
            const barcode = cols[1]?.trim() || '';
            const category = cols[2]?.trim() || '';
            const qty = parseFloat(cols[3]?.trim()) || 1;
            const price = parseFloat(cols[4]?.trim()) || 0;

            if (name) {
                const total = qty * price;
                newProducts.push({
                    id: 'p' + Date.now() + newProducts.length,
                    productName: name,
                    barcode,
                    category,
                    quantity: qty,
                    listPrice: price,
                    unitPrice: price,
                    total,
                    payment: 0,
                    remainingBalance: total,
                    date: new Date().toISOString().split('T')[0],
                    status: 'Pending'
                });
            }
        }

        if (newProducts.length > 0) {
            this.products.update(items => [...items, ...newProducts]);
        }

        this.bulkAddText = '';
        this.showBulkAddModal.set(false);
    }

    // ─── Bulk Actions ───────────────────────────────────
    bulkDelete(): void {
        this.products.update(items => items.filter(p => !p.selected));
        this.allSelected = false;
    }

    bulkMarkDelivered(): void {
        this.products.update(items => items.map(p =>
            p.selected ? { ...p, status: 'Delivered' as const, selected: false } : p
        ));
        this.allSelected = false;
    }

    bulkCancel(): void {
        this.products.update(items => items.map(p =>
            p.selected ? { ...p, status: 'Cancelled' as const, selected: false } : p
        ));
        this.allSelected = false;
    }

    // ─── Single Actions ─────────────────────────────────
    removeProduct(id: string): void {
        this.products.update(items => items.filter(p => p.id !== id));
    }

    markDelivered(id: string): void {
        this.products.update(items => items.map(p => p.id === id ? { ...p, status: 'Delivered' as const } : p));
    }

    cancelProduct(id: string): void {
        this.products.update(items => items.map(p => p.id === id ? { ...p, status: 'Cancelled' as const } : p));
    }

    duplicateProduct(p: BuyerProduct): void {
        const dup: BuyerProduct = {
            ...p,
            id: 'p' + Date.now(),
            selected: false,
            date: new Date().toISOString().split('T')[0],
            status: 'Pending'
        };
        this.products.update(items => [...items, dup]);
    }

    goBack(): void {
        this.router.navigate(['/cari-accounts/buyers']);
    }
}

import { Component, signal, OnDestroy, OnInit, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { WarehouseService } from '../../core/services/warehouse.service';
import { CariAccountService } from '../../core/services/cari-account.service';
import { SalesOrderService } from '../../core/services/sales-order.service';
import { ToastService } from '../../core/services/toast.service';
import { Product } from '../../core/models/product.model';
import { Warehouse } from '../../core/models/warehouse.model';
import { CariAccount } from '../../core/models/cari-account.model';

interface CartItem {
    productId: string;
    name: string;
    barcode: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

interface QuickProduct {
    id: string;
    name: string;
    barcode: string;
    unitPrice: number;
    category: string;
    unit: string;
}

@Component({
    selector: 'app-pos',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './pos.component.html',
    styleUrl: './pos.component.css'
})
export class PosComponent implements OnInit, OnDestroy, AfterViewInit {
    private productService = inject(ProductService);
    private warehouseService = inject(WarehouseService);
    private cariAccountService = inject(CariAccountService);
    private salesOrderService = inject(SalesOrderService);
    private toastService = inject(ToastService);
    // Search
    searchTerm = '';
    private _searchTimer: any = null;
    debouncedTerm = signal('');
    isSearching = signal(false);

    // POS state
    selectedWarehouseId = '1';
    selectedBuyerId = '';
    paymentMethod = signal<string>('cash');
    cart = signal<CartItem[]>([]);
    isScanning = signal(false);

    // ─── Buyer search (Veresiye) ───────────────────────
    buyerSearchTerm = '';
    private _buyerSearchTimer: any = null;
    debouncedBuyerTerm = signal('');
    selectedBuyer = signal<{ id: string; name: string; phone: string; balance: number } | null>(null);
    showBuyerDropdown = signal(false);

    // Barcode scanner modal
    showBarcodeScanner = signal(false);
    barcodeManualInput = '';

    // Receipt modal
    showReceipt = signal(false);
    lastSaleData = signal<{ items: CartItem[], total: number, tax: number, grandTotal: number, date: string, receiptNo: string, paymentMethod: string, customer: string } | null>(null);

    // Notification
    notification = signal<{ message: string, type: string } | null>(null);
    private _notifTimer: any = null;

    // Data from API
    warehouses: { id: string; name: string }[] = [];
    buyers: { id: string; name: string; phone: string; balance: number }[] = [];
    productCatalog: QuickProduct[] = [];
    isSaving = signal(false);

    ngOnInit(): void {
        this.loadWarehouses();
        this.loadBuyers();
        this.loadProducts();
    }

    private loadWarehouses(): void {
        this.warehouseService.getAll().subscribe({
            next: (data) => {
                this.warehouses = data.map(w => ({ id: w.id, name: w.name }));
                if (this.warehouses.length > 0) this.selectedWarehouseId = this.warehouses[0].id;
            },
            error: () => this.toastService.error('Hata', 'Depolar yüklenemedi.')
        });
    }

    private loadBuyers(): void {
        this.cariAccountService.getBuyers().subscribe({
            next: (data) => {
                this.buyers = data.map(b => ({
                    id: b.id,
                    name: b.name,
                    phone: b.phone || '',
                    balance: b.currentBalance || 0
                }));
            },
            error: () => this.toastService.error('Hata', 'Alıcılar yüklenemedi.')
        });
    }

    private loadProducts(): void {
        this.productService.getAll().subscribe({
            next: (data) => {
                this.productCatalog = data.map(p => ({
                    id: p.id,
                    name: p.name,
                    barcode: p.barcodeEan13 || '',
                    unitPrice: p.defaultSalePrice,
                    category: p.category || '',
                    unit: p.unit || 'Adet'
                }));
            },
            error: () => this.toastService.error('Hata', 'Ürünler yüklenemedi.')
        });
    }

    get searchResults(): QuickProduct[] {
        const term = this.debouncedTerm().toLowerCase();
        if (!term) return [];
        return this.productCatalog.filter(p =>
            p.name.toLowerCase().includes(term) ||
            p.barcode.includes(term) ||
            p.category.toLowerCase().includes(term)
        ).slice(0, 8);
    }

    get cartTotal(): number {
        return this.cart().reduce((sum, item) => sum + item.total, 0);
    }

    get cartTax(): number {
        return this.cartTotal * 0.18;
    }

    get cartGrandTotal(): number {
        return this.cartTotal + this.cartTax;
    }

    get cartItemCount(): number {
        return this.cart().reduce((sum, item) => sum + item.quantity, 0);
    }

    get selectedCustomerName(): string {
        if (this.paymentMethod() === 'credit' && this.selectedBuyer()) {
            return this.selectedBuyer()!.name;
        }
        if (!this.selectedBuyerId) return 'Peşin Satış';
        const b = this.buyers.find(b => b.id === this.selectedBuyerId);
        return b ? b.name : 'Peşin Satış';
    }

    // ─── Buyer Search (Veresiye) ───────────────────────
    get filteredBuyers() {
        const term = this.debouncedBuyerTerm().toLowerCase();
        if (!term) return this.buyers.slice(0, 6);
        return this.buyers.filter(b =>
            b.name.toLowerCase().includes(term) ||
            b.phone.includes(term)
        ).slice(0, 6);
    }

    onBuyerSearchInput(): void {
        if (this._buyerSearchTimer) clearTimeout(this._buyerSearchTimer);
        this._buyerSearchTimer = setTimeout(() => {
            this.debouncedBuyerTerm.set(this.buyerSearchTerm);
            this.showBuyerDropdown.set(true);
        }, 200);
    }

    selectBuyer(buyer: { id: string; name: string; phone: string; balance: number }): void {
        this.selectedBuyer.set(buyer);
        this.selectedBuyerId = buyer.id;
        this.buyerSearchTerm = '';
        this.debouncedBuyerTerm.set('');
        this.showBuyerDropdown.set(false);
        this.showNotification(`Veresiye: ${buyer.name} seçildi`, 'info');
    }

    clearBuyerSelection(): void {
        this.selectedBuyer.set(null);
        this.selectedBuyerId = '';
        this.buyerSearchTerm = '';
        this.debouncedBuyerTerm.set('');
    }

    onBuyerSearchFocus(): void {
        this.showBuyerDropdown.set(true);
        if (!this.debouncedBuyerTerm()) {
            this.debouncedBuyerTerm.set('');
        }
    }

    onBuyerSearchBlur(): void {
        // Delay to allow click on dropdown items
        setTimeout(() => this.showBuyerDropdown.set(false), 200);
    }

    highlightBuyerMatch(text: string): string {
        const term = this.debouncedBuyerTerm();
        if (!term) return this.escapeHtml(text);
        const safe = this.escapeHtml(text);
        const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return safe.replace(regex, '<mark class="search-highlight">$1</mark>');
    }

    ngAfterViewInit(): void {
        // Auto-focus search on load
        setTimeout(() => {
            const el = document.getElementById('pos-search-input');
            if (el) el.focus();
        }, 200);
    }

    // ─── Search ────────────────────────────────────────
    onSearchInput(): void {
        this.isSearching.set(true);
        if (this._searchTimer) clearTimeout(this._searchTimer);
        this._searchTimer = setTimeout(() => {
            this.debouncedTerm.set(this.searchTerm);
            this.isSearching.set(false);
        }, 250);
    }

    clearSearch(): void {
        this.searchTerm = '';
        this.debouncedTerm.set('');
        this.isSearching.set(false);
    }

    addProductFromSearch(product: QuickProduct): void {
        this.addToCart(product.id, product.name, product.barcode, product.unitPrice);
        this.clearSearch();
        this.showNotification(`${product.name} sepete eklendi`, 'success');
        // Re-focus search
        setTimeout(() => {
            const el = document.getElementById('pos-search-input');
            if (el) el.focus();
        }, 100);
    }

    // ─── Barcode Scanner ───────────────────────────────
    openBarcodeScanner(): void {
        this.barcodeManualInput = '';
        this.showBarcodeScanner.set(true);
    }

    closeBarcodeScanner(): void {
        this.showBarcodeScanner.set(false);
    }

    applyBarcodeScan(): void {
        if (this.barcodeManualInput.trim()) {
            const barcode = this.barcodeManualInput.trim();
            const product = this.productCatalog.find(p => p.barcode === barcode);
            if (product) {
                this.addToCart(product.id, product.name, product.barcode, product.unitPrice);
                this.showNotification(`${product.name} sepete eklendi`, 'success');
            } else {
                this.searchTerm = barcode;
                this.debouncedTerm.set(barcode);
                this.showNotification(`Barkod "${barcode}" katalogda bulunamadı`, 'warning');
            }
        }
        this.closeBarcodeScanner();
    }

    onBarcodeScanKeydown(e: KeyboardEvent): void {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.applyBarcodeScan();
        }
    }

    // ─── Cart Operations ───────────────────────────────
    addToCart(productId: string, name: string, barcode: string, unitPrice: number): void {
        const existing = this.cart().find(i => i.barcode === barcode);
        if (existing) {
            this.cart.update(items =>
                items.map(i => i.barcode === barcode
                    ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice }
                    : i
                )
            );
        } else {
            this.cart.update(items => [...items, {
                productId,
                name,
                barcode,
                quantity: 1,
                unitPrice,
                total: unitPrice
            }]);
        }
    }

    onSearchKeydown(e: KeyboardEvent): void {
        if (e.key === 'Enter' && this.searchTerm.trim()) {
            // Check if barcode match
            const product = this.productCatalog.find(p => p.barcode === this.searchTerm.trim());
            if (product) {
                this.addProductFromSearch(product);
            } else if (this.searchResults.length === 1) {
                this.addProductFromSearch(this.searchResults[0]);
            }
        }
        if (e.key === 'Escape') {
            this.clearSearch();
        }
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

    setQuantity(item: CartItem, event: Event): void {
        const val = parseInt((event.target as HTMLInputElement).value, 10);
        if (!val || val < 1) return;
        this.cart.update(items =>
            items.map(i => i.barcode === item.barcode
                ? { ...i, quantity: val, total: val * i.unitPrice }
                : i
            )
        );
    }

    removeItem(item: CartItem): void {
        this.cart.update(items => items.filter(i => i.barcode !== item.barcode));
        this.showNotification(`${item.name} sepetten kaldırıldı`, 'info');
    }

    clearCart(): void {
        this.cart.set([]);
    }

    // ─── Sale & Receipt ────────────────────────────────
    selectPayment(method: string): void {
        this.paymentMethod.set(method);
        // Clear buyer when switching away from credit
        if (method !== 'credit') {
            this.clearBuyerSelection();
        }
    }

    completeSale(): void {
        if (this.cart().length === 0) return;

        // Veresiye requires a buyer
        if (this.paymentMethod() === 'credit' && !this.selectedBuyer()) {
            this.showNotification('Veresiye satış için lütfen bir alıcı seçin!', 'warning');
            return;
        }

        // Need a buyer for API — use selected or first available
        const buyerId = this.selectedBuyerId || (this.buyers.length > 0 ? this.buyers[0].id : '');
        if (!buyerId) {
            this.showNotification('Satış için en az bir alıcı hesabı gerekli!', 'warning');
            return;
        }

        if (!this.selectedWarehouseId) {
            this.showNotification('Lütfen bir depo seçin!', 'warning');
            return;
        }

        this.isSaving.set(true);

        const now = new Date();
        const receiptNo = 'FIS-' + now.getFullYear() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') + '-' +
            String(now.getHours()).padStart(2, '0') +
            String(now.getMinutes()).padStart(2, '0') +
            String(now.getSeconds()).padStart(2, '0');

        const paymentLabels: Record<string, string> = {
            cash: 'Nakit',
            card: 'Kredi Kartı',
            credit: 'Veresiye'
        };

        this.salesOrderService.create({
            orderNo: receiptNo,
            customerCariAccountId: buyerId,
            warehouseId: this.selectedWarehouseId,
            items: this.cart().map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice
            }))
        }).subscribe({
            next: () => {
                this.lastSaleData.set({
                    items: [...this.cart()],
                    total: this.cartTotal,
                    tax: this.cartTax,
                    grandTotal: this.cartGrandTotal,
                    date: now.toLocaleString('tr-TR'),
                    receiptNo,
                    paymentMethod: paymentLabels[this.paymentMethod()] || 'Nakit',
                    customer: this.selectedCustomerName
                });

                this.showReceipt.set(true);
                this.clearCart();
                this.isSaving.set(false);
                this.showNotification('Satış başarıyla tamamlandı!', 'success');
            },
            error: (err) => {
                this.isSaving.set(false);
                this.showNotification(err.error?.detail || 'Satış kaydedilemedi!', 'error');
            }
        });
    }

    closeReceipt(): void {
        this.showReceipt.set(false);
    }

    printReceipt(): void {
        // Open a print window with receipt content
        const data = this.lastSaleData();
        if (!data) return;

        const printWindow = window.open('', '_blank', 'width=320,height=600');
        if (!printWindow) return;

        let itemsHtml = '';
        data.items.forEach(item => {
            itemsHtml += `
                <tr>
                    <td style="text-align:left;padding:2px 0;">${this.escapeHtml(item.name)}</td>
                    <td style="text-align:center;padding:2px 4px;">${item.quantity}</td>
                    <td style="text-align:right;padding:2px 0;">₺${item.total.toFixed(2)}</td>
                </tr>`;
        });

        printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
    <title>Fiş - ${data.receiptNo}</title>
    <style>
        @page { margin: 0; size: 80mm auto; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            width: 80mm;
            padding: 4mm;
            color: #000;
        }
        .header { text-align: center; margin-bottom: 8px; }
        .header h2 { font-size: 16px; margin-bottom: 2px; }
        .header p { font-size: 10px; color: #555; }
        .divider { border-top: 1px dashed #000; margin: 6px 0; }
        .info { font-size: 11px; margin-bottom: 4px; }
        .info span { float: right; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { text-align: left; padding: 2px 0; border-bottom: 1px solid #000; font-size: 10px; }
        th:nth-child(2) { text-align: center; }
        th:last-child { text-align: right; }
        .total-section { margin-top: 6px; }
        .total-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 11px; }
        .total-row.grand { font-weight: bold; font-size: 14px; border-top: 2px solid #000; padding-top: 4px; margin-top: 4px; }
        .footer { text-align: center; margin-top: 12px; font-size: 10px; color: #555; }
        .barcode-line { text-align: center; margin-top: 8px; font-size: 18px; letter-spacing: 3px; }
    </style>
</head>
<body>
    <div class="header">
        <h2>ERPv2</h2>
        <p>Kurumsal Yönetim Sistemi</p>
        <p>Tel: 0212 555 00 00</p>
    </div>
    <div class="divider"></div>
    <div class="info">Fiş No: <span>${this.escapeHtml(data.receiptNo)}</span></div>
    <div class="info">Tarih: <span>${this.escapeHtml(data.date)}</span></div>
    <div class="info">Müşteri: <span>${this.escapeHtml(data.customer)}</span></div>
    <div class="info">Ödeme: <span>${this.escapeHtml(data.paymentMethod)}</span></div>
    <div class="divider"></div>
    <table>
        <thead>
            <tr><th>Ürün</th><th>Ad.</th><th>Tutar</th></tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
    </table>
    <div class="divider"></div>
    <div class="total-section">
        <div class="total-row"><span>Ara Toplam:</span><span>₺${data.total.toFixed(2)}</span></div>
        <div class="total-row"><span>KDV (%18):</span><span>₺${data.tax.toFixed(2)}</span></div>
        <div class="total-row grand"><span>TOPLAM:</span><span>₺${data.grandTotal.toFixed(2)}</span></div>
    </div>
    <div class="divider"></div>
    <div class="barcode-line">||||| |||| ||||| ||||</div>
    <div class="footer">
        <p>Bizi tercih ettiğiniz için teşekkürler!</p>
        <p>Bu fiş bilgi amaçlıdır.</p>
    </div>
    <script>window.onload = function() { window.print(); }</script>
</body>
</html>`);
        printWindow.document.close();
    }

    printCurrentCart(): void {
        if (this.cart().length === 0) return;

        const now = new Date();
        const receiptNo = 'TEK-' + now.getFullYear() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') + '-' +
            String(now.getHours()).padStart(2, '0') +
            String(now.getMinutes()).padStart(2, '0') +
            String(now.getSeconds()).padStart(2, '0');

        this.lastSaleData.set({
            items: [...this.cart()],
            total: this.cartTotal,
            tax: this.cartTax,
            grandTotal: this.cartGrandTotal,
            date: now.toLocaleString('tr-TR'),
            receiptNo,
            paymentMethod: 'Teklif / Ön İzleme',
            customer: this.selectedCustomerName
        });

        this.printReceipt();
    }

    // ─── Touch Mode ────────────────────────────────────
    touchMode = signal(false);
    activeCategory = signal<string>('');

    private readonly CAT_COLORS = [
        '#f97316', '#e11d48', '#16a34a', '#0891b2',
        '#7c3aed', '#d97706', '#059669', '#dc2626',
        '#c2410c', '#0284c7'
    ];

    get categories(): string[] {
        return [...new Set(this.productCatalog.map(p => p.category).filter(Boolean))];
    }

    get filteredProducts(): QuickProduct[] {
        const cat = this.activeCategory();
        let list = cat ? this.productCatalog.filter(p => p.category === cat) : this.productCatalog;
        const term = this.debouncedTerm().toLowerCase();
        if (term) list = list.filter(p => p.name.toLowerCase().includes(term) || p.barcode.includes(term));
        return list;
    }

    getCategoryColor(cat: string): string {
        const idx = this.categories.indexOf(cat);
        return this.CAT_COLORS[Math.max(0, idx) % this.CAT_COLORS.length];
    }

    getCategoryCount(cat: string): number {
        return this.productCatalog.filter(p => p.category === cat).length;
    }

    addToCartFromGrid(product: QuickProduct): void {
        this.addToCart(product.id, product.name, product.barcode, product.unitPrice);
        this.showNotification(`${product.name} eklendi`, 'success');
    }

    // ─── Notifications ─────────────────────────────────
    showNotification(message: string, type: string): void {
        this.notification.set({ message, type });
        if (this._notifTimer) clearTimeout(this._notifTimer);
        this._notifTimer = setTimeout(() => {
            this.notification.set(null);
        }, 2500);
    }

    // ─── Highlight ─────────────────────────────────────
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

    ngOnDestroy(): void {
        if (this._searchTimer) clearTimeout(this._searchTimer);
        if (this._notifTimer) clearTimeout(this._notifTimer);
        if (this._buyerSearchTimer) clearTimeout(this._buyerSearchTimer);
    }
}

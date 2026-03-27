import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, map, of, switchMap } from 'rxjs';
import {
    Product,
    CreateProductRequest,
    UpdateProductRequest,
    ProductScanResponse
} from '../../core/models/product.model';
import { ProductService } from '../../core/services/product.service';
import { ToastService } from '../../core/services/toast.service';

interface ExcelUploadResult {
    totalRows: number;
    createdCount: number;
    failedCount: number;
    errors?: string[];
}

interface ProductRow {
    id: string;
    code: string;
    name: string;
    barcode: string;
    unitPrice: number;
    unit: string;
    categoryName: string;
    description: string;
    isActive: boolean;
    imageUrl?: string | null;
    raw: Product;
}

interface ProductFormData {
    code: string;
    name: string;
    barcode: string;
    unitPrice: number;
    unit: string;
    categoryName: string;
    description: string;
    criticalStockLevel: number;
    minimumStockLevel: number | null;
}

interface UnknownBarcodePrompt {
    barcode: string;
    draftCode: string;
    draftName: string;
}

@Component({
    selector: 'app-products',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './products.component.html',
    styleUrls: ['./products.component.css', '../../shared/styles/crud-page.css']
})
export class ProductsComponent implements OnInit, OnDestroy {
    @ViewChild('barcodeVideo') barcodeVideo?: ElementRef<HTMLVideoElement>;

    private readonly productService = inject(ProductService);
    private readonly toastService = inject(ToastService);

    searchTerm = '';
    sortColumn = '';
    sortDir: 'asc' | 'desc' = 'asc';
    categoryFilter = signal<string>('all');
    showModal = signal(false);
    showBarcodeScanner = signal(false);
    showUnknownBarcodePrompt = signal(false);
    editingProduct = signal<ProductRow | null>(null);
    unknownBarcodePrompt = signal<UnknownBarcodePrompt | null>(null);
    formData: ProductFormData = this.createEmptyForm();

    isLoading = signal(false);
    isSaving = signal(false);
    isBarcodeChecking = signal(false);
    isModalImageUploading = signal(false);

    cameraSupported = signal(false);
    cameraActive = signal(false);
    cameraError = signal('');
    private cameraStream: MediaStream | null = null;
    private cameraDetectTimer: ReturnType<typeof setInterval> | null = null;
    private barcodeDetector: any = null;

    // Debounce
    private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
    debouncedTerm = signal('');
    isSearching = signal(false);

    // Cloud image upload state
    private imageUploadingMap = signal<Record<string, boolean>>({});
    private imageRemovingMap = signal<Record<string, boolean>>({});
    pendingModalImageFile = signal<File | null>(null);
    pendingModalImagePreview = signal<string | null>(null);

    // Excel upload state
    showExcelUploadModal = signal(false);
    excelFile = signal<File | null>(null);
    excelUploading = signal(false);
    excelResult = signal<ExcelUploadResult | null>(null);
    isDragOver = signal(false);

    products = signal<ProductRow[]>([]);

    ngOnInit(): void {
        this.loadProducts();
    }

    // Unique categories
    get categories(): string[] {
        const cats = [...new Set(this.products().map(p => p.categoryName).filter(Boolean))];
        return cats.sort((a, b) => a.localeCompare(b, 'tr'));
    }

    sort(col: keyof ProductRow): void {
        if (this.sortColumn === col) {
            this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = col;
            this.sortDir = 'asc';
        }
    }

    get filteredProducts(): ProductRow[] {
        let items = this.products();

        if (this.categoryFilter() !== 'all') {
            items = items.filter(p => p.categoryName === this.categoryFilter());
        }

        const term = this.debouncedTerm().toLowerCase();
        if (term) {
            items = items.filter(p =>
                p.name.toLowerCase().includes(term) ||
                p.code.toLowerCase().includes(term) ||
                p.barcode.toLowerCase().includes(term) ||
                p.categoryName.toLowerCase().includes(term) ||
                p.unit.toLowerCase().includes(term)
            );
        }

        if (this.sortColumn) {
            const dir = this.sortDir === 'asc' ? 1 : -1;
            const col = this.sortColumn as keyof ProductRow;
            items = [...items].sort((a, b) => {
                const left = a[col] as string | number | boolean | null | undefined;
                const right = b[col] as string | number | boolean | null | undefined;

                if (typeof left === 'number' && typeof right === 'number') {
                    return dir * (left - right);
                }

                return dir * String(left ?? '').localeCompare(String(right ?? ''), 'tr');
            });
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
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
        }

        this.searchDebounceTimer = setTimeout(() => {
            this.debouncedTerm.set(this.searchTerm);
            this.isSearching.set(false);
        }, 300);
    }

    clearSearch(): void {
        this.searchTerm = '';
        this.debouncedTerm.set('');
        this.isSearching.set(false);
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
        }
    }

    // Highlight matched text
    highlightMatch(text: string): string {
        const term = this.debouncedTerm();
        if (!term) return this.escapeHtml(text);

        const safe = this.escapeHtml(text);
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'gi');
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

    // Barcode scanner modal
    barcodeManualInput = '';

    openBarcodeScanner(): void {
        this.barcodeManualInput = '';
        this.cameraError.set('');
        this.showBarcodeScanner.set(true);
        setTimeout(() => this.startCameraScanner(), 0);
    }

    closeBarcodeScanner(): void {
        this.stopCameraScanner();
        this.showBarcodeScanner.set(false);
    }

    applyBarcodeSearch(): void {
        const barcode = this.barcodeManualInput.trim();
        if (barcode) {
            this.lookupScannedBarcode(barcode);
        }
    }

    onBarcodeScanKeydown(e: KeyboardEvent): void {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.applyBarcodeSearch();
        }
    }

    cancelUnknownBarcodePrompt(): void {
        this.showUnknownBarcodePrompt.set(false);
        this.unknownBarcodePrompt.set(null);
    }

    confirmUnknownBarcodeAsNewProduct(): void {
        const prompt = this.unknownBarcodePrompt();
        if (!prompt) {
            return;
        }

        this.cancelUnknownBarcodePrompt();
        this.editingProduct.set(null);
        this.clearPendingModalImage();
        this.formData = {
            ...this.createEmptyForm(),
            code: prompt.draftCode,
            name: prompt.draftName,
            barcode: prompt.barcode
        };
        this.showModal.set(true);
        this.toastService.info('Barkod eklendi', 'Yeni urun bilgilerini tamamlayip kaydedin.');
    }

    onModalImageSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0] ?? null;
        input.value = '';

        if (!file) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            this.toastService.warning('Gecersiz dosya', 'Lutfen bir gorsel dosyasi secin.');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            this.toastService.warning('Gecersiz dosya', 'Gorsel boyutu 10 MB u asmamalidir.');
            return;
        }

        this.setPendingModalImage(file);
    }

    clearModalImageSelection(): void {
        this.clearPendingModalImage();
    }

    // CRUD
    openAddModal(): void {
        this.editingProduct.set(null);
        this.clearPendingModalImage();
        this.formData = {
            ...this.createEmptyForm(),
            code: this.generateProductCode()
        };
        this.showModal.set(true);
    }

    openEditModal(product: ProductRow): void {
        this.editingProduct.set(product);
        this.clearPendingModalImage();
        this.formData = {
            code: product.code,
            name: product.name,
            barcode: product.barcode,
            unitPrice: product.unitPrice,
            unit: product.unit,
            categoryName: product.categoryName,
            description: product.description,
            criticalStockLevel: product.raw.criticalStockLevel ?? 1,
            minimumStockLevel: product.raw.minimumStockLevel ?? null
        };
        this.showModal.set(true);
    }

    closeModal(): void {
        this.showModal.set(false);
        this.isSaving.set(false);
        this.isModalImageUploading.set(false);
        this.clearPendingModalImage();
    }

    saveProduct(): void {
        if (!this.formData.name.trim()) {
            this.toastService.warning('Eksik bilgi', 'Urun adi zorunludur.');
            return;
        }

        if (!this.formData.code.trim()) {
            this.toastService.warning('Eksik bilgi', 'Urun kodu zorunludur.');
            return;
        }

        this.isSaving.set(true);
        const editing = this.editingProduct();
        const barcodeFields = this.parseBarcodeInput(this.formData.barcode);

        if (editing) {
            const updatePayload = this.buildUpdateRequest(editing.raw, {
                code: this.formData.code.trim(),
                name: this.formData.name.trim(),
                barcodeEan13: barcodeFields.barcodeEan13,
                qrCode: barcodeFields.qrCode,
                defaultSalePrice: Number(this.formData.unitPrice || 0),
                unit: this.normalizeUnit(this.formData.unit),
                category: this.normalizeCategory(this.formData.categoryName),
                shortDescription: this.nullIfEmpty(this.formData.description),
                criticalStockLevel: Number(this.formData.criticalStockLevel) || 1,
                minimumStockLevel: this.formData.minimumStockLevel != null ? Number(this.formData.minimumStockLevel) : null
            });

            this.productService.update(editing.id, updatePayload)
                .pipe(
                    switchMap(() => this.uploadPendingModalImageIfAny(editing.id)),
                    finalize(() => this.isSaving.set(false))
                )
                .subscribe({
                    next: result => {
                        if (result.imageError) {
                            this.toastService.warning('Urun guncellendi', `Gorsel yuklenemedi: ${result.imageError}`);
                        } else if (result.imageUploaded) {
                            this.toastService.success('Urun ve gorsel guncellendi');
                        } else {
                            this.toastService.success('Urun guncellendi');
                        }
                        this.closeModal();
                        this.loadProducts();
                    },
                    error: err => this.toastService.error('Guncelleme hatasi', this.extractErrorMessage(err))
                });
            return;
        }

        const createPayload: CreateProductRequest = {
            code: this.formData.code.trim(),
            name: this.formData.name.trim(),
            unit: this.normalizeUnit(this.formData.unit),
            category: this.normalizeCategory(this.formData.categoryName),
            shortDescription: this.nullIfEmpty(this.formData.description),
            barcodeEan13: barcodeFields.barcodeEan13,
            qrCode: barcodeFields.qrCode,
            isActive: true,
            defaultSalePrice: Number(this.formData.unitPrice || 0),
            criticalStockLevel: Number(this.formData.criticalStockLevel) || 1,
            minimumStockLevel: this.formData.minimumStockLevel != null ? Number(this.formData.minimumStockLevel) : null
        };

        this.productService.create(createPayload)
            .pipe(
                switchMap(productId => this.uploadPendingModalImageIfAny(productId)),
                finalize(() => this.isSaving.set(false))
            )
            .subscribe({
                next: result => {
                    if (result.imageError) {
                        this.toastService.warning('Urun olusturuldu', `Gorsel yuklenemedi: ${result.imageError}`);
                    } else if (result.imageUploaded) {
                        this.toastService.success('Urun ve gorsel olusturuldu');
                    } else {
                        this.toastService.success('Urun olusturuldu');
                    }
                    this.closeModal();
                    this.loadProducts();
                },
                error: err => this.toastService.error('Olusturma hatasi', this.extractErrorMessage(err))
            });
    }

    toggleStatus(product: ProductRow): void {
        const updatePayload = this.buildUpdateRequest(product.raw, {
            isActive: !product.isActive
        });

        this.productService.update(product.id, updatePayload).subscribe({
            next: () => {
                this.products.update(items => items.map(p =>
                    p.id === product.id
                        ? {
                            ...p,
                            isActive: !product.isActive,
                            raw: { ...p.raw, isActive: !product.isActive }
                        }
                        : p
                ));
            },
            error: err => this.toastService.error('Durum guncelleme hatasi', this.extractErrorMessage(err))
        });
    }

    deleteProduct(id: string): void {
        this.productService.delete(id).subscribe({
            next: () => {
                this.products.update(items => items.filter(p => p.id !== id));
                this.toastService.success('Urun silindi');
            },
            error: err => this.toastService.error('Silme hatasi', this.extractErrorMessage(err))
        });
    }

    onProductImageSelected(product: ProductRow, event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0] ?? null;
        input.value = '';

        if (!file) {
            return;
        }

        this.setImageUploading(product.id, true);

        this.productService.uploadImage(product.id, file, true)
            .pipe(finalize(() => this.setImageUploading(product.id, false)))
            .subscribe({
                next: response => {
                    this.products.update(items => items.map(p =>
                        p.id === product.id
                            ? {
                                ...p,
                                imageUrl: response.imageUrl,
                                raw: { ...p.raw, imageUrl: response.imageUrl }
                            }
                            : p
                    ));

                    if (this.editingProduct()?.id === product.id) {
                        this.editingProduct.update(current =>
                            current ? { ...current, imageUrl: response.imageUrl, raw: { ...current.raw, imageUrl: response.imageUrl } } : null
                        );
                    }

                    this.toastService.success('Gorsel yuklendi');
                },
                error: err => this.toastService.error('Gorsel yukleme hatasi', this.extractErrorMessage(err))
            });
    }

    removeProductImage(product: ProductRow): void {
        if (!product.imageUrl) {
            return;
        }

        this.setImageRemoving(product.id, true);

        this.productService.removeImage(product.id)
            .pipe(finalize(() => this.setImageRemoving(product.id, false)))
            .subscribe({
                next: () => {
                    this.products.update(items => items.map(p =>
                        p.id === product.id
                            ? {
                                ...p,
                                imageUrl: null,
                                raw: { ...p.raw, imageUrl: null }
                            }
                            : p
                    ));

                    if (this.editingProduct()?.id === product.id) {
                        this.editingProduct.update(current =>
                            current ? { ...current, imageUrl: null, raw: { ...current.raw, imageUrl: null } } : null
                        );
                    }

                    this.toastService.success('Gorsel kaldirildi');
                },
                error: err => this.toastService.error('Gorsel silme hatasi', this.extractErrorMessage(err))
            });
    }

    isImageUploading(productId: string): boolean {
        return !!this.imageUploadingMap()[productId];
    }

    isImageRemoving(productId: string): boolean {
        return !!this.imageRemovingMap()[productId];
    }

    // Excel upload mock flow
    openExcelModal(): void {
        this.excelFile.set(null);
        this.excelResult.set(null);
        this.excelUploading.set(false);
        this.isDragOver.set(false);
        this.showExcelUploadModal.set(true);
    }

    closeExcelModal(): void {
        this.showExcelUploadModal.set(false);
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.setFile(input.files[0]);
        }
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver.set(true);
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver.set(false);
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver.set(false);

        if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
            this.setFile(event.dataTransfer.files[0]);
        }
    }

    private setFile(file: File): void {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(ext || '') || file.size > 5 * 1024 * 1024) {
            this.toastService.warning('Gecersiz dosya', 'Yalnizca xlsx/xls/csv ve max 5 MB dosya yukleyin.');
            return;
        }

        this.excelFile.set(file);
        this.excelResult.set(null);
    }

    removeExcelFile(): void {
        this.excelFile.set(null);
        this.excelResult.set(null);
    }

    uploadExcel(): void {
        if (!this.excelFile()) {
            return;
        }

        this.excelUploading.set(true);
        setTimeout(() => {
            this.excelResult.set({
                totalRows: 20,
                createdCount: 17,
                failedCount: 3,
                errors: [
                    'Satir 4: Urun adi alani bos.',
                    'Satir 12: Barkod zaten mevcut.',
                    'Satir 18: Birim fiyat sayisal olmali.'
                ]
            });
            this.excelUploading.set(false);
        }, 1500);
    }

    formatFileSize(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    ngOnDestroy(): void {
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
        }
        this.stopCameraScanner();
        this.clearPendingModalImage();
    }

    private lookupScannedBarcode(barcode: string): void {
        const normalized = barcode.trim();
        if (!normalized || this.isBarcodeChecking()) {
            return;
        }

        this.isBarcodeChecking.set(true);
        this.productService.scanBarcode(normalized)
            .pipe(finalize(() => this.isBarcodeChecking.set(false)))
            .subscribe({
                next: response => this.handleBarcodeLookupResult(response),
                error: err => this.toastService.error('Barkod sorgu hatasi', this.extractErrorMessage(err))
            });
    }

    private handleBarcodeLookupResult(response: ProductScanResponse): void {
        if (response.found && response.product) {
            const barcodeValue = response.product.barcodeEan13 ?? response.product.qrCode ?? response.barcode;
            this.searchTerm = barcodeValue;
            this.debouncedTerm.set(this.searchTerm);
            this.closeBarcodeScanner();
            this.toastService.success('Urun bulundu', `${response.product.name} listede filtrelendi.`);
            return;
        }

        const draftCode = response.draft?.code || this.generateProductCodeFromBarcode(response.barcode);
        const draftName = response.draft?.name || `Yeni Urun ${response.barcode}`;
        this.unknownBarcodePrompt.set({
            barcode: response.barcode,
            draftCode,
            draftName
        });
        this.closeBarcodeScanner();
        this.showUnknownBarcodePrompt.set(true);
    }

    private async startCameraScanner(): Promise<void> {
        const BarcodeDetectorCtor = (globalThis as any)?.BarcodeDetector;
        if (!BarcodeDetectorCtor) {
            this.cameraSupported.set(false);
            this.cameraError.set('Tarayiciniz kamera barkod algilama ozelligini desteklemiyor. Manuel giris kullanin.');
            return;
        }

        this.cameraSupported.set(true);
        this.cameraError.set('');

        try {
            this.barcodeDetector = new BarcodeDetectorCtor({
                formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code']
            });
        } catch {
            this.barcodeDetector = new BarcodeDetectorCtor();
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            this.cameraError.set('Kamera erisimi bu cihazda desteklenmiyor.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            this.cameraStream = stream;
            if (!this.showBarcodeScanner()) {
                stream.getTracks().forEach(track => track.stop());
                return;
            }

            const video = this.barcodeVideo?.nativeElement;
            if (!video) {
                return;
            }

            video.srcObject = stream;
            await video.play();
            this.cameraActive.set(true);

            this.cameraDetectTimer = setInterval(() => {
                this.detectBarcodeFromCamera().catch(() => {
                    // silent
                });
            }, 350);
        } catch {
            this.cameraError.set('Kamera acilamadi. Izin verip tekrar deneyin veya manuel barkod girin.');
        }
    }

    private async detectBarcodeFromCamera(): Promise<void> {
        if (!this.cameraActive() || !this.barcodeDetector || this.isBarcodeChecking()) {
            return;
        }

        const video = this.barcodeVideo?.nativeElement;
        if (!video || video.readyState < 2) {
            return;
        }

        const result = await this.barcodeDetector.detect(video);
        const value = result?.[0]?.rawValue?.toString()?.trim();
        if (!value) {
            return;
        }

        this.barcodeManualInput = value;
        this.lookupScannedBarcode(value);
    }

    private stopCameraScanner(): void {
        this.cameraActive.set(false);
        if (this.cameraDetectTimer) {
            clearInterval(this.cameraDetectTimer);
            this.cameraDetectTimer = null;
        }

        const video = this.barcodeVideo?.nativeElement;
        if (video) {
            video.pause();
            video.srcObject = null;
        }

        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
        }
    }

    private loadProducts(): void {
        this.isLoading.set(true);

        this.productService.getAll({ page: 1, pageSize: 500 })
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe({
                next: rows => {
                    this.products.set(rows.map(product => this.mapProduct(product)));
                },
                error: err => {
                    this.products.set([]);
                    this.toastService.error('Urunler yuklenemedi', this.extractErrorMessage(err));
                }
            });
    }

    private mapProduct(product: Product): ProductRow {
        return {
            id: product.id,
            code: product.code ?? '',
            name: product.name ?? '',
            barcode: product.barcodeEan13 ?? product.qrCode ?? '',
            unitPrice: Number(product.defaultSalePrice ?? 0),
            unit: (product.unit ?? 'EA').trim(),
            categoryName: (product.category ?? 'Genel').trim(),
            description: product.shortDescription ?? '',
            isActive: product.isActive,
            imageUrl: product.imageUrl ?? null,
            raw: product
        };
    }

    private buildUpdateRequest(base: Product, overrides: Partial<UpdateProductRequest>): UpdateProductRequest {
        return {
            code: overrides.code ?? base.code ?? this.generateProductCode(),
            name: overrides.name ?? base.name ?? '',
            unit: this.normalizeUnit(overrides.unit ?? base.unit ?? 'EA'),
            category: this.normalizeCategory(overrides.category ?? base.category ?? 'Genel'),
            shortDescription: overrides.shortDescription ?? base.shortDescription ?? null,
            subCategory: overrides.subCategory ?? base.subCategory ?? null,
            brand: overrides.brand ?? base.brand ?? null,
            alternativeUnits: overrides.alternativeUnits ?? base.alternativeUnits ?? null,
            barcodeEan13: overrides.barcodeEan13 ?? base.barcodeEan13 ?? null,
            alternativeBarcodes: overrides.alternativeBarcodes ?? base.alternativeBarcodes ?? null,
            qrCode: overrides.qrCode ?? base.qrCode ?? null,
            productType: overrides.productType ?? base.productType ?? null,
            purchaseVatRate: overrides.purchaseVatRate ?? base.purchaseVatRate ?? null,
            salesVatRate: overrides.salesVatRate ?? base.salesVatRate ?? null,
            isActive: overrides.isActive ?? base.isActive,
            minimumStockLevel: overrides.minimumStockLevel ?? base.minimumStockLevel ?? null,
            criticalStockLevel: overrides.criticalStockLevel ?? base.criticalStockLevel ?? 1,
            maximumStockLevel: overrides.maximumStockLevel ?? base.maximumStockLevel ?? null,
            defaultWarehouseId: overrides.defaultWarehouseId ?? base.defaultWarehouseId ?? null,
            defaultShelfCode: overrides.defaultShelfCode ?? base.defaultShelfCode ?? null,
            imageUrl: overrides.imageUrl ?? base.imageUrl ?? null,
            technicalDocumentUrl: overrides.technicalDocumentUrl ?? base.technicalDocumentUrl ?? null,
            defaultSalePrice: Number(overrides.defaultSalePrice ?? base.defaultSalePrice ?? 0),
            lastPurchasePrice: overrides.lastPurchasePrice ?? base.lastPurchasePrice ?? null,
            lastSalePrice: overrides.lastSalePrice ?? base.lastSalePrice ?? null
        };
    }

    private setImageUploading(productId: string, value: boolean): void {
        this.imageUploadingMap.update(map => ({ ...map, [productId]: value }));
    }

    private setImageRemoving(productId: string, value: boolean): void {
        this.imageRemovingMap.update(map => ({ ...map, [productId]: value }));
    }

    private uploadPendingModalImageIfAny(productId: string) {
        const file = this.pendingModalImageFile();
        if (!file) {
            return of({ imageUploaded: false, imageError: null as string | null });
        }

        this.isModalImageUploading.set(true);
        return this.productService.uploadImage(productId, file, true).pipe(
            map(() => ({ imageUploaded: true, imageError: null as string | null })),
            catchError(err => of({ imageUploaded: false, imageError: this.extractErrorMessage(err) })),
            finalize(() => this.isModalImageUploading.set(false))
        );
    }

    private setPendingModalImage(file: File): void {
        this.clearPendingModalImage();
        this.pendingModalImageFile.set(file);
        this.pendingModalImagePreview.set(URL.createObjectURL(file));
    }

    private clearPendingModalImage(): void {
        const preview = this.pendingModalImagePreview();
        if (preview) {
            URL.revokeObjectURL(preview);
        }

        this.pendingModalImageFile.set(null);
        this.pendingModalImagePreview.set(null);
    }

    private normalizeUnit(unit: string | null | undefined): string {
        const value = (unit ?? '').trim();
        return value ? value : 'EA';
    }

    private normalizeCategory(category: string | null | undefined): string {
        const value = (category ?? '').trim();
        return value ? value : 'Genel';
    }

    private nullIfEmpty(value: string | null | undefined): string | null {
        const normalized = (value ?? '').trim();
        return normalized ? normalized : null;
    }

    private parseBarcodeInput(rawValue: string | null | undefined): { barcodeEan13: string | null; qrCode: string | null } {
        const value = (rawValue ?? '').trim();
        if (!value) {
            return { barcodeEan13: null, qrCode: null };
        }

        if (/^\d{13}$/.test(value)) {
            return { barcodeEan13: value, qrCode: null };
        }

        return { barcodeEan13: null, qrCode: value };
    }

    private extractErrorMessage(error: unknown): string {
        if (error instanceof HttpErrorResponse) {
            if (typeof error.error === 'string' && error.error.trim()) {
                return error.error;
            }

            if (error.error && typeof error.error === 'object') {
                const errObj = error.error as Record<string, unknown>;
                const title = typeof errObj['title'] === 'string' ? errObj['title'] : null;
                const detail = typeof errObj['detail'] === 'string' ? errObj['detail'] : null;
                const message = typeof errObj['message'] === 'string' ? errObj['message'] : null;
                const first = title || detail || message;
                if (first) {
                    return first;
                }
            }

            return `HTTP ${error.status}`;
        }

        return 'Beklenmeyen bir hata olustu.';
    }

    private generateProductCode(): string {
        const suffix = Date.now().toString().slice(-6);
        return `PRD-${suffix}`;
    }

    private generateProductCodeFromBarcode(barcode: string): string {
        const normalized = (barcode ?? '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        if (!normalized) {
            return this.generateProductCode();
        }

        const suffix = normalized.length > 8 ? normalized.slice(-8) : normalized;
        return `PRD-${suffix}`;
    }

    private createEmptyForm(): ProductFormData {
        return {
            code: '',
            name: '',
            barcode: '',
            unitPrice: 0,
            unit: 'EA',
            categoryName: 'Genel',
            description: '',
            criticalStockLevel: 1,
            minimumStockLevel: null
        };
    }

    // ── Barkod Yazdırma ──────────────────────────────────────────────────────
    showBarcodeModal = signal(false);
    barcodeSelection = signal<Set<string>>(new Set());
    barcodeLabelCount = 1;

    openBarcodeModal(): void {
        this.barcodeSelection.set(new Set());
        this.barcodeLabelCount = 1;
        this.showBarcodeModal.set(true);
    }

    closeBarcodeModal(): void { this.showBarcodeModal.set(false); }

    toggleBarcodeProduct(id: string): void {
        this.barcodeSelection.update(s => {
            const next = new Set(s);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    isBarcodeSelected(id: string): boolean { return this.barcodeSelection().has(id); }

    selectAllBarcodes(): void {
        const allIds = this.filteredProducts.filter(p => p.barcode).map(p => p.id);
        this.barcodeSelection.set(new Set(allIds));
    }

    clearBarcodeSelection(): void { this.barcodeSelection.set(new Set()); }

    get barcodeSelectedProducts(): ProductRow[] {
        const sel = this.barcodeSelection();
        return this.products().filter(p => sel.has(p.id) && p.barcode);
    }

    printBarcodes(): void {
        const items = this.barcodeSelectedProducts;
        if (items.length === 0) return;

        const count = this.barcodeLabelCount || 1;
        const labelsHtml = items.flatMap(p =>
            Array.from({ length: count }, () => `
                <div class="label">
                    <div class="label-name">${p.name.length > 30 ? p.name.substring(0, 28) + '…' : p.name}</div>
                    <div class="barcode">${p.barcode}</div>
                    <div class="barcode-num">${p.barcode}</div>
                    ${p.unitPrice ? `<div class="label-price">₺${p.unitPrice.toLocaleString('tr-TR')}</div>` : ''}
                </div>
            `)
        ).join('');

        const win = window.open('', '_blank', 'width=800,height=600');
        if (!win) return;
        win.document.write(`
            <!DOCTYPE html><html><head><meta charset="utf-8">
            <title>Barkod Etiketleri</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+128&display=swap" rel="stylesheet">
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: Arial, sans-serif; background: #fff; }
                .labels { display: flex; flex-wrap: wrap; gap: 8px; padding: 12px; }
                .label {
                    width: 90mm; border: 1px solid #ccc; border-radius: 4px;
                    padding: 6px 8px; text-align: center; page-break-inside: avoid;
                }
                .label-name { font-size: 9pt; font-weight: 600; margin-bottom: 4px; line-height: 1.2; }
                .barcode { font-family: 'Libre Barcode 128', cursive; font-size: 48pt; line-height: 1; }
                .barcode-num { font-size: 8pt; letter-spacing: 2px; margin-top: 2px; }
                .label-price { font-size: 10pt; font-weight: 700; margin-top: 4px; }
                @media print { .labels { gap: 6px; padding: 8px; } }
            </style></head>
            <body><div class="labels">${labelsHtml}</div>
            <script>window.onload = () => { window.print(); window.close(); }<\/script>
            </body></html>
        `);
        win.document.close();
    }
}

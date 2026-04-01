import { Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import {
    CommitScannedDocumentRequest,
    CommitScannedDocumentResponse,
    DocumentScanResult,
    DocumentScannerService,
    ScannedLineItem,
    ScanCommitOperation,
    ScanProvider
} from '../../core/services/document-scanner.service';
import { ToastService } from '../../core/services/toast.service';
import { CariAccountService } from '../../core/services/cari-account.service';
import { WarehouseService } from '../../core/services/warehouse.service';
import { CariAccount } from '../../core/models/cari-account.model';
import { Warehouse } from '../../core/models/warehouse.model';

type PageState = 'idle' | 'preview' | 'analyzing' | 'results';

@Component({
    selector: 'app-document-scanner',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './document-scanner.component.html',
    styleUrl: './document-scanner.component.css'
})
export class DocumentScannerComponent {
    @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

    private scannerService = inject(DocumentScannerService);
    private cariAccountService = inject(CariAccountService);
    private warehouseService = inject(WarehouseService);
    private toast = inject(ToastService);

    pageState = signal<PageState>('idle');
    provider = signal<ScanProvider>('gemini');
    isDragging = signal(false);
    private readonly supportedProviders = new Set<ScanProvider>(['gemini', 'claude']);

    previewUrl = signal<string | null>(null);
    fileName = signal('');
    fileSize = signal('');
    private imageBase64 = '';
    private mimeType = '';

    result = signal<DocumentScanResult | null>(null);
    editableItems = signal<ScannedLineItem[]>([]);

    operation = signal<ScanCommitOperation>('supplierPurchaseOrder');
    buyers = signal<CariAccount[]>([]);
    suppliers = signal<CariAccount[]>([]);
    warehouses = signal<Warehouse[]>([]);
    selectedBuyerId = signal('');
    selectedSupplierId = signal('');
    selectedWarehouseId = signal('');
    createMissingProducts = signal(true);
    isLoadingTargets = signal(false);
    isCommitting = signal(false);
    commitResult = signal<CommitScannedDocumentResponse | null>(null);

    readonly documentTypeLabel = computed(() => {
        const t = this.result()?.documentType;
        return t === 'invoice' ? 'Fatura'
             : t === 'waybill' ? 'Irsaliye'
             : t === 'receipt' ? 'Fis'
             : 'Belge';
    });

    readonly providerLabel = computed(() => {
        switch (this.provider()) {
            case 'claude': return 'Claude AI (Anthropic)';
            case 'azure': return 'Azure Document Intelligence';
            case 'gemini': return 'Google Gemini';
            default: return 'AI';
        }
    });

    readonly editableTotal = computed(() =>
        this.editableItems().reduce((sum, i) => sum + (i.totalPrice || 0), 0)
    );

    readonly canCommit = computed(() => {
        if (this.pageState() !== 'results' || this.isCommitting() || this.editableItems().length === 0) {
            return false;
        }

        const op = this.operation();
        if (op === 'buyerDebt') {
            return !!this.selectedBuyerId();
        }

        if (op === 'supplierPurchaseOrder') {
            return !!this.selectedSupplierId() && !!this.selectedWarehouseId();
        }

        return !!this.selectedWarehouseId();
    });

    isProviderSupported(provider: ScanProvider): boolean {
        return this.supportedProviders.has(provider);
    }

    setProvider(provider: ScanProvider): void {
        if (!this.isProviderSupported(provider)) {
            this.toast.info(
                'Saglayici Hazir Degil',
                `${this.providerDisplayName(provider)} henuz backend tarafinda aktif degil. Simdilik Claude veya Gemini kullanin.`
            );
            return;
        }

        this.provider.set(provider);
    }

    setOperation(operation: ScanCommitOperation): void {
        this.operation.set(operation);
        this.commitResult.set(null);

        if (operation === 'buyerDebt' && !this.selectedBuyerId() && this.buyers().length > 0) {
            this.selectedBuyerId.set(this.buyers()[0].id);
        }

        if (operation === 'supplierPurchaseOrder' && !this.selectedSupplierId() && this.suppliers().length > 0) {
            this.selectedSupplierId.set(this.suppliers()[0].id);
        }

        if (!this.selectedWarehouseId() && this.warehouses().length > 0) {
            this.selectedWarehouseId.set(this.warehouses()[0].id);
        }
    }

    openFilePicker(): void {
        this.fileInputRef.nativeElement.value = '';
        this.fileInputRef.nativeElement.click();
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) {
            this.loadFile(file);
        }
    }

    onDragOver(e: DragEvent): void {
        e.preventDefault();
        this.isDragging.set(true);
    }

    onDragLeave(): void {
        this.isDragging.set(false);
    }

    onDrop(e: DragEvent): void {
        e.preventDefault();
        this.isDragging.set(false);
        const file = e.dataTransfer?.files[0];
        if (file) {
            this.loadFile(file);
        }
    }

    private loadFile(file: File): void {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            this.toast.warning('Desteklenmeyen Format', 'Lutfen JPEG, PNG veya WebP bir gorsel yukleyin.');
            return;
        }

        this.fileName.set(file.name);
        this.fileSize.set(this.formatBytes(file.size));

        this.prepareImageForUpload(file).then(prepared => {
            this.imageBase64 = prepared.base64;
            this.mimeType = prepared.mimeType;
            this.previewUrl.set(prepared.previewDataUrl);
            this.pageState.set('preview');
            this.result.set(null);
            this.commitResult.set(null);
        });
    }

    private async prepareImageForUpload(file: File): Promise<{ base64: string; mimeType: string; previewDataUrl: string }> {
        const maxDirectUploadBytes = 4 * 1024 * 1024;

        if (file.size <= maxDirectUploadBytes) {
            const dataUrl = await this.readFileAsDataUrl(file);
            return {
                base64: dataUrl.split(',')[1] ?? '',
                mimeType: file.type,
                previewDataUrl: dataUrl
            };
        }

        const compressedBase64 = await this.compressImage(file);
        return {
            base64: compressedBase64,
            mimeType: 'image/jpeg',
            previewDataUrl: `data:image/jpeg;base64,${compressedBase64}`
        };
    }

    private readFileAsDataUrl(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result ?? ''));
            reader.onerror = () => reject(new Error('File could not be read.'));
            reader.readAsDataURL(file);
        });
    }

    private compressImage(file: File, maxWidth = 2048, quality = 0.85): Promise<string> {
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = e => {
                const img = new Image();
                img.onload = () => {
                    let { width, height } = img;
                    if (width > maxWidth) {
                        height = Math.round(height * maxWidth / width);
                        width = maxWidth;
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL('image/jpeg', quality);
                    resolve(dataUrl.split(',')[1]);
                };
                img.src = e.target!.result as string;
            };
            reader.readAsDataURL(file);
        });
    }

    analyze(): void {
        if (!this.imageBase64) {
            return;
        }

        if (!this.isProviderSupported(this.provider())) {
            this.toast.warning(
                'Saglayici Hazir Degil',
                `${this.providerDisplayName(this.provider())} henuz backend tarafinda aktif degil.`
            );
            return;
        }

        this.pageState.set('analyzing');

        this.scannerService.analyze({
            imageBase64: this.imageBase64,
            mimeType: this.mimeType || 'image/jpeg',
            provider: this.provider()
        }).subscribe({
            next: res => {
                if (res.errorMessage) {
                    this.pageState.set('preview');
                    this.toast.warning(
                        this.resolveErrorTitle(res.errorMessage),
                        this.resolveErrorDetail(res.errorMessage)
                    );
                    return;
                }

                this.result.set(res);
                this.editableItems.set(res.items?.map(i => ({ ...i })) ?? []);
                this.commitResult.set(null);
                this.pageState.set('results');
                this.loadCommitTargets(res.vendorName ?? '');
            },
            error: err => {
                this.pageState.set('preview');
                const msg: string =
                    err.error?.detail ||
                    err.error?.errorMessages?.[0] ||
                    err.error?.errorMessage ||
                    err.message || '';
                this.toast.error(
                    this.resolveErrorTitle(msg),
                    this.resolveErrorDetail(msg)
                );
            }
        });
    }

    updateItem(index: number, field: keyof ScannedLineItem, value: string | number): void {
        const items = this.editableItems().map((item, i) => {
            if (i !== index) {
                return item;
            }

            const updated = { ...item, [field]: value };
            if (field === 'quantity' || field === 'unitPrice') {
                const quantity = Number(updated.quantity) || 0;
                const unitPrice = Number(updated.unitPrice) || 0;
                updated.totalPrice = +(quantity * unitPrice).toFixed(2);
            }

            return updated;
        });

        this.editableItems.set(items);
        this.commitResult.set(null);
    }

    addItem(): void {
        this.editableItems.update(items => [
            ...items,
            { description: '', quantity: 1, unit: 'adet', unitPrice: 0, totalPrice: 0 }
        ]);
        this.commitResult.set(null);
    }

    removeItem(index: number): void {
        this.editableItems.update(items => items.filter((_, i) => i !== index));
        this.commitResult.set(null);
    }

    commitScannedData(): void {
        if (!this.canCommit()) {
            this.toast.warning('Eksik Secim', 'Lutfen islem tipi ve hedef alan secimlerini tamamlayin.');
            return;
        }

        const payloadItems = this.editableItems()
            .map(item => {
                const description = (item.description ?? '').trim();
                const quantity = Number(item.quantity) > 0 ? Number(item.quantity) : 1;
                const unitPrice = Number(item.unitPrice) >= 0 ? Number(item.unitPrice) : 0;
                const totalPriceRaw = Number(item.totalPrice);
                const totalPrice = totalPriceRaw > 0 ? totalPriceRaw : +(quantity * unitPrice).toFixed(2);

                return {
                    description,
                    quantity,
                    unit: (item.unit ?? '').trim(),
                    unitPrice,
                    totalPrice
                };
            })
            .filter(item => item.description.length > 0);

        if (payloadItems.length === 0) {
            this.toast.warning('Kalem Bulunamadi', 'Kayit icin en az bir aciklamali kalem olmalidir.');
            return;
        }

        const operation = this.operation();
        const request: CommitScannedDocumentRequest = {
            operation,
            buyerCariAccountId: operation === 'buyerDebt' ? this.selectedBuyerId() : null,
            supplierCariAccountId: operation === 'supplierPurchaseOrder' ? this.selectedSupplierId() : null,
            warehouseId: operation !== 'buyerDebt' ? this.selectedWarehouseId() : null,
            documentDate: this.result()?.documentDate ?? null,
            documentNumber: this.result()?.documentNumber ?? null,
            createMissingProducts: this.createMissingProducts(),
            items: payloadItems
        };

        this.isCommitting.set(true);
        this.commitResult.set(null);

        this.scannerService.commit(request)
            .pipe(finalize(() => this.isCommitting.set(false)))
            .subscribe({
                next: response => {
                    this.commitResult.set(response);
                    this.toast.success('Kayit Tamamlandi', response.message);
                },
                error: err => {
                    const msg =
                        err.error?.detail ||
                        err.error?.errorMessage ||
                        err.error?.title ||
                        err.message ||
                        'Kayit islemi sirasinda bir hata olustu.';
                    this.toast.error('Kayit Basarisiz', msg);
                }
            });
    }

    private loadCommitTargets(vendorNameHint: string): void {
        this.isLoadingTargets.set(true);

        forkJoin({
            buyers: this.cariAccountService.getBuyers({ page: 1, pageSize: 200, sortBy: 'name', sortDir: 'asc' }),
            suppliers: this.cariAccountService.getSuppliers({ page: 1, pageSize: 200, sortBy: 'name', sortDir: 'asc' }),
            warehouses: this.warehouseService.getAll()
        })
            .pipe(finalize(() => this.isLoadingTargets.set(false)))
            .subscribe({
                next: ({ buyers, suppliers, warehouses }) => {
                    this.buyers.set(buyers ?? []);
                    this.suppliers.set(suppliers ?? []);
                    this.warehouses.set(warehouses ?? []);

                    if (!this.selectedBuyerId() && buyers.length > 0) {
                        this.selectedBuyerId.set(buyers[0].id);
                    }

                    const hintedSupplierId = this.findSupplierByNameHint(suppliers, vendorNameHint);
                    if (hintedSupplierId) {
                        this.selectedSupplierId.set(hintedSupplierId);
                    } else if (!this.selectedSupplierId() && suppliers.length > 0) {
                        this.selectedSupplierId.set(suppliers[0].id);
                    }

                    if (!this.selectedWarehouseId() && warehouses.length > 0) {
                        this.selectedWarehouseId.set(warehouses[0].id);
                    }
                },
                error: () => {
                    this.toast.warning('Liste Yuklenemedi', 'Hedef secim listeleri su an yuklenemedi. Tekrar deneyin.');
                }
            });
    }

    private findSupplierByNameHint(suppliers: CariAccount[], hint: string): string {
        const normalizedHint = (hint ?? '').trim().toLocaleLowerCase('tr-TR');
        if (!normalizedHint) {
            return '';
        }

        const exact = suppliers.find(x => (x.name ?? '').trim().toLocaleLowerCase('tr-TR') === normalizedHint);
        if (exact) {
            return exact.id;
        }

        const include = suppliers.find(x => (x.name ?? '').toLocaleLowerCase('tr-TR').includes(normalizedHint));
        return include?.id ?? '';
    }

    private resolveErrorTitle(msg: string): string {
        if (!msg) return 'Analiz basarisiz';
        const m = msg.toLowerCase();
        if (m.includes('provider is not configured') || m.includes('not configured on server'))
            return 'Saglayici Hazir Degil';
        if (m.includes('could not process image') || m.includes('image could not be processed'))
            return 'Gorsel Islenemedi';
        if (m.includes('quota') || m.includes('resource_exhausted') || m.includes('rate limit') || m.includes('too many'))
            return 'API Kota Limiti Asildi';
        if (m.includes('api anahtari') || m.includes('api key') || m.includes('invalid key') || m.includes('invalid x-api-key') || m.includes('unauthorized') || m.includes('authentication_error'))
            return 'Gecersiz API Anahtari';
        if (m.includes('timeout') || m.includes('zaman asimi'))
            return 'Baglanti Zaman Asimi';
        if (m.includes('json') || m.includes('parse'))
            return 'Yanit Okunamadi';
        return 'Analiz Basarisiz';
    }

    private resolveErrorDetail(msg: string): string {
        if (!msg) return 'Lutfen tekrar deneyin.';
        const m = msg.toLowerCase();
        if (m.includes('provider is not configured') || m.includes('not configured on server'))
            return 'Secili AI saglayicisi backend uzerinde etkin degil. Su an desteklenen bir saglayici secin.';
        if (m.includes('could not process image') || m.includes('image could not be processed'))
            return 'Gorsel netligini artirip tekrar deneyin. Mumkunse PNG veya yuksek kaliteli JPG kullanin.';
        if (m.includes('quota') || m.includes('resource_exhausted') || m.includes('rate limit') || m.includes('too many'))
            return 'Ucretsiz plan limitine ulasildi. Bir sure bekleyip tekrar deneyin.';
        if (m.includes('api anahtari') || m.includes('api key') || m.includes('invalid key') || m.includes('invalid x-api-key') || m.includes('unauthorized') || m.includes('authentication_error'))
            return 'Ayarlardan API anahtarini kontrol edin.';
        if (m.includes('timeout') || m.includes('zaman asimi'))
            return 'Sunucu yanit vermedi. Internet baglantinizi kontrol edin.';
        return 'Gorsel farkli bir formatta olabilir veya teknik bir sorun olustu.';
    }

    reset(): void {
        this.pageState.set('idle');
        this.previewUrl.set(null);
        this.result.set(null);
        this.editableItems.set([]);
        this.commitResult.set(null);
        this.imageBase64 = '';
        this.mimeType = '';
    }

    formatCurrency(value?: number): string {
        if (value == null) return '-';
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: this.result()?.currency ?? 'TRY'
        }).format(value);
    }

    private formatBytes(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    }

    private providerDisplayName(provider: ScanProvider): string {
        switch (provider) {
            case 'claude': return 'Claude AI';
            case 'azure': return 'Azure';
            case 'gemini': return 'Gemini';
            default: return 'AI';
        }
    }
}

import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupplierQuoteService } from '../../core/services/supplier-quote.service';
import { CariAccountService } from '../../core/services/cari-account.service';
import { ProductService } from '../../core/services/product.service';
import { WarehouseService } from '../../core/services/warehouse.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { CariAccount } from '../../core/models/cari-account.model';
import {
    CreateSupplierQuoteRequestRequest,
    SupplierQuoteOffer,
    SupplierQuoteRequestDetail,
    SupplierQuoteRequestListItem,
    UpsertSupplierQuoteOfferRequest
} from '../../core/models/supplier-quote.model';

type OfferDraft = {
    [offerId: string]: {
        status: number;
        leadTimeDays: number;
        notes: string;
        items: Array<{ productId: string; offeredQuantity: number; unitPrice: number; minimumOrderQuantity?: number | null }>;
    };
};

@Component({
    selector: 'app-supplier-quotes',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './supplier-quotes.component.html',
    styleUrls: ['./supplier-quotes.component.css', '../../shared/styles/crud-page.css']
})
export class SupplierQuotesComponent implements OnInit {
    private quoteService = inject(SupplierQuoteService);
    private cariService = inject(CariAccountService);
    private productService = inject(ProductService);
    private warehouseService = inject(WarehouseService);
    private toast = inject(ToastService);
    private confirm = inject(ConfirmService);

    items = signal<SupplierQuoteRequestListItem[]>([]);
    detail = signal<SupplierQuoteRequestDetail | null>(null);
    suppliers = signal<CariAccount[]>([]);
    warehouses = signal<{ id: string; name: string }[]>([]);
    products = signal<{ id: string; code: string; name: string; unit: string; defaultSalePrice: number }[]>([]);
    isLoading = signal(false);
    isLoadingDetail = signal(false);
    isSaving = signal(false);
    searchTerm = '';
    showCreateModal = signal(false);
    selectedId = signal<string | null>(null);
    offerDrafts = signal<OfferDraft>({});

    formData = {
        title: '',
        warehouseId: '',
        neededByDateUtc: '',
        notes: '',
        supplierCariAccountIds: [] as string[],
        items: [{ productId: '', quantity: 1, targetUnitPrice: 0, notes: '' }]
    };

    readonly filteredItems = computed(() => {
        const term = this.searchTerm.trim().toLocaleLowerCase('tr-TR');
        if (!term) return this.items();
        return this.items().filter(x =>
            [x.requestNo, x.title, x.warehouseName, x.createdByUserName]
                .some(v => (v ?? '').toLocaleLowerCase('tr-TR').includes(term))
        );
    });

    ngOnInit(): void {
        this.loadLookups();
        this.loadItems();
    }

    private loadLookups(): void {
        this.cariService.getSuppliers().subscribe(data => this.suppliers.set(data));
        this.warehouseService.getAll().subscribe(data => {
            const mapped = data.map(x => ({ id: x.id, name: x.name }));
            this.warehouses.set(mapped);
            if (!this.formData.warehouseId && mapped[0]) this.formData.warehouseId = mapped[0].id;
        });
        this.productService.getAll().subscribe(data => {
            this.products.set(data.map(x => ({
                id: x.id,
                code: x.code || '',
                name: x.name,
                unit: x.unit || 'EA',
                defaultSalePrice: x.defaultSalePrice
            })));
        });
    }

    loadItems(): void {
        this.isLoading.set(true);
        this.quoteService.getAll().subscribe({
            next: data => {
                this.items.set(data);
                this.isLoading.set(false);
            },
            error: () => {
                this.isLoading.set(false);
                this.toast.error('Hata', 'Tedarikci teklif talepleri yuklenemedi.');
            }
        });
    }

    openCreateModal(): void {
        this.formData = {
            title: '',
            warehouseId: this.warehouses()[0]?.id ?? '',
            neededByDateUtc: '',
            notes: '',
            supplierCariAccountIds: [],
            items: [{ productId: '', quantity: 1, targetUnitPrice: 0, notes: '' }]
        };
        this.showCreateModal.set(true);
    }

    closeCreateModal(): void {
        this.showCreateModal.set(false);
    }

    addItemRow(): void {
        this.formData.items.push({ productId: '', quantity: 1, targetUnitPrice: 0, notes: '' });
    }

    removeItemRow(index: number): void {
        if (this.formData.items.length === 1) return;
        this.formData.items.splice(index, 1);
    }

    saveRequest(): void {
        const request: CreateSupplierQuoteRequestRequest = {
            title: this.formData.title,
            warehouseId: this.formData.warehouseId,
            neededByDateUtc: this.formData.neededByDateUtc || null,
            notes: this.formData.notes || null,
            supplierCariAccountIds: this.formData.supplierCariAccountIds,
            items: this.formData.items
                .filter(x => x.productId && x.quantity > 0)
                .map(x => ({
                    productId: x.productId,
                    quantity: x.quantity,
                    targetUnitPrice: x.targetUnitPrice || null,
                    notes: x.notes || null
                }))
        };

        this.isSaving.set(true);
        this.quoteService.create(request).subscribe({
            next: id => {
                this.isSaving.set(false);
                this.closeCreateModal();
                this.loadItems();
                this.openDetail(id);
                this.toast.success('Kaydedildi', 'Teklif toplama talebi olusturuldu.');
            },
            error: err => {
                this.isSaving.set(false);
                this.toast.error('Hata', err.error?.detail || err.error || 'Talep olusturulamadi.');
            }
        });
    }

    openDetail(id: string): void {
        this.selectedId.set(id);
        this.isLoadingDetail.set(true);
        this.quoteService.getById(id).subscribe({
            next: data => {
                this.detail.set(data);
                this.offerDrafts.set(this.buildOfferDrafts(data.offers));
                this.isLoadingDetail.set(false);
            },
            error: () => {
                this.detail.set(null);
                this.isLoadingDetail.set(false);
                this.toast.error('Hata', 'Teklif detayi yuklenemedi.');
            }
        });
    }

    private buildOfferDrafts(offers: SupplierQuoteOffer[]): OfferDraft {
        return Object.fromEntries(offers.map(offer => [
            offer.id,
            {
                status: Number(offer.status),
                leadTimeDays: offer.leadTimeDays,
                notes: offer.notes || '',
                items: offer.items.map(item => ({
                    productId: item.productId,
                    offeredQuantity: item.offeredQuantity || 0,
                    unitPrice: item.unitPrice || 0,
                    minimumOrderQuantity: item.minimumOrderQuantity || null
                }))
            }
        ]));
    }

    getOfferDraft(offerId: string) {
        return this.offerDrafts()[offerId];
    }

    saveOffer(offer: SupplierQuoteOffer): void {
        const draft = this.getOfferDraft(offer.id);
        if (!draft) return;

        const request: UpsertSupplierQuoteOfferRequest = {
            status: draft.status,
            leadTimeDays: draft.leadTimeDays,
            notes: draft.notes,
            items: draft.items.map(x => ({
                productId: x.productId,
                offeredQuantity: x.offeredQuantity,
                unitPrice: x.unitPrice,
                minimumOrderQuantity: x.minimumOrderQuantity
            }))
        };

        this.quoteService.upsertOffer(this.detail()!.id, offer.id, request).subscribe({
            next: () => {
                this.toast.success('Kaydedildi', `${offer.supplierName} teklifi guncellendi.`);
                this.openDetail(this.detail()!.id);
            },
            error: err => this.toast.error('Hata', err.error?.detail || 'Teklif kaydedilemedi.')
        });
    }

    async selectOffer(offer: SupplierQuoteOffer): Promise<void> {
        const confirmed = await this.confirm.confirm({
            title: 'Teklif Sec',
            message: `${offer.supplierName} teklifini secili teklif yapmak istiyor musunuz?`,
            confirmText: 'Sec',
            type: 'primary'
        });
        if (!confirmed) return;

        this.quoteService.selectOffer(this.detail()!.id, offer.id).subscribe({
            next: () => {
                this.toast.success('Secildi', 'Teklif secildi.');
                this.openDetail(this.detail()!.id);
                this.loadItems();
            },
            error: err => this.toast.error('Hata', err.error?.detail || 'Teklif secilemedi.')
        });
    }

    async convertSelected(): Promise<void> {
        if (!this.detail()?.selectedOfferId) return;
        const confirmed = await this.confirm.confirm({
            title: 'Taslak Satin Alma Siparisi',
            message: 'Secili tekliften taslak satin alma siparisi olusturulsun mu?',
            confirmText: 'Olustur',
            type: 'warning'
        });
        if (!confirmed) return;

        this.quoteService.convertSelectedOffer(this.detail()!.id).subscribe({
            next: result => {
                this.toast.success('Olustu', `${result.orderNo} taslak siparisi olusturuldu.`);
                this.openDetail(this.detail()!.id);
                this.loadItems();
            },
            error: err => this.toast.error('Hata', err.error?.detail || 'Siparis olusturulamadi.')
        });
    }

    statusLabel(status: number | string): string {
        const key = Number(status);
        if (key === 1) return 'Taslak';
        if (key === 2) return 'Acik';
        if (key === 3) return 'Kapali';
        if (key === 4) return 'Siparise Donustu';
        if (key === 5) return 'Iptal';
        return String(status);
    }

    offerStatusLabel(status: number | string): string {
        const key = Number(status);
        if (key === 1) return 'Bekleniyor';
        if (key === 2) return 'Geldi';
        if (key === 3) return 'Reddedildi';
        return String(status);
    }
}

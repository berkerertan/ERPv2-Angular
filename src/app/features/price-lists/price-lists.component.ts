import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PriceListService } from '../../core/services/price-list.service';
import { PriceList, CreatePriceListRequest } from '../../core/models/price-list.model';
import { ProductService } from '../../core/services/product.service';
import { ConfirmService } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../core/services/toast.service';

@Component({
    selector: 'app-price-lists',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './price-lists.component.html',
    styleUrls: ['./price-lists.component.css', '../../shared/styles/crud-page.css']
})
export class PriceListsComponent implements OnInit {
    private priceListService = inject(PriceListService);
    private productService = inject(ProductService);
    private confirmService = inject(ConfirmService);
    private toastService = inject(ToastService);

    searchTerm = '';
    showCreateModal = signal(false);
    showDetailModal = signal(false);
    isSaving = signal(false);
    formError = signal('');

    priceLists = signal<PriceList[]>([]);
    selectedList = signal<PriceList | null>(null);
    products = signal<{ id: string; name: string; defaultSalePrice: number }[]>([]);

    formData = {
        name: '',
        description: '',
        isActive: true,
        startDate: '',
        endDate: '',
        discountRate: 0,
        items: [] as { productId: string; productName: string; originalPrice: number; customPrice: number }[]
    };

    ngOnInit(): void {
        this.loadPriceLists();
        this.loadProducts();
        const today = new Date();
        const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
        this.formData.startDate = today.toISOString().split('T')[0];
        this.formData.endDate = nextYear.toISOString().split('T')[0];
    }

    loadPriceLists(): void {
        this.priceListService.getAll().subscribe({
            next: (data) => this.priceLists.set(data),
            error: () => this.toastService.error('Hata', 'Fiyat listeleri yüklenemedi.')
        });
    }

    private loadProducts(): void {
        this.productService.getAll().subscribe({
            next: (data) => this.products.set(data.map(p => ({
                id: p.id, name: p.name, defaultSalePrice: p.defaultSalePrice || 0
            }))),
            error: () => {}
        });
    }

    get filteredLists() {
        const term = this.searchTerm.toLowerCase();
        return term
            ? this.priceLists().filter(pl => pl.name.toLowerCase().includes(term) || (pl.description || '').toLowerCase().includes(term))
            : this.priceLists();
    }

    openCreateModal(): void {
        const today = new Date();
        const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
        this.formData = {
            name: '', description: '', isActive: true,
            startDate: today.toISOString().split('T')[0],
            endDate: nextYear.toISOString().split('T')[0],
            discountRate: 0, items: []
        };
        this.formError.set('');
        this.showCreateModal.set(true);
    }

    closeCreateModal(): void { this.showCreateModal.set(false); }

    openDetailModal(pl: PriceList): void {
        this.selectedList.set(pl);
        this.showDetailModal.set(true);
    }

    closeDetailModal(): void { this.showDetailModal.set(false); }

    addProduct(productId: string): void {
        if (!productId) return;
        if (this.formData.items.some(i => i.productId === productId)) return;
        const product = this.products().find(p => p.id === productId);
        if (!product) return;
        const discount = this.formData.discountRate || 0;
        const customPrice = +(product.defaultSalePrice * (1 - discount / 100)).toFixed(2);
        this.formData.items.push({ productId: product.id, productName: product.name, originalPrice: product.defaultSalePrice, customPrice });
    }

    removeProduct(index: number): void { this.formData.items.splice(index, 1); }

    onDiscountRateChange(): void {
        const discount = this.formData.discountRate || 0;
        this.formData.items.forEach(item => {
            item.customPrice = +(item.originalPrice * (1 - discount / 100)).toFixed(2);
        });
    }

    get availableProducts() {
        const usedIds = new Set(this.formData.items.map(i => i.productId));
        return this.products().filter(p => !usedIds.has(p.id));
    }

    saveList(): void {
        if (!this.formData.name.trim()) { this.formError.set('Liste adı zorunludur.'); return; }
        if (!this.formData.startDate || !this.formData.endDate) { this.formError.set('Başlangıç ve bitiş tarihi zorunludur.'); return; }

        this.isSaving.set(true);
        this.formError.set('');

        const request: CreatePriceListRequest = {
            name: this.formData.name,
            description: this.formData.description || undefined,
            isActive: this.formData.isActive,
            startDate: this.formData.startDate,
            endDate: this.formData.endDate,
            discountRate: this.formData.discountRate,
            items: this.formData.items.map(i => ({ productId: i.productId, customPrice: i.customPrice }))
        };

        this.priceListService.create(request).subscribe({
            next: () => {
                this.isSaving.set(false);
                this.closeCreateModal();
                this.loadPriceLists();
                this.toastService.success('Oluşturuldu', 'Fiyat listesi başarıyla oluşturuldu.');
            },
            error: (err) => {
                this.isSaving.set(false);
                this.formError.set(err.error?.detail || 'Fiyat listesi oluşturulamadı.');
            }
        });
    }

    async toggleActive(pl: PriceList): Promise<void> {
        this.priceListService.update(pl.id, { isActive: !pl.isActive }).subscribe({
            next: () => { this.loadPriceLists(); this.toastService.success('Güncellendi', `Fiyat listesi ${!pl.isActive ? 'aktif' : 'pasif'} yapıldı.`); },
            error: (err) => this.toastService.error('Hata', err.error?.detail || 'Güncelleme başarısız.')
        });
    }

    async deleteList(id: string): Promise<void> {
        const confirmed = await this.confirmService.confirm({
            title: 'Silme Onayı', message: 'Bu fiyat listesini silmek istediğinize emin misiniz?',
            confirmText: 'Sil', type: 'danger'
        });
        if (!confirmed) return;
        this.priceListService.delete(id).subscribe({
            next: () => { this.loadPriceLists(); this.toastService.success('Silindi', 'Fiyat listesi silindi.'); },
            error: (err) => this.toastService.error('Hata', err.error?.detail || 'Silme başarısız.')
        });
    }
}

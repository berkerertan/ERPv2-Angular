import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceMovementService } from '../../core/services/finance-movement.service';
import { FinanceMovementType } from '../../core/models/finance-movement.model';

@Component({
    selector: 'app-finance-movements',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './finance-movements.component.html',
    styleUrls: ['./finance-movements.component.css', '../../shared/styles/crud-page.css']
})
export class FinanceMovementsComponent implements OnInit {
    private financeService = inject(FinanceMovementService);

    searchTerm = '';
    activeTab = signal<'all' | 'Income' | 'Expense'>('all');
    showModal = signal(false);
    formData = { type: 'Income', amount: 0, description: '', category: '' };

    items = signal<any[]>([]);

    ngOnInit(): void {
        this.loadItems();
    }

    loadItems(): void {
        this.financeService.getAll().subscribe({
            next: (data) => this.items.set(data.map(m => ({
                id: m.id,
                type: m.type === FinanceMovementType.Income ? 'Income' : 'Expense',
                amount: m.amount,
                description: m.description || '',
                category: m.referenceNo || '—',
                cariAccountName: m.cariAccountId.substring(0, 8) + '...',
                createdAt: m.movementDateUtc?.split('T')[0] || ''
            }))),
            error: (err) => console.error('Finans hareketleri yüklenemedi:', err.error?.detail || err.message)
        });
    }

    get filteredItems() {
        let list = this.items();
        if (this.activeTab() !== 'all') list = list.filter(i => i.type === this.activeTab());
        const t = this.searchTerm.toLowerCase();
        if (t) list = list.filter(i => i.description.toLowerCase().includes(t) || i.category.toLowerCase().includes(t));
        return list;
    }

    get totalIncome() { return this.items().filter(i => i.type === 'Income').reduce((s, i) => s + i.amount, 0); }
    get totalExpense() { return this.items().filter(i => i.type === 'Expense').reduce((s, i) => s + i.amount, 0); }
    get netBalance() { return this.totalIncome - this.totalExpense; }

    openAddModal(): void { this.formData = { type: 'Income', amount: 0, description: '', category: '' }; this.showModal.set(true); }
    closeModal(): void { this.showModal.set(false); }

    save(): void {
        // Note: API requires cariAccountId — for now this creates with a placeholder
        // Full implementation needs cariAccount selection in form
        alert('Finans hareketi oluşturmak için cari hesap seçimi gereklidir.');
    }

    deleteItem(id: string): void {
        if (!confirm('Bu hareketi silmek istediğinize emin misiniz?')) return;
        this.financeService.delete(id).subscribe({
            next: () => this.loadItems(),
            error: (err) => alert(err.error?.detail || 'Silme başarısız.')
        });
    }
}

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-finance-movements',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './finance-movements.component.html',
    styleUrls: ['./finance-movements.component.css', '../../shared/styles/crud-page.css']
})
export class FinanceMovementsComponent {
    searchTerm = '';
    activeTab = signal<'all' | 'Income' | 'Expense'>('all');
    showModal = signal(false);
    formData = { type: 'Income', amount: 0, description: '', category: '' };

    items = signal([
        { id: '1', type: 'Income', amount: 15000, description: 'Satış geliri - SIP-001', category: 'Satış', cariAccountName: 'Ahmet Yılmaz', createdAt: '2026-03-08' },
        { id: '2', type: 'Expense', amount: 45000, description: 'Tedarik ödemesi - SAT-001', category: 'Satın Alma', cariAccountName: 'Tedarik A.Ş.', createdAt: '2026-03-07' },
        { id: '3', type: 'Income', amount: 8200, description: 'POS satış geliri', category: 'Satış', cariAccountName: 'Peşin', createdAt: '2026-03-07' },
        { id: '4', type: 'Expense', amount: 3500, description: 'Kira ödemesi', category: 'Genel Gider', cariAccountName: '-', createdAt: '2026-03-06' },
        { id: '5', type: 'Income', amount: 22300, description: 'Toplu satış geliri', category: 'Satış', cariAccountName: 'Mehmet Kaya', createdAt: '2026-03-05' },
    ]);

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
        this.items.update(l => [...l, { id: Date.now().toString(), ...this.formData, cariAccountName: '-', createdAt: new Date().toISOString().split('T')[0] }]);
        this.closeModal();
    }
    deleteItem(id: string): void { this.items.update(l => l.filter(i => i.id !== id)); }
}

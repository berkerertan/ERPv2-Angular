import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-suppliers',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './suppliers.component.html',
    styleUrls: ['./suppliers.component.css', '../../../shared/styles/crud-page.css']
})
export class SuppliersComponent {
    searchTerm = '';
    statusFilter = signal<'all' | 'active' | 'inactive'>('all');
    showModal = signal(false);
    showDetailModal = signal(false);
    editingAccount = signal<any>(null);
    selectedAccount = signal<any>(null);

    formData = {
        name: '', phone: '', email: '', address: '',
        taxNumber: '', taxOffice: '', city: '', contactPerson: '', notes: ''
    };

    accounts = signal([
        { id: '1', name: 'Tedarik A.Ş.', phone: '0212 333 44 55', email: 'info@tedarik.com', address: 'Beyoğlu, İstanbul', taxNumber: '1234567890', taxOffice: 'Beyoğlu VD', city: 'İstanbul', contactPerson: 'Hasan Bey', balance: -12000, totalPurchase: 148000, totalPayments: 136000, remainingDebt: 12000, orderCount: 45, lastOrder: '2026-03-08', isActive: true, rating: 4.5 },
        { id: '2', name: 'Global Elektronik', phone: '0216 555 66 77', email: 'info@global.com', address: 'Ataşehir, İstanbul', taxNumber: '0987654321', taxOffice: 'Ataşehir VD', city: 'İstanbul', contactPerson: 'Ayşe Hanım', balance: -35000, totalPurchase: 520000, totalPayments: 485000, remainingDebt: 35000, orderCount: 127, lastOrder: '2026-03-08', isActive: true, rating: 4.8 },
        { id: '3', name: 'Anadolu Gıda Ltd.', phone: '0312 888 99 00', email: 'satis@anadolugida.com', address: 'Ostim, Ankara', taxNumber: '5566778899', taxOffice: 'Ostim VD', city: 'Ankara', contactPerson: 'Veli Bey', balance: -2500, totalPurchase: 32000, totalPayments: 29500, remainingDebt: 2500, orderCount: 18, lastOrder: '2026-03-06', isActive: true, rating: 3.8 },
        { id: '4', name: 'Ege Tekstil San.', phone: '0232 444 55 66', email: 'siparis@egetekstil.com', address: 'Bornova, İzmir', taxNumber: '1122334455', taxOffice: 'Bornova VD', city: 'İzmir', contactPerson: 'Emre Bey', balance: 0, totalPurchase: 15000, totalPayments: 15000, remainingDebt: 0, orderCount: 6, lastOrder: '2026-02-28', isActive: false, rating: 3.2 },
        { id: '5', name: 'Mega Ambalaj', phone: '0224 777 88 99', email: 'bilgi@megaambalaj.com', address: 'Gemlik, Bursa', taxNumber: '6677889900', taxOffice: 'Gemlik VD', city: 'Bursa', contactPerson: 'Merve Hanım', balance: -8200, totalPurchase: 89000, totalPayments: 80800, remainingDebt: 8200, orderCount: 34, lastOrder: '2026-03-07', isActive: true, rating: 4.2 },
    ]);

    get filteredAccounts() {
        let items = this.accounts();
        if (this.statusFilter() === 'active') items = items.filter(a => a.isActive);
        if (this.statusFilter() === 'inactive') items = items.filter(a => !a.isActive);
        const term = this.searchTerm.toLowerCase();
        if (term) items = items.filter(a =>
            a.name.toLowerCase().includes(term) ||
            a.phone.includes(term) ||
            a.email.toLowerCase().includes(term) ||
            a.contactPerson.toLowerCase().includes(term) ||
            a.city.toLowerCase().includes(term)
        );
        return items;
    }

    get totalBalance() { return this.accounts().reduce((s, a) => s + a.balance, 0); }
    get activeCount() { return this.accounts().filter(a => a.isActive).length; }
    get totalPurchaseSum() { return this.accounts().reduce((s, a) => s + a.totalPurchase, 0); }
    get totalPaymentsSum() { return this.accounts().reduce((s, a) => s + a.totalPayments, 0); }
    get totalDebtSum() { return this.accounts().reduce((s, a) => s + a.remainingDebt, 0); }

    getRatingStars(rating: number): string {
        return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
    }

    openAddModal(): void {
        this.editingAccount.set(null);
        this.formData = { name: '', phone: '', email: '', address: '', taxNumber: '', taxOffice: '', city: '', contactPerson: '', notes: '' };
        this.showModal.set(true);
    }

    openEditModal(account: any): void {
        this.editingAccount.set(account);
        this.formData = {
            name: account.name, phone: account.phone, email: account.email, address: account.address,
            taxNumber: account.taxNumber, taxOffice: account.taxOffice, city: account.city,
            contactPerson: account.contactPerson, notes: ''
        };
        this.showModal.set(true);
    }

    closeModal(): void { this.showModal.set(false); }

    save(): void {
        if (this.editingAccount()) {
            this.accounts.update(items => items.map(a => a.id === this.editingAccount().id ? { ...a, ...this.formData } : a));
        } else {
            this.accounts.update(items => [...items, {
                id: Date.now().toString(), ...this.formData,
                balance: 0, totalPurchase: 0, totalPayments: 0, remainingDebt: 0, orderCount: 0, lastOrder: '-', isActive: true, rating: 0
            }]);
        }
        this.closeModal();
    }

    viewDetail(account: any): void {
        this.selectedAccount.set(account);
        this.showDetailModal.set(true);
    }

    closeDetailModal(): void { this.showDetailModal.set(false); }

    toggleStatus(id: string): void {
        this.accounts.update(items => items.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
    }

    deleteAccount(id: string): void {
        this.accounts.update(items => items.filter(a => a.id !== id));
    }
}

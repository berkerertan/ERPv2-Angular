import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
    selector: 'app-buyers',
    standalone: true,
    imports: [CommonModule, FormsModule],

    templateUrl: './buyers.component.html',
    styleUrls: ['./buyers.component.css', '../../../shared/styles/crud-page.css']
})
export class BuyersComponent {
    searchTerm = '';
    statusFilter = signal<'all' | 'active' | 'inactive'>('all');
    showModal = signal(false);
    editingAccount = signal<any>(null);

    constructor(private router: Router) { }

    formData = {
        name: '', phone: '', email: '', address: '',
        taxNumber: '', city: '', notes: ''
    };

    accounts = signal([
        { id: '1', name: 'Ahmet Yılmaz', phone: '0532 111 22 33', email: 'ahmet@mail.com', address: 'Kadıköy, İstanbul', taxNumber: '12345678901', city: 'İstanbul', balance: 5200, totalSales: 24500, totalPayments: 19300, remainingDebt: 5200, orderCount: 12, lastOrder: '2026-03-08', isActive: true },
        { id: '2', name: 'Mehmet Kaya', phone: '0543 222 33 44', email: 'mehmet@mail.com', address: 'Çankaya, Ankara', taxNumber: '98765432109', city: 'Ankara', balance: 1800, totalSales: 8900, totalPayments: 7100, remainingDebt: 1800, orderCount: 5, lastOrder: '2026-03-07', isActive: true },
        { id: '3', name: 'Fatma Çelik', phone: '0555 444 55 66', email: 'fatma@mail.com', address: 'Bornova, İzmir', taxNumber: '11223344556', city: 'İzmir', balance: 0, totalSales: 3200, totalPayments: 3200, remainingDebt: 0, orderCount: 2, lastOrder: '2026-03-05', isActive: false },
        { id: '4', name: 'Ali Öztürk', phone: '0532 777 88 99', email: 'ali@mail.com', address: 'Nilüfer, Bursa', taxNumber: '55667788990', city: 'Bursa', balance: 12400, totalSales: 67000, totalPayments: 54600, remainingDebt: 12400, orderCount: 28, lastOrder: '2026-03-08', isActive: true },
        { id: '5', name: 'Zeynep Arslan', phone: '0544 333 22 11', email: 'zeynep@mail.com', address: 'Seyhan, Adana', taxNumber: '99887766554', city: 'Adana', balance: 3600, totalSales: 15200, totalPayments: 11600, remainingDebt: 3600, orderCount: 8, lastOrder: '2026-03-06', isActive: true },
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
            a.city.toLowerCase().includes(term)
        );
        return items;
    }

    get totalBalance() { return this.accounts().reduce((s, a) => s + a.balance, 0); }
    get activeCount() { return this.accounts().filter(a => a.isActive).length; }
    get totalSalesSum() { return this.accounts().reduce((s, a) => s + a.totalSales, 0); }
    get totalPaymentsSum() { return this.accounts().reduce((s, a) => s + a.totalPayments, 0); }
    get totalDebtSum() { return this.accounts().reduce((s, a) => s + a.remainingDebt, 0); }

    openAddModal(): void {
        this.editingAccount.set(null);
        this.formData = { name: '', phone: '', email: '', address: '', taxNumber: '', city: '', notes: '' };
        this.showModal.set(true);
    }

    openEditModal(account: any): void {
        this.editingAccount.set(account);
        this.formData = { name: account.name, phone: account.phone, email: account.email, address: account.address, taxNumber: account.taxNumber, city: account.city, notes: '' };
        this.showModal.set(true);
    }

    closeModal(): void { this.showModal.set(false); }

    save(): void {
        if (this.editingAccount()) {
            this.accounts.update(items => items.map(a => a.id === this.editingAccount().id ? { ...a, ...this.formData } : a));
        } else {
            this.accounts.update(items => [...items, {
                id: Date.now().toString(), ...this.formData,
                balance: 0, totalSales: 0, totalPayments: 0, remainingDebt: 0, orderCount: 0, lastOrder: '-', isActive: true
            }]);
        }
        this.closeModal();
    }

    viewDetail(account: any): void {
        this.router.navigate(['/cari-accounts/buyers', account.id]);
    }

    toggleStatus(id: string): void {
        this.accounts.update(items => items.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
    }

    deleteAccount(id: string): void {
        this.accounts.update(items => items.filter(a => a.id !== id));
    }
}

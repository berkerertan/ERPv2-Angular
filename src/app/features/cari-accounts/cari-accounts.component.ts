import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-cari-accounts',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './cari-accounts.component.html',
    styleUrls: ['./cari-accounts.component.css', '../../shared/styles/crud-page.css']
})
export class CariAccountsComponent {
    searchTerm = '';
    activeTab = signal<'all' | 'suppliers' | 'buyers'>('all');
    showModal = signal(false);
    editingAccount = signal<any>(null);
    formData = { name: '', type: 'Buyer', phone: '', email: '', address: '', taxNumber: '' };

    accounts = signal([
        { id: '1', name: 'Ahmet Yılmaz', type: 'Buyer', phone: '0532 111 22 33', email: 'ahmet@mail.com', balance: 5200, isActive: true },
        { id: '2', name: 'Tedarik A.Ş.', type: 'Supplier', phone: '0212 333 44 55', email: 'info@tedarik.com', balance: -12000, isActive: true },
        { id: '3', name: 'Mehmet Kaya', type: 'Buyer', phone: '0543 222 33 44', email: 'mehmet@mail.com', balance: 1800, isActive: true },
        { id: '4', name: 'Global Elektronik', type: 'Supplier', phone: '0216 555 66 77', email: 'info@global.com', balance: -35000, isActive: true },
        { id: '5', name: 'Fatma Çelik', type: 'Buyer', phone: '0555 444 55 66', email: 'fatma@mail.com', balance: 0, isActive: false },
    ]);

    get filteredAccounts() {
        let items = this.accounts();
        if (this.activeTab() === 'suppliers') items = items.filter(a => a.type === 'Supplier');
        if (this.activeTab() === 'buyers') items = items.filter(a => a.type === 'Buyer');
        const term = this.searchTerm.toLowerCase();
        if (term) items = items.filter(a => a.name.toLowerCase().includes(term) || a.phone.includes(term));
        return items;
    }

    openAddModal(): void {
        this.editingAccount.set(null);
        this.formData = { name: '', type: 'Buyer', phone: '', email: '', address: '', taxNumber: '' };
        this.showModal.set(true);
    }

    openEditModal(account: any): void {
        this.editingAccount.set(account);
        this.formData = { ...account };
        this.showModal.set(true);
    }

    closeModal(): void { this.showModal.set(false); }

    save(): void {
        if (this.editingAccount()) {
            this.accounts.update(items => items.map(a => a.id === this.editingAccount().id ? { ...a, ...this.formData } : a));
        } else {
            this.accounts.update(items => [...items, { id: Date.now().toString(), ...this.formData, balance: 0, isActive: true }]);
        }
        this.closeModal();
    }

    deleteAccount(id: string): void {
        this.accounts.update(items => items.filter(a => a.id !== id));
    }
}

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-companies',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './companies.component.html',
    styleUrls: ['./companies.component.css', '../../shared/styles/crud-page.css']
})
export class CompaniesComponent {
    searchTerm = '';
    showModal = signal(false);
    editingItem = signal<any>(null);
    formData = { name: '', taxNumber: '', address: '', phone: '', email: '' };

    items = signal([
        { id: '1', name: 'ABC Teknoloji A.Ş.', taxNumber: '1234567890', address: 'İstanbul', phone: '0212 111 22 33', email: 'info@abc.com', isActive: true },
        { id: '2', name: 'XYZ Ticaret Ltd.', taxNumber: '0987654321', address: 'Ankara', phone: '0312 444 55 66', email: 'info@xyz.com', isActive: true },
    ]);

    get filteredItems() {
        const term = this.searchTerm.toLowerCase();
        if (!term) return this.items();
        return this.items().filter(i => i.name.toLowerCase().includes(term));
    }

    openAddModal(): void { this.editingItem.set(null); this.formData = { name: '', taxNumber: '', address: '', phone: '', email: '' }; this.showModal.set(true); }
    openEditModal(item: any): void { this.editingItem.set(item); this.formData = { ...item }; this.showModal.set(true); }
    closeModal(): void { this.showModal.set(false); }
    save(): void {
        if (this.editingItem()) { this.items.update(list => list.map(i => i.id === this.editingItem().id ? { ...i, ...this.formData } : i)); }
        else { this.items.update(list => [...list, { id: Date.now().toString(), ...this.formData, isActive: true }]); }
        this.closeModal();
    }
    deleteItem(id: string): void { this.items.update(list => list.filter(i => i.id !== id)); }
}

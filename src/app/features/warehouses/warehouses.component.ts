import { Component, signal } from '@angular/core'; import { CommonModule } from '@angular/common'; import { FormsModule } from '@angular/forms';
@Component({ selector: 'app-warehouses', standalone: true, imports: [CommonModule, FormsModule], templateUrl: './warehouses.component.html', styleUrls: ['./warehouses.component.css', '../../shared/styles/crud-page.css'] })
export class WarehousesComponent {
    searchTerm = ''; showModal = signal(false); editingItem = signal<any>(null);
    formData = { name: '', address: '' };
    items = signal([
        { id: '1', name: 'Ana Depo', branchName: 'İstanbul Merkez Şube', address: 'İstanbul, Tuzla', isActive: true },
        { id: '2', name: 'Şube Depo', branchName: 'Ankara Şube', address: 'Ankara, OSTİM', isActive: true },
        { id: '3', name: 'İade Depo', branchName: 'İstanbul Merkez Şube', address: 'İstanbul, Tuzla', isActive: false },
    ]);
    get filteredItems() { const t = this.searchTerm.toLowerCase(); return !t ? this.items() : this.items().filter(i => i.name.toLowerCase().includes(t)); }
    openAddModal(): void { this.editingItem.set(null); this.formData = { name: '', address: '' }; this.showModal.set(true); }
    openEditModal(item: any): void { this.editingItem.set(item); this.formData = { ...item }; this.showModal.set(true); }
    closeModal(): void { this.showModal.set(false); }
    save(): void { if (this.editingItem()) { this.items.update(l => l.map(i => i.id === this.editingItem().id ? { ...i, ...this.formData } : i)); } else { this.items.update(l => [...l, { id: Date.now().toString(), ...this.formData, branchName: 'Şube', isActive: true }]); } this.closeModal(); }
    deleteItem(id: string): void { this.items.update(l => l.filter(i => i.id !== id)); }
}

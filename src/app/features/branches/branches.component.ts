import { Component, signal } from '@angular/core'; import { CommonModule } from '@angular/common'; import { FormsModule } from '@angular/forms';
@Component({ selector: 'app-branches', standalone: true, imports: [CommonModule, FormsModule], templateUrl: './branches.component.html', styleUrls: ['./branches.component.css', '../../shared/styles/crud-page.css'] })
export class BranchesComponent {
    searchTerm = ''; showModal = signal(false); editingItem = signal<any>(null);
    formData = { name: '', companyId: '', address: '', phone: '' };
    items = signal([
        { id: '1', name: 'İstanbul Merkez Şube', companyName: 'ABC Teknoloji A.Ş.', address: 'Levent, İstanbul', phone: '0212 111 22 33', isActive: true },
        { id: '2', name: 'Ankara Şube', companyName: 'ABC Teknoloji A.Ş.', address: 'Kızılay, Ankara', phone: '0312 444 55 66', isActive: true },
        { id: '3', name: 'İzmir Şube', companyName: 'XYZ Ticaret Ltd.', address: 'Alsancak, İzmir', phone: '0232 777 88 99', isActive: false },
    ]);
    get filteredItems() { const t = this.searchTerm.toLowerCase(); return !t ? this.items() : this.items().filter(i => i.name.toLowerCase().includes(t)); }
    openAddModal(): void { this.editingItem.set(null); this.formData = { name: '', companyId: '', address: '', phone: '' }; this.showModal.set(true); }
    openEditModal(item: any): void { this.editingItem.set(item); this.formData = { ...item }; this.showModal.set(true); }
    closeModal(): void { this.showModal.set(false); }
    save(): void { if (this.editingItem()) { this.items.update(l => l.map(i => i.id === this.editingItem().id ? { ...i, ...this.formData } : i)); } else { this.items.update(l => [...l, { id: Date.now().toString(), ...this.formData, companyName: 'Şirket', isActive: true }]); } this.closeModal(); }
    deleteItem(id: string): void { this.items.update(l => l.filter(i => i.id !== id)); }
}

import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CollectionPlanService } from '../../core/services/collection-plan.service';
import { CollectionPlanDashboard, CollectionPlanItem, UpsertCollectionPlanRequest } from '../../core/models/collection-plan.model';
import { ToastService } from '../../core/services/toast.service';

@Component({
    selector: 'app-collection-plans',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './collection-plans.component.html',
    styleUrls: ['./collection-plans.component.css', '../../shared/styles/crud-page.css']
})
export class CollectionPlansComponent implements OnInit {
    private service = inject(CollectionPlanService);
    private toast = inject(ToastService);

    dashboard = signal<CollectionPlanDashboard | null>(null);
    isLoading = signal(false);
    searchTerm = '';
    onlyAssignedToMe = false;
    statusFilter = 0;
    priorityFilter = 0;
    showPlanModal = signal(false);
    selected = signal<CollectionPlanItem | null>(null);
    isSaving = signal(false);

    formData = {
        title: '',
        priority: 2,
        status: 1,
        nextActionDateUtc: '',
        promiseDateUtc: '',
        assignedToUserName: '',
        notes: '',
        lastContactNote: ''
    };

    readonly filteredItems = computed(() => {
        const term = this.searchTerm.trim().toLocaleLowerCase('tr-TR');
        const data = this.dashboard()?.items ?? [];
        if (!term) return data;
        return data.filter(x =>
            [x.cariCode, x.cariName, x.title, x.assignedToUserName, x.notes]
                .some(v => (v ?? '').toLocaleLowerCase('tr-TR').includes(term))
        );
    });

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.isLoading.set(true);
        this.service.getDashboard({
            status: this.statusFilter || undefined,
            priority: this.priorityFilter || undefined,
            onlyAssignedToMe: this.onlyAssignedToMe
        }).subscribe({
            next: data => {
                this.dashboard.set(data);
                this.isLoading.set(false);
            },
            error: () => {
                this.isLoading.set(false);
                this.toast.error('Hata', 'Tahsilat planlama verileri yuklenemedi.');
            }
        });
    }

    openPlan(item: CollectionPlanItem): void {
        this.selected.set(item);
        this.formData = {
            title: item.title,
            priority: item.priority,
            status: item.status,
            nextActionDateUtc: item.nextActionDateUtc ? item.nextActionDateUtc.slice(0, 10) : '',
            promiseDateUtc: item.promiseDateUtc ? item.promiseDateUtc.slice(0, 10) : '',
            assignedToUserName: item.assignedToUserName || '',
            notes: item.notes || '',
            lastContactNote: item.lastContactNote || ''
        };
        this.showPlanModal.set(true);
    }

    closePlanModal(): void {
        this.showPlanModal.set(false);
        this.selected.set(null);
    }

    savePlan(): void {
        const item = this.selected();
        if (!item) return;

        const request: UpsertCollectionPlanRequest = {
            cariAccountId: item.cariAccountId,
            title: this.formData.title,
            priority: this.formData.priority,
            status: this.formData.status,
            nextActionDateUtc: this.formData.nextActionDateUtc || null,
            promiseDateUtc: this.formData.promiseDateUtc || null,
            assignedToUserName: this.formData.assignedToUserName || null,
            notes: this.formData.notes || null,
            lastContactNote: this.formData.lastContactNote || null
        };

        this.isSaving.set(true);
        this.service.upsert(request).subscribe({
            next: () => {
                this.isSaving.set(false);
                this.closePlanModal();
                this.load();
                this.toast.success('Kaydedildi', 'Tahsilat planı güncellendi.');
            },
            error: err => {
                this.isSaving.set(false);
                this.toast.error('Hata', err.error?.detail || 'Tahsilat planı kaydedilemedi.');
            }
        });
    }

    markStatus(item: CollectionPlanItem, status: number): void {
        if (!item.planEntryId) {
            this.openPlan({ ...item, status });
            return;
        }

        this.service.updateStatus(item.planEntryId, {
            status,
            promiseDateUtc: item.promiseDateUtc || null,
            notes: item.notes || null,
            lastContactNote: item.lastContactNote || null
        }).subscribe({
            next: () => {
                this.toast.success('Guncellendi', 'Tahsilat durumu guncellendi.');
                this.load();
            },
            error: err => this.toast.error('Hata', err.error?.detail || 'Durum guncellenemedi.')
        });
    }

    priorityLabel(value: number): string {
        if (value === 4) return 'Kritik';
        if (value === 3) return 'Yuksek';
        if (value === 2) return 'Orta';
        return 'Dusuk';
    }

    statusLabel(value: number): string {
        if (value === 2) return 'Gorusuldu';
        if (value === 3) return 'Odeme sozu';
        if (value === 4) return 'Tahsil edildi';
        if (value === 5) return 'Eskale';
        if (value === 6) return 'Iptal';
        return 'Acik';
    }
}

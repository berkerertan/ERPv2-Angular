import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnnouncementService } from '../../../core/services/announcement.service';
import { AnnouncementDto, UpsertAnnouncementRequest } from '../../../core/models/announcement.model';
import { ConfirmService } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './announcements.component.html',
  styleUrl: './announcements.component.css'
})
export class AnnouncementsComponent implements OnInit {
  private announcementService = inject(AnnouncementService);
  private confirmService = inject(ConfirmService);
  private toastService = inject(ToastService);

  isLoading = signal<boolean>(false);
  announcements = signal<AnnouncementDto[]>([]);

  showModal = signal<boolean>(false);
  editingItem = signal<AnnouncementDto | null>(null);

  formTitle = signal<string>('');
  formContent = signal<string>('');
  formPriority = signal<number>(5);
  formIsPublished = signal<boolean>(false);
  formStartsAt = signal<string>('');
  formEndsAt = signal<string>('');

  get totalPublished(): number {
    return this.announcements().filter(a => a.isPublished).length;
  }

  get totalScheduled(): number {
    return this.announcements().filter(a => !a.isPublished && a.startsAtUtc).length;
  }

  get totalDraft(): number {
    return this.announcements().filter(a => !a.isPublished && !a.startsAtUtc).length;
  }

  ngOnInit(): void {
    this.loadAnnouncements();
  }

  loadAnnouncements(): void {
    this.isLoading.set(true);
    this.announcementService.adminGetAll().subscribe({
      next: (data) => {
        this.announcements.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  openModal(item?: AnnouncementDto): void {
    if (item) {
      this.editingItem.set(item);
      this.formTitle.set(item.title || '');
      this.formContent.set(item.content || '');
      this.formPriority.set(item.priority);
      this.formIsPublished.set(item.isPublished);
      this.formStartsAt.set(item.startsAtUtc ? item.startsAtUtc.slice(0, 16) : '');
      this.formEndsAt.set(item.endsAtUtc ? item.endsAtUtc.slice(0, 16) : '');
    } else {
      this.editingItem.set(null);
      this.resetForm();
    }
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.resetForm();
  }

  resetForm(): void {
    this.formTitle.set('');
    this.formContent.set('');
    this.formPriority.set(5);
    this.formIsPublished.set(false);
    this.formStartsAt.set('');
    this.formEndsAt.set('');
  }

  saveAnnouncement(): void {
    if (!this.formTitle().trim() || !this.formContent().trim()) return;

    const req: UpsertAnnouncementRequest = {
      title: this.formTitle(),
      content: this.formContent(),
      priority: this.formPriority(),
      isPublished: this.formIsPublished(),
      startsAtUtc: this.formStartsAt() || undefined,
      endsAtUtc: this.formEndsAt() || undefined
    };

    if (this.editingItem()) {
      this.announcementService.adminUpdate(this.editingItem()!.id, req).subscribe({
        next: () => { this.loadAnnouncements(); this.closeModal(); },
        error: (err) => this.toastService.error('Hata', err.error?.detail || 'Güncelleme başarısız.')
      });
    } else {
      this.announcementService.adminCreate(req).subscribe({
        next: () => { this.loadAnnouncements(); this.closeModal(); },
        error: (err) => this.toastService.error('Hata', err.error?.detail || 'Kayıt başarısız.')
      });
    }
  }

  async deleteAnnouncement(id: string): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Silme Onayı',
      message: 'Bu duyuruyu silmek istediğinize emin misiniz?',
      confirmText: 'Sil',
      type: 'danger'
    });
    if (!confirmed) return;
    this.announcementService.adminDelete(id).subscribe({
      next: () => { this.loadAnnouncements(); this.toastService.success('Silindi', 'Duyuru silindi'); },
      error: (err) => this.toastService.error('Hata', err.error?.detail || 'Silme başarısız.')
    });
  }

  publishNow(item: AnnouncementDto): void {
    this.announcementService.adminPublish(item.id).subscribe({
      next: () => this.loadAnnouncements(),
      error: (err) => this.toastService.error('Hata', err.error?.detail || 'Yayınlama başarısız.')
    });
  }

  unpublish(item: AnnouncementDto): void {
    this.announcementService.adminUnpublish(item.id).subscribe({
      next: () => this.loadAnnouncements(),
      error: (err) => this.toastService.error('Hata', err.error?.detail || 'Yayından kaldırma başarısız.')
    });
  }

  getStatus(item: AnnouncementDto): string {
    if (item.isPublished) return 'published';
    if (item.startsAtUtc) return 'scheduled';
    return 'draft';
  }

  getStatusClass(item: AnnouncementDto): string {
    const status = this.getStatus(item);
    const map: Record<string, string> = { published: 'badge-success', scheduled: 'badge-warning', draft: 'badge-secondary' };
    return map[status] || 'badge-info';
  }

  getStatusLabel(item: AnnouncementDto): string {
    const status = this.getStatus(item);
    const map: Record<string, string> = { published: 'Yayında', scheduled: 'Zamanlanmış', draft: 'Taslak' };
    return map[status] || status;
  }

  getPriorityLabel(priority: number): string {
    if (priority >= 15) return 'Kritik';
    if (priority >= 10) return 'Yüksek';
    if (priority >= 5) return 'Normal';
    return 'Düşük';
  }

  getPriorityClass(priority: number): string {
    if (priority >= 15) return 'type-error';
    if (priority >= 10) return 'type-warning';
    if (priority >= 5) return 'type-success';
    return 'type-info';
  }

  getPriorityIcon(priority: number): string {
    if (priority >= 15) return 'error';
    if (priority >= 10) return 'warning';
    if (priority >= 5) return 'check_circle';
    return 'info';
  }
}

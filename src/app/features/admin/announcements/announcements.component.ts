import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnnouncementService } from '../../../core/services/announcement.service';
import { AnnouncementDto, UpsertAnnouncementRequest } from '../../../core/models/announcement.model';

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './announcements.component.html',
  styleUrl: './announcements.component.css'
})
export class AnnouncementsComponent implements OnInit {
  private announcementService = inject(AnnouncementService);

  isLoading = signal<boolean>(false);
  announcements = signal<AnnouncementDto[]>([]);

  showModal = signal<boolean>(false);
  editingItem = signal<AnnouncementDto | null>(null);

  formTitle = signal<string>('');
  formContent = signal<string>('');
  formPriority = signal<number>(0);
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
    this.formPriority.set(0);
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
        error: () => {}
      });
    } else {
      this.announcementService.adminCreate(req).subscribe({
        next: () => { this.loadAnnouncements(); this.closeModal(); },
        error: () => {}
      });
    }
  }

  deleteAnnouncement(id: string): void {
    if (!confirm('Bu duyuruyu silmek istediğinize emin misiniz?')) return;
    this.announcementService.adminDelete(id).subscribe({
      next: () => this.loadAnnouncements(),
      error: () => {}
    });
  }

  publishNow(item: AnnouncementDto): void {
    this.announcementService.adminPublish(item.id).subscribe({
      next: () => this.loadAnnouncements(),
      error: () => {}
    });
  }

  unpublish(item: AnnouncementDto): void {
    this.announcementService.adminUnpublish(item.id).subscribe({
      next: () => this.loadAnnouncements(),
      error: () => {}
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
    const map: Record<number, string> = { 0: 'Düşük', 1: 'Normal', 2: 'Yüksek', 3: 'Kritik' };
    return map[priority] || 'Normal';
  }

  getPriorityClass(priority: number): string {
    const map: Record<number, string> = { 0: 'type-info', 1: 'type-success', 2: 'type-warning', 3: 'type-error' };
    return map[priority] || '';
  }

  getPriorityIcon(priority: number): string {
    const map: Record<number, string> = { 0: 'info', 1: 'check_circle', 2: 'warning', 3: 'error' };
    return map[priority] || 'info';
  }
}

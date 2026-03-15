import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlatformAdminService } from '../../../core/services/platform-admin.service';
import { LandingContentService } from '../../../core/services/landing-content.service';
import { LandingPageContentDto, UpdateLandingPageContentRequest } from '../../../core/models/platform-admin.model';
import {
  LandingContent,
  HeroContent,
  FeatureItem,
  TestimonialItem,
  StatItem,
  CtaContent,
} from '../../../core/models/landing-content.model';

type TabType = 'hero' | 'stats' | 'features' | 'testimonials' | 'cta';

@Component({
  selector: 'app-landing-content',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './landing-content.component.html',
  styleUrl: './landing-content.component.css',
})
export class LandingContentComponent implements OnInit {
  private platformAdminService = inject(PlatformAdminService);

  // ── Content state ────────────────────────────────────────────────────────────
  content = signal<LandingContent | null>(null);
  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);
  savedToast = signal<string | null>(null);

  // Backend content items for update operations
  private apiContentItems: LandingPageContentDto[] = [];

  // ── Tab ──────────────────────────────────────────────────────────────────────
  activeTab = signal<TabType>('hero');

  // ── Hero editing ─────────────────────────────────────────────────────────────
  editingHero = signal<HeroContent>({
    badge: '',
    title: '',
    titleAccent: '',
    description: '',
    primaryCtaText: '',
    secondaryCtaText: '',
  });

  // ── Stats editing ─────────────────────────────────────────────────────────────
  editingStats = signal<StatItem[]>([]);

  // ── Feature modal ─────────────────────────────────────────────────────────────
  showFeatureModal = signal<boolean>(false);
  editingFeature = signal<FeatureItem | null>(null);
  /** Local copy for the feature form fields */
  featureForm = signal<Partial<FeatureItem>>({});

  // ── Testimonial modal ─────────────────────────────────────────────────────────
  showTestimonialModal = signal<boolean>(false);
  editingTestimonial = signal<TestimonialItem | null>(null);
  /** Local copy for the testimonial form fields */
  testimonialForm = signal<Partial<TestimonialItem>>({});

  // ── CTA editing ───────────────────────────────────────────────────────────────
  editingCta = signal<CtaContent>({
    title: '',
    description: '',
    primaryCtaText: '',
    secondaryCtaText: '',
  });

  // Keep LandingContentService as fallback for rich mock data
  constructor(private landingContentService: LandingContentService) {}

  ngOnInit(): void {
    // Try loading from API first
    this.platformAdminService.getLandingContent().subscribe({
      next: (items) => {
        this.apiContentItems = items;
        // If API has content, try parsing; otherwise fall back to mock
        if (items.length > 0) {
          this.loadFromApiContent(items);
        } else {
          this.loadFromMock();
        }
      },
      error: () => {
        // API failed, use mock data
        this.loadFromMock();
      },
    });
  }

  private loadFromApiContent(items: LandingPageContentDto[]): void {
    // The API stores key-value pairs; try to parse content as JSON for each section
    const contentMap = new Map(items.map(i => [i.key, i]));

    // Use mock service as base, then overlay any API content
    this.landingContentService.getContent().subscribe({
      next: (data) => {
        // Overlay API title/content onto default data where available
        const heroItem = contentMap.get('hero');
        if (heroItem?.content) {
          try { Object.assign(data.hero, JSON.parse(heroItem.content)); } catch {}
        }
        const ctaItem = contentMap.get('cta');
        if (ctaItem?.content) {
          try { Object.assign(data.cta, JSON.parse(ctaItem.content)); } catch {}
        }

        this.content.set(data);
        this.editingHero.set({ ...data.hero });
        this.editingStats.set(data.stats.map((s) => ({ ...s })));
        this.editingCta.set({ ...data.cta });
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  private loadFromMock(): void {
    this.landingContentService.getContent().subscribe({
      next: (data) => {
        this.content.set(data);
        this.editingHero.set({ ...data.hero });
        this.editingStats.set(data.stats.map((s) => ({ ...s })));
        this.editingCta.set({ ...data.cta });
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Landing content yüklenirken hata:', err);
        this.isLoading.set(false);
      },
    });
  }

  // ── Tab helpers ───────────────────────────────────────────────────────────────

  setTab(tab: TabType): void {
    this.activeTab.set(tab);
    // Refresh editing copies from current content when switching tabs
    const c = this.content();
    if (!c) return;
    if (tab === 'hero') this.editingHero.set({ ...c.hero });
    if (tab === 'stats') this.editingStats.set(c.stats.map((s) => ({ ...s })));
    if (tab === 'cta') this.editingCta.set({ ...c.cta });
  }

  // ── Hero ──────────────────────────────────────────────────────────────────────

  updateHeroField(field: keyof HeroContent, value: string): void {
    this.editingHero.update((h) => ({ ...h, [field]: value }));
  }

  saveHero(): void {
    this.isSaving.set(true);
    // Save to mock service for local state
    this.landingContentService.updateHero(this.editingHero()).subscribe();
    // Also persist to API
    this.platformAdminService.updateLandingContent('hero', {
      title: this.editingHero().title,
      content: JSON.stringify(this.editingHero()),
      isPublished: true,
      sortOrder: 1,
    }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.showToast('Hero içeriği kaydedildi');
      },
      error: (err) => {
        console.error('Hero kaydedilirken hata:', err.error?.detail || err.message);
        this.isSaving.set(false);
        this.showToast('Hero içeriği yerel olarak kaydedildi');
      },
    });
  }

  // ── Stats ─────────────────────────────────────────────────────────────────────

  updateStatField(index: number, field: keyof StatItem, value: string): void {
    this.editingStats.update((stats) => {
      const copy = stats.map((s) => ({ ...s }));
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  saveStats(): void {
    this.isSaving.set(true);
    this.landingContentService.updateStats(this.editingStats()).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.showToast('İstatistikler kaydedildi');
      },
      error: (err) => {
        console.error('İstatistikler kaydedilirken hata:', err);
        this.isSaving.set(false);
      },
    });
  }

  // ── Features ──────────────────────────────────────────────────────────────────

  openFeatureEdit(f?: FeatureItem): void {
    if (f) {
      this.editingFeature.set(f);
      this.featureForm.set({ ...f });
    } else {
      // New feature template
      this.editingFeature.set(null);
      this.featureForm.set({
        icon: 'star',
        title: '',
        description: '',
        stat: '',
        statLabel: '',
        isActive: true,
        sortOrder: (this.content()?.features.length ?? 0) + 1,
      });
    }
    this.showFeatureModal.set(true);
  }

  closeFeatureModal(): void {
    this.showFeatureModal.set(false);
    this.editingFeature.set(null);
    this.featureForm.set({});
  }

  updateFeatureField(field: keyof FeatureItem, value: string | boolean | number): void {
    this.featureForm.update((f) => ({ ...f, [field]: value }));
  }

  saveFeature(): void {
    const form = this.featureForm();
    const existing = this.editingFeature();
    this.isSaving.set(true);

    if (existing) {
      // Update existing
      this.landingContentService.updateFeature(existing.id, form).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeFeatureModal();
          this.showToast('Özellik güncellendi');
        },
        error: (err) => {
          console.error('Özellik güncellenirken hata:', err);
          this.isSaving.set(false);
        },
      });
    } else {
      // Add new – cast because all required fields should be filled
      this.landingContentService.addFeature(form as Omit<FeatureItem, 'id'>).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeFeatureModal();
          this.showToast('Yeni özellik eklendi');
        },
        error: (err) => {
          console.error('Özellik eklenirken hata:', err);
          this.isSaving.set(false);
        },
      });
    }
  }

  deleteFeature(id: string): void {
    if (!confirm('Bu özelliği silmek istediğinizden emin misiniz?')) return;
    this.landingContentService.deleteFeature(id).subscribe({
      next: () => this.showToast('Özellik silindi'),
      error: (err) => console.error('Özellik silinirken hata:', err),
    });
  }

  // ── Testimonials ──────────────────────────────────────────────────────────────

  openTestimonialEdit(t?: TestimonialItem): void {
    if (t) {
      this.editingTestimonial.set(t);
      this.testimonialForm.set({ ...t });
    } else {
      this.editingTestimonial.set(null);
      this.testimonialForm.set({
        name: '',
        role: '',
        avatar: '',
        text: '',
        rating: 5,
        isActive: true,
      });
    }
    this.showTestimonialModal.set(true);
  }

  closeTestimonialModal(): void {
    this.showTestimonialModal.set(false);
    this.editingTestimonial.set(null);
    this.testimonialForm.set({});
  }

  updateTestimonialField(field: keyof TestimonialItem, value: string | boolean | number): void {
    this.testimonialForm.update((t) => ({ ...t, [field]: value }));
  }

  saveTestimonial(): void {
    const form = this.testimonialForm();
    const existing = this.editingTestimonial();
    this.isSaving.set(true);

    if (existing) {
      this.landingContentService.updateTestimonial(existing.id, form).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeTestimonialModal();
          this.showToast('Referans güncellendi');
        },
        error: (err) => {
          console.error('Referans güncellenirken hata:', err);
          this.isSaving.set(false);
        },
      });
    } else {
      this.landingContentService.addTestimonial(form as Omit<TestimonialItem, 'id'>).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeTestimonialModal();
          this.showToast('Yeni referans eklendi');
        },
        error: (err) => {
          console.error('Referans eklenirken hata:', err);
          this.isSaving.set(false);
        },
      });
    }
  }

  deleteTestimonial(id: string): void {
    if (!confirm('Bu referansı silmek istediğinizden emin misiniz?')) return;
    this.landingContentService.deleteTestimonial(id).subscribe({
      next: () => this.showToast('Referans silindi'),
      error: (err) => console.error('Referans silinirken hata:', err),
    });
  }

  // ── CTA ───────────────────────────────────────────────────────────────────────

  updateCtaField(field: keyof CtaContent, value: string): void {
    this.editingCta.update((c) => ({ ...c, [field]: value }));
  }

  saveCta(): void {
    this.isSaving.set(true);
    this.landingContentService.updateCta(this.editingCta()).subscribe();
    this.platformAdminService.updateLandingContent('cta', {
      title: this.editingCta().title,
      content: JSON.stringify(this.editingCta()),
      isPublished: true,
      sortOrder: 5,
    }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.showToast('CTA bölümü kaydedildi');
      },
      error: (err) => {
        console.error('CTA kaydedilirken hata:', err.error?.detail || err.message);
        this.isSaving.set(false);
        this.showToast('CTA bölümü yerel olarak kaydedildi');
      },
    });
  }

  // ── Toast helper ──────────────────────────────────────────────────────────────

  private showToast(message: string): void {
    this.savedToast.set(message);
    setTimeout(() => this.savedToast.set(null), 3000);
  }

  // ── Star rating helper ────────────────────────────────────────────────────────

  starsArray(rating: number): number[] {
    return Array.from({ length: 5 }, (_, i) => i + 1);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

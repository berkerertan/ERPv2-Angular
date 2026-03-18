import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { interval, Subscription, forkJoin } from 'rxjs';
import { PlatformAdminService } from '../../../core/services/platform-admin.service';
import {
    SystemHealthOverviewDto,
    SystemHealthDependencyDto,
    SystemHealthTimelineDto,
    SystemHealthTimelinePointDto
} from '../../../core/models/platform-admin.model';

@Component({
    selector: 'app-system-health',
    standalone: true,
    imports: [CommonModule, FormsModule, DatePipe],
    templateUrl: './system-health.component.html',
    styleUrl: './system-health.component.css'
})
export class SystemHealthComponent implements OnInit, OnDestroy {
    private refreshSub: Subscription | null = null;

    isLoading = signal(false);
    autoRefresh = signal(true);
    lastChecked = signal<Date | null>(null);
    checkCount = signal(0);
    timelineRange = 60;
    timelineBucket = 5;

    // API data signals
    overview   = signal<SystemHealthOverviewDto | null>(null);
    deps       = signal<SystemHealthDependencyDto[]>([]);
    timeline   = signal<SystemHealthTimelineDto | null>(null);
    probeOk    = signal<boolean | null>(null);   // /health probe result

    // Error signals
    overviewError = signal<string | null>(null);

    // Computed
    overallStatus = computed(() => {
        const ov = this.overview();
        if (!ov) return this.probeOk() === false ? 'offline' : 'checking';
        const s = ov.status.toLowerCase();
        if (s === 'healthy')  return 'online';
        if (s === 'degraded') return 'degraded';
        return 'offline';
    });

    healthyDepCount = computed(() => this.deps().filter(d => d.status.toLowerCase() === 'healthy').length);

    errorRate = computed(() => this.overview()?.errorRateLastHour ?? null);

    uptimeLabel = computed(() => {
        const s = this.overview()?.uptimeSeconds;
        if (s == null) return '—';
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        if (h >= 24) return `${Math.floor(h / 24)}g ${h % 24}s`;
        return `${h}s ${m}d`;
    });

    timelineMax = computed(() => {
        const pts = this.timeline()?.points ?? [];
        return Math.max(...pts.map(p => p.requestCount), 1);
    });

    totalRequests = computed(() =>
        (this.timeline()?.points ?? []).reduce((s, p) => s + p.requestCount, 0)
    );

    constructor(private adminService: PlatformAdminService) {}

    ngOnInit(): void {
        this.loadAll();
        this.refreshSub = interval(30000).subscribe(() => {
            if (this.autoRefresh()) this.loadAll();
        });
    }

    ngOnDestroy(): void {
        this.refreshSub?.unsubscribe();
    }

    toggleAutoRefresh(): void {
        this.autoRefresh.update(v => !v);
    }

    loadAll(): void {
        if (this.isLoading()) return;
        this.isLoading.set(true);
        this.overviewError.set(null);
        this.checkCount.update(n => n + 1);

        // ── 1. Public health probe (no auth) ──────────────────────────
        this.adminService.getHealthProbe().subscribe({
            next: () => this.probeOk.set(true),
            error: () => this.probeOk.set(false)
        });

        // ── 2. Parallel: overview + dependencies + timeline ───────────
        forkJoin({
            overview: this.adminService.getSystemHealthOverview(),
            deps:     this.adminService.getSystemHealthDependencies(),
            timeline: this.adminService.getSystemHealthTimeline(this.timelineRange, this.timelineBucket)
        }).subscribe({
            next: ({ overview, deps, timeline }) => {
                this.overview.set(overview);
                this.deps.set(deps);
                this.timeline.set(timeline);
                this.lastChecked.set(new Date());
                this.isLoading.set(false);
            },
            error: (err) => {
                const msg = err?.error?.detail || err?.message || 'Veri yüklenemedi';
                this.overviewError.set(msg);
                this.isLoading.set(false);
                this.lastChecked.set(new Date());
            }
        });
    }

    onRangeChange(): void {
        this.loadAll();
    }

    // ── Helpers ────────────────────────────────────────────────────────

    getDepIcon(name: string): string {
        return ({ database: 'storage', authorization: 'lock', api: 'api' })[name] ?? 'circle';
    }

    getDepLabel(name: string): string {
        return ({ database: 'Veritabanı', authorization: 'Yetkilendirme', api: 'API Sunucusu' })[name] ?? name;
    }

    getStatusClass(status: string): string {
        const s = status.toLowerCase();
        if (s === 'healthy')  return 'status-online';
        if (s === 'degraded') return 'status-degraded';
        return 'status-offline';
    }

    getStatusLabel(status: string): string {
        const s = status.toLowerCase();
        if (s === 'healthy')  return 'Sağlıklı';
        if (s === 'degraded') return 'Performans Düşük';
        return 'Erişilemiyor';
    }

    getBannerClass(): string {
        const s = this.overallStatus();
        return `banner-${s}`;
    }

    getOverallLabel(): string {
        const s = this.overallStatus();
        if (s === 'checking') return 'Kontrol Ediliyor...';
        if (s === 'online')   return 'Tüm Sistemler Sağlıklı';
        if (s === 'degraded') return 'Kısmi Servis Kesintisi';
        return 'Sistem Kesintisi Var';
    }

    formatUptime(seconds: number): string {
        const d = Math.floor(seconds / 86400);
        const h = Math.floor((seconds % 86400) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const parts = [];
        if (d) parts.push(`${d} gün`);
        if (h) parts.push(`${h} saat`);
        if (m || !parts.length) parts.push(`${m} dk`);
        return parts.join(' ');
    }

    formatTime(d: Date | null): string {
        if (!d) return '—';
        return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    bucketLabel(pt: SystemHealthTimelinePointDto): string {
        const d = new Date(pt.bucketStartUtc);
        return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }

    errorBarHeight(pt: SystemHealthTimelinePointDto): number {
        if (!pt.requestCount) return 0;
        return Math.round((pt.errorCount / pt.requestCount) * 100);
    }
}

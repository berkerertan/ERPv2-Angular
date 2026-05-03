import { Component, signal, computed, OnInit, OnDestroy, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockMovementService } from '../../core/services/stock-movement.service';
import { WarehouseService } from '../../core/services/warehouse.service';
import { InventoryCountSessionDetail, InventoryCountSessionListItem, InventoryCountSessionStatus, QueuedInventoryCountRequest, StockBalance } from '../../core/models/stock-movement.model';
import { Warehouse } from '../../core/models/warehouse.model';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { InventoryCountOfflineQueueService } from '../../core/services/inventory-count-offline-queue.service';

declare global {
    interface Window {
        BarcodeDetector?: any;
    }
}

export interface CountRow {
    productId: string;
    productName: string;
    barcode: string;
    unit: string;
    warehouseName: string;
    systemQty: number;
    countedQty: number | null;
}

type RecentScan = {
    productId: string;
    productName: string;
    barcode: string;
    quantity: number;
};

@Component({
    selector: 'app-inventory-count',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './inventory-count.component.html',
    styleUrls: ['./inventory-count.component.css', '../../shared/styles/crud-page.css']
})
export class InventoryCountComponent implements OnInit, OnDestroy {
    @ViewChild('scannerVideo') scannerVideo?: ElementRef<HTMLVideoElement>;

    private stockService = inject(StockMovementService);
    private warehouseService = inject(WarehouseService);
    private toastService = inject(ToastService);
    private confirmService = inject(ConfirmService);
    private offlineQueueService = inject(InventoryCountOfflineQueueService);

    warehouses = signal<Warehouse[]>([]);
    rows = signal<CountRow[]>([]);
    recentScans = signal<RecentScan[]>([]);
    sessions = signal<InventoryCountSessionListItem[]>([]);
    sessionHistory = signal<InventoryCountSessionListItem[]>([]);
    activeSession = signal<InventoryCountSessionDetail | null>(null);
    selectedHistorySession = signal<InventoryCountSessionDetail | null>(null);

    selectedWarehouseId = signal<string>('');
    searchTerm = signal<string>('');
    showOnlyDiffs = signal(false);
    referenceNo = signal('');
    notes = signal('');
    locationCode = signal('');
    manualBarcode = signal('');
    scannerError = signal('');
    scannerStatus = signal('Hazir');
    barcodeModalOpen = signal(false);
    historyModalOpen = signal(false);
    pendingBarcode = signal('');
    pendingRow = signal<CountRow | null>(null);
    pendingQuantity = signal(1);
    quickScanEnabled = signal(true);
    quickScanQuantity = signal(1);
    scanFeedbackEnabled = signal(true);
    lastScanLabel = signal('');

    isLoadingWarehouses = signal(false);
    isLoadingBalances = signal(false);
    isLoadingSessions = signal(false);
    isLoadingHistory = signal(false);
    isStartingSession = signal(false);
    isSaving = signal(false);
    countSaved = signal(false);
    scannerActive = signal(false);

    private mediaStream: MediaStream | null = null;
    private scannerTimer: ReturnType<typeof setInterval> | null = null;
    private detector: any = null;
    private lastDetectedCode = '';
    private lastDetectedAt = 0;
    private audioContext: AudioContext | null = null;

    readonly selectedWarehouseName = computed(() => {
        const wh = this.warehouses().find(w => w.id === this.selectedWarehouseId());
        return wh?.name || '';
    });

    readonly openSessions = computed(() =>
        this.sessions().filter(x => !this.selectedWarehouseId() || x.warehouseId === this.selectedWarehouseId())
    );

    readonly completedSessions = computed(() =>
        this.sessionHistory().filter(x =>
            (!this.selectedWarehouseId() || x.warehouseId === this.selectedWarehouseId()) &&
            x.status !== InventoryCountSessionStatus.Open)
    );

    readonly hasActiveSession = computed(() => !!this.activeSession());

    readonly historySummary = computed(() => {
        const items = this.completedSessions();
        return {
            totalSessions: items.length,
            totalAppliedItems: items.reduce((sum, item) => sum + item.appliedItems, 0),
            totalIncreaseQuantity: items.reduce((sum, item) => sum + item.totalIncreaseQuantity, 0),
            totalDecreaseQuantity: items.reduce((sum, item) => sum + item.totalDecreaseQuantity, 0)
        };
    });

    readonly filteredRows = computed(() => {
        let list = this.rows();
        const term = this.searchTerm().toLowerCase();
        if (term) {
            list = list.filter(r =>
                r.productName.toLowerCase().includes(term) ||
                r.barcode.toLowerCase().includes(term)
            );
        }
        if (this.showOnlyDiffs()) {
            list = list.filter(r => r.countedQty !== null && r.countedQty !== r.systemQty);
        }
        return list;
    });

    readonly diffCount = computed(() =>
        this.rows().filter(r => r.countedQty !== null && r.countedQty !== r.systemQty).length
    );

    readonly enteredCount = computed(() =>
        this.rows().filter(r => r.countedQty !== null).length
    );

    readonly totalRows = computed(() => this.rows().length);
    readonly queueCount = computed(() => this.offlineQueueService.queuedItems().length);
    readonly queueItems = computed(() => this.offlineQueueService.queuedItems());
    readonly isOnline = computed(() => this.offlineQueueService.isOnline());
    readonly isSyncingQueue = computed(() => this.offlineQueueService.isSyncing());
    readonly queueSummary = computed(() => this.offlineQueueService.lastSyncSummary());
    readonly lastQueueSyncAtUtc = computed(() => this.offlineQueueService.lastSyncAtUtc());

    ngOnInit(): void {
        this.loadWarehouses();
        this.referenceNo.set(`SAYIM-${new Date().toISOString().slice(0, 10)}`);
        if (this.isOnline() && this.queueCount() > 0) {
            void this.syncOfflineQueue(false);
        }
    }

    ngOnDestroy(): void {
        this.stopScanner();
    }

    loadWarehouses(): void {
        this.isLoadingWarehouses.set(true);
        this.warehouseService.getAll().subscribe({
            next: whs => {
                this.warehouses.set(whs);
                if (whs.length) {
                    this.selectedWarehouseId.set(whs[0].id);
                    this.loadBalances();
                    this.loadSessions();
                    this.loadSessionHistory();
                }
                this.isLoadingWarehouses.set(false);
            },
            error: () => {
                this.toastService.error('Hata', 'Depolar yuklenemedi.');
                this.isLoadingWarehouses.set(false);
            }
        });
    }

    onWarehouseChange(id: string): void {
        this.selectedWarehouseId.set(id);
        this.countSaved.set(false);
        this.recentScans.set([]);
        this.activeSession.set(null);
        this.locationCode.set('');
        this.loadBalances();
        this.loadSessions();
        this.loadSessionHistory();
    }

    loadBalances(): void {
        const whId = this.selectedWarehouseId();
        if (!whId) return;

        this.isLoadingBalances.set(true);
        this.stockService.getBalances().subscribe({
            next: balances => {
                const whName = this.selectedWarehouseName();
                const filtered = balances.filter(b => !b.warehouseName || b.warehouseName === whName || whName === '');
                this.rows.set(filtered.map(b => this.mapBalanceToRow(b)));
                this.isLoadingBalances.set(false);
            },
            error: () => {
                this.toastService.error('Hata', 'Stok bakiyeleri yuklenemedi.');
                this.isLoadingBalances.set(false);
            }
        });
    }

    loadSessions(): void {
        const whId = this.selectedWarehouseId();
        if (!whId) return;

        this.isLoadingSessions.set(true);
        this.stockService.getInventoryCountSessions({
            warehouseId: whId,
            includeCompleted: false,
            page: 1,
            pageSize: 20
        }).subscribe({
            next: sessions => {
                this.sessions.set(sessions);
                this.isLoadingSessions.set(false);
            },
            error: () => {
                this.isLoadingSessions.set(false);
                this.toastService.error('Hata', 'Acik sayim oturumlari yuklenemedi.');
            }
        });
    }

    loadSessionHistory(): void {
        const whId = this.selectedWarehouseId();
        if (!whId) return;

        this.isLoadingHistory.set(true);
        this.stockService.getInventoryCountSessions({
            warehouseId: whId,
            includeCompleted: true,
            page: 1,
            pageSize: 50
        }).subscribe({
            next: sessions => {
                this.sessionHistory.set(sessions);
                this.isLoadingHistory.set(false);
            },
            error: () => {
                this.isLoadingHistory.set(false);
                this.toastService.error('Hata', 'Sayim gecmisi yuklenemedi.');
            }
        });
    }

    startSession(): void {
        const warehouseId = this.selectedWarehouseId();
        if (!warehouseId) {
            this.toastService.error('Hata', 'Once depo secin.');
            return;
        }

        this.isStartingSession.set(true);
        this.stockService.startInventoryCountSession({
            warehouseId,
            referenceNo: this.referenceNo(),
            notes: this.notes(),
            locationCode: this.locationCode()
        }).subscribe({
            next: sessionId => {
                this.isStartingSession.set(false);
                this.toastService.success('Hazir', 'Sayim oturumu baslatildi.');
                this.resumeSession(sessionId);
                this.loadSessions();
                this.loadSessionHistory();
            },
            error: err => {
                this.isStartingSession.set(false);
                this.toastService.error('Hata', err?.error?.detail || 'Sayim oturumu baslatilamadi.');
            }
        });
    }

    resumeSession(sessionId: string): void {
        this.stockService.getInventoryCountSessionById(sessionId).subscribe({
            next: session => {
                this.activeSession.set(session);
                this.referenceNo.set(session.referenceNo || '');
                this.notes.set(session.notes || '');
                this.locationCode.set(session.locationCode || '');
                this.selectedWarehouseId.set(session.warehouseId);
                this.loadBalancesForSession(session);
                this.toastService.info('Devam', 'Acik sayim oturumu yuklendi.');
            },
            error: () => {
                this.toastService.error('Hata', 'Sayim oturumu acilamadi.');
            }
        });
    }

    openHistorySession(sessionId: string): void {
        this.stockService.getInventoryCountSessionById(sessionId).subscribe({
            next: session => {
                this.selectedHistorySession.set(session);
                this.historyModalOpen.set(true);
            },
            error: () => {
                this.toastService.error('Hata', 'Sayim detaylari acilamadi.');
            }
        });
    }

    closeHistoryModal(): void {
        this.historyModalOpen.set(false);
        this.selectedHistorySession.set(null);
    }

    leaveSession(): void {
        this.activeSession.set(null);
        this.referenceNo.set(`SAYIM-${new Date().toISOString().slice(0, 10)}`);
        this.notes.set('');
        this.locationCode.set('');
        this.recentScans.set([]);
        this.loadBalances();
    }

    setCountedQty(row: CountRow, value: string): void {
        const parsed = value === '' ? null : parseFloat(value);
        this.rows.update(list =>
            list.map(r => r.productId === row.productId ? { ...r, countedQty: parsed } : r)
        );
    }

    getDiff(row: CountRow): number {
        if (row.countedQty === null) return 0;
        return row.countedQty - row.systemQty;
    }

    getDiffClass(row: CountRow): string {
        const d = this.getDiff(row);
        if (d > 0) return 'diff-positive';
        if (d < 0) return 'diff-negative';
        return 'diff-zero';
    }

    fillAllFromSystem(): void {
        this.rows.update(list => list.map(r => ({ ...r, countedQty: r.systemQty })));
    }

    clearAllCounts(): void {
        this.rows.update(list => list.map(r => ({ ...r, countedQty: null })));
        this.recentScans.set([]);
        this.lastScanLabel.set('');
    }

    async saveCount(): Promise<void> {
        const whId = this.selectedWarehouseId();
        if (!whId) {
            this.toastService.error('Hata', 'Depo secilmedi.');
            return;
        }

        const countedItems = this.rows()
            .filter(r => r.countedQty !== null)
            .map(r => ({ productId: r.productId, countedQuantity: r.countedQty as number }));

        if (!countedItems.length) {
            this.toastService.error('Hata', 'Kaydedilecek sayim girdisi bulunamadi.');
            return;
        }

        const ok = await this.confirmService.confirm({
            title: 'Sayimi Onayla',
            message: `${countedItems.length} urun icin sayim sonucu stoga uygulanacak. Devam edilsin mi?`,
            confirmText: 'Kaydet',
            type: 'warning'
        });
        if (!ok) return;

        this.isSaving.set(true);
        try {
            const result = await this.offlineQueueService.submitOrQueue({
                sessionId: this.activeSession()?.id,
                warehouseId: whId,
                referenceNo: this.referenceNo(),
                notes: this.notes(),
                locationCode: this.locationCode(),
                items: countedItems
            }, this.selectedWarehouseName());

            this.isSaving.set(false);
            this.countSaved.set(true);
            this.notes.set('');
            this.locationCode.set('');
            this.referenceNo.set(`SAYIM-${new Date().toISOString().slice(0, 10)}`);
            this.recentScans.set([]);
            this.activeSession.set(null);

            if (result.mode === 'online' && result.response) {
                this.toastService.success('Sayim Tamamlandi', `${result.response.appliedItems} kalem uygulandi.`);
                this.loadBalances();
                this.loadSessions();
                this.loadSessionHistory();
            } else {
                this.toastService.info('Offline Kuyruga Alindi', 'Baglanti gelince sayim otomatik senkronlanacak.');
                this.rows.update(list => list.map(r => ({ ...r, countedQty: null })));
            }
        } catch (err: any) {
            this.isSaving.set(false);
            this.toastService.error('Hata', err?.error?.detail || 'Sayim kaydedilemedi.');
        }
    }

    async syncOfflineQueue(showToast = true): Promise<void> {
        const result = await this.offlineQueueService.syncPending();
        if (result.synced > 0) {
            this.loadBalances();
            this.loadSessions();
            this.loadSessionHistory();
            if (showToast) {
                this.toastService.success('Senkron Tamamlandi', `${result.synced} offline sayim gonderildi.`);
            }
            return;
        }

        if (showToast) {
            if (result.failed > 0) {
                this.toastService.error('Senkron Bekliyor', `${result.failed} offline sayim halen kuyrukta.`);
            } else {
                this.toastService.info('Hazir', 'Senkronlanacak bekleyen sayim yok.');
            }
        }
    }

    async removeQueuedCount(queueId: string): Promise<void> {
        const ok = await this.confirmService.confirm({
            title: 'Kuyruktan Sil',
            message: 'Bu offline sayim kaydi kuyruktan kaldirilacak. Devam edilsin mi?',
            confirmText: 'Sil',
            type: 'warning'
        });

        if (!ok) return;

        this.offlineQueueService.removeQueuedItem(queueId);
        this.toastService.info('Kaldirildi', 'Offline sayim kuyruktan silindi.');
    }

    async clearQueuedCounts(): Promise<void> {
        if (this.queueCount() === 0) return;

        const ok = await this.confirmService.confirm({
            title: 'Kuyrugu Temizle',
            message: `${this.queueCount()} offline sayim kaydi silinecek. Devam edilsin mi?`,
            confirmText: 'Temizle',
            type: 'warning'
        });

        if (!ok) return;

        this.offlineQueueService.clearQueue();
        this.toastService.info('Temizlendi', 'Offline kuyruk bosaltildi.');
    }

    getQueuedItemCount(item: QueuedInventoryCountRequest): number {
        return item?.items?.length ?? 0;
    }

    async startScanner(): Promise<void> {
        if (this.scannerActive()) return;
        this.scannerError.set('');

        if (!navigator.mediaDevices?.getUserMedia) {
            this.scannerError.set('Bu cihaz kamerayi desteklemiyor. Manuel barkod girisi kullanin.');
            return;
        }

        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' } },
                audio: false
            });

            const video = this.scannerVideo?.nativeElement;
            if (!video) {
                this.scannerError.set('Kamera alani hazir degil.');
                return;
            }

            video.srcObject = this.mediaStream;
            await video.play();
            this.detector = window.BarcodeDetector ? new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'code_128', 'qr_code', 'upc_a', 'upc_e'] }) : null;
            this.scannerActive.set(true);
            this.scannerStatus.set('Kamera hazir');

            if (!this.detector) {
                this.scannerError.set('Tarayici barkod algilama API sunmuyor. Manuel barkod girisini kullanin.');
                this.scannerStatus.set('Algilayici desteklenmiyor');
                return;
            }

            this.scannerTimer = setInterval(async () => {
                if (!this.scannerActive() || this.barcodeModalOpen()) return;
                try {
                    const codes = await this.detector.detect(video);
                    const rawValue = codes?.[0]?.rawValue?.trim();
                    if (rawValue) {
                        this.handleDetectedBarcode(rawValue);
                    }
                } catch {
                    this.scannerError.set('Kamera acik fakat barkod okunamadi. Manuel giris kullanabilirsiniz.');
                    this.scannerStatus.set('Okuma bekleniyor');
                }
            }, 900);
        } catch {
            this.scannerError.set('Kamera izni alinmadi veya cihaza erisilemedi.');
            this.scannerStatus.set('Kamera erisimi yok');
        }
    }

    stopScanner(): void {
        this.scannerActive.set(false);
        this.scannerStatus.set('Kamera kapali');
        if (this.scannerTimer) {
            clearInterval(this.scannerTimer);
            this.scannerTimer = null;
        }
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        const video = this.scannerVideo?.nativeElement;
        if (video) {
            video.pause();
            video.srcObject = null;
        }
    }

    submitManualBarcode(): void {
        const barcode = this.manualBarcode().trim();
        if (!barcode) {
            this.toastService.error('Hata', 'Barkod girin.');
            return;
        }
        this.handleDetectedBarcode(barcode);
        this.manualBarcode.set('');
    }

    confirmPendingBarcode(): void {
        const row = this.pendingRow();
        const qty = this.pendingQuantity();
        if (!row || qty <= 0) return;

        this.applyScanQuantity(row, qty);

        this.barcodeModalOpen.set(false);
        this.pendingRow.set(null);
        this.pendingBarcode.set('');
        this.pendingQuantity.set(1);
    }

    cancelPendingBarcode(): void {
        this.barcodeModalOpen.set(false);
        this.pendingRow.set(null);
        this.pendingBarcode.set('');
        this.pendingQuantity.set(1);
    }

    quickAddRecent(scan: RecentScan): void {
        const row = this.rows().find(x => x.productId === scan.productId);
        if (!row) return;
        if (this.quickScanEnabled()) {
            this.applyScanQuantity(row, 1);
            return;
        }
        this.pendingRow.set(row);
        this.pendingBarcode.set(scan.barcode);
        this.pendingQuantity.set(1);
        this.barcodeModalOpen.set(true);
    }

    setQuickScanQuantity(qty: number): void {
        this.quickScanQuantity.set(qty);
    }

    private handleDetectedBarcode(barcode: string): void {
        const now = Date.now();
        if (this.lastDetectedCode === barcode && now - this.lastDetectedAt < 450) {
            return;
        }
        this.lastDetectedCode = barcode;
        this.lastDetectedAt = now;

        const normalized = barcode.trim().toLowerCase();
        let row = this.rows().find(item => item.barcode.trim().toLowerCase() === normalized);

        if (!row) {
            row = {
                productId: `barcode-${barcode}`,
                productName: `Yeni barkod: ${barcode}`,
                barcode,
                unit: 'Adet',
                warehouseName: this.selectedWarehouseName(),
                systemQty: 0,
                countedQty: 0
            };
            this.rows.update(list => [row as CountRow, ...list]);
        }

        this.scannerStatus.set(`Okundu: ${barcode}`);
        if (this.quickScanEnabled()) {
            this.applyScanQuantity(row, this.quickScanQuantity());
            return;
        }

        this.pendingRow.set(row);
        this.pendingBarcode.set(barcode);
        this.pendingQuantity.set(1);
        this.barcodeModalOpen.set(true);
    }

    private applyScanQuantity(row: CountRow, qty: number): void {
        const existing = row.countedQty ?? 0;
        this.rows.update(list =>
            list.map(item =>
                item.productId === row.productId
                    ? { ...item, countedQty: existing + qty }
                    : item
            )
        );

        this.recentScans.update(list => [
            {
                productId: row.productId,
                productName: row.productName,
                barcode: row.barcode,
                quantity: qty
            },
            ...list.filter(item => item.productId !== row.productId).slice(0, 4)
        ]);

        this.lastScanLabel.set(`${row.productName} (+${qty})`);
        this.scannerStatus.set(`Sayima eklendi: ${qty}`);
        this.triggerFeedback();
    }

    private triggerFeedback(): void {
        if (!this.scanFeedbackEnabled()) return;

        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(60);
        }

        try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioCtx) return;
            this.audioContext ??= new AudioCtx();
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.value = 880;
            gainNode.gain.value = 0.03;
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.08);
        } catch {
        }
    }

    private loadBalancesForSession(session: InventoryCountSessionDetail): void {
        this.isLoadingBalances.set(true);
        this.stockService.getBalances().subscribe({
            next: balances => {
                const whName = session.warehouseName || this.selectedWarehouseName();
                const filtered = balances.filter(b => !b.warehouseName || b.warehouseName === whName || whName === '');
                const mapped = filtered.map(b => this.mapBalanceToRow(b));
                const byProductId = new Map(mapped.map(row => [row.productId, row] as const));

                session.items.forEach(item => {
                    const existing = byProductId.get(item.productId);
                    if (existing) {
                        existing.countedQty = item.countedQuantity;
                        existing.systemQty = item.systemQuantity;
                        existing.barcode = item.barcode || existing.barcode;
                        existing.unit = item.unit || existing.unit;
                    } else {
                        mapped.unshift({
                            productId: item.productId,
                            productName: item.productName,
                            barcode: item.barcode || '-',
                            unit: item.unit,
                            warehouseName: session.warehouseName,
                            systemQty: item.systemQuantity,
                            countedQty: item.countedQuantity
                        });
                    }
                });

                this.rows.set(mapped);
                this.isLoadingBalances.set(false);
            },
            error: () => {
                this.toastService.error('Hata', 'Sayim oturumu bakiyeleri yuklenemedi.');
                this.isLoadingBalances.set(false);
            }
        });
    }

    private mapBalanceToRow(balance: StockBalance): CountRow {
        return {
            productId: balance.productId,
            productName: balance.productName || balance.productId,
            barcode: balance.barcode || '-',
            unit: balance.unit || '-',
            warehouseName: balance.warehouseName || '-',
            systemQty: balance.balance,
            countedQty: null
        };
    }
}

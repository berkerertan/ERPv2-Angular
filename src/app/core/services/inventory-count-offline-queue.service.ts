import { Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApplyInventoryCountRequest, ApplyInventoryCountResponse, QueuedInventoryCountRequest } from '../models/stock-movement.model';
import { StockMovementService } from './stock-movement.service';

@Injectable({ providedIn: 'root' })
export class InventoryCountOfflineQueueService {
    private readonly storageKey = 'stoknet.inventoryCountQueue.v1';

    readonly queuedItems = signal<QueuedInventoryCountRequest[]>(this.readQueue());
    readonly isOnline = signal(typeof navigator === 'undefined' ? true : navigator.onLine);
    readonly isSyncing = signal(false);
    readonly lastSyncSummary = signal('');

    constructor(private stockMovementService: StockMovementService) {
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => {
                this.isOnline.set(true);
                void this.syncPending();
            });
            window.addEventListener('offline', () => this.isOnline.set(false));
        }
    }

    enqueue(request: ApplyInventoryCountRequest, warehouseName?: string): QueuedInventoryCountRequest {
        const queued: QueuedInventoryCountRequest = {
            ...request,
            clientRequestId: request.clientRequestId || this.generateId(),
            queueId: this.generateId(),
            queuedAtUtc: new Date().toISOString(),
            warehouseName
        };

        const items = [...this.queuedItems(), queued];
        this.writeQueue(items);
        this.queuedItems.set(items);
        return queued;
    }

    async syncPending(): Promise<{ synced: number; failed: number }> {
        if (this.isSyncing() || !this.isOnline()) {
            return { synced: 0, failed: this.queuedItems().length };
        }

        const current = [...this.queuedItems()];
        if (!current.length) {
            this.lastSyncSummary.set('');
            return { synced: 0, failed: 0 };
        }

        this.isSyncing.set(true);
        let synced = 0;
        const failed: QueuedInventoryCountRequest[] = [];

        for (const item of current) {
            try {
                await firstValueFrom(this.stockMovementService.applyInventoryCount(item));
                synced++;
            } catch {
                failed.push(item);
            }
        }

        this.writeQueue(failed);
        this.queuedItems.set(failed);
        this.lastSyncSummary.set(
            synced > 0
                ? `${synced} offline sayim senkronlandi${failed.length ? `, ${failed.length} kuyrukta kaldi` : ''}.`
                : failed.length
                    ? 'Offline kuyruk senkronlanamadi.'
                    : ''
        );
        this.isSyncing.set(false);
        return { synced, failed: failed.length };
    }

    async submitOrQueue(request: ApplyInventoryCountRequest, warehouseName?: string): Promise<{
        mode: 'online' | 'queued';
        response?: ApplyInventoryCountResponse;
        queued?: QueuedInventoryCountRequest;
    }> {
        const normalizedRequest: ApplyInventoryCountRequest = {
            ...request,
            clientRequestId: request.clientRequestId || this.generateId()
        };

        if (!this.isOnline()) {
            return { mode: 'queued', queued: this.enqueue(normalizedRequest, warehouseName) };
        }

        try {
            const response = await firstValueFrom(this.stockMovementService.applyInventoryCount(normalizedRequest));
            return { mode: 'online', response };
        } catch (error: any) {
            if (error?.status === 0) {
                return { mode: 'queued', queued: this.enqueue(normalizedRequest, warehouseName) };
            }
            throw error;
        }
    }

    private readQueue(): QueuedInventoryCountRequest[] {
        if (typeof localStorage === 'undefined') {
            return [];
        }

        try {
            const raw = localStorage.getItem(this.storageKey);
            return raw ? JSON.parse(raw) as QueuedInventoryCountRequest[] : [];
        } catch {
            return [];
        }
    }

    private writeQueue(items: QueuedInventoryCountRequest[]): void {
        if (typeof localStorage === 'undefined') {
            return;
        }

        localStorage.setItem(this.storageKey, JSON.stringify(items));
    }

    private generateId(): string {
        if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
            return crypto.randomUUID();
        }

        return `iq-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
}

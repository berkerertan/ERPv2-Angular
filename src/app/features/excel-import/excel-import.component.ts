import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CariAccountService } from '../../core/services/cari-account.service';
import { ToastService } from '../../core/services/toast.service';
import { BuyerDebtItemsBatchImportResult, BuyerDebtItemsBatchImportFileResult } from '../../core/models/cari-account.model';

type ImportModule = 'buyers-batch' | 'single-buyer' | 'products';

interface SingleBuyerImportState {
    cariAccountId: string;
    file: File | null;
    uploading: boolean;
    result: any | null;
}

@Component({
    selector: 'app-excel-import',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './excel-import.component.html',
    styleUrls: ['./excel-import.component.css', '../../shared/styles/crud-page.css']
})
export class ExcelImportComponent implements OnInit {
    private cariService = inject(CariAccountService);
    private toastService = inject(ToastService);

    activeModule = signal<ImportModule>('buyers-batch');

    // ── Alıcı Batch Import ───────────────────────────────────
    batchFiles = signal<File[]>([]);
    batchUploading = signal(false);
    batchResult = signal<BuyerDebtItemsBatchImportResult | null>(null);
    batchIsDragOver = signal(false);
    batchReplaceExisting = false;

    // Column mapping options
    columnOptions = {
        transactionDateColumn: '',
        materialDescriptionColumn: '',
        quantityColumn: '',
        listPriceColumn: '',
        salePriceColumn: '',
        totalAmountColumn: '',
        paymentColumn: '',
        remainingBalanceColumn: ''
    };

    showAdvancedOptions = signal(false);

    // ── Tekil Alıcı Import ───────────────────────────────────
    singleState: SingleBuyerImportState = {
        cariAccountId: '', file: null, uploading: false, result: null
    };
    cariAccounts = signal<any[]>([]);
    singleIsDragOver = signal(false);
    singleFileInput: HTMLInputElement | null = null;

    ngOnInit(): void {
        this.loadCariAccounts();
    }

    private loadCariAccounts(): void {
        this.cariService.getBuyers().subscribe({
            next: data => this.cariAccounts.set(data),
            error: () => {}
        });
    }

    // ── Batch Import ─────────────────────────────────────────
    onBatchDragOver(e: DragEvent): void { e.preventDefault(); e.stopPropagation(); this.batchIsDragOver.set(true); }
    onBatchDragLeave(e: DragEvent): void { e.preventDefault(); e.stopPropagation(); this.batchIsDragOver.set(false); }

    onBatchDrop(e: DragEvent): void {
        e.preventDefault(); e.stopPropagation();
        this.batchIsDragOver.set(false);
        if (e.dataTransfer?.files) this.addBatchFiles(Array.from(e.dataTransfer.files));
    }

    onBatchFileSelected(e: Event): void {
        const input = e.target as HTMLInputElement;
        if (input.files?.length) { this.addBatchFiles(Array.from(input.files)); input.value = ''; }
    }

    private addBatchFiles(files: File[]): void {
        const valid = files.filter(f => {
            const ext = f.name.split('.').pop()?.toLowerCase();
            return ['xlsx', 'xls', 'csv'].includes(ext || '') && f.size <= 10 * 1024 * 1024;
        });
        if (valid.length) { this.batchFiles.update(existing => [...existing, ...valid]); this.batchResult.set(null); }
        else this.toastService.error('Geçersiz Dosya', 'Sadece xlsx, xls veya csv (maks. 10MB) kabul edilir.');
    }

    removeBatchFile(i: number): void { this.batchFiles.update(files => files.filter((_, idx) => idx !== i)); }
    clearBatchFiles(): void { this.batchFiles.set([]); this.batchResult.set(null); }

    uploadBatch(): void {
        if (!this.batchFiles().length) return;
        this.batchUploading.set(true);
        this.batchResult.set(null);

        const opts = this.showAdvancedOptions() ? {
            replaceExisting: this.batchReplaceExisting,
            ...Object.fromEntries(Object.entries(this.columnOptions).filter(([, v]) => v))
        } : { replaceExisting: this.batchReplaceExisting };

        this.cariService.importBuyersBatch(this.batchFiles(), opts).subscribe({
            next: result => {
                this.batchResult.set(result);
                this.batchUploading.set(false);
                if (result.totalCreatedCount > 0) {
                    this.toastService.success('Import Tamamlandı', `${result.totalCreatedCount} kayıt oluşturuldu.`);
                } else {
                    this.toastService.success('Tamamlandı', 'Import işlemi tamamlandı.');
                }
            },
            error: err => {
                this.batchUploading.set(false);
                this.toastService.error('Hata', err.error?.detail || 'Import sırasında bir hata oluştu.');
            }
        });
    }

    // ── Single Buyer Import ──────────────────────────────────
    onSingleDragOver(e: DragEvent): void { e.preventDefault(); e.stopPropagation(); this.singleIsDragOver.set(true); }
    onSingleDragLeave(e: DragEvent): void { e.preventDefault(); e.stopPropagation(); this.singleIsDragOver.set(false); }

    onSingleDrop(e: DragEvent): void {
        e.preventDefault(); e.stopPropagation();
        this.singleIsDragOver.set(false);
        const files = e.dataTransfer?.files;
        if (files?.length) this.setSingleFile(files[0]);
    }

    onSingleFileSelected(e: Event): void {
        const inp = e.target as HTMLInputElement;
        if (inp.files?.length) { this.setSingleFile(inp.files[0]); inp.value = ''; }
    }

    private setSingleFile(f: File): void {
        const ext = f.name.split('.').pop()?.toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(ext || '') || f.size > 10 * 1024 * 1024) {
            this.toastService.error('Geçersiz Dosya', 'Sadece xlsx, xls veya csv (maks. 10MB) kabul edilir.');
            return;
        }
        this.singleState = { ...this.singleState, file: f, result: null };
    }

    clearSingleFile(): void { this.singleState = { ...this.singleState, file: null, result: null }; }

    uploadSingle(): void {
        const file = this.singleState.file;
        if (!file || !this.singleState.cariAccountId) return;
        this.singleState = { ...this.singleState, uploading: true, result: null };

        const formData = new FormData();
        formData.append('File', file);

        this.cariService.importExcel(this.singleState.cariAccountId, formData).subscribe({
            next: result => {
                this.singleState = { ...this.singleState, uploading: false, result };
                this.toastService.success('Import Tamamlandı', `${result.createdCount} kayıt oluşturuldu.`);
            },
            error: err => {
                this.singleState = { ...this.singleState, uploading: false };
                this.toastService.error('Hata', err.error?.detail || 'Import sırasında bir hata oluştu.');
            }
        });
    }

    // ── Helpers ─────────────────────────────────────────────
    formatFileSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    extractBuyerName(fileName: string): string { return fileName.replace(/\.[^/.]+$/, ''); }

    getBatchResultClass(f: BuyerDebtItemsBatchImportFileResult): string {
        if (f.failedCount > 0 && f.createdCount === 0) return 'result-error';
        if (f.failedCount > 0) return 'result-partial';
        return 'result-success';
    }
}

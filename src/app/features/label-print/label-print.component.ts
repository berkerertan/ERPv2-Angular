import {
    Component, signal, computed, ElementRef, effect,
    ViewChildren, QueryList, AfterViewChecked, inject, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import JsBarcode from 'jsbarcode';
import { ToastService } from '../../core/services/toast.service';

// ── Sabitler ──────────────────────────────────────────────────────────────────

export const LABEL_SIZES: LabelSize[] = [
    { id: '89x36',  label: '89 × 36 mm',  w: 89,  h: 36,  isDefault: true  },
    { id: '89x41',  label: '89 × 41 mm',  w: 89,  h: 41                    },
    { id: '58x40',  label: '58 × 40 mm',  w: 58,  h: 40                    },
    { id: '70x35',  label: '70 × 35 mm',  w: 70,  h: 35                    },
    { id: '100x50', label: '100 × 50 mm', w: 100, h: 50                    },
    { id: '32x57',  label: '32 × 57 mm',  w: 32,  h: 57                    },
    { id: '50x25',  label: '50 × 25 mm',  w: 50,  h: 25                    },
];

// ── Tipler ────────────────────────────────────────────────────────────────────

export interface LabelSize  { id: string; label: string; w: number; h: number; isDefault?: boolean; }
export interface LabelItem  { id: string; name: string; barcode: string; qty: number; }

// ── Bileşen ───────────────────────────────────────────────────────────────────

@Component({
    selector: 'app-label-print',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './label-print.component.html',
    styleUrl: './label-print.component.css'
})
export class LabelPrintComponent implements AfterViewChecked, OnInit {

    private toast = inject(ToastService);

    // ── State ─────────────────────────────────────────────────────────────────
    readonly sizes = LABEL_SIZES;
    selectedSizeId = signal<string>('89x36');
    items          = signal<LabelItem[]>([]);
    showPreview    = signal(false);
    isDragging     = signal(false);
    isLoading      = signal(false);

    // Manuel ekleme formu (signal → canlı önizleme)
    manualName    = signal('');
    manualBarcode = signal('');
    manualQty     = signal(1);

    // Column mapping (Excel)
    colName    = signal(0);   // sütun index (0-based)
    colBarcode = signal(1);
    showColMap    = signal(false);
    colMapApplied = signal(false);   // Uygula'ya basıldıktan sonra true
    detectedHeaders: string[] = [];
    private pendingRows: any[][] = [];  // parse bekleyen ham satırlar

    // Barcode SVG'leri için ViewChildren referansları
    @ViewChildren('barcodeEl') barcodeEls!: QueryList<ElementRef<SVGElement>>;
    private _barcodesDirty = false;

    // ── Computed ──────────────────────────────────────────────────────────────
    readonly selectedSize = computed(() =>
        this.sizes.find(s => s.id === this.selectedSizeId()) ?? this.sizes[0]
    );

    readonly totalLabelCount = computed(() =>
        this.items().reduce((s, i) => s + i.qty, 0)
    );

    /** Her item × qty kadar flatMap → yazdırılacak etiket listesi */
    readonly flatLabels = computed<LabelItem[]>(() =>
        this.items().flatMap(i => Array(Math.max(1, i.qty)).fill(i))
    );

    /** Canlı önizleme etiketi — kullanıcı yazarken anında güncellenir */
    readonly livePreviewLabel = computed<LabelItem>(() => {
        const name    = this.manualName().trim();
        const barcode = this.manualBarcode().trim();
        // Kullanıcı bir şey yazdıysa onu göster, yoksa örnek veri
        return {
            id:      'live-preview',
            name:    name || 'MB ENAMEL PARLAK ANTRASİT 0,75 L',
            barcode: barcode || '8692070832814',
            qty:     1
        };
    });

    /** Kullanıcı form alanlarına dokunmuş mu? */
    readonly isFormTouched = computed(() =>
        this.manualName().trim().length > 0 || this.manualBarcode().trim().length > 0
    );

    constructor() {
        // Canlı önizleme: barkod veya isim değiştiğinde SVG'leri yeniden çiz
        effect(() => {
            // Signal'leri oku ki effect onları izlesin
            this.manualBarcode();
            this.manualName();
            this.selectedSizeId();
            // Bir sonraki AfterViewChecked'de SVG'leri render et
            this._barcodesDirty = true;
        });
    }

    ngOnInit(): void {}

    // ── AfterViewChecked: SVG'leri yenile ─────────────────────────────────────
    ngAfterViewChecked(): void {
        if (this._barcodesDirty) {
            this._barcodesDirty = false;
            this.renderPreviewBarcodes();
        }
    }

    private renderPreviewBarcodes(): void {
        this.barcodeEls?.forEach(ref => {
            const el  = ref.nativeElement;
            const val = el.getAttribute('data-barcode') ?? '';
            if (!val) return;
            try {
                JsBarcode(el, val, this.barcodeOptions(val, true));
            } catch { /* geçersiz barkod — görmezden gel */ }
        });
    }

    // ── Excel Import ──────────────────────────────────────────────────────────
    onFileInput(event: Event): void {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) this.parseExcel(file);
        (event.target as HTMLInputElement).value = '';
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        this.isDragging.set(false);
        const file = event.dataTransfer?.files?.[0];
        if (file) this.parseExcel(file);
    }

    onDragOver(e: DragEvent): void { e.preventDefault(); this.isDragging.set(true); }
    onDragLeave(): void { this.isDragging.set(false); }

    parseExcel(file: File): void {
        if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
            this.toast.error('Hata', 'Sadece .xlsx, .xls veya .csv dosyaları desteklenir.');
            return;
        }
        this.isLoading.set(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const wb   = XLSX.read(e.target!.result, { type: 'binary' });
                const ws   = wb.Sheets[wb.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: '' });

                if (rows.length === 0) {
                    this.toast.error('Hata', 'Dosya boş.');
                    return;
                }

                // Otomatik sütun tespiti — ilk satır başlık mı?
                const firstRow = (rows[0] as string[]).map(c => String(c ?? '').toLowerCase());
                const hasHeaders = firstRow.some(c =>
                    /barkod|barcode|ürün|urun|isim|name|ambalaj|paket|boyut/.test(c)
                );

                if (hasHeaders) {
                    // Başlık satırı bulundu → sütun eşleme panelini göster,
                    // ham satırları sakla, parsing'i kullanıcı onayına bırak
                    this.detectedHeaders = rows[0] as string[];
                    this.pendingRows     = rows.slice(1) as any[][];
                    this.autoDetectColumns(firstRow);
                    this.colMapApplied.set(false);
                    this.showColMap.set(true);
                    this.toast.success('Dosya Yüklendi', `${this.pendingRows.length} satır bulundu. Sütunları doğrulayıp "Uygula"ya basın.`);
                } else {
                    // Başlık yok → direkt parse et
                    this.parsePendingRows(rows as any[][]);
                }
            } catch (err) {
                this.toast.error('Hata', 'Excel dosyası okunamadı.');
            } finally {
                this.isLoading.set(false);
            }
        };
        reader.readAsBinaryString(file);
    }

    private autoDetectColumns(headers: string[]): void {
        headers.forEach((h, i) => {
            if (/ürün|urun|isim|name|ad\b/.test(h))  this.colName.set(i);
            if (/barkod|barcode|kod\b|ean/.test(h))   this.colBarcode.set(i);
        });
    }

    applyColMapping(): void {
        if (!this.pendingRows.length) return;
        this.parsePendingRows(this.pendingRows);
        this.pendingRows = [];
        this.colMapApplied.set(true);
    }

    /** Sütun seçimini sıfırla — kullanıcı dosyayı tekrar yükleyince yeni eşleme yapabilsin */
    resetColMap(): void {
        this.colMapApplied.set(false);
        this.showColMap.set(false);
        this.detectedHeaders = [];
    }

    private parsePendingRows(dataRows: any[][]): void {
        const parsed: LabelItem[] = dataRows
            .filter(r => r && String(r[this.colBarcode()] ?? '').trim() !== '')
            .map((r, i) => ({
                id:      `xl-${Date.now()}-${i}`,
                name:    String(r[this.colName()] ?? '').trim(),
                barcode: String(r[this.colBarcode()] ?? '').trim(),
                qty:     1
            }))
            .filter(item => item.barcode);

        this.items.update(prev => [...prev, ...parsed]);
        this._barcodesDirty = true;
        this.showPreview.set(true);
        this.toast.success('Başarılı', `${parsed.length} ürün listeye eklendi.`);
    }

    // ── Manuel Ekleme ─────────────────────────────────────────────────────────
    addManual(): void {
        if (!this.manualBarcode().trim()) {
            this.toast.error('Hata', 'Barkod zorunludur.');
            return;
        }
        this.items.update(prev => [...prev, {
            id:      `m-${Date.now()}`,
            name:    this.manualName().trim(),
            barcode: this.manualBarcode().trim(),
            qty:     Math.max(1, this.manualQty())
        }]);
        this.manualName.set('');
        this.manualBarcode.set('');
        this.manualQty.set(1);
        this._barcodesDirty = true;
        this.showPreview.set(true);
    }

    removeItem(id: string): void {
        this.items.update(prev => prev.filter(i => i.id !== id));
    }

    clearAll(): void {
        this.items.set([]);
        this.showPreview.set(false);
    }

    updateQty(id: string, qty: number): void {
        this.items.update(prev =>
            prev.map(i => i.id === id ? { ...i, qty: Math.max(1, qty) } : i)
        );
    }

    trackById(_: number, item: LabelItem): string { return item.id; }

    togglePreview(): void {
        this.showPreview.update(v => !v);
        if (this.showPreview()) this._barcodesDirty = true;
    }

    // ── Barkod Seçenekleri ────────────────────────────────────────────────────
    private barcodeOptions(val: string, preview = false): object {
        const isEan13  = /^\d{13}$/.test(val);
        const isEan8   = /^\d{8}$/.test(val);
        const size     = this.selectedSize();
        const scaleH   = preview ? 0.6 : 1;
        const barcodeH = Math.max(18, Math.round((size.h * 0.45) * scaleH));
        const lineW    = size.w >= 70 ? 1.4 : size.w >= 50 ? 1.2 : 1.0;
        return {
            format:       isEan13 ? 'EAN13' : isEan8 ? 'EAN8' : 'CODE128',
            width:        lineW,
            height:       barcodeH,
            displayValue: false,
            margin:       0,
            background:   'transparent',
            lineColor:    '#000000',
        };
    }

    // ── Barkod SVG String üret (print için) ───────────────────────────────────
    generateBarcodeSvg(barcode: string): string {
        if (!barcode) return '';
        try {
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            JsBarcode(svg, barcode, this.barcodeOptions(barcode, false));
            return svg.outerHTML;
        } catch { return ''; }
    }

    // ── Yazdır ────────────────────────────────────────────────────────────────
    print(): void {
        const labels = this.flatLabels();
        if (!labels.length) return;

        const size = this.selectedSize();
        const WIN_W = size.w + 2;
        const WIN_H = size.h + 2;
        const pw    = window.open('', '_blank', `width=${WIN_W * 4},height=${WIN_H * 4 + 60}`);
        if (!pw) { this.toast.error('Hata', 'Açılır pencere engellendi.'); return; }

        const labelsHtml = labels.map(item => this.buildLabelHtml(item, size)).join('\n');

        pw.document.write(`<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>Etiket Yazdır — ${size.label}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { background:#fff; }
  @page {
    size: ${size.w}mm ${size.h}mm;
    margin: 0;
  }
  .label {
    width: ${size.w}mm;
    height: ${size.h}mm;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    padding: ${size.h < 30 ? '1mm' : '2mm'} ${size.w < 40 ? '1.5mm' : '2.5mm'};
    page-break-after: always;
    background: #fff;
    font-family: Arial, Helvetica, sans-serif;
    text-align: center;
  }
  .label:last-child { page-break-after: avoid; }
  .lbl-name {
    font-size: ${this.nameFontPt(size)}pt;
    font-weight: 700;
    line-height: 1.25;
    color: #111;
    word-break: break-word;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: ${size.h < 30 ? 1 : size.h < 45 ? 2 : 3};
    -webkit-box-orient: vertical;
    text-align: center;
    width: 100%;
  }
  .lbl-barcode {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: auto;
    width: 100%;
  }
  .lbl-barcode svg {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 0 auto;
  }
  .lbl-barcode-num {
    font-size: ${this.barNumFontPt(size)}pt;
    letter-spacing: 0.5px;
    color: #222;
    margin-top: 0.3mm;
    font-family: 'Courier New', monospace;
    text-align: center;
  }
</style>
</head>
<body>
${labelsHtml}
<script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`);
        pw.document.close();
    }

    private buildLabelHtml(item: LabelItem, size: LabelSize): string {
        const svgStr = this.generateBarcodeSvg(item.barcode);
        return `
<div class="label">
  <div class="lbl-name">${this.esc(item.name)}</div>
  <div class="lbl-barcode">
    ${svgStr}
    <div class="lbl-barcode-num">${this.esc(item.barcode)}</div>
  </div>
</div>`;
    }

    // ── Font boyutu yardımcıları (pt) ─────────────────────────────────────────
    // Metin alanı ≈ genişliğin %90'ı → mm'yi pt'ye çevir (1mm ≈ 2.835pt)
    // Karakter başına tahmini genişlik: bold font ~0.62 × font-size (pt cinsinden)
    nameFontPt(s: LabelSize): number {
        const MM_TO_PT  = 2.835;
        const usableW   = s.w * 0.88;                 // padding çıkart (~2×2.5mm → %88'i)
        const usableH   = s.h * 0.40;                 // isim bölgesi yüksekliği ≈ yüksekliğin %40'ı
        // Genişlik kısıtı: en uzun kelimeye göre max tek satır font
        const maxByW    = (usableW * MM_TO_PT) / (s.w >= 89 ? 12 : s.w >= 58 ? 10 : 8);
        // Yükseklik kısıtı: 2 satır sığsın
        const lineH     = usableH * MM_TO_PT / 2.4;
        const raw       = Math.min(maxByW, lineH);
        return Math.min(14, Math.max(5.5, Math.round(raw * 2) / 2));  // 0.5pt adımlarla, max 14pt
    }
    barNumFontPt(s: LabelSize): number { return Math.max(4.5, this.nameFontPt(s) - 2.5); }

    // ── HTML escape ───────────────────────────────────────────────────────────
    private esc(s: string): string {
        return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    // ── Örnek Şablon İndir ────────────────────────────────────────────────────
    downloadTemplate(): void {
        const ws = XLSX.utils.aoa_to_sheet([
            ['Ürün Adı', 'Barkod'],
            ['MB ENAMEL PARLAK ANTRASİT 0,75 L', '8692070832814'],
            ['MB ASTAR AHŞAP KORUYUCU 1 L',      '8692070123456'],
            ['MB MAT İÇ CEPHE BOYASI 2,5 L',     '8692070789012'],
        ]);
        ws['!cols'] = [{ wch: 40 }, { wch: 18 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Etiketler');
        XLSX.writeFile(wb, 'etiket-sablonu.xlsx');
    }
}

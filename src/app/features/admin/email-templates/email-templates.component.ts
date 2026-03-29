import { Component, OnInit, OnDestroy, signal, inject, SecurityContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PlatformAdminService } from '../../../core/services/platform-admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmService } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import {
    EmailTemplateDto,
    UpdateEmailTemplateRequest,
    PlatformEmailCampaignStatus,
    PlatformEmailRecipientStatus,
    CampaignPreviewDto,
    EmailCampaignListItemDto,
    EmailCampaignDetailDto,
    EmailCampaignRecipientDto,
    EmailLogDto,
    CampaignFilter,
    EmailLogFilter,
    CreateCampaignRequest,
    CampaignPreviewRequest,
} from '../../../core/models/platform-admin.model';

// Değişken önerileri — template key'e göre
const TEMPLATE_VARS: Record<string, string[]> = {
    welcome:             ['{{TenantName}}', '{{TenantCode}}', '{{RecipientEmail}}', '{{LoginUrl}}'],
    invoice:             ['{{TenantName}}', '{{RecipientEmail}}', '{{InvoiceNo}}', '{{InvoiceDate}}', '{{Amount}}', '{{InvoiceUrl}}'],
    reminder:            ['{{TenantName}}', '{{RecipientEmail}}', '{{Amount}}', '{{DueDate}}', '{{DaysLeft}}', '{{PaymentUrl}}'],
    subscription_expiry: ['{{TenantName}}', '{{RecipientEmail}}', '{{PlanName}}', '{{ExpiryDate}}', '{{RenewalUrl}}'],
    password_reset:      ['{{TenantName}}', '{{RecipientEmail}}', '{{ResetLink}}', '{{ExpiryHours}}'],
};
const COMMON_VARS = ['{{TenantName}}', '{{TenantCode}}', '{{RecipientEmail}}'];

/** Önizleme için örnek değerler — tüm bilinen değişkenleri kapsar */
const SAMPLE_VALUES: Record<string, string> = {
    '{{TenantName}}':          'Örnek Şirket A.Ş.',
    '{{TenantCode}}':          'ornek-sirket',
    '{{RecipientEmail}}':      'demo@erp.local',
    '{{LoginUrl}}':            'https://app.erp.local/login',
    '{{Plan}}':                'Profesyonel',
    '{{SubscriptionStatus}}':  'Aktif',
    '{{SubscriptionEndDate}}': '31.03.2026',
    '{{InvoiceNo}}':           'INV-2026-0042',
    '{{InvoiceDate}}':         '25.03.2026',
    '{{Amount}}':              '₺1.499,00',
    '{{InvoiceUrl}}':          'https://app.erp.local/invoices/42',
    '{{DueDate}}':             '01.04.2026',
    '{{DaysLeft}}':            '7',
    '{{PaymentUrl}}':          'https://app.erp.local/payment',
    '{{PlanName}}':            'Profesyonel',
    '{{ExpiryDate}}':          '31.03.2026',
    '{{RenewalUrl}}':          'https://app.erp.local/renew',
    '{{ResetLink}}':           'https://app.erp.local/reset?token=abc123xyz',
    '{{ExpiryHours}}':         '24',
};

export type EmailTab = 'templates' | 'builder' | 'campaigns' | 'logs';

@Component({
    selector: 'app-email-templates',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './email-templates.component.html',
    styleUrl: './email-templates.component.css'
})
export class EmailTemplatesComponent implements OnInit, OnDestroy {
    private svc       = inject(PlatformAdminService);
    private toast     = inject(ToastService);
    private confirm   = inject(ConfirmService);
    private sanitizer = inject(DomSanitizer);

    // ─── Tab ──────────────────────────────────────────────────────────
    activeTab = signal<EmailTab>('templates');

    // ─── Templates ────────────────────────────────────────────────────
    templates          = signal<EmailTemplateDto[]>([]);
    isLoadingTemplates = signal(false);
    templateError      = signal<string | null>(null);
    selectedTemplate   = signal<EmailTemplateDto | null>(null);
    showEditPanel      = signal(false);
    isSaving           = signal(false);
    // edit form (regular props for ngModel)
    editSubject  = '';
    editBodyHtml = '';
    editIsActive = true;

    // ─── Preview Modal ────────────────────────────────────────────────
    showPreviewModal  = signal(false);
    isLoadingPreview  = signal(false);
    previewTemplate   = signal<EmailTemplateDto | null>(null);
    previewSubject    = signal('');
    previewBodySafe   = signal<SafeHtml>('');

    // ─── Campaign Builder ─────────────────────────────────────────────
    bName              = '';
    bDescription       = '';
    bTemplateKey       = '';
    bSendToAll         = true;
    bTenantIdsText     = '';
    bSendToAllUsers    = false;
    bUseSubjectOverride = false;
    bSubjectOverride   = '';
    bUseBodyOverride   = false;
    bBodyOverride      = '';
    bScheduledAt       = '';
    bIsHtml            = true;
    bVariables: { key: string; value: string }[] = [];
    bNewVarKey         = '';
    bNewVarValue       = '';
    isPreviewing       = signal(false);
    previewResult      = signal<CampaignPreviewDto | null>(null);
    isCreatingCampaign = signal(false);
    builderError       = signal<string | null>(null);

    // ─── Campaigns ────────────────────────────────────────────────────
    campaigns               = signal<EmailCampaignListItemDto[]>([]);
    isLoadingCampaigns      = signal(false);
    campaignError           = signal<string | null>(null);
    campaignQ               = '';
    campaignStatusFilter    = '';
    selectedCampaignDetail  = signal<EmailCampaignDetailDto | null>(null);
    showCampaignDetail      = signal(false);
    isLoadingCampaignDetail = signal(false);
    campaignRecipients      = signal<EmailCampaignRecipientDto[]>([]);
    isLoadingRecipients     = signal(false);
    recipientStatusFilter   = '';
    isQueuingCampaign       = signal(false);
    isCancellingCampaign    = signal(false);

    // ─── Logs ─────────────────────────────────────────────────────────
    logs           = signal<EmailLogDto[]>([]);
    isLoadingLogs  = signal(false);
    logError       = signal<string | null>(null);
    logQ           = '';
    logStatus      = '';
    logFrom        = '';
    logTo          = '';
    logCampaignId  = '';
    private _logDebounce: any = null;

    // Enum refs for template
    readonly CampaignStatus   = PlatformEmailCampaignStatus;
    readonly RecipientStatus  = PlatformEmailRecipientStatus;

    ngOnInit(): void {
        this.loadTemplates();
    }

    ngOnDestroy(): void {
        if (this._logDebounce) clearTimeout(this._logDebounce);
    }

    /** XSS koruması — HTML önizleme içeriğini sanitize eder */
    get sanitizedBodyHtml(): string {
        const raw = this.editBodyHtml || '<span style="opacity:.4">İçerik yok</span>';
        return this.sanitizer.sanitize(SecurityContext.HTML, raw) || '';
    }

    // ─── Tab ──────────────────────────────────────────────────────────

    switchTab(tab: EmailTab): void {
        this.activeTab.set(tab);
        this.showEditPanel.set(false);
        this.showCampaignDetail.set(false);
        if (tab === 'campaigns') this.loadCampaigns();
        if (tab === 'logs')      this.loadLogs();
    }

    // ─── Templates ────────────────────────────────────────────────────

    loadTemplates(): void {
        this.isLoadingTemplates.set(true);
        this.templateError.set(null);
        this.svc.getEmailTemplates().subscribe({
            next: (data) => {
                // Backend bir array dönmeli; farklı sarmalama varsa düzelt
                const list = Array.isArray(data) ? data : (data as any)?.items ?? (data as any)?.data ?? [];
                this.templates.set(list);
                this.isLoadingTemplates.set(false);
            },
            error: (err) => {
                const status  = err.status ?? 0;
                const detail  = err.error?.detail ?? err.error?.message ?? err.message ?? '';
                const display = detail
                    ? `[${status}] ${detail}`
                    : status === 0
                        ? 'Sunucuya ulaşılamıyor. Backend çalışıyor mu?'
                        : status === 401 || status === 403
                            ? `[${status}] Yetki hatası — lütfen tekrar giriş yapın.`
                            : status === 404
                                ? `[404] Endpoint bulunamadı: /api/platform-admin/email/templates`
                                : `[${status}] Şablonlar yüklenemedi.`;
                console.error('[EmailTemplates] loadTemplates error', err);
                this.templateError.set(display);
                this.isLoadingTemplates.set(false);
            }
        });
    }

    openEditPanel(t: EmailTemplateDto): void {
        this.selectedTemplate.set(t);
        this.editSubject  = t.subjectTemplate;
        this.editBodyHtml = t.bodyTemplate;
        this.editIsActive = t.isActive;
        this.showEditPanel.set(true);
    }

    closeEditPanel(): void {
        this.showEditPanel.set(false);
        this.selectedTemplate.set(null);
    }

    saveTemplate(): void {
        const t = this.selectedTemplate();
        if (!t || !this.editSubject.trim()) return;
        this.isSaving.set(true);

        // Profesyonel tasarımı otomatik uygula (her zaman)
        const wrappedBody = this.generateFullEmailHtml(
            t.key,
            this.editBodyHtml || '<p>İçerik buraya gelecek.</p>'
        );

        const req: UpdateEmailTemplateRequest = {
            subjectTemplate: this.editSubject,
            bodyTemplate:    wrappedBody,
            isActive:        this.editIsActive,
        };
        this.svc.updateEmailTemplate(t.key, req).subscribe({
            next: () => {
                this.templates.update(list => list.map(x =>
                    x.key === t.key
                        ? { ...x, subjectTemplate: this.editSubject, bodyTemplate: wrappedBody, isActive: this.editIsActive, updatedAtUtc: new Date().toISOString() }
                        : x
                ));
                this.toast.success('Kaydedildi', `"${t.name}" şablonu güncellendi`);
                this.isSaving.set(false);
                this.closeEditPanel();
            },
            error: (err) => {
                this.toast.error('Hata', err.error?.detail || 'Güncelleme başarısız.');
                this.isSaving.set(false);
            }
        });
    }

    insertVar(v: string): void {
        this.editBodyHtml += v;
    }

    // ─── Preview Modal ─────────────────────────────────────────────────

    /** Template listesindeki göz ikonuna tıklandığında — API'den taze veri çeker */
    openPreviewFromList(t: EmailTemplateDto, event: Event): void {
        event.stopPropagation();
        this.previewTemplate.set(t);
        this.showPreviewModal.set(true);
        this.isLoadingPreview.set(true);

        this.svc.getEmailTemplate(t.key).subscribe({
            next: (data) => {
                this.previewTemplate.set(data);
                this.buildPreview(data.subjectTemplate, data.bodyTemplate);
                this.isLoadingPreview.set(false);
            },
            error: () => {
                // API hatası → listeden gelen önbellek veri ile devam
                this.buildPreview(t.subjectTemplate, t.bodyTemplate);
                this.isLoadingPreview.set(false);
            }
        });
    }

    /** Edit panelindeki "Önizle" butonuna tıklandığında — formun anlık değerini gösterir */
    openPreviewFromEditor(): void {
        if (!this.selectedTemplate()) return;
        this.previewTemplate.set(this.selectedTemplate());
        this.buildPreview(this.editSubject, this.editBodyHtml);
        this.showPreviewModal.set(true);
        this.isLoadingPreview.set(false);
    }

    closePreview(): void {
        this.showPreviewModal.set(false);
        this.previewTemplate.set(null);
    }

    /** Değişkenleri çözer, tam email HTML'i sarmalayarak SafeHtml üretir */
    private buildPreview(subject: string, body: string): void {
        this.previewSubject.set(this.resolveVars(subject));
        const resolvedBody  = this.resolveVars(body);
        const key           = this.previewTemplate()?.key ?? '';
        const fullHtml      = this.generateFullEmailHtml(key, resolvedBody);
        this.previewBodySafe.set(this.sanitizer.bypassSecurityTrustHtml(fullHtml));
    }

    /**
     * Tüm e-postalar için kullanılan tam HTML email wrapper'ı.
     * body parametresi sadece <body> içindeki içerik bölümüdür.
     */
    generateFullEmailHtml(key: string, body: string): string {
        const titles: Record<string, string> = {
            welcome:             'Hoş Geldiniz!',
            invoice:             'Fatura Bilgilendirmesi',
            reminder:            'Ödeme Hatırlatması',
            subscription_expiry: 'Abonelik Bitiyor',
            password_reset:      'Şifre Sıfırlama',
        };
        const headerTitle = titles[key] ?? 'Bilgilendirme';
        const isEmpty = !body?.trim();

        return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${headerTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f2f8;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" border="0"
       style="background-color:#f0f2f8;padding:40px 16px">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" border="0"
           style="max-width:600px;width:100%;background:#ffffff;
                  border-radius:16px;overflow:hidden;
                  box-shadow:0 4px 24px rgba(0,0,0,0.10)">

      <!-- HEADER -->
      <tr>
        <td style="background:linear-gradient(135deg,#f97316 0%,#ea580c 100%);
                   padding:36px 48px;text-align:center">
          <div style="font-size:28px;font-weight:800;color:#ffffff;
                      letter-spacing:-1px;font-family:Arial,sans-serif">
            ERP<span style="opacity:0.55">v2</span>
          </div>
          <div style="color:rgba(255,255,255,0.72);font-size:13px;
                      margin-top:6px;letter-spacing:0.3px">
            Kurumsal Yönetim Sistemi
          </div>
        </td>
      </tr>

      <!-- TITLE BAR -->
      <tr>
        <td style="background:#fafbff;padding:20px 48px 16px;
                   border-bottom:2px solid #eef0fb">
          <p style="margin:0;font-size:20px;font-weight:700;
                    color:#1e2433;letter-spacing:-0.3px">${headerTitle}</p>
        </td>
      </tr>

      <!-- BODY CONTENT -->
      <tr>
        <td style="padding:32px 48px 28px;color:#374151;
                   font-size:15px;line-height:1.8">
          ${isEmpty
              ? '<p style="color:#aaa;text-align:center;padding:20px 0">İçerik henüz eklenmedi.</p>'
              : body}
        </td>
      </tr>

      <!-- DIVIDER -->
      <tr>
        <td style="padding:0 48px">
          <div style="height:1px;background:#eef0fb"></div>
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="background:#f8f9ff;padding:24px 48px 32px;
                   text-align:center">
          <p style="margin:0 0 6px;font-size:12px;color:#9ca3af">
            Bu e-posta ERPv2 Platformu tarafından otomatik olarak gönderilmiştir.
          </p>
          <p style="margin:0 0 16px;font-size:12px;color:#9ca3af">
            Yardım için
            <a href="mailto:destek@erp.local"
               style="color:#f97316;text-decoration:none">
              destek@erp.local
            </a>
          </p>
          <p style="margin:0;font-size:11px;color:#d1d5db">
            &copy; 2026 ERPv2 &mdash; Tüm hakları saklıdır.
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
    }

    /** {{Değişken}} → örnek değer */
    private resolveVars(template: string): string {
        if (!template) return '';
        let result = template;
        for (const [placeholder, value] of Object.entries(SAMPLE_VALUES)) {
            result = result.split(placeholder).join(value);
        }
        return result;
    }

    templateVars(key: string): string[] {
        return TEMPLATE_VARS[key] ?? COMMON_VARS;
    }

    typeIcon(key: string): string {
        const map: Record<string, string> = {
            welcome:             'waving_hand',
            invoice:             'receipt',
            reminder:            'alarm',
            subscription_expiry: 'card_membership',
            password_reset:      'lock_reset',
        };
        return map[key] ?? 'mail';
    }

    // ─── Builder ──────────────────────────────────────────────────────

    private get builderRequest(): CreateCampaignRequest {
        const tenantIds = this.bSendToAll
            ? undefined
            : this.bTenantIdsText.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
        const variables = this.bVariables.length
            ? Object.fromEntries(this.bVariables.map(v => [v.key, v.value]))
            : undefined;
        return {
            name:                  this.bName,
            description:           this.bDescription || undefined,
            templateKey:           this.bTemplateKey,
            tenantIds,
            sendToAllActiveTenants: this.bSendToAll,
            sendToAllTenantUsers:   this.bSendToAllUsers,
            subjectOverride: this.bUseSubjectOverride ? this.bSubjectOverride : undefined,
            bodyOverride:    this.bUseBodyOverride    ? this.bBodyOverride    : undefined,
            variables,
            scheduledAtUtc:  this.bScheduledAt ? new Date(this.bScheduledAt).toISOString() : undefined,
            isHtml:          this.bIsHtml,
        };
    }

    preview(): void {
        if (!this.bTemplateKey) { this.builderError.set('Lütfen bir şablon seçin.'); return; }
        this.isPreviewing.set(true);
        this.previewResult.set(null);
        this.builderError.set(null);
        const req = this.builderRequest;
        const previewReq: CampaignPreviewRequest = {
            templateKey:           req.templateKey,
            tenantIds:             req.tenantIds,
            sendToAllActiveTenants: req.sendToAllActiveTenants,
            sendToAllTenantUsers:   req.sendToAllTenantUsers,
        };
        this.svc.previewCampaign(previewReq).subscribe({
            next: (data) => { this.previewResult.set(data); this.isPreviewing.set(false); },
            error: (err) => {
                this.builderError.set(err.error?.detail || 'Önizleme başarısız.');
                this.isPreviewing.set(false);
            }
        });
    }

    createCampaign(): void {
        if (!this.bName.trim() || !this.bTemplateKey) {
            this.builderError.set('Kampanya adı ve şablon seçimi zorunludur.');
            return;
        }
        this.isCreatingCampaign.set(true);
        this.builderError.set(null);
        this.svc.createCampaign(this.builderRequest).subscribe({
            next: (data) => {
                this.isCreatingCampaign.set(false);
                this.toast.success('Kampanya Oluşturuldu', `"${data.name}" taslak olarak kaydedildi`);
                this.resetBuilder();
                this.switchTab('campaigns');
            },
            error: (err) => {
                this.builderError.set(err.error?.detail || 'Kampanya oluşturulamadı.');
                this.isCreatingCampaign.set(false);
            }
        });
    }

    resetBuilder(): void {
        this.bName = ''; this.bDescription = ''; this.bTemplateKey = '';
        this.bSendToAll = true; this.bTenantIdsText = ''; this.bSendToAllUsers = false;
        this.bUseSubjectOverride = false; this.bSubjectOverride = '';
        this.bUseBodyOverride = false; this.bBodyOverride = '';
        this.bScheduledAt = ''; this.bIsHtml = true;
        this.bVariables = []; this.bNewVarKey = ''; this.bNewVarValue = '';
        this.previewResult.set(null);
        this.builderError.set(null);
    }

    addVar(): void {
        if (!this.bNewVarKey.trim()) return;
        this.bVariables = [...this.bVariables, { key: this.bNewVarKey.trim(), value: this.bNewVarValue }];
        this.bNewVarKey = ''; this.bNewVarValue = '';
    }

    removeVar(i: number): void {
        this.bVariables = this.bVariables.filter((_, idx) => idx !== i);
    }

    // ─── Campaigns ────────────────────────────────────────────────────

    loadCampaigns(): void {
        this.isLoadingCampaigns.set(true);
        this.campaignError.set(null);
        const filter: CampaignFilter = {
            q:        this.campaignQ || undefined,
            status:   this.campaignStatusFilter ? Number(this.campaignStatusFilter) : undefined,
            page:     1,
            pageSize: 50,
        };
        this.svc.getCampaigns(filter).subscribe({
            next: (data) => { this.campaigns.set(data); this.isLoadingCampaigns.set(false); },
            error: (err) => {
                this.campaignError.set(err.error?.detail || 'Kampanyalar yüklenemedi.');
                this.isLoadingCampaigns.set(false);
            }
        });
    }

    openCampaignDetail(c: EmailCampaignListItemDto): void {
        this.showCampaignDetail.set(true);
        this.selectedCampaignDetail.set(null);
        this.campaignRecipients.set([]);
        this.isLoadingCampaignDetail.set(true);
        this.svc.getCampaignDetail(c.campaignId).subscribe({
            next: (detail) => {
                this.selectedCampaignDetail.set(detail);
                this.isLoadingCampaignDetail.set(false);
                this.loadRecipients(c.campaignId);
            },
            error: () => this.isLoadingCampaignDetail.set(false)
        });
    }

    closeCampaignDetail(): void {
        this.showCampaignDetail.set(false);
        this.selectedCampaignDetail.set(null);
        this.campaignRecipients.set([]);
    }

    loadRecipients(campaignId: string): void {
        this.isLoadingRecipients.set(true);
        const status = this.recipientStatusFilter ? Number(this.recipientStatusFilter) : undefined;
        this.svc.getCampaignRecipients(campaignId, status).subscribe({
            next: (data) => { this.campaignRecipients.set(data); this.isLoadingRecipients.set(false); },
            error: () => this.isLoadingRecipients.set(false)
        });
    }

    async queueCampaign(campaignId: string, event?: Event): Promise<void> {
        event?.stopPropagation();
        const confirmed = await this.confirm.confirm({
            title:       'Kuyruğa Al',
            message:     'Kampanyayı kuyruğa almak istediğinize emin misiniz? Gönderim başlayacaktır.',
            confirmText: 'Kuyruğa Al',
            type:        'primary'
        });
        if (!confirmed) return;
        this.isQueuingCampaign.set(true);
        this.svc.queueCampaign(campaignId).subscribe({
            next: () => {
                this.toast.success('Kuyruğa Alındı', 'Kampanya gönderim kuyruğuna eklendi');
                this.isQueuingCampaign.set(false);
                this.loadCampaigns();
                if (this.selectedCampaignDetail()?.campaignId === campaignId) {
                    this.openCampaignDetail({ campaignId } as any);
                }
            },
            error: (err) => {
                this.toast.error('Hata', err.error?.detail || 'İşlem başarısız.');
                this.isQueuingCampaign.set(false);
            }
        });
    }

    async cancelCampaign(campaignId: string, event?: Event): Promise<void> {
        event?.stopPropagation();
        const confirmed = await this.confirm.confirm({
            title:       'Kampanyayı İptal Et',
            message:     'Bu kampanyayı iptal etmek istediğinize emin misiniz?',
            confirmText: 'İptal Et',
            type:        'danger'
        });
        if (!confirmed) return;
        this.isCancellingCampaign.set(true);
        this.svc.cancelCampaign(campaignId).subscribe({
            next: () => {
                this.toast.success('İptal Edildi', 'Kampanya iptal edildi');
                this.isCancellingCampaign.set(false);
                this.closeCampaignDetail();
                this.loadCampaigns();
            },
            error: (err) => {
                this.toast.error('Hata', err.error?.detail || 'İptal başarısız.');
                this.isCancellingCampaign.set(false);
            }
        });
    }

    canQueue(status: PlatformEmailCampaignStatus): boolean {
        return status === PlatformEmailCampaignStatus.Draft || status === PlatformEmailCampaignStatus.Scheduled;
    }

    canCancel(status: PlatformEmailCampaignStatus): boolean {
        return [
            PlatformEmailCampaignStatus.Draft,
            PlatformEmailCampaignStatus.Scheduled,
            PlatformEmailCampaignStatus.Queued,
        ].includes(status);
    }

    // ─── Logs ─────────────────────────────────────────────────────────

    loadLogs(): void {
        this.isLoadingLogs.set(true);
        this.logError.set(null);
        const filter: EmailLogFilter = {
            q:          this.logQ          || undefined,
            status:     this.logStatus     || undefined,
            fromUtc:    this.logFrom       || undefined,
            toUtc:      this.logTo         || undefined,
            campaignId: this.logCampaignId || undefined,
            page: 1, pageSize: 100,
        };
        this.svc.getEmailLogs(filter).subscribe({
            next: (data) => { this.logs.set(data); this.isLoadingLogs.set(false); },
            error: (err) => {
                this.logError.set(err.error?.detail || 'Loglar yüklenemedi.');
                this.isLoadingLogs.set(false);
            }
        });
    }

    onLogFilterChange(): void {
        if (this._logDebounce) clearTimeout(this._logDebounce);
        this._logDebounce = setTimeout(() => this.loadLogs(), 400);
    }

    // ─── Helpers ──────────────────────────────────────────────────────

    campaignStatusLabel(status: PlatformEmailCampaignStatus): string {
        const map: Record<number, string> = {
            1: 'Taslak', 2: 'Zamanlandı', 3: 'Kuyruğa Alındı',
            4: 'İşleniyor', 5: 'Tamamlandı', 6: 'Hata ile Bitti', 7: 'İptal Edildi',
        };
        return map[status] ?? String(status);
    }

    campaignStatusClass(status: PlatformEmailCampaignStatus): string {
        const map: Record<number, string> = {
            1: 'cs-draft', 2: 'cs-scheduled', 3: 'cs-queued',
            4: 'cs-processing', 5: 'cs-completed', 6: 'cs-errors', 7: 'cs-cancelled',
        };
        return map[status] ?? '';
    }

    recipientStatusLabel(status: PlatformEmailRecipientStatus): string {
        const map: Record<number, string> = {
            1: 'Bekliyor', 2: 'Gönderildi', 3: 'Başarısız', 4: 'Atlandı', 5: 'İptal',
        };
        return map[status] ?? String(status);
    }

    recipientStatusClass(status: PlatformEmailRecipientStatus): string {
        const map: Record<number, string> = {
            1: 'rs-pending', 2: 'rs-sent', 3: 'rs-failed', 4: 'rs-skipped', 5: 'rs-cancelled',
        };
        return map[status] ?? '';
    }

    logStatusClass(status: string): string {
        if (status === 'Sent')    return 'rs-sent';
        if (status === 'Failed')  return 'rs-failed';
        if (status === 'Pending') return 'rs-pending';
        return '';
    }

    campaignProgress(c: EmailCampaignListItemDto): number {
        if (!c.recipientCount) return 0;
        return Math.round(((c.sentCount + c.failedCount) / c.recipientCount) * 100);
    }

    formatDate(iso?: string | null): string {
        if (!iso) return '—';
        return new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    formatDateTime(iso?: string | null): string {
        if (!iso) return '—';
        return new Date(iso).toLocaleString('tr-TR', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    }

    fmtVar(key: string): string {
        return `{{${key}}}`;
    }
}

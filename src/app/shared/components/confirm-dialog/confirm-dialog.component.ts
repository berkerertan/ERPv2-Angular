import { Component, signal, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ConfirmService {
    isOpen = signal(false);
    title = signal('');
    message = signal('');
    confirmText = signal('Onayla');
    cancelText = signal('İptal');
    confirmType = signal<'danger' | 'primary' | 'warning'>('danger');
    private resolveCallback: ((result: boolean) => void) | null = null;

    confirm(options: {
        title: string;
        message: string;
        confirmText?: string;
        cancelText?: string;
        type?: 'danger' | 'primary' | 'warning';
    }): Promise<boolean> {
        this.title.set(options.title);
        this.message.set(options.message);
        this.confirmText.set(options.confirmText || 'Onayla');
        this.cancelText.set(options.cancelText || 'İptal');
        this.confirmType.set(options.type || 'danger');
        this.isOpen.set(true);

        return new Promise<boolean>(resolve => {
            this.resolveCallback = resolve;
        });
    }

    handleResult(result: boolean): void {
        this.isOpen.set(false);
        if (this.resolveCallback) {
            this.resolveCallback(result);
            this.resolveCallback = null;
        }
    }
}

@Component({
    selector: 'app-confirm-dialog',
    standalone: true,
    imports: [CommonModule],
    template: `
    @if (confirmService.isOpen()) {
      <div class="confirm-overlay" (click)="confirmService.handleResult(false)"></div>
      <div class="confirm-dialog">
        <div class="confirm-icon" [attr.data-type]="confirmService.confirmType()">
          <span class="material-icons-outlined">
            @switch (confirmService.confirmType()) {
              @case ('danger') { warning }
              @case ('warning') { help_outline }
              @case ('primary') { info }
            }
          </span>
        </div>
        <h3 class="confirm-title">{{ confirmService.title() }}</h3>
        <p class="confirm-message">{{ confirmService.message() }}</p>
        <div class="confirm-actions">
          <button class="btn btn-secondary" (click)="confirmService.handleResult(false)">
            {{ confirmService.cancelText() }}
          </button>
          <button class="btn"
            [class.btn-danger]="confirmService.confirmType() === 'danger'"
            [class.btn-primary]="confirmService.confirmType() === 'primary'"
            [class.btn-warning]="confirmService.confirmType() === 'warning'"
            (click)="confirmService.handleResult(true)">
            {{ confirmService.confirmText() }}
          </button>
        </div>
      </div>
    }
  `,
    styles: [`
    .confirm-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 10001;
      animation: fadeIn 0.15s ease;
    }

    .confirm-dialog {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xl);
      padding: var(--space-7);
      max-width: 400px;
      width: calc(100% - var(--space-8));
      z-index: 10002;
      text-align: center;
      box-shadow: var(--shadow-xl);
      animation: fadeInUp 0.2s ease;
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translate(-50%, -48%); }
      to { opacity: 1; transform: translate(-50%, -50%); }
    }

    .confirm-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto var(--space-4);
    }

    .confirm-icon[data-type="danger"] { background: var(--danger-bg); color: var(--danger); }
    .confirm-icon[data-type="warning"] { background: var(--warning-bg); color: var(--warning); }
    .confirm-icon[data-type="primary"] { background: rgba(76,110,245,0.12); color: var(--primary-400); }

    .confirm-icon .material-icons-outlined { font-size: 24px; }

    .confirm-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: var(--space-2);
    }

    .confirm-message {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-bottom: var(--space-6);
      line-height: 1.5;
    }

    .confirm-actions {
      display: flex;
      gap: var(--space-3);
      justify-content: center;
    }

    .confirm-actions .btn {
      min-width: 100px;
    }

    .btn-danger {
      background: var(--danger);
      color: white;
    }
    .btn-danger:hover {
      background: #e03131;
    }
    .btn-warning {
      background: var(--warning);
      color: #1a1a2e;
    }
  `]
})
export class ConfirmDialogComponent {
    constructor(public confirmService: ConfirmService) { }
}

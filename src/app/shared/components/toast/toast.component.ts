import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
    selector: 'app-toast',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [attr.data-type]="toast.type" (click)="toastService.dismiss(toast.id)">
          <div class="toast-icon">
            <span class="material-icons-outlined">
              @switch (toast.type) {
                @case ('success') { check_circle }
                @case ('error') { error }
                @case ('warning') { warning }
                @case ('info') { info }
              }
            </span>
          </div>
          <div class="toast-content">
            <div class="toast-title">{{ toast.title }}</div>
            @if (toast.message) {
              <div class="toast-message">{{ toast.message }}</div>
            }
          </div>
          <button class="toast-close">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>
      }
    </div>
  `,
    styles: [`
    .toast-container {
      position: fixed;
      top: calc(var(--header-height) + var(--space-4));
      right: var(--space-4);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      max-width: 380px;
      width: 100%;
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      animation: slideInRight 0.3s ease forwards;
      cursor: pointer;
      pointer-events: auto;
      backdrop-filter: blur(12px);
    }

    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    .toast[data-type="success"] { border-left: 3px solid var(--success); }
    .toast[data-type="error"] { border-left: 3px solid var(--danger); }
    .toast[data-type="warning"] { border-left: 3px solid var(--warning); }
    .toast[data-type="info"] { border-left: 3px solid var(--info); }

    .toast-icon { flex-shrink: 0; padding-top: 2px; }
    .toast[data-type="success"] .toast-icon { color: var(--success); }
    .toast[data-type="error"] .toast-icon { color: var(--danger); }
    .toast[data-type="warning"] .toast-icon { color: var(--warning); }
    .toast[data-type="info"] .toast-icon { color: var(--info); }

    .toast-icon .material-icons-outlined { font-size: 20px; }

    .toast-content { flex: 1; min-width: 0; }
    .toast-title { font-size: 0.8125rem; font-weight: 600; color: var(--text-primary); }
    .toast-message { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }

    .toast-close {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-sm);
      color: var(--text-muted);
      transition: all var(--transition-fast);
    }

    .toast-close:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
    }

    .toast-close .material-icons-outlined { font-size: 16px; }

    @media (max-width: 480px) {
      .toast-container {
        left: var(--space-4);
        right: var(--space-4);
        max-width: none;
      }
    }
  `]
})
export class ToastComponent {
    constructor(public toastService: ToastService) { }
}

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-loading',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="loading-container" [class.full-page]="fullPage" [class.overlay]="hasOverlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        @if (message) {
          <p class="loading-text">{{ message }}</p>
        }
      </div>
    </div>
  `,
    styles: [`
    .loading-container {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-8);
    }

    .loading-container.full-page {
      position: fixed;
      inset: 0;
      z-index: 9999;
      padding: 0;
    }

    .loading-container.overlay {
      background: rgba(10, 11, 20, 0.6);
      backdrop-filter: blur(4px);
    }

    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-4);
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--border-color);
      border-top-color: var(--primary-500);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-text {
      font-size: 0.875rem;
      color: var(--text-muted);
    }
  `]
})
export class LoadingComponent {
    @Input() message = '';
    @Input() fullPage = false;
    @Input() hasOverlay = false;
}

import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
    id: number;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
    private nextId = 0;
    toasts = signal<ToastMessage[]>([]);

    show(type: ToastMessage['type'], title: string, message: string, duration = 4000): void {
        const id = this.nextId++;
        const toast: ToastMessage = { id, type, title, message, duration };
        this.toasts.update(list => [...list, toast]);

        if (duration > 0) {
            setTimeout(() => this.dismiss(id), duration);
        }
    }

    success(title: string, message = ''): void { this.show('success', title, message); }
    error(title: string, message = ''): void { this.show('error', title, message, 6000); }
    warning(title: string, message = ''): void { this.show('warning', title, message); }
    info(title: string, message = ''): void { this.show('info', title, message); }

    dismiss(id: number): void {
        this.toasts.update(list => list.filter(t => t.id !== id));
    }

    clear(): void {
        this.toasts.set([]);
    }
}

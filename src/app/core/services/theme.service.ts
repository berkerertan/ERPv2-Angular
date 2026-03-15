import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
    isDark = signal(true);

    constructor() {
        const saved = localStorage.getItem('theme');
        if (saved === 'light') {
            this.isDark.set(false);
            document.documentElement.classList.add('light-mode');
        }
    }

    toggle(): void {
        const next = !this.isDark();
        this.isDark.set(next);
        if (next) {
            document.documentElement.classList.remove('light-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
        }
    }
}

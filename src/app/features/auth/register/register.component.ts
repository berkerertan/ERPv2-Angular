import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';

interface RegisterForm {
    fullName: string;
    email: string;
    phone: string;
    companyName: string;
    password: string;
    passwordConfirm: string;
    selectedPlan: string;
    agreeTerms: boolean;
}

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './register.component.html',
    styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
    currentStep = signal(1);
    isLoading = signal(false);
    errorMessage = signal('');
    showPassword = signal(false);
    showPasswordConfirm = signal(false);

    form: RegisterForm = {
        fullName: '',
        email: '',
        phone: '',
        companyName: '',
        password: '',
        passwordConfirm: '',
        selectedPlan: 'pro',
        agreeTerms: false
    };

    plans = [
        {
            id: 'starter',
            name: 'Başlangıç',
            icon: 'rocket_launch',
            price: 299,
            description: '1 şube • 3 kullanıcı',
            color: 'blue'
        },
        {
            id: 'pro',
            name: 'Profesyonel',
            icon: 'workspace_premium',
            price: 699,
            description: '3 şube • 10 kullanıcı',
            color: 'purple',
            popular: true
        },
        {
            id: 'enterprise',
            name: 'Kurumsal',
            icon: 'domain',
            price: 1499,
            description: 'Sınırsız şube & kullanıcı',
            color: 'gold'
        }
    ];

    constructor(
        private router: Router,
        private route: ActivatedRoute
    ) {}

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            if (params['plan'] && ['starter', 'pro', 'enterprise'].includes(params['plan'])) {
                this.form.selectedPlan = params['plan'];
            }
        });
    }

    get selectedPlan() {
        return this.plans.find(p => p.id === this.form.selectedPlan)!;
    }

    nextStep() {
        this.errorMessage.set('');
        if (this.currentStep() === 1) {
            if (!this.form.fullName.trim() || !this.form.email.trim() || !this.form.phone.trim()) {
                this.errorMessage.set('Lütfen tüm alanları doldurun.');
                return;
            }
            if (!this.isValidEmail(this.form.email)) {
                this.errorMessage.set('Geçerli bir e-posta adresi girin.');
                return;
            }
        }
        if (this.currentStep() === 2) {
            if (!this.form.companyName.trim()) {
                this.errorMessage.set('İşletme adını girin.');
                return;
            }
            if (!this.form.password || this.form.password.length < 6) {
                this.errorMessage.set('Şifre en az 6 karakter olmalıdır.');
                return;
            }
            if (this.form.password !== this.form.passwordConfirm) {
                this.errorMessage.set('Şifreler eşleşmiyor.');
                return;
            }
        }
        this.currentStep.update(s => s + 1);
    }

    prevStep() {
        this.errorMessage.set('');
        this.currentStep.update(s => s - 1);
    }

    onSubmit() {
        this.errorMessage.set('');
        if (!this.form.agreeTerms) {
            this.errorMessage.set('Kullanım şartlarını kabul etmeniz gerekmektedir.');
            return;
        }

        this.isLoading.set(true);

        // Simulate API call
        setTimeout(() => {
            this.isLoading.set(false);
            this.router.navigate(['/auth/login'], {
                queryParams: { registered: 'true', email: this.form.email }
            });
        }, 1500);
    }

    private isValidEmail(email: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    getStepLabel(step: number): string {
        const labels = ['Kişisel Bilgiler', 'İşletme & Şifre', 'Plan Seçimi'];
        return labels[step - 1];
    }
}

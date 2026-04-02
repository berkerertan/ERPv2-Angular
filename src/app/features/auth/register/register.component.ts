import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SocialAuthService } from '../../../core/services/social-auth.service';
import { SubscriptionPlan } from '../../../core/models/user.model';

interface RegisterForm {
    fullName: string;
    email: string;
    phone: string;
    companyName: string;
    password: string;
    passwordConfirm: string;
    selectedPlan: string;
    agreeTerms: boolean;
    // Payment fields
    cardName: string;
    cardNumber: string;
    cardExpiry: string;
    cardCvc: string;
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

    private socialAuth = inject(SocialAuthService);
    registerWithGoogle(): void { this.socialAuth.initiateGoogle(); }
    registerWithGithub(): void { this.socialAuth.initiateGithub(); }

    form: RegisterForm = {
        fullName: '',
        email: '',
        phone: '',
        companyName: '',
        password: '',
        passwordConfirm: '',
        selectedPlan: 'pro',
        agreeTerms: false,
        cardName: '',
        cardNumber: '',
        cardExpiry: '',
        cardCvc: ''
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

    readonly totalSteps = 4;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private authService: AuthService
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
        // Step 3 (Ödeme) has no mandatory validation — skip is allowed
        this.currentStep.update(s => s + 1);
    }

    prevStep() {
        this.errorMessage.set('');
        this.currentStep.update(s => s - 1);
    }

    /** Skip payment step entirely */
    skipPayment(): void {
        this.errorMessage.set('');
        this.form.cardName = '';
        this.form.cardNumber = '';
        this.form.cardExpiry = '';
        this.form.cardCvc = '';
        this.currentStep.update(s => s + 1);
    }

    onSubmit() {
        this.errorMessage.set('');
        if (!this.form.agreeTerms) {
            this.errorMessage.set('Kullanım şartlarını kabul etmeniz gerekmektedir.');
            return;
        }

        this.isLoading.set(true);

        const planMap: Record<string, SubscriptionPlan> = {
            starter: SubscriptionPlan.Starter,
            pro: SubscriptionPlan.Pro,
            enterprise: SubscriptionPlan.Enterprise
        };

        // Clear sensitive payment data before API call
        this.form.cardNumber = '';
        this.form.cardCvc = '';
        this.form.cardExpiry = '';
        this.form.cardName = '';

        this.authService.registerSaas({
            userName: this.form.email,
            email: this.form.email,
            password: this.form.password,
            companyName: this.form.companyName,
            plan: planMap[this.form.selectedPlan] || SubscriptionPlan.Starter
        }).subscribe({
            next: () => {
                this.isLoading.set(false);
                this.form.password = '';
                this.form.passwordConfirm = '';
                this.router.navigate(['/auth/login'], {
                    queryParams: {
                        verifyEmailPending: '1',
                        email: this.form.email
                    }
                });
            },
            error: (err) => {
                this.isLoading.set(false);
                this.errorMessage.set(err.error?.detail || err.error?.message || 'Kayıt başarısız. Lütfen bilgilerinizi kontrol edin.');
            }
        });
    }

    private isValidEmail(email: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    getStepLabel(step: number): string {
        const labels = ['Kişisel Bilgiler', 'İşletme & Şifre', 'Ödeme', 'Plan Seçimi'];
        return labels[step - 1];
    }

    getStepIcon(step: number): string {
        const icons = ['person', 'business', 'credit_card', 'verified'];
        return icons[step - 1];
    }

    /** Format card number with spaces every 4 digits */
    formatCardNumber(): void {
        let val = this.form.cardNumber.replace(/\D/g, '');
        if (val.length > 16) val = val.substring(0, 16);
        this.form.cardNumber = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    }

    /** Format expiry as MM/YY */
    formatExpiry(): void {
        let val = this.form.cardExpiry.replace(/\D/g, '');
        if (val.length > 4) val = val.substring(0, 4);
        if (val.length >= 2) {
            this.form.cardExpiry = val.substring(0, 2) + '/' + val.substring(2);
        } else {
            this.form.cardExpiry = val;
        }
    }
}

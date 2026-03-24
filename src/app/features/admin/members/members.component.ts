import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlatformAdminService } from '../../../core/services/platform-admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmService } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import {
    AdminUserListItemDto,
    AdminUserDetailDto,
    AdminActivityLogDto,
} from '../../../core/models/platform-admin.model';

@Component({
    selector: 'app-members',
    standalone: true,
    imports: [CommonModule, FormsModule, DatePipe],
    templateUrl: './members.component.html',
    styleUrl: './members.component.css'
})
export class MembersComponent implements OnInit, OnDestroy {
    private platformAdminService = inject(PlatformAdminService);
    private toastService = inject(ToastService);
    private confirmService = inject(ConfirmService);

    // ─── List state ────────────────────────────────────────────────────
    users = signal<AdminUserListItemDto[]>([]);
    isLoading = signal(false);
    error = signal<string | null>(null);

    // ─── Filter ────────────────────────────────────────────────────────
    searchTerm = '';
    roleFilter = '';
    statusFilter: 'all' | 'active' | 'inactive' = 'all';
    private _searchDebounce: any = null;

    // ─── Sort ──────────────────────────────────────────────────────────
    sortColumn = 'createdAtUtc';
    sortDir: 'asc' | 'desc' = 'desc';

    // ─── Detail panel ─────────────────────────────────────────────────
    selectedUser = signal<AdminUserListItemDto | null>(null);
    userDetail = signal<AdminUserDetailDto | null>(null);
    userActivities = signal<AdminActivityLogDto[]>([]);
    isLoadingDetail = signal(false);
    showDetailPanel = signal(false);

    // ─── Pagination ────────────────────────────────────────────────────
    page = 1;
    pageSize = 15;

    ngOnInit(): void {
        this.loadUsers();
    }

    ngOnDestroy(): void {
        if (this._searchDebounce) clearTimeout(this._searchDebounce);
    }

    // ─── Data ──────────────────────────────────────────────────────────

    loadUsers(): void {
        this.isLoading.set(true);
        this.error.set(null);
        this.platformAdminService.getUsers({
            q: this.searchTerm || undefined,
            role: this.roleFilter || undefined,
            isActive: this.statusFilter === 'all' ? undefined : this.statusFilter === 'active',
            page: this.page,
            pageSize: this.pageSize,
        }).subscribe({
            next: (data) => { this.users.set(data); this.isLoading.set(false); },
            error: (err) => {
                this.error.set(err.error?.detail || 'Üyeler yüklenirken hata oluştu.');
                this.isLoading.set(false);
            }
        });
    }

    onSearchChange(): void {
        if (this._searchDebounce) clearTimeout(this._searchDebounce);
        this._searchDebounce = setTimeout(() => { this.page = 1; this.loadUsers(); }, 400);
    }

    onFilterChange(): void {
        this.page = 1;
        this.loadUsers();
    }

    // ─── Sort & Filter (client-side) ───────────────────────────────────

    get filteredUsers(): AdminUserListItemDto[] {
        let list = this.users();
        if (this.sortColumn) {
            const dir = this.sortDir === 'asc' ? 1 : -1;
            const col = this.sortColumn as keyof AdminUserListItemDto;
            list = [...list].sort((a, b) => {
                const av = a[col] ?? '';
                const bv = b[col] ?? '';
                if (typeof av === 'boolean') return dir * (Number(av) - Number(bv));
                return dir * String(av).localeCompare(String(bv), 'tr');
            });
        }
        return list;
    }

    sort(col: string): void {
        if (this.sortColumn === col) this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
        else { this.sortColumn = col; this.sortDir = 'asc'; }
    }

    // ─── Stats ─────────────────────────────────────────────────────────

    get totalUsers() { return this.users().length; }
    get activeUsers() { return this.users().filter(u => u.isActive).length; }
    get inactiveUsers() { return this.users().filter(u => !u.isActive).length; }
    get platformAdmins() { return this.users().filter(u => u.role === 'SuperAdmin' || u.role === 'Admin').length; }

    // ─── Detail Panel ─────────────────────────────────────────────────

    openDetail(user: AdminUserListItemDto): void {
        this.selectedUser.set(user);
        this.userDetail.set(null);
        this.userActivities.set([]);
        this.showDetailPanel.set(true);
        this.isLoadingDetail.set(true);

        this.platformAdminService.getUserDetail(user.userId).subscribe({
            next: (detail) => {
                this.userDetail.set(detail);
                this.userActivities.set(detail.recentActivities ?? []);
                this.isLoadingDetail.set(false);
            },
            error: () => this.isLoadingDetail.set(false)
        });
    }

    closeDetail(): void {
        this.showDetailPanel.set(false);
        this.selectedUser.set(null);
        this.userDetail.set(null);
    }

    async toggleUserActive(user: AdminUserListItemDto, event: Event): Promise<void> {
        event.stopPropagation();
        const action = user.isActive ? 'pasife almak' : 'aktif etmek';
        const confirmed = await this.confirmService.confirm({
            title: user.isActive ? 'Kullanıcıyı Pasife Al' : 'Kullanıcıyı Aktif Et',
            message: `"${user.userName}" kullanıcısını ${action} istediğinize emin misiniz?`,
            confirmText: user.isActive ? 'Pasife Al' : 'Aktif Et',
            type: user.isActive ? 'danger' : 'primary'
        });
        if (!confirmed) return;

        this.platformAdminService.toggleUserActive(user.userId).subscribe({
            next: () => {
                this.toastService.success(
                    user.isActive ? 'Pasife Alındı' : 'Aktif Edildi',
                    `${user.userName} güncellendi`
                );
                this.loadUsers();
                if (this.selectedUser()?.userId === user.userId) this.closeDetail();
            },
            error: (err) => this.toastService.error('Hata', err.error?.detail || 'İşlem başarısız.')
        });
    }

    // ─── Helpers ───────────────────────────────────────────────────────

    roleLabel(role: string): string {
        const map: Record<string, string> = {
            SuperAdmin: 'Süper Admin',
            Admin: 'Admin',
            '1.Kademe': 'Başlangıç',
            '2.Kademe': 'Profesyonel',
            '3.Kademe': 'Kurumsal',
        };
        return map[role] ?? role;
    }

    roleClass(role: string): string {
        if (role === 'SuperAdmin') return 'role-superadmin';
        if (role === 'Admin') return 'role-admin';
        if (role === '1.Kademe') return 'role-starter';
        if (role === '2.Kademe') return 'role-pro';
        if (role === '3.Kademe') return 'role-enterprise';
        return 'role-default';
    }

    avatarInitials(name: string): string {
        return (name || '?').slice(0, 2).toUpperCase();
    }

    avatarColor(name: string): string {
        const colors = [
            '#4c6ef5', '#7950f2', '#e64980', '#f03e3e',
            '#e67700', '#2f9e44', '#0c8599', '#1971c2'
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    }

    formatDate(iso?: string | null): string {
        if (!iso) return '—';
        return new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    formatDateTime(iso?: string | null): string {
        if (!iso) return '—';
        return new Date(iso).toLocaleString('tr-TR', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    getActivityAction(method?: string, path?: string): string {
        if (!method || !path) return 'İşlem';
        const m = method.toUpperCase();
        const p = path.toLowerCase();
        if (p.includes('/products') && m === 'POST') return 'Ürün Eklendi';
        if (p.includes('/products') && m === 'DELETE') return 'Ürün Silindi';
        if (p.includes('/sales-orders') && m === 'POST') return 'Satış Siparişi';
        if (p.includes('/purchase-orders') && m === 'POST') return 'Satın Alma';
        if (p.includes('/invoices') && m === 'POST') return 'Fatura Oluşturuldu';
        if (p.includes('/cari-accounts') && m === 'POST') return 'Cari Hesap Eklendi';
        if (p.includes('/auth/login')) return 'Giriş';
        return m === 'GET' ? 'Görüntüleme' : m === 'POST' ? 'Oluşturma' : m === 'PUT' ? 'Güncelleme' : 'Silme';
    }

    actStatusClass(code: number): string {
        if (code >= 200 && code < 300) return 'act-ok';
        if (code >= 400 && code < 500) return 'act-warn';
        if (code >= 500) return 'act-err';
        return '';
    }

    readonly uniqueRoles = ['', 'SuperAdmin', 'Admin', '1.Kademe', '2.Kademe', '3.Kademe'];
}

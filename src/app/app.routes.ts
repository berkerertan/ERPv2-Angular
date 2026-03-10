import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
        path: 'auth',
        loadComponent: () => import('./layouts/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
        canActivate: [guestGuard],
        children: [
            {
                path: 'login',
                loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
            },
            {
                path: '',
                redirectTo: 'login',
                pathMatch: 'full'
            }
        ]
    },
    {
        path: '',
        loadComponent: () => import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
        canActivate: [authGuard],
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
            },
            {
                path: 'pos',
                loadComponent: () => import('./features/pos/pos.component').then(m => m.PosComponent)
            },
            {
                path: 'products',
                loadComponent: () => import('./features/products/products.component').then(m => m.ProductsComponent)
            },
            {
                path: 'stock-movements',
                loadComponent: () => import('./features/stock-movements/stock-movements.component').then(m => m.StockMovementsComponent)
            },
            {
                path: 'cari-accounts',
                loadComponent: () => import('./features/cari-accounts/cari-accounts.component').then(m => m.CariAccountsComponent)
            },
            {
                path: 'cari-accounts/buyers',
                loadComponent: () => import('./features/cari-accounts/buyers/buyers.component').then(m => m.BuyersComponent)
            },
            {
                path: 'cari-accounts/buyers/:id',
                loadComponent: () => import('./features/cari-accounts/buyers/detail/buyer-detail.component').then(m => m.BuyerDetailComponent)
            },
            {
                path: 'cari-accounts/suppliers',
                loadComponent: () => import('./features/cari-accounts/suppliers/suppliers.component').then(m => m.SuppliersComponent)
            },
            {
                path: 'sales-orders',
                loadComponent: () => import('./features/sales-orders/sales-orders.component').then(m => m.SalesOrdersComponent)
            },
            {
                path: 'purchase-orders',
                loadComponent: () => import('./features/purchase-orders/purchase-orders.component').then(m => m.PurchaseOrdersComponent)
            },
            {
                path: 'companies',
                loadComponent: () => import('./features/companies/companies.component').then(m => m.CompaniesComponent)
            },
            {
                path: 'branches',
                loadComponent: () => import('./features/branches/branches.component').then(m => m.BranchesComponent)
            },
            {
                path: 'warehouses',
                loadComponent: () => import('./features/warehouses/warehouses.component').then(m => m.WarehousesComponent)
            },
            {
                path: 'finance-movements',
                loadComponent: () => import('./features/finance-movements/finance-movements.component').then(m => m.FinanceMovementsComponent)
            },
            {
                path: 'invoices/efatura',
                loadComponent: () => import('./features/invoices/efatura/invoices-efatura.component').then(m => m.InvoicesEFaturaComponent)
            },
            {
                path: 'invoices/earsiv',
                loadComponent: () => import('./features/invoices/earsiv/invoices-earsiv.component').then(m => m.InvoicesEArsivComponent)
            },
            {
                path: 'reports',
                loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent)
            }
        ]
    },
    {
        path: '**',
        redirectTo: 'dashboard'
    }
];

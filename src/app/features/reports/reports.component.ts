import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-reports',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './reports.component.html',
    styleUrls: ['./reports.component.css', '../../shared/styles/crud-page.css']
})
export class ReportsComponent {
    activeReport = signal<string>('stock');

    reports = [
        { id: 'stock', label: 'Stok Raporu', icon: 'inventory', description: 'Depo bazlı stok durumu' },
        { id: 'sales', label: 'Satış Raporu', icon: 'shopping_cart', description: 'Satış analizleri ve trendler' },
        { id: 'purchases', label: 'Satın Alma Raporu', icon: 'local_shipping', description: 'Tedarikçi bazlı satın alma' },
        { id: 'cari-balances', label: 'Cari Bakiyeler', icon: 'account_balance_wallet', description: 'Cari hesap bakiyeleri' },
        { id: 'cari-aging', label: 'Cari Yaşlandırma', icon: 'schedule', description: 'Vade bazlı alacak analizi' },
        { id: 'income-expense', label: 'Gelir-Gider', icon: 'bar_chart', description: 'Gelir ve gider karşılaştırması' }
    ];
}

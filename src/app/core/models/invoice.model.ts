/** Fatura modeli — E-Fatura ve E-Arşiv ortak yapısı */

export interface Invoice {
    id: string;
    invoiceNumber: string;
    invoiceType: 'EFatura' | 'EArsiv';
    invoiceCategory: 'Satis' | 'Iade';    // Satış / İade
    status: 'Draft' | 'Sent' | 'Approved' | 'Rejected' | 'Cancelled';
    cariAccountId: string;
    cariAccountName: string;
    taxNumber: string;

    // Tarihler
    issueDate: string;
    dueDate?: string;

    // Tutarlar
    subtotal: number;
    taxTotal: number;
    discountTotal: number;
    grandTotal: number;
    currency: string;

    // E-Fatura spesifik
    uuid?: string;             // GIB UUID
    ettn?: string;             // ETTN kodu
    gibResponseCode?: string;  // GIB yanıt kodu
    gibResponseDescription?: string;

    // Genel
    notes?: string;
    createdAt: string;
    updatedAt?: string;
    isActive: boolean;
}

export interface InvoiceItem {
    id: string;
    invoiceId: string;
    productId: string;
    productName: string;
    barcode?: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    discountRate: number;
    discountAmount: number;
    taxRate: number;       // KDV oranı (0, 1, 8, 18, 20)
    taxAmount: number;
    lineTotal: number;
}

export interface InvoiceCreateRequest {
    invoiceType: 'EFatura' | 'EArsiv';
    invoiceCategory: 'Satis' | 'Iade';
    cariAccountId: string;
    issueDate: string;
    dueDate?: string;
    currency?: string;
    notes?: string;
    items: Partial<InvoiceItem>[];
}

export interface InvoiceSummary {
    totalCount: number;
    draftCount: number;
    sentCount: number;
    approvedCount: number;
    rejectedCount: number;
    totalAmount: number;
}

/** Fatura modeli — E-Fatura ve E-Arşiv ortak yapısı */

/** InvoiceType enum: 1=EFatura, 2=EArsiv */
export enum InvoiceType { EFatura = 1, EArsiv = 2 }

/** InvoiceCategory enum: 0=Standard, 1=Satis, 2=Iade, 3=Tevkifat */
export enum InvoiceCategory { Standard = 0, Satis = 1, Iade = 2, Tevkifat = 3 }

/** InvoiceStatus enum: 1=Draft, 2=Sent, 3=Approved, 4=Rejected, 5=Cancelled */
export enum InvoiceStatus { Draft = 1, Sent = 2, Approved = 3, Rejected = 4, Cancelled = 5 }

export interface Invoice {
    id: string;
    invoiceNumber: string;
    invoiceType: InvoiceType;
    invoiceCategory: InvoiceCategory;
    status: InvoiceStatus;
    cariAccountId: string;
    cariAccountName: string;
    taxNumber: string;

    // İlişkili siparişler
    salesOrderId?: string;
    purchaseOrderId?: string;

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

export interface CreateInvoiceItemRequest {
    productId: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    discountRate: number;
}

export interface CreateInvoiceRequest {
    invoiceType: InvoiceType;
    invoiceCategory: InvoiceCategory;
    cariAccountId: string;
    issueDate: string;
    dueDate?: string;
    currency?: string;
    notes?: string;
    items: CreateInvoiceItemRequest[];
}

export interface UpdateInvoiceRequest {
    invoiceType: InvoiceType;
    invoiceCategory: InvoiceCategory;
    issueDate: string;
    dueDate?: string;
    currency?: string;
    notes?: string;
    items: CreateInvoiceItemRequest[];
}

export interface CreateInvoiceFromOrderRequest {
    invoiceType: InvoiceType;
    issueDate?: string;
    dueDate?: string;
    currency?: string;
    notes?: string;
}

export interface CancelInvoiceRequest {
    reason: string;
}

export interface InvoiceSummary {
    totalCount: number;
    draftCount: number;
    sentCount: number;
    approvedCount: number;
    rejectedCount: number;
    totalAmount: number;
}

/** InvoiceListItemDto — GET /api/invoices/e-fatura ve /e-arsiv yanıtı */
export interface InvoiceListItemDto {
    id: string;
    invoiceNumber: string;
    invoiceCategory: InvoiceCategory;
    customerName?: string;
    supplierName?: string;
    taxNumber?: string;
    totalAmount: number;
    taxTotal: number;
    status: InvoiceStatus;
    statusText?: string;
    issueDate: string;
}

/** InvoiceDetailDto — GET /api/invoices/{id}/detail yanıtı */
export interface InvoiceDetailDto {
    invoice: Invoice;
    items: InvoiceItem[];
    customerCariAccountId?: string;
    customerName?: string;
    supplierCariAccountId?: string;
    supplierName?: string;
}

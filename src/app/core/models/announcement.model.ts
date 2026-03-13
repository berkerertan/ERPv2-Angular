/** Announcement module — Backend API DTO eşleştirmesi */

export interface AnnouncementDto {
    id: string;
    title?: string;
    content?: string;
    isPublished: boolean;
    priority: number;
    startsAtUtc?: string;
    endsAtUtc?: string;
    publishedAtUtc?: string;
    createdAtUtc: string;
    updatedAtUtc?: string;
}

export interface UpsertAnnouncementRequest {
    title?: string;
    content?: string;
    isPublished: boolean;
    priority: number;
    startsAtUtc?: string;
    endsAtUtc?: string;
}

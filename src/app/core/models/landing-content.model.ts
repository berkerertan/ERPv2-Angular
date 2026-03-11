/** Landing page CMS içerik modeli */

export interface HeroContent {
    badge: string;
    title: string;
    titleAccent: string;
    description: string;
    primaryCtaText: string;
    secondaryCtaText: string;
}

export interface StatItem {
    value: string;
    label: string;
}

export interface FeatureItem {
    id: string;
    icon: string;
    title: string;
    description: string;
    stat: string;
    statLabel: string;
    isActive: boolean;
    sortOrder: number;
}

export interface TestimonialItem {
    id: string;
    name: string;
    role: string;
    avatar: string;
    text: string;
    rating: number;
    isActive: boolean;
}

export interface CtaContent {
    title: string;
    description: string;
    primaryCtaText: string;
    secondaryCtaText: string;
}

export interface LandingContent {
    hero: HeroContent;
    stats: StatItem[];
    features: FeatureItem[];
    testimonials: TestimonialItem[];
    cta: CtaContent;
    lastUpdatedAt: string;
    updatedBy: string;
}

export type UpdateHeroRequest = Partial<HeroContent>;
export type UpdateCtaRequest = Partial<CtaContent>;
export type UpdateStatsRequest = StatItem[];
export type UpdateFeatureRequest = Partial<FeatureItem>;
export type UpdateTestimonialRequest = Partial<TestimonialItem>;

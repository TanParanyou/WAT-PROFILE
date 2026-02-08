export type LocalizedText = {
    th: string;
    en: string;
    de?: string;
};

export interface ScheduleItem {
    time: string;
    activity: LocalizedText;
    day?: LocalizedText; // Optional: Group by day (e.g., "Day 1", "12 Feb")
}

export interface Event {
    id: number;
    title: LocalizedText;
    date: string;
    time: string;
    location: LocalizedText;
    image: string;
    description: LocalizedText;
    schedule: ScheduleItem[];
    mapUrl: string;
    order?: number;
    active?: boolean;
}

export type LocalizedText = {
    th: string;
    en: string;
};

export interface ScheduleItem {
    time: string;
    activity: LocalizedText;
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
}

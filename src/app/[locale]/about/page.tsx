'use client';

import { useTranslations } from 'next-intl';

export default function AboutPage() {
    const t = useTranslations('AboutPage');

    return (
        <div className="bg-white dark:bg-zinc-950 min-h-screen">
            {/* Header */}
            <div className="bg-primary text-white py-20">
                <div className="container mx-auto px-4 md:px-6 text-center">
                    <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
                        {t('title')}
                    </h1>
                    <p className="text-xl font-light opacity-90">
                        {t('subtitle')}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 md:px-6 py-12 md:py-20">
                <div className="max-w-3xl mx-auto prose prose-lg dark:prose-invert">
                    <h2 className="font-heading text-primary">{t('historyTitle')}</h2>
                    <p>
                        {/* Placeholder for history content which might be long and is fine to be here or moved to JSON if needed */}
                        วัดเสริมรังษี ก่อตั้งขึ้นเมื่อ... (รอข้อมูลจากผู้ใช้งาน) โดยมีวัตถุประสงค์เพื่อเป็นศูนย์รวมจิตใจ
                        ของพุทธศาสนิกชนในพื้นที่ กรุงวอชิงตัน ดี.ซี. และรัฐใกล้เคียง
                    </p>

                    <h2 className="font-heading text-primary mt-12">
                        {t('visionTitle')}
                    </h2>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>{t('vision1')}</li>
                        <li>{t('vision2')}</li>
                        <li>{t('vision3')}</li>
                    </ul>

                    <h2 className="font-heading text-primary mt-12">
                        {t('missionTitle')}
                    </h2>
                    <p>
                        {t('missionDesc')}
                    </p>
                </div>
            </div>
        </div>
    );
}

'use client';

import { siteConfig } from '@/config/site.config';
import { Mail, MapPin, Phone, Send } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

export default function ContactPage() {
    const t = useTranslations('ContactPage');
    const locale = useLocale();

    return (
        <div className="bg-white dark:bg-zinc-950 min-h-screen">
            {/* Header */}
            <div className="bg-primary text-white py-20">
                <div className="container mx-auto px-4 md:px-6 text-center">
                    <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">{t('title')}</h1>
                    <p className="text-xl font-light opacity-90">{t('subtitle')}</p>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 md:px-6 py-12 md:py-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
                    {/* Contact Info */}
                    <div>
                        <h2 className="text-3xl font-heading font-bold text-primary mb-8">{t('infoTitle')}</h2>
                        <ul className="space-y-8">
                            <li className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                                    <MapPin size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1">{t('address')}</h3>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                        {siteConfig.contact.address ? siteConfig.contact.address[locale as 'th' | 'en'] : ''}
                                    </p>
                                </div>
                            </li>
                            <li className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                                    <Phone size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1">{t('phone')}</h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        {siteConfig.contact.phone}
                                    </p>
                                </div>
                            </li>
                            <li className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                                    <Mail size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1">{t('email')}</h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        {siteConfig.contact.email}
                                    </p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-zinc-50 dark:bg-zinc-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800">
                        <h2 className="text-2xl font-heading font-bold text-primary mb-6">{t('formTitle')}</h2>
                        <form className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-sm font-medium">{t('fullName')}</label>
                                    <input type="text" id="name" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="Your Name" />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium">{t('email')}</label>
                                    <input type="email" id="email" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="Your Email" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="subject" className="text-sm font-medium">{t('subject')}</label>
                                <input type="text" id="subject" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="Subject" />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="message" className="text-sm font-medium">{t('message')}</label>
                                <textarea id="message" rows={5} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none" placeholder="Message..." />
                            </div>
                            <button type="button" className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                                <Send size={20} /> {t('sendMessage')}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Google Map Embed (Placeholder) */}
            <div className="h-96 w-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center">
                <p className="text-gray-500">Google Map Embed Placeholder</p>
            </div>
        </div>
    );
}

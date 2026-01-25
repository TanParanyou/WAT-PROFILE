'use client';

import { Mail, MapPin, Phone, Send, Loader2, CheckCircle, AlertCircle, Clock, Car, Info, Navigation, ArrowRight, Facebook } from 'lucide-react';
import contactData from '@/data/contact.json';
import { useTranslations, useLocale } from 'next-intl';
import { useState } from 'react';

import PageHeader from '@/components/layout/PageHeader';
import PageContainer from '@/components/layout/PageContainer';

export default function ContactPage() {
    const t = useTranslations('ContactPage');
    const tVisit = useTranslations('VisitPage');
    const locale = useLocale();

    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        try {
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (response.ok) {
                setStatus('success');
                setFormData({ name: '', email: '', subject: '', message: '' });
                setTimeout(() => setStatus('idle'), 5000);
            } else setStatus('error');
        } catch {
            setStatus('error');
        }
    };

    return (
        <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen">
            <PageHeader
                title={t('title')}
                subtitle={t('subtitle')}
            />

            <PageContainer>
                {/* Main Contact Card */}
                <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col lg:flex-row mb-20">

                    {/* Left: Contact Info */}
                    <div className="lg:w-2/5 p-8 md:p-12 bg-primary/5 dark:bg-zinc-800/50">
                        <h2 className="text-2xl font-heading font-bold text-primary mb-8">{t('infoTitle')}</h2>
                        <div className="space-y-8">
                            <div className="flex gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 text-primary flex items-center justify-center shadow-sm shrink-0">
                                    <MapPin size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-1">{t('address')}</h3>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-sans">
                                        {contactData.address ? contactData.address[locale as 'th' | 'en'] : ''}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 text-primary flex items-center justify-center shadow-sm shrink-0">
                                    <Phone size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-1">{t('phone')}</h3>
                                    <p className="text-gray-600 dark:text-gray-400 font-mono">
                                        {contactData.phone}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 text-primary flex items-center justify-center shadow-sm shrink-0">
                                    <Mail size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-1">{t('email')}</h3>
                                    <p className="text-gray-600 dark:text-gray-400 font-mono">
                                        {contactData.email}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 text-primary flex items-center justify-center shadow-sm shrink-0">
                                    <Facebook size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-1">Facebook</h3>
                                    <a
                                        href={contactData.social.facebook}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:text-primary/80 transition-colors font-medium break-all"
                                    >
                                        เสริมรังษี ศูนย์ปฏิบัติธรรม
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Decor */}
                        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-500 italic">
                                &quot;{tVisit('etiquetteDesc')}&quot;
                            </p>
                        </div>
                    </div>

                    {/* Right: Form */}
                    <div className="lg:w-3/5 p-8 md:p-12">
                        <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-6">{t('formTitle')}</h2>
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('fullName')}</label>
                                    <input type="text" id="name" required value={formData.name} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-zinc-950 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('email')}</label>
                                    <input type="email" id="email" required value={formData.email} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-zinc-950 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="subject" className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('subject')}</label>
                                <input type="text" id="subject" required value={formData.subject} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-zinc-950 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="message" className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('message')}</label>
                                <textarea id="message" rows={4} required value={formData.message} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-zinc-950 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none" />
                            </div>
                            <button type="submit" disabled={status === 'loading' || status === 'success'} className={`w-full font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 transform active:scale-95 ${status === 'success' ? 'bg-green-600 text-white' : status === 'error' ? 'bg-red-600 text-white' : 'bg-primary text-white hover:bg-primary/90 shadow-lg hover:shadow-primary/30'}`}>
                                {status === 'loading' ? <Loader2 className="animate-spin" /> : status === 'success' ? <><CheckCircle /> Sent</> : <><Send /> {t('sendMessage')}</>}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Visitor Info Sections */}
                <div className="mb-20">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-heading font-bold text-gray-900 dark:text-gray-100">{tVisit('subtitle')}</h2>
                        <div className="w-20 h-1 bg-primary mx-auto mt-4 rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Card 1: Hours */}
                        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all text-center group">
                            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <Clock size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-4">{tVisit('openingHours')}</h3>
                            <p className="text-gray-600 dark:text-gray-400">{contactData.openingHours.days[locale as 'th' | 'en']}</p>
                            <p className="text-xl font-bold text-primary mt-2">{contactData.openingHours.time}</p>
                        </div>

                        {/* Card 2: Transport */}
                        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all text-center group">
                            <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <Car size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-4">{tVisit('directions')}</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                {contactData.transport.parking[locale as 'th' | 'en']}
                            </p>
                            <a href={contactData.transport.directionsUrl} target="_blank" className="flex items-center justify-center gap-2 text-primary font-bold mt-4 hover:underline">
                                Get Directions <ArrowRight size={16} />
                            </a>
                        </div>

                        {/* Card 3: Etiquette */}
                        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all text-center group">
                            <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <Info size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-4">{tVisit('etiquette')}</h3>
                            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 text-left inline-block">
                                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> {tVisit('dressCodeDesc')}</li>
                                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> {tVisit('behaviorDesc')}</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Map Section */}
                <div className="rounded-3xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800 h-[500px] relative group">
                    <iframe
                        title="Map of Wat Serm Rangsi"
                        src={contactData.map.embedUrl}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        className="grayscale group-hover:grayscale-0 transition-all duration-700"
                        referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                    <div className="absolute bottom-6 right-6 bg-white dark:bg-zinc-900 px-6 py-3 rounded-xl shadow-lg flex items-center gap-3">
                        <Navigation size={20} className="text-primary" />
                        <span className="font-bold">{contactData.map.locationName}</span>
                    </div>
                </div>
            </PageContainer>
        </div>
    );
}

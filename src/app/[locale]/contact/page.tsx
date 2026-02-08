'use client';

import { Mail, MapPin, Phone, Send, Loader2, CheckCircle, AlertCircle, Clock, Car, Info, Navigation, ArrowRight, Facebook, Instagram, CreditCard } from 'lucide-react';
import contactData from '@/data/contact.json';
import { useTranslations, useLocale } from 'next-intl';
import { useState } from 'react';

import PageHeader from '@/components/layout/PageHeader';
import PageContainer from '@/components/layout/PageContainer';
import { getLocalizedText } from '@/utils/i18n';

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
                                        {getLocalizedText(contactData.address, locale)}
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
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-1">Social Media</h3>
                                    <div className="flex flex-col gap-2">
                                        <a
                                            href={contactData.social.facebook}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:text-primary/80 transition-colors font-medium break-all flex items-center gap-2"
                                        >
                                            <Facebook size={16} /> Facebook
                                        </a>
                                        <a
                                            href={contactData.social.instagram}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:text-primary/80 transition-colors font-medium break-all flex items-center gap-2"
                                        >
                                            <Instagram size={16} /> Instagram
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Bank Details */}
                            <div className="flex gap-5 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 text-primary flex items-center justify-center shadow-sm shrink-0">
                                    <CreditCard size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-1">Bank Donation</h3>
                                    <div className="text-gray-600 dark:text-gray-400 text-sm space-y-1">
                                        <p className="font-medium">{contactData.bank.name}</p>
                                        <p>Account: {contactData.bank.account}</p>
                                        <p className="font-mono">IBAN: {contactData.bank.iban}</p>
                                        <p className="font-mono">BIC: {contactData.bank.bic}</p>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Decor */}
                        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
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

                {/* Visitor Info Sections - Bento Grid Layout */}
                <div className="mb-20">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-heading font-bold text-gray-900 dark:text-gray-100">{tVisit('subtitle')}</h2>
                        <div className="w-20 h-1 bg-primary mx-auto mt-4 rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
                        {/* Left Column (Span 2): Transport - MINIMAL DESIGN */}
                        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-8 md:p-10 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all group">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-2xl flex items-center justify-center">
                                    <Car size={32} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{tVisit('directions')}</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Easily accessible by public transport or car</p>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-12 items-start">
                                {/* Public Transport Timeline */}
                                <div className="flex-1 w-full relative">
                                    <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-8 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                                            <span className="text-sm font-bold">1</span>
                                        </div>
                                        Public Transport
                                    </h4>

                                    <div className="relative pl-4">
                                        {/* Continuous Line */}
                                        <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-green-200 dark:bg-green-900/50"></div>

                                        <div className="space-y-8">
                                            {contactData.transport.public.map((step, index) => (
                                                <div key={index} className="relative pl-12">
                                                    {/* Timeline Dot */}
                                                    <div className="absolute left-[9px] top-6 w-3.5 h-3.5 rounded-full bg-white dark:bg-zinc-900 border-[3px] border-green-500 z-10"></div>

                                                    <div className="bg-gray-50 dark:bg-zinc-800/50 p-6 rounded-2xl">
                                                        <div className="mb-3">
                                                            {step.icon === 'train' ? (
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Train
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 text-xs font-bold uppercase tracking-wider">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div> Bus
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-gray-900 dark:text-gray-100 font-medium text-lg leading-relaxed">
                                                            {getLocalizedText(step.text, locale)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Car Navigation Section */}
                                <div className="w-full md:w-2/5">
                                    <div className="bg-gray-50 dark:bg-zinc-800/30 p-1 rounded-3xl border border-gray-100 dark:border-gray-800/50 h-full">
                                        <div className="bg-white dark:bg-zinc-900/50 rounded-[20px] p-8 h-full flex flex-col">
                                            <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-green-600">
                                                    <span className="text-sm font-bold">2</span>
                                                </div>
                                                Car
                                            </h4>

                                            <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed text-base flex-grow">
                                                {getLocalizedText(contactData.transport.car.text, locale)}
                                            </p>

                                            <a href={contactData.transport.directionsUrl} target="_blank" className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-4 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-gray-100 transition-colors">
                                                Open Maps <Navigation size={18} />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column (Span 1): Stack */}
                        <div className="flex flex-col gap-8">
                            {/* Card 1: Hours */}
                            <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all text-center group flex-1 flex flex-col items-center justify-center">
                                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                    <Clock size={32} />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{tVisit('openingHours')}</h3>
                                <div className="space-y-1">
                                    <p className="text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wide">{getLocalizedText(contactData.openingHours.days, locale)}</p>
                                    <p className="text-3xl font-heading font-bold text-primary">{contactData.openingHours.time}</p>
                                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2 italic">{getLocalizedText(contactData.openingHours.remark, locale)}</p>
                                </div>
                            </div>

                            {/* Card 3: Etiquette */}
                            <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all text-center group flex-1">
                                <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                    <Info size={32} />
                                </div>
                                <h3 className="text-xl font-bold mb-4">{tVisit('etiquette')}</h3>
                                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-3 text-left inline-block">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                                        <span>{tVisit('dressCodeDesc')}</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                                        <span>{tVisit('behaviorDesc')}</span>
                                    </li>
                                </ul>
                            </div>
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

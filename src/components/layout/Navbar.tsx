'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { siteConfig } from '@/config/site.config';
import { Menu, X, Sun, Moon, Globe } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname, useRouter } from '@/navigation';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { theme, setTheme } = useTheme();
    const t = useTranslations('Navbar');
    const tSite = useTranslations('Site');
    const locale = useLocale();

    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: t('home'), href: '/' },
        { name: t('about'), href: '/about' },
        { name: t('visit'), href: '/visit' },
        { name: t('events'), href: '/events' },
        { name: t('contact'), href: '/contact' },
    ];

    const toggleLanguage = () => {
        const nextLocale = locale === 'th' ? 'en' : 'th';
        router.replace(pathname, { locale: nextLocale });
    };

    return (
        <nav
            className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 dark:bg-black/80 backdrop-blur-md shadow-md py-2' : 'bg-transparent py-4'
                }`}
        >
            <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-heading font-bold text-xl group-hover:scale-105 transition-transform">
                        W
                    </div>
                    <div className="flex flex-col">
                        <span className={`font-heading font-bold text-lg leading-tight ${scrolled ? 'text-foreground' : 'text-white'}`}>
                            {tSite('name')}
                        </span>
                    </div>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`text-sm font-medium transition-colors hover:text-primary ${scrolled ? 'text-gray-700 dark:text-gray-200' : 'text-white hover:text-white/80'
                                }`}
                        >
                            {link.name}
                        </Link>
                    ))}

                    {/* Theme Toggle */}
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className={`p-2 rounded-full transition-colors ${scrolled ? 'hover:bg-gray-100 dark:hover:bg-gray-800' : 'text-white hover:bg-white/10'
                            }`}
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>

                    {/* Language Switcher */}
                    <button
                        onClick={toggleLanguage}
                        className={`flex items-center gap-1 text-sm font-medium ${scrolled ? 'text-gray-700 dark:text-gray-200' : 'text-white'
                            }`}
                    >
                        <Globe size={16} />
                        <span>{locale.toUpperCase()}</span>
                    </button>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className={`md:hidden p-2 ${scrolled ? 'text-foreground' : 'text-white'}`}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-gray-800 overflow-hidden"
                    >
                        <div className="container mx-auto px-4 py-6 flex flex-col gap-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="text-lg font-medium text-gray-800 dark:text-gray-100 py-2 border-b border-gray-100 dark:border-gray-800"
                                    onClick={() => setIsOpen(false)}
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <div className="flex items-center justify-between pt-4">
                                <span className="text-gray-600 dark:text-gray-400">Theme</span>
                                <button
                                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                    className="p-2 rounded-full bg-gray-100 dark:bg-zinc-800"
                                >
                                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                                </button>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                                <span className="text-gray-600 dark:text-gray-400">Language</span>
                                <button
                                    onClick={() => {
                                        toggleLanguage();
                                        setIsOpen(false);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-zinc-800"
                                >
                                    <Globe size={18} />
                                    <span>{locale.toUpperCase()}</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}

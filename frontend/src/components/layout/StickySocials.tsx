'use client';

import { siteConfig } from '@/config/site.config';
import { Facebook, Mail, Youtube, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StickySocials() {
    const socials = [
        {
            name: 'Facebook',
            icon: Facebook,
            href: siteConfig.social.facebook,
            color: 'bg-[#1877F2]'
        },
        {
            name: 'YouTube',
            icon: Youtube,
            href: siteConfig.social.youtube,
            color: 'bg-[#FF0000]'
        },
        {
            name: 'Email',
            icon: Mail,
            href: siteConfig.social.email ? `mailto:${siteConfig.social.email}` : null,
            color: 'bg-green-600'
        }
    ].filter(item => item.href);

    const positionClass = siteConfig.layout.socialSidebarPosition === 'right' ? 'right-6' : 'left-6';

    return (
        <div className={`fixed bottom-6 ${positionClass} z-40 flex flex-col gap-3`}>
            {socials.map((social, index) => (
                <motion.a
                    key={social.name}
                    href={social.href || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + (index * 0.1) }}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 hover:-translate-y-1 transition-all duration-300 ${social.color}`}
                    title={social.name}
                >
                    <social.icon size={24} />
                </motion.a>
            ))}
        </div>
    );
}

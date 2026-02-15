'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '../../navigation';
import { locales } from '../../navigation';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const handleLanguageChange = (newLocale: string) => {
        router.replace(pathname, { locale: newLocale });
    };

    const languageNames: Record<string, string> = {
        en: 'English',
        hi: 'हिन्दी',
        es: 'Español',
        fr: 'Français',
        de: 'Deutsch'
    };

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full backdrop-blur-sm">
            <Globe className="w-4 h-4 text-gray-400" />
            <select
                value={locale}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-transparent text-sm text-gray-200 outline-none cursor-pointer hover:text-blue-400 transition-colors"
            >
                {locales.map((loc) => (
                    <option key={loc} value={loc} className="bg-[#0f172a] text-gray-200">
                        {languageNames[loc]}
                    </option>
                ))}
            </select>
        </div>
    );
}

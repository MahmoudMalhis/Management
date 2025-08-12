import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LucideMenu, LucideUser } from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
}

const LANG_KEY = "lang";

const Header = ({ onMenuClick }: HeaderProps) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  // قراءة أولية آمنة
  const initialLang = useMemo(() => {
    if (typeof window === "undefined") return "ar";
    return localStorage.getItem(LANG_KEY) || "ar";
  }, []);

  const [lang, setLang] = useState(initialLang);

  // طبّق اللغة/الاتجاه على أول تحميل
  useEffect(() => {
    const applyDir = (lng: string) => {
      const dir = lng === "ar" ? "rtl" : "ltr";
      document.documentElement.dir = dir;
      document.documentElement.lang = lng;
      document.body.dir = dir;
    };

    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
    applyDir(lang);
  }, [i18n, lang]);

  const toggleLanguage = () => {
    const newLang = lang === "ar" ? "en" : "ar";
    setLang(newLang);
    i18n.changeLanguage(newLang);
    // حدّث الاتجاه فورًا لتجنّب فلاش
    const dir = newLang === "ar" ? "rtl" : "ltr";
    document.documentElement.dir = dir;
    document.documentElement.lang = newLang;
    document.body.dir = dir;
    try {
      localStorage.setItem(LANG_KEY, newLang);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <header className="glass-header py-4 px-6 flex items-center justify-between shadow-md">
      <div>
        <Button
          variant="ghost"
          size="icon"
          className="glass-btn lg:hidden"
          onClick={onMenuClick}
        >
          <LucideMenu className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleLanguage}
          className="glass-btn text-sm"
        >
          {lang === "ar" ? t("common.english") : t("common.arabic")}
        </Button>

        <div className="hidden md:flex items-center gap-2">
          <span className="text-sm font-medium text-[#395275] glassy-text">
            {user?.name}
          </span>
          <div className="glass-avatar h-8 w-8 rounded-full flex items-center justify-center">
            <LucideUser className="h-4 w-4 text-[#395275]" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

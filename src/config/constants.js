
// available languages for translation
const availableLangs = [
  "ru",
  "en",
  "zh",
  "ko",
  "ar",
  "fr",
  "it",
  "es",
  "de",
  "ja",
];

// Additional languages working with TTS
const additionalTTS = [
  "bn",
  "pt",
  "cs",
  "hi",
  "mr", // TODO: Add menu translation (MAYBE)
  "te", // TODO: Add menu translation (MAYBE)
  "tr",
  "ms",
  "vi",
  "ta", // TODO: Add menu translation (MAYBE)
  "jv",
  "ur",
  "fa",
  "gu", // TODO: Add menu translation (MAYBE)
  "id",
  "uk",
  "kk",
];

const siteTranslates = {
  youtube: "https://youtu.be/",
  twitch: "https://twitch.tv/",
  vimeo: "https://vimeo.com/",
  "9gag": "https://9gag.com/gag/",
  vk: "https://vk.com/video?z=",
  xvideos: "https://www.xvideos.com/",
  pornhub: "https://rt.pornhub.com/view_video.php?viewkey=",
  udemy: "https://www.udemy.com",
  twitter: "https://twitter.com/i/status/",
  facebook: "https://www.facebook.com/",
  rutube: "https://rutube.ru/video/",
  "bilibili.com": "https://www.bilibili.com/video/",
  "mail.ru": "https://my.mail.ru/",
  coub: "https://coub.com/view/",
  bitchute: "https://www.bitchute.com/video/",
};

// TODO:
/*
  Add a language upload from github.

  it may be worth redesigning the translation system
  (if there is no necessary phrase, then the phrase in English / "raw" phrase will be displayed)
*/
let translations = {
  ru: {
    unSupportedExtensionError: `Ошибка! ${GM_info.scriptHandler} не поддерживается этой версией расширения!\n\nПожалуйста, используйте cloudflare-версию расширения VOT.`,
    VOTDisabledForDBUpdating: `VOT отключен из-за ошибки при обновление Базы Данных. Закройте все открытые вкладки с ${window.location.hostname} и попробуйте снова`,
  },
  en: {
    unSupportedExtensionError: `Error! ${GM_info.scriptHandler} is not supported by this version of the extension!\n\nPlease use the cloudflare version of the VOT extension.`,
    VOTDisabledForDBUpdating: `VOT is disabled due to an error when updating the Database. Close all open tabs with ${window.location.hostname} and try again`,
  },
  zh: {
    unSupportedExtensionError: `错误! 此版本的扩展不支持 ${GM_info.scriptHandler}!\n\n请使用cloudflare版本的VOT扩展.`,
    VOTDisabledForDBUpdating: `VOT由于更新数据库时出错而被禁用。 关闭所有打开的选项卡${window.location.hostname} 再试一次`,
  },
  ar: {
    unSupportedExtensionError: `خطأ! ${GM_info.scriptHandler} غير مدعوم من قبل هذه النسخة من الامتداد!\n\nيرجى استخدام نسخة cloudflare من امتداد VOT.`,
    VOTDisabledForDBUpdating: `VOT معطل بسبب خطأ عند تحديث قاعدة البيانات. أغلق جميع علامات التبويب المفتوحة مع ${window.location.hostname} وحاول مرة أخرى`,
  },
  ko: {
    unSupportedExtensionError: `오류! ${GM_info.scriptHandler}는 이 버전의 확장 프로그램에서 지원되지 않습니다!\n\nVOT 확장 프로그램의 클라우드플레어 버전을 사용하십시오.`,
    VOTDisabledForDBUpdating: `데이터베이스 업데이트 오류로 인해 VOT가 비활성화되었습니다. ${window.location.hostname}와 열려 있는 모든 탭을 닫고 다시 시도하십시오`,
  },
  de: {
    unSupportedExtensionError: `Fehler! ${GM_info.scriptHandler} wird von dieser Version der Erweiterung nicht unterstützt!\n\nBitte verwenden Sie die Cloudflare-Version der VOT-Erweiterung.`,
    VOTDisabledForDBUpdating: `VOT wurde aufgrund eines Fehlers beim Aktualisieren der Datenbank deaktiviert. Schließen Sie alle geöffneten Tabs mit ${window.location.hostname} und versuchen Sie es erneut`,
  },
  es: {
    unSupportedExtensionError: `Error! ${GM_info.scriptHandler} no es compatible con esta versión de la extensión!\n\nUtilice la versión cloudflare de la extensión VOT.`,
    VOTDisabledForDBUpdating: `VOT está deshabilitado debido a un error al actualizar la Base de Datos. Cierre todas las pestañas abiertas con ${window.location.hostname} y vuelve a intentarlo`,
  },
  fr: {
    unSupportedExtensionError: `Erreur! ${GM_info.scriptHandler} n'est pas supporté par cette version de l'extension!!\n\nVeuillez utiliser la version cloudflare de l'extension VOT.`,
    VOTDisabledForDBUpdating: `VOT est désactivé en raison d'une erreur lors de la mise à jour de la Base de Données. Fermez tous les onglets ouverts avec ${window.location.hostname} et essayez à nouveau`,
  },
  it: {
    unSupportedExtensionError: `Errore! ${GM_info.scriptHandler} non è supportato da questa versione dell'estensione!\n\nUtilizzare la versione cloudflare dell'estensione VOT.`,
    VOTDisabledForDBUpdating: `VOT è disabilitato a causa di un errore durante l'aggiornamento del database. CHIUDI tutte le schede aperte con ${window.location.hostname} e riprova`,
  },
  ja: {
    unSupportedExtensionError: `エラー！ ${GM_info.scriptHandler} はこのバージョンの拡張機能ではサポートされていません！\n\nVOT拡張機能のcloudflareバージョンを使用してください。`,
    VOTDisabledForDBUpdating: `データベース更新時のエラーのため、VOTは無効になっています。${window.location.hostname} を開いているすべてのタブを閉じて、もう一度お試しください。`,
  },
  pt: {
    unSupportedExtensionError: `Erro! ${GM_info.scriptHandler} não é suportado por esta versão da extensão!\n\nPor favor, use a versão do Cloudflare da extensão VOT.`,
    VOTDisabledForDBUpdating: `VOT está desativado devido a um erro ao atualizar o banco de dados. Feche todas as guias abertas em ${window.location.hostname} e tente novamente`,
  },
  cs: {
    unSupportedExtensionError: `Chyba! ${GM_info.scriptHandler} není podporován touto verzí rozšíření!\n\nProsím, použijte cloudflare-verzi rozšíření VOT.`,
    VOTDisabledForDBUpdating: `VOT je vypnut kvůli chybě při aktualizaci databáze. Zavřete všechny otevřené karty s ${window.location.hostname} a zkuste to znovu`,
  },
  hi: {
    unSupportedExtensionError: `त्रुटि! ${GM_info.scriptHandler} इस संस्करण के एक्सटेंशन का समर्थन नहीं करता है!\n\nकृपया, वीओटी के क्लाउडफ्लेयर-वर्शन का उपयोग करें।`,
    VOTDisabledForDBUpdating: `बाकी डेटाबेस अपडेट करने में त्रुटि के कारण, वीओटी निष्क्रिय हो गया है। कृपया ${window.location.hostname} के सभी खिड़कियों को बंद करें और फिर से प्रयास करें।`,
  },
  tr: {
    unSupportedExtensionError: `Hata! ${GM_info.scriptHandler} Bu uzantı sürümü tarafından desteklenmiyor!\n\nLütfen VOT'un cloudflare sürümünü kullanın.`,
    VOTDisabledForDBUpdating: `Veritabanı güncelleştirme hatası nedeniyle VOT kapalı. ${window.location.hostname} ile açık olan tüm sekmeleri kapatın ve tekrar deneyin.`,
  },
  vi: {
    unSupportedExtensionError: `Lỗi! ${GM_info.scriptHandler} không được hỗ trợ bởi phiên bản tiện ích mở rộng này!\n\nVui lòng sử dụng phiên bản cloudflare của tiện ích mở rộng VOT.`,
    VOTDisabledForDBUpdating: `VOT bị tắt do lỗi khi cập nhật cơ sở dữ liệu. Vui lòng đóng tất cả các tab mở với ${window.location.hostname} và thử lại`,
  },
  uk: {
    unSupportedExtensionError: `Помилка! ${GM_info.scriptHandler} не підтримується цією версією розширення!\n\nБудь ласка, використовуйте cloudflare-версію розширення VOT.`,
    VOTDisabledForDBUpdating: `VOT вимкнено через помилку при оновленні бази даних. Будь ласка, закрийте всі відкриті вкладки ${window.location.hostname} та спробуйте знову`,
  },
  kk: {
    unSupportedExtensionError: `Қате! ${GM_info.scriptHandler} бұл кеңейтімділіктің мұндай нұсқасын қолдаушы емес!\n\nCloudflare-версиясын қолданыңыз.`,
    VOTDisabledForDBUpdating: `Деректер базасын жаңарту кезінде VOT өшірілді. ${window.location.hostname} сайтындағы барлық терезелерді жабыңыз және қайтадан көріңіз`,
  },
  bn: {
    unSupportedExtensionError: `ত্রুটি! ${GM_info.scriptHandler} এই সংস্করণের এক্সটেনশানটি সমর্থিত নয়!\n\nদয়া করে cloudflare ভার্শনে এক্সটেনশানটি ব্যবহার করুন।`,
    VOTDisabledForDBUpdating: `ডাটাবেস আপডেট সময়ে VOT অক্ষম করা হয়েছে। ${window.location.hostname} সমস্ত ট্যাব বন্ধ করুন এবং আবার চেষ্টা করুন`,
  },
  ms: {
    unSupportedExtensionError: `Ralat! ${GM_info.scriptHandler} tidak disokong oleh versi sambungan ini!\n\nSila gunakan versi cloudflare sambungan VOT.`,
    VOTDisabledForDBUpdating: `VOT dimatikan kerana ralat semasa mengemaskini pangkalan data. Sila tutup semua tab yang dibuka di ${window.location.hostname} dan cuba sekali lagi`,
  },
  jv: {
    unSupportedExtensionError: `Kesalahan! ${GM_info.scriptHandler} ora ditandhani dening versi ekstensi iki!\n\nMangga gunakake versi cloudflare iki saka ekstensi VOT.`,
  },
  ur: {
    unSupportedExtensionError: `خرابی! ${GM_info.scriptHandler} اس ایکسٹینشن کے اس ورژن کی حمایت نہیں کرتا!\n\nبراہ کرم ایکسٹینشن VOT کے کلاؤڈ فلیئر ورژن کا استعمال کریں۔`,
    VOTDisabledForDBUpdating: `VOT ڈیٹا بیس کو اپ ڈیٹ کرتے وقت خرابی کی وجہ سے بند ہے۔ ${window.location.hostname} تمام کھلے پروگرامات کو بند کرکے دوبارہ کوشش کریں`,
  },
  fa: {
    unSupportedExtensionError: `خطا! ${GM_info.scriptHandler} برای این نسخه توسعه دهنده پشتیبانی نمی شود!\n\n لطفاً از نسخه CloudFlare افزونه VOT استفاده کنید.`,
    VOTDisabledForDBUpdating: `VOT به دلیل خطای به‌روزرسانی پایگاه داده غیرفعال شده است. تمام تب های با ${window.location.hostname} را ببندید و دوباره تلاش کنید.`,
  },
  id: {
    unSupportedExtensionError: `Error! ${GM_info.scriptHandler} tidak didukung oleh versi ekstensi ini! \n\nSilakan gunakan versi ekstensi Cloudflare VOT.`,
    VOTDisabledForDBUpdating: `VOT dinonaktifkan karena kesalahan saat pembaruan basis data. Tutup semua tab terbuka dengan ${window.location.hostname} dan coba lagi`,
  },
};

// временный вариант
const userlang = navigator.language ?? navigator.userLanguage;
let lang = userlang.substring(0, 2) ?? "en";

// укажите свой репозеторий
async function getTranslations(lang) {
  let response = await fetch(`https://raw.githubusercontent.com/SashaXser/voice-over-translation/master/localization/${lang}.json`, {
    method: "GET",
  });
  let json = await response.json();
  translations[lang] = { ...translations[lang], ...json };
}

// временный вариант
try {
  await getTranslations(lang);
} catch (error) {
  console.error(error)
}


export { availableLangs, additionalTTS, siteTranslates, translations };

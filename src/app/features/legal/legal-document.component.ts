import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';

interface LegalSection {
    heading: string;
    paragraphs: string[];
}

interface LegalDocument {
    eyebrow: string;
    title: string;
    summary: string;
    lastUpdated: string;
    sections: LegalSection[];
}

const LEGAL_CONTENT: Record<string, LegalDocument> = {
    privacy: {
        eyebrow: 'Gizlilik ve veri güvenliği',
        title: 'Gizlilik Politikası',
        summary: 'Bu politika, StokNet hizmetini kullanırken topladığımız kişisel verileri, bu verileri hangi amaçlarla işlediğimizi ve kullanıcıların sahip olduğu hakları açıklar.',
        lastUpdated: '4 Mayıs 2026',
        sections: [
            {
                heading: '1. Hangi verileri topluyoruz?',
                paragraphs: [
                    'Hesap oluşturma, demo erişimi, ödeme, destek talepleri ve uygulama kullanımı sırasında ad, soyad, e-posta, kullanıcı adı, şirket bilgileri, işlem kayıtları ve teknik kullanım verileri işlenebilir.',
                    'İşletme verileri içinde ürün, sipariş, cari hesap, stok hareketi ve raporlama kayıtları kullanıcı hesabınızın yönetilebilmesi için güvenli şekilde saklanır.'
                ]
            },
            {
                heading: '2. Verileri hangi amaçlarla işliyoruz?',
                paragraphs: [
                    'Verileri hizmeti sunmak, abonelikleri yönetmek, güvenliği sağlamak, destek vermek, performansı izlemek ve yasal yükümlülükleri yerine getirmek için kullanırız.',
                    'Ürün deneyimini iyileştirmek için anonimleştirilmiş kullanım verilerini analiz edebiliriz; bu analizler doğrudan kişisel kimlik tespiti amacı taşımaz.'
                ]
            },
            {
                heading: '3. Verileri kimlerle paylaşabiliriz?',
                paragraphs: [
                    'Veriler, yalnızca hizmetin çalışması için gerekli altyapı, e-posta, ödeme veya barındırma sağlayıcıları ile sözleşmesel gizlilik yükümlülükleri altında paylaşılır.',
                    'Yasal talep veya düzenleyici zorunluluk bulunması halinde, ilgili mevzuat çerçevesinde yetkili kurumlarla paylaşım yapılabilir.'
                ]
            },
            {
                heading: '4. Saklama ve güvenlik',
                paragraphs: [
                    'Veriler, erişim kontrolü, şifreleme, loglama ve düzenli yedekleme süreçleriyle korunur. Yalnızca yetkili kullanıcılar kendi rol kapsamları içinde erişim sağlar.',
                    'Hesap sonlandırma veya yasal sürelerin dolması sonrasında, veriler silme veya anonimleştirme politikalarımıza göre işlenir.'
                ]
            },
            {
                heading: '5. Haklarınız',
                paragraphs: [
                    'Kullanıcılar kişisel verilerine erişim, düzeltme, silme, işleme itiraz etme ve mevzuat kapsamındaki diğer haklarını destek kanallarımız üzerinden kullanabilir.',
                    'KVKK ve ilgili veri koruma mevzuatı kapsamındaki taleplerinizi kayıtlı e-posta adresiniz üzerinden iletebilirsiniz.'
                ]
            }
        ]
    },
    terms: {
        eyebrow: 'Hizmet şartları',
        title: 'Kullanım Koşulları',
        summary: 'Bu koşullar, StokNet platformuna erişim sağlayan tüm kullanıcıların uyması gereken temel kullanım kurallarını, sorumluluk sınırlarını ve abonelik esaslarını tanımlar.',
        lastUpdated: '4 Mayıs 2026',
        sections: [
            {
                heading: '1. Hizmet kapsamı',
                paragraphs: [
                    'StokNet; stok yönetimi, satış, satın alma, cari hesap, raporlama ve ilişkili operasyon modüllerini bulut tabanlı olarak sunar.',
                    'Sunulan özellikler, seçtiğiniz abonelik planına, kullanıcı rolüne ve ürün geliştirme yol haritasına göre değişebilir.'
                ]
            },
            {
                heading: '2. Kullanıcı yükümlülükleri',
                paragraphs: [
                    'Kullanıcılar hesap bilgilerini doğru ve güncel tutmakla, erişim bilgilerini güvenli saklamakla ve yalnızca yetkili kişilere kullandırmakla sorumludur.',
                    'Platformun mevzuata aykırı, kötü niyetli, zarar verici veya başka kullanıcıların erişimini engelleyici şekilde kullanılması yasaktır.'
                ]
            },
            {
                heading: '3. Abonelik ve ödeme',
                paragraphs: [
                    'Ücretli planlar aylık veya yıllık dönemler halinde sunulabilir. Plan değişiklikleri ve yenilemeler ilgili faturalama dönemine göre uygulanır.',
                    'Ödeme gecikmesi, plan limit aşımı veya sözleşme ihlali durumunda hizmetin bir bölümü geçici olarak kısıtlanabilir.'
                ]
            },
            {
                heading: '4. Fikri mülkiyet ve kullanım lisansı',
                paragraphs: [
                    'StokNet yazılımı, tasarımları, raporlama şablonları ve sistem bileşenleri ilgili fikri mülkiyet hakları kapsamında korunur.',
                    'Kullanıcıya yalnızca hizmetten yararlanmak için sınırlı, devredilemez ve geri alınabilir bir kullanım hakkı tanınır.'
                ]
            },
            {
                heading: '5. Sorumluluğun sınırı',
                paragraphs: [
                    'Makûl teknik ve operasyonel önlemler alınsa da internet erişimi, üçüncü taraf servisler ve kullanıcı kaynaklı yanlış veri girişleri nedeniyle kesinti veya veri tutarsızlığı oluşabilir.',
                    'Kullanıcı, kritik ticari kararlar öncesinde kendi iç kontrol süreçlerini işletmekten ve gerekli yedekleri almaktan sorumludur.'
                ]
            }
        ]
    },
    cookies: {
        eyebrow: 'Tarayıcı tercihleri',
        title: 'Çerez Politikası',
        summary: 'Bu politika, StokNet web sitesi ve uygulama yüzeylerinde kullanılan çerez ve benzeri teknolojilerin amacını, kategorilerini ve kullanıcı tercihlerini açıklar.',
        lastUpdated: '4 Mayıs 2026',
        sections: [
            {
                heading: '1. Çerez nedir?',
                paragraphs: [
                    'Çerezler, web sitesi deneyimini sürdürmek, oturum açmayı kolaylaştırmak ve belirli tercihleri hatırlamak için tarayıcınıza kaydedilen küçük metin dosyalarıdır.'
                ]
            },
            {
                heading: '2. Hangi çerez türlerini kullanıyoruz?',
                paragraphs: [
                    'Zorunlu çerezler oturum yönetimi, güvenlik ve temel gezinme için kullanılır. Performans çerezleri ise hangi ekranların daha sık kullanıldığını anlamamıza yardımcı olur.',
                    'Pazarlama veya üçüncü taraf hedefleme amaçlı çerezler kullanılacaksa bu tercih ayrıca kullanıcı onayına tabi tutulur.'
                ]
            },
            {
                heading: '3. Çerez tercihleri nasıl yönetilir?',
                paragraphs: [
                    'Tarayıcı ayarlarınız üzerinden çerezleri silebilir, engelleyebilir veya belirli alan adları için ayrı tercih tanımlayabilirsiniz.',
                    'Bazı zorunlu çerezleri devre dışı bırakmak, oturum açma ve güvenlik odaklı işlevlerin beklenen şekilde çalışmamasına neden olabilir.'
                ]
            },
            {
                heading: '4. Saklama süresi',
                paragraphs: [
                    'Çerezlerin saklama süresi kullanım amacına göre değişir. Oturum çerezleri tarayıcı kapanınca silinebilir; tercih çerezleri ise belirli bir süre saklanabilir.'
                ]
            },
            {
                heading: '5. İletişim',
                paragraphs: [
                    'Çerez kullanımı veya tercih yönetimi konusunda sorularınız varsa destek kanallarımız üzerinden bizimle iletişime geçebilirsiniz.'
                ]
            }
        ]
    }
};

@Component({
    selector: 'app-legal-document',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './legal-document.component.html',
    styleUrl: './legal-document.component.css'
})
export class LegalDocumentComponent {
    private readonly route = inject(ActivatedRoute);
    readonly document = LEGAL_CONTENT[(this.route.snapshot.data['legalKey'] as string) ?? 'privacy'];
}

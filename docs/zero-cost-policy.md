# Ortak: Sıfır Zorunlu Maliyet İlkesi

**Durum:** Ürün ve mimari için bağlayıcı karar taslağı
**Tarih:** 2026-10-11

## Ana karar

Ortak'ın başlangıç ilkesi, proje sahibine veya kullanıcıya zorunlu bir hizmet faturası çıkarmamaktır. Ücretli API, zorunlu bulut, ücretli veri tabanı, zorunlu kullanıcı hesabı, API anahtarı, cüzdan veya ödeme bilgisi olmayacaktır.

Bu, dünyanın fiziksel maliyetlerinin sıfır olduğu veya ücretsiz hizmetlerin sınırsız olduğu iddiası değildir. Elektrik, internet bağlantısı, cihaz yıpranması, alan adı ve gönüllü düğüm işletimi gibi maliyetleri biri üstlenir. Ortak'ın hedefi bunları kullanıcıya zorunlu fatura olarak yüklememek ve proje sahibinin ödeme yapmasını teknik olarak zorunlu kılmamaktır.

## Zorunlu kurallar

1. **Ücretli plana otomatik geçiş yok.** Fatura doğurabilecek yükseltme veya ölçüm bazlı ücret özelliği etkinleştirilmez. Ücretsiz kota dolarsa ilgili çevrimiçi özellik kapalı/erişilemez duruma geçer; ücretli hizmete sessizce geçmez.
2. **Yerel işlem birinci sınıftır.** Fotoğraf işleme tarayıcıda çalışır. Fotoğraf veya çıktı, kullanıcı açıkça eşler arası paylaşımı onaylamadıkça herhangi bir koordinasyon servisine gönderilmez.
3. **İşlem yükü gönüllü cihazlara aittir.** Hesaplama katılımcı cihazlarda yapılır. Pil, ısı, veri kullanımı ve cihaz kaynağı kullanıcıya anlatılır; kaynak paylaşımı varsayılan olarak kapalıdır.
4. **Doğrudan P2P tercih edilir; TURN zorunlu değildir.** Doğrudan WebRTC bağlantısı başarısızsa kullanıcı yerel işleme döner. Ücretli relay veya TURN hizmeti varsayılan ya da zorunlu bağımlılık olmayacaktır.
5. **Koordinasyon maliyeti saklanmaz.** WebRTC, eşlerin birbirini bulması için kendi başına bir sinyalleşme/keşif ağı sağlamaz. Otomatik keşif için ya gönüllülerce işletilen koordinasyon düğümleri ya da üçüncü taraf topluluk röleleri gerekir. Her durumda düğüm kapasitesi, kullanılabilirliği ve işleten taraf açıkça belgelenir.
6. **Çökerek güvenli şekilde sınırla.** Ücretsiz bir röle/host sınırına ulaşıldığında yerel araçlar çalışmaya devam eder; çevrimiçi keşif sıraya alma, sınırlama veya geçici kapatma ile yanıt verir. Ücretli plana geçiş önerilebilir ancak otomatik yapılamaz.
7. **Kullanıcı hesabı ve merkezi dosya deposu yok.** İlk aşamada katılımcı kaydı kalıcı kullanıcı hesabı gerektirmez. Görev dosyaları varsayılan olarak merkezi depoda tutulmaz.
8. **Telemetri isteğe bağlıdır.** Kullanıcı dosyası, fotoğraf içeriği veya tanımlayıcı veri varsayılan olarak analitik servisine gönderilmez. Ölçümler mümkün olduğunca cihaz üzerinde hesaplanır ve kullanıcı tarafından dışa aktarılır.

## İlk sürümün maliyet modeli

| Katman | Başlangıç kararı | Ücret/kota riski |
|---|---|---|
| Statik uygulama | GitHub Pages üzerinde herkese açık depo | Sağlayıcı limitleri ve hız sınırlaması; sınırsızlık garantisi yok |
| Fotoğraf işleme | Tarayıcı Canvas ve Web Worker | Kullanıcı cihazı, elektriği ve interneti kullanılır; sunucu işlem faturası yok |
| Sonuç dosyaları | Cihazda oluşturma ve indirme | Merkezi dosya saklama maliyeti yok |
| Eşler arası veri | WebRTC DataChannel, doğrudan bağlantı tercihli | Bazı ağlarda bağlantı başarısız olabilir; ücretli TURN'a otomatik geçiş yok |
| Keşif/sinyalleşme | Takılabilir protokol; gönüllü/toplulukça işletilen düğümler değerlendirilecek | Düğüm işletim maliyeti bir gönüllü/kurum tarafından karşılanır; düğüm yoksa otomatik keşif de yok |
| Ölçüm | Yerel test kaydı ve isteğe bağlı dışa aktarma | Varsayılan üçüncü taraf analitik faturası yok |

## Otomatik keşif için önemli gerçek

Herkesin bir URL'yi açması, tarayıcıların birbirini kendiliğinden bulması için yeterli değildir. WebRTC'de uygulamanın bağlantı tekliflerini ve ICE bilgilerini eşe ulaştıracağı bir sinyalleşme kanalı gerekir. Sadece statik GitHub Pages sitesi bu koordinasyon görevini yapmaz.

Bu yüzden şu seçenekleri teknik deneylerle karşılaştıracağız:

- **Gönüllü işletilen, açık kaynaklı rendezvous düğümleri:** Birden fazla bağımsız düğüm; self-host kurulumu ve sağlık kontrolü. Maliyet düğüm işleten gönüllüye aittir.
- **Topluluk röleleri:** Başlangıçta hızlı pilot için kullanılabilir; üçüncü taraf hizmetidir, SLA'sı ve sınırsız kapasitesi varsayılmaz. Birden fazla sağlayıcı desteklenir; tek sağlayıcıya kilitlenilmez.
- **Elle QR/kopyala-yapıştır bağlantısı:** Sunucusuz yedek test seçeneği; geniş kullanıcı kitlesi için nihai deneyim değildir.

Bu belgede henüz bir çevrimiçi keşif protokolü seçilmiş değildir. Seçim; ücretli servise zorunlu bağımlılık, dış ağ koşulları, kötüye kullanım kontrolü, metadata gizliliği ve test edilebilirlik açısından bir prototiple doğrulandıktan sonra yapılacaktır.

## Ölçek taahhüdü

3, 30, 300 veya daha çok katılımcı hedefi bir test basamağıdır; önceden verilmiş kapasite garantisi değildir. Ölçek, koordinasyon düğümleri, bağlantı kurulma oranı, görev boyutu, hata/tekrar oranı ve gönüllü cihazların çevrimiçi kalma süresiyle ölçülür. Milyonlarca veya milyarlarca katılımcı, mevcut ücretsiz barındırma sınırlarının ötesinde bir ağ, topluluk tarafından sağlanan kapasite ve dağıtılmış yönetim gerektirir.

## Değişiklik kabul ölçütü

Yeni bir altyapı bağımlılığı ancak aşağıdaki şartların hepsini karşılıyorsa kabul edilir:

- Zorunlu ücret veya ödeme yöntemi gerektirmez.
- Ücretsiz kotası bittiğinde otomatik ücret üretmez; özelliği kapatmak mümkündür.
- Yerel fotoğraf işleme ve mevcut çıktı indirmeyi bozmaz.
- Kullanıcı verisini hangi düğümün görebileceği dokümante edilmiştir.
- Sağlayıcı değiştirilebilir veya gönüllü tarafından self-host edilebilir.
- Gerçek cihazlar arası uçtan uca test ve yük testiyle değerlendirilir.

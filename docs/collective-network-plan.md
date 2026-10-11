# Ortak — Otomatik Katılımcı Ağı Planı

**Durum:** Tasarım kararı; otomatik ortak işçi havuzu henüz uygulanmış veya canlıda doğrulanmış değildir.

## Ürün hedefi

Ortak'ın uzun vadeli hedefi, insanların uygulamayı açıp açıkça katılım izni verdiklerinde çevrimiçi gönüllü cihazların bir havuzda görünmesi; iş gönderenin her cihazla elle WebRTC metni paylaşmak zorunda kalmaması; koordinatörün uygun işçiyi seçip bağlantıyı kurması; izin verilen işi, kullanıcı rızasıyla doğrudan eş cihaza göndermesi ve sonucu doğrulayarak geri almasıdır. İkinci tarayıcı açmak, kullanıcıya yönelik nihai akış değildir; yalnızca erken PoC'nin elle bağlantı kurma yöntemidir.

## Bugünkü sürümde gerçekten olan

- Statik GitHub Pages uygulaması.
- Fotoğraf işleme ve karşılaştırma yerel tarayıcı içinde.
- WebRTC DataChannel prototipi; SDP daveti/yanıtı elle kopyalanır.
- Merkezi katılımcı listesi, otomatik buluşma, kalp atışı/presence servisi, kuyruk, eşleştirici veya otomatik iş dağıtıcısı yoktur.
- Bu nedenle farklı kullanıcılar siteyi aynı anda açsa bile uygulama birbirlerini bulamaz. Bu bir CI hatası değil, şu anki mimarinin eksik bir aşamasıdır.

## Önerilen ilk ağ mimarisi

1. **Ön yüz:** `rhizon-protocol/ortak` statik GitHub Pages; yerel fotoğraf işleme varsayılan kalır.
2. **Presence ve sinyalleşme:** Cloudflare Worker + SQLite-backed Durable Object + WebSocket. Bu bileşen yalnızca geçici katılımcı durumunu, oturum kimliklerini ve WebRTC offer/answer iletilerini taşır; varsayılan tasarımda kullanıcı fotoğraf baytlarını almaz veya saklamaz.
3. **Açık katılım:** Kullanıcı ayrıca “Hesaplama ağına katıl” düğmesine basar; görünür, geçici takma ad/oturum kimliği alır; uygun olduğu iş türlerini ve cihazının kaynak sınırlarını belirtir. Ağda görünmek varsayılan olarak kapalıdır.
4. **Eşleştirme:** Koordinatör yalnızca istek yapan işi destekleyen, çevrimiçi ve boş işçiyi seçer. Önce tek işçiyle eşleştir; tüm kullanıcılar arasında tam mesh kurma.
5. **Bağlantı:** WebSocket sinyalleşmesi SDP/ICE değişimini otomatikleştirir; gerçek medya/iş verisi mümkün olduğunda WebRTC DataChannel'dan doğrudan eş cihaza gider. TURN kullanımı gerekirse relay hizmeti ve bant genişliği ayrı maliyet/bağımlılık olarak açıklanır.
6. **Rıza:** Gönüllü, önce “bu iş türlerine katılıyorum” şeklinde ağ katılımını seçer; sonra her işin türü, dosya adı, boyutu, beklenen süre ve veri paylaşımı hakkında açık bilgi görür. Hassas dosyalar paylaşılmamalı.
7. **İş yaşam döngüsü:** `queued → offered → accepted → leased → running → result-received → verified` veya `rejected/timeout/failed`. Süresi dolan iş tekrar kuyruğa alınabilir; aynı işin iki kez tamamlanması idempotent biçimde yönetilir.
8. **Sonuç doğrulama:** Dosyanın SHA-256 özeti yalnızca aktarım bütünlüğünü gösterir. İşin doğru yapıldığını doğrulamak için biçim/boyut kontrolleri, sabit test görselleri, sonuca yönelik kalite ölçümleri ve riskli işlerde çift/tekrarlı hesaplama gerekir.
9. **Gizlilik ve güvenlik:** Rastgele oturum kimliği, origin kontrolü, mesaj şeması doğrulama, hız/iş limiti, bağlantı başına bellek sınırı, oturum zaman aşımı, kötüye kullanım kotası ve görünür bağlantıyı kesme eylemi. Koordinatör fotoğraf/çıktı içeriklerini loglamaz.
10. **Gözlemlenebilirlik:** Yalnızca opt-in ve mümkün olduğunca toplu ölçümler: online işçi sayısı, iş başına süre, eşleşme süresi, başarısızlık nedeni, gönderilen/alınan bayt, doğrulama sonucu. Dosya adı veya içerik analitiğe gönderilmez.

## Ücretsiz başlangıç altyapısı

Cloudflare Workers'ın ücretsiz planı WebSocket koordinasyonu ve SQLite-backed Durable Objects için sınırlı kullanım sağlar. Resmî fiyatlandırmada Durable Objects Free planı için 100.000 istek/gün ve 13.000 GB-s/gün, ayrıca 5 GB toplam depolama sınırı belirtilmiştir; bu sınırlardan biri aşılırsa ilgili işlemler hata verir. Bu “sonsuz ücretsiz” demek değildir. Herhangi bir dağıtımdan önce güncel kotalar, hesap gereksinimleri ve kullanım koşulları tekrar doğrulanmalıdır.

İlk pilotta fotoğraf içeriği koordinatör üzerinden geçirilmemeli. STUN/WebRTC yine dış servis ve ağ bağımlılıkları getirir. TURN zorunlu hale gelirse ücretsiz, sınırsız röle varsayılmamalı; kapsam/alternatif kullanıcıya açıklanmalı.

## Yayına kabul kapıları

### Gate A — CI ve statik ön yüz
- `npm test`, `npm run typecheck`, `npm run build` ve Pages yayını başarılı.
- WebRTC deney ekranı elle bağlantı gerektiğini açıkça söyler.

### Gate B — Otomatik presence/signaling
- İki ayrı cihaz aynı ağa isteyerek katılır; canlı katılımcı listesinde görünür.
- Koordinatör offer/answer sinyallerini doğru oturuma aktarır.
- Rastgele üçüncü kişi iş içeriğine izinsiz erişemez.
- Servis kapalıyken yerel fotoğraf işleme aynen çalışır.

### Gate C — Otomatik görev eşleştirme
- Bir işçi kayıt olur ve kapasitesini ilan eder.
- Gönderici işçi seçimini otomatik yapabilir ama dosya aktarımı için gönderici ve alıcı rızası gerekir.
- Bağlantı koparsa görev zaman aşımına düşer ve açıkça raporlanır.

### Gate D — 3–30 gönüllü pilot
- Katılımcıların farklı fiziksel cihaz ve farklı ağlardan katılımı kanıtlanır.
- Eşleşme/bağlantı başarı oranı, iş başarı oranı, toplam süre, aktarılan bayt ve yerel moda göre hız ölçülür.
- Yavaş veya bozuk sonuçlar saklanmadan raporlanır.

### Gate E — Daha büyük ölçek
- Önce 100, sonra 1.000 eşzamanlı istemciyi kontrollü test et; tek global oda nesnesi darboğaz olur mu ölç.
- Sharding, kuyruklar, kota, maliyet ve kötüye kullanım incelemesi olmadan milyonlar/bilyonlar hedefi için kapasite iddiası verme.

## Bilinçli olarak yapmayacaklarımız

- Uygulama açılır açılmaz kullanıcıyı haber vermeden kaynak havuzuna katmak.
- Rastgele kullanıcılara dosya göndermek veya kullanıcı izni olmadan başka cihazda görev çalıştırmak.
- GitHub Pages'in kendisinin WebSocket sunucusu ya da görev kuyruğu olduğunu varsaymak.
- Ücretsiz hizmet kotasını sınırsız kapasite olarak pazarlamak.
- Katılımcı sayısını tek başına başarı kanıtı saymak.

## Resmî kaynaklar

- Cloudflare Workers fiyatlandırması: https://developers.cloudflare.com/workers/platform/pricing/
- Durable Objects fiyatlandırması: https://developers.cloudflare.com/durable-objects/platform/pricing/
- Durable Objects WebSocket: https://developers.cloudflare.com/durable-objects/best-practices/websockets/
- MDN WebRTC sinyalleşmesi: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling
- GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages

# Mimari Karar Kaydı (ADR-001)

**Durum:** PoC için kabul edildi. **Tarih:** 11 Ekim 2026.

## Karar

Bağımlılıksız, statik istemci web uygulaması: HTML/CSS/ES modules; görüntü dönüşümü için tarayıcı `createImageBitmap` + `OffscreenCanvas` + Web Workers; desteklenmediğinde ana iş parçacığı yedeği; görev koordinasyonu için açık durumlu basit kuyruk; birden çok çıktıyı bir arşive almak için küçük bir ZIP (stored/no-compression) yazıcısı; deneysel cihazlar arası iş için WebRTC `RTCPeerConnection` + sıralı `RTCDataChannel`; kopyala-yapıştır SDP sinyalleşmesi; PWA manifestosu ve statik service worker önbelleği.

## Neden

- Fotoğraf yeniden boyutlandırma ve JPEG/PNG/WebP dışa aktarımı tarayıcının yerleşik görüntü yetenekleriyle yapılabilir; video kodekleri veya model çıkarımı bu PoC'nin hedefi değildir.
- Web Workers ana arayüzün uzun işlerden etkilenmesini azaltır. Görevler bağımsız dosyalara ayrılır; her bir dosyanın hatası diğer görevlerin kuyruğunu durdurmaz. Transfer edilen `ArrayBuffer` kopyalamak yerine bağlamlar arasında sahiplik değişimiyle aktarılabilir.
- WebRTC DataChannel, kullanıcı onaylı ve doğrudan eşler arası veri aktarımını mümkün kılar. SDP teklifi/yanıtını elle değiş tokuş etmek sinyalleşme sunucusunu PoC'nin zorunlu bağımlılığından çıkarır. ICE/STUN yine harici bir hizmete ihtiyaç duyabilir.
- Statik dosyalar ve küçük bir Node.js test sunucusu, ücretli bulut/DB/API ihtiyacını kaldırır. Uygulama runtime'da üçüncü taraf JS paketi indirmez.
- İş sonuçları geçici tutulur; kullanıcı indirir. Kalıcı dosya saklama ihtiyacı olmadığı için IndexedDB eklenmedi.

## Alternatifler ve elenme gerekçeleri

- **Merkezî WebSocket sinyalleşmesi:** Kullanım kolaylığını artırır; ancak sunucu işletimi ve erişilebilirlik yükü getirir. İlk deneyde manuel sinyalleşme yeterli.
- **TURN hizmeti:** NAT arkasındaki eşlerin bağlanma oranını iyileştirebilir fakat röle altyapısı/bant genişliği gerektirir. Şimdilik arka uç yok; başarısız bağlantı açıkça gösterilir.
- **FFmpeg.wasm:** Geniş kodek ve medya araçları sağlar, fakat ek Wasm çekirdeği indirme/dağıtma maliyeti ve daha ağır bir yol açar. Mevcut JPEG/PNG/WebP fotoğraf kapsamı için gereksiz.
- **Transformers.js / WebGPU:** Tarayıcı içi AI için adaydır; bu PoC'de AI görevi yoktur ve model indirme, bellek ve tarayıcı uyumluluğu yükü ekler.
- **BOINC, Golem, Salad, Render Network veya Acurast altyapısına iş göndermek:** Bunlar olgun görev/sağlayıcı/hesaplama ağlarından öğrenmek için değerlidir; ancak istemci PoC'si için kurulum, ağ protokolü, operatör veya pazar yeri gereksinimleri ekler. Bu projelerle entegrasyon yoktur ve uygulama onları kullanıyormuş gibi davranmaz.
- **IndexedDB ile çevrimdışı görev kuyruğu:** Bu sürüm için sonuçlar indirilebilir, sayfada geçicidir; saklama/temizleme politikası karmaşıklığı eklememek için ertelendi.

## Görev protokolü ve güven sınırı

1. Gönderici yalnızca seçilen dosyanın adını, MIME türünü, boyutunu ve sabit dönüşüm ayarlarını içeren `job-offer` mesajı yollar; dosya içeriği henüz gönderilmez.
2. Alıcı işin ayrıntılarını görür. Açık onayla `job-consent` geldikten sonra dosya, 64 KiB parçalar hâlinde sıralı DataChannel üzerinden aktarılır.
3. Alıcı dosyanın boyutunu ve SHA-256 özetini doğrular, sabit dönüştürme kodunu kendi cihazında çalıştırır ve sonucu geri gönderir.
4. Gönderici dönen dosyanın SHA-256'sını, MIME tipini, çözümlenebilirliğini ve ayarlara uyan boyutlarını kontrol eder.

Bu, hatalı aktarımı saptar fakat kötü niyetli bir alıcının doğru iş yaptığını kanıtlamaz. Daha ileri aşamada yinelenen görev/sonuç karşılaştırması veya uygulamaya özel doğrulanabilirlik gereklidir.

## Riskler

- STUN erişimi, NAT davranışı ve kurumsal ağ politikaları eşler arası bağlantıyı engelleyebilir. TURN/arka uç yok.
- Safari/Firefox/Chromium sürümleri arasında Worker içindeki `OffscreenCanvas`, görüntü kodekleri ve WebRTC davranışı değişebilir. Ana iş parçacığı yedeği vardır; ancak tüm tarayıcılarda aynı hız garantisi yoktur.
- Piksel sayısı ve dosya boyutu limitleri bellek baskısını azaltır ama bütün mobil cihazlarda çökme riskini sıfırlamaz.
- Eşten dönen sonuç güvenilir bir işlem kanıtı değildir; sonuç yalnızca temel biçim/ölçü/özet kontrollerini geçer.
- Herkesin kullanabileceği bir iş pazarına dönüşmek için kimlik, itibar, oran sınırlama, kötüye kullanım, görev tekrarları ve gizlilik modeli ayrıca tasarlanmalıdır.

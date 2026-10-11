# Ortak — Dijital Araç Kutusu

**Türkçe öncelikli, yerel çalışan dijital araçlar ve topluluk destekli cihazlar arası hesaplama deneyleri.**

> Durum: Erken aşama açık kaynak projesi. Fotoğraf araçları ilk ürün; eşler arası işlem deneysel ve her ağda çalışacağı garanti edilmez.

## Deneyin

Planlanan canlı adres: **https://rhizon-protocol.github.io/ortak/**  
Bu adres henüz doğrulanmış canlı yayın değildir. Depo oluşturulup GitHub Pages ayarlanana ve ilk dağıtım başarılı olana kadar çalışır durumda kabul edilmemelidir. GitHub’a hazırlık adımları: [`docs/publish-to-github.md`](docs/publish-to-github.md).

Yerel deneme için Node.js 20+ gerekir:

```bash
npm test
npm run build
npm run serve
```

Ardından `http://localhost:4173` adresini aç. Uygulama çalışma zamanı bağımlılığı istemez; hesap, API anahtarı, veri tabanı, ücretli bulut veya ücretli API gerekmez.

## Ne yapar?

- Birden fazla JPEG, PNG veya WebP görseli ekleme.
- Görselleri yeniden boyutlandırma ve kalite/çıktı formatını seçme.
- İşlem süresi ve kaynak/çıktı boyutlarını görme.
- Dosyaları ayrı ayrı veya tek ZIP arşiviyle indirme.
- Yerel tekli ve çoklu işçi sonuçlarını karşılaştırma.
- Deneysel WebRTC DataChannel üzerinden onaylı bir görsel işini başka tarayıcıya gönderip sonucu geri alma.

## Gizlilik ve güvenlik

- Varsayılan fotoğraf işleme tarayıcıda yerel yapılır; uygulama kendi sunucusuna görsel yüklemez ve telemetri göndermez. GitHub Pages gibi barındırma altyapısı bağlantı sırasında IP adresi gibi teknik istek metaverilerini güvenlik/işletim amacıyla işleyebilir; bu, fotoğraf içeriğinin uygulama tarafından yüklendiği anlamına gelmez.
- Eşler arası paylaşım ayrı ve isteğe bağlıdır. Alıcı paylaşılan görselin içeriğini görebilir; aktarım öncesi onay gereklidir.
- WebRTC bağlantısı için STUN keşfi `stun:stun.l.google.com:19302` adresini kullanır. Bu harici hizmetin kullanılabilirliği garanti edilmez. TURN veya merkezi sinyalleşme sunucusu yoktur; bazı ağlarda bağlantı başarısız olur.
- Aktarım bütünlüğü özeti, karşı cihazın algoritmayı doğru çalıştırdığını kanıtlamaz.
- Kullanıcı dosyalarını Issues/Discussions'a yüklemeyin. Hata raporlarında gizli bilgi ve kişisel veri paylaşmayın.

Ayrıntılar için [`docs/architecture.md`](docs/architecture.md), [`docs/research.md`](docs/research.md), [`docs/testing.md`](docs/testing.md), [`docs/launch-plan.md`](docs/launch-plan.md) ve [`docs/publish-to-github.md`](docs/publish-to-github.md) belgelerine bakın.

## Katkı verin

Hataları [GitHub Issues](https://github.com/rhizon-protocol/ortak/issues) üzerinden bildirebilir, katkı için `CONTRIBUTING.md` yönergelerini takip edebilirsiniz. Bu bağlantılar depo oluşturulup Issues etkinleştirildikten sonra etkin olacaktır. Henüz yayınlanmamış adresler çalışır durumda kabul edilmemelidir.

## Proje durumu

Şu ana kadarki otomatik kontroller ve doğrulanmamış alanlar [`docs/testing.md`](docs/testing.md) içinde raporlanır. Önce fotoğraf işlemenin gerçek tarayıcılarda doğrulanması; sonra iki ayrı fiziksel cihaz arasında uçtan uca WebRTC testinin tamamlanması gerekir. Başarılı uçtan uca test yapılmadan dağıtık mod çalışıyor diye ilan edilmez.

## Lisans

Apache License 2.0 — bkz. [`LICENSE`](LICENSE).

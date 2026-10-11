# Ortak — Dijital Araç Kutusu

**Türkçe öncelikli, yerel çalışan dijital araçlar ve topluluk destekli cihazlar arası hesaplama deneyleri.**

> Durum: Erken aşama açık kaynak projesi. Fotoğraf araçları ilk ürün; elle sinyalleşmeli WebRTC deneysel. Otomatik katılımcı havuzu ve görev dağıtımı henüz uygulanmadı.

## Deneyin

GitHub Pages adresi: **https://rhizon-protocol.github.io/ortak/**

Yeni bir sürümü duyurmadan önce son commit için `Validate and deploy Ortak` iş akışının başarılı tamamlandığını ve Pages ortamının dağıtımı onayladığını kontrol edin. İlk kurulum ve hata düzeltme adımları: [`docs/publish-to-github.md`](docs/publish-to-github.md).

Yerel deneme için Node.js 20.11+ gerekir (CI, Node.js 24 kullanır):

```bash
npm test
npm run typecheck
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
- Deneysel WebRTC DataChannel üzerinden onaylı bir görsel işini başka tarayıcıya gönderip sonucu geri alma (bu sürümde davet/yanıt elle paylaşılır).

## Gizlilik ve güvenlik

- Varsayılan fotoğraf işleme tarayıcıda yerel yapılır; uygulama kendi sunucusuna görsel yüklemez ve telemetri göndermez. GitHub Pages gibi barındırma altyapısı bağlantı sırasında IP adresi gibi teknik istek metaverilerini güvenlik/işletim amacıyla işleyebilir; bu, fotoğraf içeriğinin uygulama tarafından yüklendiği anlamına gelmez.
- Eşler arası paylaşım ayrı ve isteğe bağlıdır. Alıcı paylaşılan görselin içeriğini görebilir; aktarım öncesi onay gereklidir.
- Bu ilk sürümde kullanıcılar otomatik keşfedilmez, ortak işçi havuzuna kendiliğinden katılmaz ve görevler çevrimiçi cihazlara otomatik dağıtılmaz. Bunun için ayrı bir eşleştirme/sinyalleşme hizmeti ve iş kuyruğu gerekir; tasarım planı `docs/collective-network-plan.md` içindedir.
- WebRTC bağlantısı için STUN keşfi `stun:stun.l.google.com:19302` adresini kullanır. Bu harici hizmetin kullanılabilirliği garanti edilmez. TURN veya merkezi sinyalleşme sunucusu yoktur; bazı ağlarda bağlantı başarısız olur.
- Aktarım bütünlüğü özeti, karşı cihazın algoritmayı doğru çalıştırdığını kanıtlamaz.
- Kullanıcı dosyalarını Issues/Discussions'a yüklemeyin. Hata raporlarında gizli bilgi ve kişisel veri paylaşmayın.

Otomatik katılımcı havuzu ve yol haritası için [`docs/collective-network-plan.md`](docs/collective-network-plan.md) belgesine; diğer ayrıntılar için [`docs/architecture.md`](docs/architecture.md), [`docs/research.md`](docs/research.md), [`docs/testing.md`](docs/testing.md), [`docs/launch-plan.md`](docs/launch-plan.md) ve [`docs/publish-to-github.md`](docs/publish-to-github.md) belgelerine bakın.

## Katkı verin

Hataları [GitHub Issues](https://github.com/rhizon-protocol/ortak/issues) üzerinden bildirebilir, katkı için `CONTRIBUTING.md` yönergelerini takip edebilirsiniz. Bu bağlantılar depo oluşturulup Issues etkinleştirildikten sonra etkin olacaktır. Henüz yayınlanmamış adresler çalışır durumda kabul edilmemelidir.

## Proje durumu

Şu ana kadarki otomatik kontroller ve doğrulanmamış alanlar [`docs/testing.md`](docs/testing.md) içinde raporlanır. Önce fotoğraf işlemenin gerçek tarayıcılarda doğrulanması; sonra iki ayrı fiziksel cihaz arasında uçtan uca WebRTC testinin tamamlanması gerekir. Başarılı uçtan uca test yapılmadan dağıtık mod çalışıyor diye ilan edilmez.

## Lisans

Apache License 2.0 — bkz. [`LICENSE`](LICENSE).

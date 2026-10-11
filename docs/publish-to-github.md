# GitHub yayınlama adımları — `rhizon-protocol/ortak`

**Durum:** Hazırlık talimatı; depo oluşturulmuş veya site yayımlanmış değildir.

## 1. Yeni public depo oluştur

1. Önce [Rhizon Protocol depolarını kontrol et](https://github.com/orgs/rhizon-protocol/repositories); `ortak` veya aynı işlevi gören daha eski bir repo varsa yeni repo açmadan önce karşılaştır.
2. GitHub hesabında oturum açıkken [Önceden doldurulmuş depo oluşturma formunu aç](https://github.com/new?owner=rhizon-protocol&name=ortak&visibility=public&description=Privacy-first%20digital%20tools%20and%20community-powered%20computing%20experiments).
3. Owner: `rhizon-protocol`, repository name: `ortak`, visibility: **Public**.
4. README, `.gitignore` veya LICENSE oluşturma seçeneklerini işaretleme. Bu proje arşivi bunları zaten içeriyor; boş depo oluşturup tek bir başlangıç geçmişi push etmek merge çakışmalarını önler.
5. Depo adının boşta olduğunu ve organizasyonun yeni depo oluşturmaya izin verdiğini GitHub'da doğrula. Eğer `ortak` zaten varsa, dur ve sahip/amaç kontrolü yap; alternatif ad olarak `ortak-platform` kullanılabilir.

## 2. Kaynakları yükle

ZIP paketini indirip `rhizon-ortak` adında bir klasöre çıkar. O klasörde terminal aç ve önce doğrulamaları çalıştır:

```bash
npm test
npm run typecheck
npm run build
```

Ardından yerel Git geçmişini oluştur ve boş GitHub deposuna gönder:

```bash
git init -b main
git add .
git commit -m "Initial public release preparation"
git remote add origin https://github.com/rhizon-protocol/ortak.git
git push -u origin main
```

Git kullanıcı adı/parola veya token'ı hiçbir kaynak dosyasına yazma. GitHub'un tarayıcı kimlik doğrulamasını veya yerel credential manager'ını kullan. Organizasyonun repo oluşturma/push politikası nedeniyle işlem reddedilirse izinleri kontrol et; gizli erişim anahtarı ekleyerek aşmaya çalışma.

## 3. GitHub Pages ayarını yap

1. Depoda **Settings → Pages** sayfasını aç.
2. **Build and deployment → Source** değerini **GitHub Actions** seç.
3. Actions sekmesinde `Validate and deploy Ortak` iş akışının çalışmasını izle.
4. İş akışı başarılı olduktan sonra `https://rhizon-protocol.github.io/ortak/` adresini aç.
5. Workflow başarısız olursa yeşil gibi göstermeden logu incele. `configure-pages` hatası Pages kaynağı ayarlanmadığını gösteriyorsa önce Settings adımını tamamlayıp workflow'u yeniden çalıştır.

GitHub Pages'in resmi belgeleri: [Custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [depo oluşturma](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository).

## 4. Canlı URL'de kabul testi

Yayından sonra en az:

- Farklı içerikte bir JPEG, PNG ve WebP dosyası ekle; çıktıyı ayrı ayrı indir ve aç.
- En az bir bozuk görsel ekle; diğer dosyaların tamamlandığını doğrula.
- `Tek işçi` ve `Çoklu işçi` denemelerini mümkün olduğunca aynı dosya kümesiyle yap.
- Birinci ve ikinci tarayıcıda WebRTC teklif/yanıt metinlerini değiş tokuş et; alıcı onayı yokken içeriğin aktarılmadığını denetle.
- Bağlantı kurulduğunda dosya aktarımı ve sonucun geri dönüşünü kontrol et. Bu, aynı bilgisayardaki iki oturumla ilk smoke test'tir; fiziksel iki cihazın kanıtı sayılmaz.
- Telefon ve masaüstünde aç; `Settings → Pages` URL'si, servis çalışanı kapsamı ve eski önbelleğe takılma davranışını kontrol et.

## 5. İlk kullanıcı pilotunu aç

- İlk duyuruya `experimental` ibaresi ve bilinen kısıtlamalar eklensin.
- Issues ve Discussions etkinleştirilsin; güvenlik açıkları kamu issue'su yerine `SECURITY.md` yönergesiyle bildirilsin.
- Kullanıcılardan orijinal fotoğraf, dosya adı, kişisel veri veya ekran görüntüsü istenmesin. Gönüllü geri bildirimde yalnızca cihaz/tarayıcı tipi, ayarlar, süreler ve hata adımları yeterli olsun.
- İlk fiziksel cihazlar arası deneye katılmak isteyenlere karşı tarafın görsel dosyasını göreceği ve STUN sunucusunun ağ metaverisi görebileceği açıkça bildirilsin.

## 6. Yayınlanmış saymak için gereken kanıt

Repo URL'sinin açılması tek başına uygulamanın çalıştığını kanıtlamaz. Aşağıdaki kanıtları `docs/testing.md` içine tarih ve tarayıcı bilgileriyle eklemeden özellikleri doğrulanmış diye ilan etme:

- Workflow başarı bağlantısı.
- Canlı URL'de gerçek dosya işleme/indirme sonucu.
- Ayrı iki fiziksel cihaz arasındaki WebRTC testi ve başarısız denemeler.
- Denenen cihaz/tarayıcı listesi.

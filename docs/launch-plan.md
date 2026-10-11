# Ortak — Organizasyon, Yayın ve Açık Kullanıcı Pilotu Planı

**Belge durumu:** Organizasyon kararı verildi (`rhizon-protocol`); GitHub deposu ve canlı yayın bu çalışma ortamından oluşturulmadı  
**Tarih:** 11 Ekim 2026  
**Proje markası:** Ortak (geçici, doğrulanacak)  
**İlk ürün:** Türkçe öncelikli, tarayıcıda çalışan Dijital Araç Kutusu  
**Ana ilke:** Önce kullanıcıya gerçek değer sağlayan ürün; paralelde kanıta dayalı dağıtık hesaplama deneyi.

## 1. Yönetici kararı

Karar: **`rhizon-protocol/ortak`** bağımsız ürün deposu olarak hedeflensin. Kullanıcı bu organizasyonun uzun vadeli mesh, protokol ve iletişim hedefleriyle uyumlu olduğunu seçti. Mevcut `rhizon-core`, `sentirik-link`, organizasyon README/manifesto ve ilgili eski projelerle çakışma olup olmadığı GitHub erişimi sağlandığında ayrıca incelensin; anlamlı bir eski depo bulunursa kopyalama yerine birleştirme/taşıma değerlendirilsin. Bu çalışma klasörü henüz GitHub’a gönderilmiş değildir.

Önerilen geçici ürün kimliği:

- **Marka:** Ortak
- **Depo adı adayı:** `ortak`
- **Alternatif depo adı:** `ortak-platform` (yalnızca `ortak` adı çakışıyor ya da kapsamı anlatmıyorsa)
- **Kısa açıklama:** “Gizliliği önceleyen dijital araçlar ve topluluk destekli cihazlar arası hesaplama deneyleri.”
- **İngilizce kısa açıklama:** “Privacy-first digital tools and community-powered computing experiments.”
- **Etiket:** “Open source · Local-first · Experimental peer-to-peer computing”

“Ortak” Türkçede paylaşma, müştereklik, iş birliği ve birlikte çalışma fikrini taşır. İngilizcede “ortak” tek başına yaygın marka/ürün karşılığı olarak açık olmayabilir; bu nedenle markayı korurken her yerde açıklayıcı bir İngilizce alt başlık kullan. Marka, GitHub kullanıcı adı, npm paketi veya alan adı uygunluğu henüz doğrulanmadı; kullanılabilir olduklarını varsayma.

## 2. Organizasyon kararı ve kapsam

Organizasyon seçimi yapıldı: ana ürün deposu `rhizon-protocol` altında olacak. Aşağıdaki diğer organizasyon adları yalnızca daha önceki benzer projeyi bulmak ve neden taşımaya ihtiyaç doğabileceğini değerlendirmek için referanstır; hedef seçimi artık açık değildir. Tek bir kanonik kaynak deposu tutulmalı.

| Aday | Ne zaman tercih edilir? | Şimdiki değerlendirme |
|---|---|---|
| `azmisahin-com` | Ortak genel amaçlı, AI dışı dijital araç ürünü/şemsiyesi olacaksa ve organizasyon bu amaca uygunsa | Geniş ürün kimliği için incelenmeli |
| `azmisahin-ai` | Eski ilgili proje burada bulunursa veya ilk dönemde yerel AI/hesaplama odağı baskınsa | Güçlü aday; AI dışı uzun vadeli vizyonu dar gösterebilir |
| `azmisahin-mobile` | Yakın vadeli ana teslimat yerel mobil uygulama veya telefon istemcisi olacaksa | Şimdiki web/PWA ürünü için ikincil |
| `rhizon-protocol` | Ortak, Rhizon mimarisiyle uzun vadeli eşler arası hesaplama/mesh odağını paylaşır | **Seçildi:** `rhizon-protocol/ortak`; ürün deposu protokol çekirdeğinden ayrı tutulur |
| `azmisahin-demo` | Sadece vitrin veya ayrı, sadeleştirilmiş gösterim sürümü için | Kanonik kaynak kodunun yeri olmasın |
| `azmisahin-test` | Geçici deneyler, uyumluluk testleri veya atıl prototipler için | Kamuya açık ana ürün için uygun değil |
| `open-cognitive` | Ortak doğrudan bilişsel motor/sandbox/protokol kapsamına dönüşürse | Şu anda gereksiz mimari bağ kurma riski |

### Kesin karar ve depo sınırı

`rhizon-protocol` hedef organizasyon olarak seçildi. `ortak` adı, depo oluşturulmadan önce aynı organizasyonda mevcut bir depo adıyla çakışıp çakışmadığı kontrol edilecek. Bu hazırlık paketinde hedef `rhizon-protocol/ortak`; yalnızca ad çakışırsa `ortak-platform` yedeği değerlendirilsin. Yeni bir organizasyon açılmayacak.

Ortak, insanların kullanacağı fotoğraf araçları ve cihazlar arası deneyleri barındıran ürün deposu olacak. `rhizon-core`, `sentirik-link`, manifesto ve spesifikasyon depolarına kodu gereksiz yere taşımayacak; olası protokol entegrasyonu ayrı ve belgeli bir arayüzle yapılacak.

## 3. Önceki projeyi bulma ve kod envanteri

Depoyu oluşturmadan önce benzer/eski çalışmayı isimle değil, işlev ve teknik işaretlerle ara. Hedef organizasyon zaten `rhizon-protocol`; eski bir proje bulunursa yeni depo açmak yerine önce onu yeniden kullanma/taşıma/ilişkilendirme kararı ver:

- Öncelik `rhizon-protocol` içindeki `rhizon-core`, `sentirik-link`, `rhizon-protocol.github.io`, `.github`, `manifesto` ve spesifikasyon depolarında. Gerekirse eski prototip bulmak için `azmisahin-ai`, `azmisahin-mobile`, `azmisahin-demo` ve `azmisahin-test` depolarını da ara.
- Anahtar kelimeler: `WebRTC`, `DataChannel`, `peer-to-peer`, `P2P`, `distributed`, `compute`, `worker`, `image`, `photo`, `compress`, `resize`, `PWA`, `offline`, `task queue`, `volunteer computing`, `Ortak`.
- Depo içinde kontrol: README, lisans, son commit, açık issue/PR, branch/tag, release, GitHub Actions, Pages ayarı, bağımlılıklar, kullanıcıya sunulan URL ve gizli bilgi/anahtar sızıntısı.

Her olası eski depo için tek satırlık envanter tut: `owner/repo`, son aktivite, ilgili kod yüzdesi, lisans, test durumu, yayın durumu, benzersiz değer, öneri (`kullan`, `taşı`, `arşivle`, `bağlantı kur`, `ele`). Eski repo içeriği görülmeden “aynı proje” veya “ilişkisiz proje” sonucu çıkarma.

### Koruma kuralları

- Birleştirme/taşıma kararı öncesi kaynak depoyu klonla ve tam yedek al.
- Mevcut geçmiş ve lisansı koru; açık kaynak lisansı olmadan kodu başka projeden kopyalama.
- Depo taşınacaksa GitHub yönlendirmeleri ve bağlantılarının etkisini kontrol et.
- GitHub Actions secret'larını, erişim token'larını, `.env` dosyalarını, kişisel verileri ve kullanıcı görsellerini asla repoya koyma.
- `rhizon-protocol` hedefi seçilmiş olsa da benzer/eski depo envanteri tamamlanmadan ikinci bir kanonik depo yaratma veya mevcut depoyu yeniden adlandırma.

## 4. Ürün sınırı ve ilk yayın ilkesi

### İlk gerçek kullanıcı ürünü

1. Çoklu fotoğraf ekleme ve sürükle-bırak.
2. JPEG/PNG/WebP dönüştürme; boyut ve kalite ayarı.
3. Her dosya için durum, süre, boyut farkı ve anlaşılır hata.
4. Tekil indirme ve toplu ZIP indirme.
5. Erişilebilir ve mobil uyumlu Türkçe arayüz.
6. Mümkün olduğunda Web Worker üzerinden yerel işleme; güvenli geri dönüş.
7. Kullanıcıya açık gizlilik ve bellek/dosya sınırları.

### Dağıtık modun dürüst sınırı

- WebRTC modu “deneysel” olarak işaretlensin; varsayılan kapalı kalsın.
- Kullanıcıya eş cihazın seçilen görseli göreceği söylenmeden hiçbir dosya gönderilmesin.
- İlk deney sadece sabit, izin verilen görsel dönüştürme görevi olsun; uzaktan kod çalıştırma yok.
- STUN dış bağımlılığı görünür dokümante edilsin; TURN/sinyalleşme sunucusu yoksa bazı ağlarda bağlantının başarısız olması normal kabul edilsin.
- SHA-256, dosyanın aktarımda değişmediğini denetler; eş cihazın algoritmayı doğru çalıştırdığını kanıtlamaz.
- Dağıtık çalışma yerel işlemekten yavaşsa sonuç açıkça gösterilsin.

## 5. Yayın mimarisi

### İlk tercih: GitHub Pages + GitHub Actions

Uygulama statik HTML/CSS/JavaScript dosyaları olduğu ve sunucu tarafı API gerektirmediği sürece GitHub Pages ilk halka açık yayın için uygundur. Organizasyon GitHub Free kullanıyorsa Pages için depo herkese açık olmalıdır. Derleme/test/dağıtım için GitHub Actions kullanılabilir.

Hedef URL: `https://rhizon-protocol.github.io/ortak/`. Bu adres planlanan URL’dir; depo yaratılıp GitHub Pages etkinleştirilene ve ilk workflow başarılı olana kadar canlı olduğu varsayılmamalıdır.

Pages bir uygulama sunucusu değildir; kalıcı görev kuyruğu, merkezi eş bulma, gizli kullanıcı verisi, backend API veya TURN rölesi sağlamaz. İleride bunlar gerekirse statik istemciyi koru ve sunucu ihtiyacını ayrı teknik karar olarak değerlendir; ücretli servis zorunluluğu ekleme.

### Yayın öncesi zorunlu teknik kontroller

- Proje alt yolu (`/<repo>/`) için asset yolları doğru mu? Kök `/styles.css` gibi yanlış mutlak yollar Pages projesinde 404 yaratabilir.
- Service worker kapsamı, cache invalidation ve sürüm yükseltme doğru mu?
- Build çıktısı statik; gizli anahtar, test verisi veya özel dosya içeriyor mu?
- Güvenlik başlıkları, CSP ihtiyacı, dış ağ talepleri ve bağımlılıklar gözden geçirildi mi?
- HTTPS yayında aktif mi?
- Üretim URL'si test edildi mi; gerçek bir görsel yüklenip dönüştürülüp indirildi mi?
- Uygulama telemetri göndermese de GitHub Pages'in ziyaretçi IP adresini güvenlik amacıyla kaydedebileceği gizlilik notunda açıklanmalı.
- STUN kullanılırsa karşı tarafın ve STUN hizmetinin gördüğü ağ metaverileri gizlilik notunda açıklanmalı.

## 6. Depo içeriği ve topluluk için minimum dosyalar

- `README.md` — proje amacı, durum, ekran görüntüsü, canlı uygulama, özellikler, hızlı başlangıç, sınırlar.
- `LICENSE` — hazırlık paketinde Apache-2.0 var; yayın öncesi sahibi tarafından onaylanmalı.
- `CONTRIBUTING.md` — geliştirme kurulumu, test/build, commit ve PR akışı.
- `CODE_OF_CONDUCT.md` — toplulukta beklenen davranış ve bildirim yolu.
- `SECURITY.md` — güvenlik bildirimi, desteklenen sürümler, hassas raporların kamuya açık issue olarak açılmaması.
- `.github/ISSUE_TEMPLATE/bug_report.yml` ve `feature_request.yml`.
- `.github/PULL_REQUEST_TEMPLATE.md`.
- `.github/workflows/ci.yml` — pull request'te test, typecheck ve build.
- `.github/workflows/pages.yml` — ana branch'ten doğrulanmış build'in Pages'e dağıtımı; PR'ler otomatik yayın yapmasın.
- `docs/architecture.md`, `docs/research.md`, `docs/testing.md`, `docs/launch-plan.md`.
- `CHANGELOG.md` veya GitHub Releases ile sürüm notları.

Varsayılan dal `main`; branch koruma/Ruleset, en azından CI kontrolü ve yayın yetkisini sınırlama önerilir. Katkıcıya minimum gerekli erişim verilmeli; `Write` veya `Admin` rolü gereksiz yere verilmemeli.

## 7. Lisans ve marka

**Geçici varsayılan:** Bu hazırlık paketine Apache License 2.0 eklendi. Protokol/motor ekosistemi açısından patent lisansı hükümlerinin açıklığı yararlı olabilir. Kamuya açmadan önce lisansın proje sahibi tarafından onaylanması ve gerekirse değiştirilmesi gerekir; bu bir hukuki danışmanlık değildir. Dokümantasyon ve görseller için farklı lisans gerekiyorsa açıkça belirt.

Marka kontrol listesi:

- [ ] `Ortak` adı aynı alandaki GitHub projelerinde ve web'de araştırıldı.
- [ ] Repo sahibi/organizasyon adı ve kısa İngilizce açıklama anlaşılıyor.
- [ ] Logo/favicon ve ekran görüntülerinin lisansı net.
- [ ] Alan adı alınması gerekiyorsa henüz zorunlu yapılmadı; ücretsiz GitHub Pages adresi yeterli.
- [ ] Ticari marka/alan adı kullanılabilirliği doğrulanmadan müsait olduğu ileri sürülmedi.

## 8. Yayın kapıları (milestone'lar)

### M0 — Envanter ve yer seçimi

**Çıktılar:** `rhizon-protocol` içindeki ve gerekirse diğer organizasyonlardaki benzer depoların envanteri; `ortak` adı çakışma kontrolü; eski proje için `reuse/merge/new` kararı.

**Geçiş kriteri:** Eski proje araması belgeli; hedef sahibi ve sahiplik gerekçesi belli.

### M1 — Açık kaynağa hazırlık

**Çıktılar:** Lisans, README, katkı rehberi, davranış kuralları, güvenlik politikası, issue/PR şablonları, CI.

**Geçiş kriteri:** Temiz ortamda build/test geçiyor; gizli bilgi taraması yapıldı; kurulum adımları başka bir geliştirici tarafından takip edilebilir.

### M2 — Üretim statik yayını

**Çıktılar:** GitHub Actions ile Pages yayını, mobil kontrol, açık gizlilik notu, sürüm `v0.1.0` veya `v0.1.0-alpha`.

**Geçiş kriteri:** Yayındaki URL'de gerçek JPG/PNG/WebP dosyaları işlenip indirildi; bozuk dosya diğer dosyaları durdurmadı; en az iki tarayıcı türü denendi veya denenmeyenler raporda açıklandı.

### M3 — Gönüllü kullanıcı pilotu

**Çıktılar:** Basit test protokolü, gönüllü ve isteğe bağlı geri bildirim, cihaz/tarayıcı/işlem koşulu kayıt şablonu.

**Geçiş kriteri:** Başarı/hata ve süre metriklerinin anlamı belli; telemetri açık rıza olmadan yok; gerçek kullanıcı dosyaları toplanmıyor.

### M4 — Eşler arası teknik kanıt

**Çıktılar:** İki ayrı cihaz ve en az iki farklı ağ senaryosunda deneme; aktarım süresi, veri miktarı, başarısız bağlantı ve çıktı doğrulaması.

**Geçiş kriteri:** Gerçekten farklı cihazların iş/sonuç gönderdiğine dair tekrar edilebilir test adımları ve kanıt; başarısız denemeler de raporda.

### M5 — Ürün/altyapı ayrımı kararı

**Çıktılar:** Ölçüme dayalı karar: Web/PWA'da kal, yerel istemci ekle, görev motorunu ayır veya protokol entegrasyonu yap.

**Geçiş kriteri:** Yeni depo açmak için somut bağımsız sürümleme/yönetişim/yeniden kullanım ihtiyacı var.

## 9. Pilot metrikleri

İlk pilotun başarısı kullanıcı veya cihaz sayısıyla tek başına ölçülmemeli. Şu metrikleri aynı görev kümesi ve kalite ayarıyla karşılaştır:

- Görev sayısı: başarılı / başarısız / iptal edilen.
- Medyan ve p95 toplam süre.
- Kaynak ve çıktı toplam baytları; kazanılan bayt ve oran.
- Yerel tek işçi / yerel çoklu işçi sonuç doğruluğu.
- Eşler arası bağlantı başarı oranı, bağlantı kurma süresi, aktarım süresi, giden/gelen bayt.
- Mobil/masaüstü, tarayıcı, yaklaşık kaynak ölçüsü (gönüllünün isteğe bağlı paylaştığı) ve hata türü.
- Geri bildirim: anlaşılırlık, güven ve başlıca takılma noktaları.

Fotoğraf, dosya adı veya içerik merkezî analitiğe eklenmez. Rapor paylaşacak kullanıcıdan açık onay alınır; kişisel veri içeren ekran görüntüleri istenmez.

## 10. Güvenlik ve kötüye kullanım sınırları

- İlk sürüm hesaplama pazarı değildir; anonim kullanıcıların birbirine keyfi işler göndermesi yok.
- Sadece önceden tanımlı görev tipi, sınırlı boyut ve sınırlı görev adedi.
- Alıcı açıkça onaylamadan dosya içeriği aktarılmaz.
- Uzak tarafta çalıştırılabilir kod, kullanıcı betiği veya keyfi WASM çalıştırılmaz.
- Gönderici ve alıcı sonuçlarının doğruluğu kesin kabul edilmez; raporda hash bütünlüğü ve algoritmik doğrulama farkı anlatılır.
- Bağlantı teklifi/yanıtı gizli kimlik bilgisi gibi güvenilmeyen kişilerle paylaşılmamalı; oturum bitince atılmalı.
- Gönüllü kaynak paylaşımı varsayılan kapalıdır; sürekli arka plan işi ve sınırsız kaynak kullanımı yok.
- Hassas dosyaların eşe gönderilmemesi yönünde uyarı gösterilir.

## 11. Risk kaydı

| Risk | Etki | Azaltma |
|---|---|---|
| Aynı amaca yönelik eski repo gözden kaçırılır | Kod/karar tekrarı | Organizasyon araması ve envanter M0 geçiş koşulu |
| Ortak ile Rhizon protokol depolarının sorumluluğu karışır | Mimari belirsizlik | Ortak kullanıcı ürünü; çekirdek/protokol ayrı depolarda ve belgeli entegrasyonla |
| GitHub Pages base path/service worker hatası | Uygulama boş açılır veya eski sürüm kalır | Gerçek Pages URL'sinde smoke test ve cache sürümleme |
| WebRTC NAT/firewall sorunu | Bazı kullanıcılar bağlanamaz | Deneysel etiket, açık hata mesajı, yerel geri dönüş, koşulları raporlama |
| Eş yanlış/kalitesiz sonuç üretir | Ölçüm yanıltılır | Sonuç kontrolleri, tekrarlı görev stratejisini sonraki aşamada değerlendirme |
| Büyük görseller bellek baskısı yaratır | Tarayıcı kapanması | Boyut limitleri, kuyruk/işçi sınırı, mobil testler |
| Gizlilik iddiaları olduğundan güçlü | Kullanıcı güveni ve risk | IP/STUN metaverisi ve dosya aktarımı açıklamasını ayrıştırma |
| Açık depoda secret veya özel içerik | Güvenlik olayı | Yayın öncesi tarama, secret scanning/push protection imkânlarını açma |

## 12. Bugünkü PoC'nin durumu ve yayın öncesi boşluklar

Mevcut paket (`README.md`, `docs/architecture.md`, `docs/research.md`, `docs/testing.md`) bir bağımlılıksız statik istemci uygulaması, birim testleri ve prototip WebRTC akışı içeriyor. Belgelenmiş otomatik sonuçlar: 8/8 birim testi, TypeScript 5.8.3 ile tür denetimi, üretim derlemesi, 12 statik HTTP kaynağı kontrolü ve 11 JavaScript/MJS sözdizimi kontrolü başarılı.

Önceki test kaydı, bu çalışma ortamında tarayıcı kısıtı nedeniyle gerçek görsel işlemeyi ve WebRTC uçtan uca testini doğrulayamadığını açıkça belirtiyor. Bu yüzden aşağıdakiler tamamlandı gibi sunulamaz:

- Gerçek Pages yayını.
- Canlı URL üzerinde dosya işleme ve indirme.
- Farklı fiziksel cihazlar veya farklı ağlar arasında WebRTC.
- Safari/Firefox ve çeşitli mobil cihazlarda uyumluluk.
- Gönüllü kullanıcı testi.

Bu boşluklar projenin değerini ortadan kaldırmaz; bir sonraki sürüm için doğrulama kapılarını tanımlar.

## 13. Hemen uygulanacak sıra

1. GitHub erişimiyle ilgili organizasyonlardaki depoları ve olası eski projeyi oku; yalnızca kullanıcı tarafından verilen organizasyon listesiyle sınırlı kalma.
2. M0 envanterini tamamla; `rhizon-protocol` içindeki benzer depo için `reuse/merge/new` kararını belgeli ver.
3. PoC paketindeki `LICENSE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, issue/PR şablonları ve GitHub Actions iş akışlarını gözden geçir; Apache-2.0 lisansını yayından önce onayla.
4. GitHub Pages alt yolunu ve service worker davranışını doğrula; üretim build ve test kapısı ekle.
5. Depoyu public yapmadan önce secret, kişisel veri, dosya, lisans ve bağımlılık taraması yap.
6. M2 kabul testini canlı URL üzerinde tamamla; test edilmemiş platformu açıkça belirt.
7. İlk kullanıcı pilotunu küçük ve geri bildirim odaklı başlat; dağıtık modu deneysel tut.
8. Fiziksel cihazlar arası ölçümleri kaydet ve ancak kanıtlandıktan sonra dağıtık yeteneği öne çıkar.

## 14. Kaynaklar ve dış doğrulama

- GitHub Pages site oluşturma ve plan koşulları: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
- GitHub Pages yayın kaynağı / GitHub Actions: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- Özel Actions ile Pages dağıtımı: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- GitHub depo görünürlüğü ve herkese açık kaynak kodu güvenliği: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility
- Organizasyon profil README'si ve sabitlenen depolar: https://docs.github.com/en/organizations/collaborating-with-groups-in-organizations/customizing-your-organizations-profile
- Kuruluş depolarında minimum erişim rolleri: https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/repository-roles-for-an-organization
- WebRTC sinyalleşme modeli: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling

Organizasyon kararı `rhizon-protocol` olarak verilmiştir. Bu belge GitHub deposunun fiilen oluşturulduğunu, dosyaların push edildiğini veya Pages yayınının tamamlandığını iddia etmez; bunlar hâlâ yapılması gereken yetkili GitHub adımlarıdır. Apache-2.0 varsayılan lisansı da kamuya açılmadan önce proje sahibi tarafından onaylanmalıdır.


## Otomatik katılımcı ağı için zorunlu ara aşama

İlk sürümde kullanıcılar siteyi birlikte açınca otomatik olarak birbirini bulmaz; WebRTC bağlantısı elle kurulur. Bu, uzun vadeli ortak hesaplama hedefi değil, erken prototipin mevcut sınırlamasıdır. Presence/sinyalleşme, opt-in katılımcı havuzu, görev eşleştirme ve sonuç doğrulama aşamalarının ayrıntılı teknik planı [`collective-network-plan.md`](collective-network-plan.md) dosyasındadır. Bu altyapı devreye alınmadan uygulama otomatik dağıtık hesaplama ağı olarak duyurulmayacak.

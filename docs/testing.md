# Test planı ve sonuçlar

## Otomatik kontroller

- `node --test tests/*.test.mjs`: boyut formatlama, sıkıştırma oranı, en-boy korumalı yeniden boyutlandırma, MIME/uzantı ve dosya boyutu kontrolleri, çıktı adlandırma, JPEG şeffaflık uyarısı ve limitler.
- `npm run typecheck`: uygulama/worker JavaScript tür kontrolü; yerel TypeScript kurulumu varsa onu kullanır, yoksa `typescript@5.8.3` paketini npm üzerinden indirmeyi dener.
- `npm run build`: statik `dist/` üretimi.

## Manuel kabul adımları

1. Farklı JPEG, PNG, WebP ve hatalı/bozuk dosya ekle; geçerli işlerin bozuk dosyadan etkilenmediğini denetle.
2. WebP/JPEG/PNG çıktısını, ölçü limitlerini ve kalite ayarını denetle.
3. Tek işçi ve çoklu işçi denemelerinde aynı dosya kümesini kullan; başarılı/hatalı iş sayısı ve süreleri karşılaştır.
4. İki ayrı HTTPS tarayıcı bağlamında davet/yanıtı elle değiş tokuş et. Alıcı onayı olmadan içerik aktarılmadığını doğrula.
5. Alıcıda gelen dosyanın işlendiğini, sonucun göndericiye döndüğünü, iki taraftaki dosya özetlerinin doğrulandığını ve kıyaslama satırının oluştuğunu kontrol et.
6. Ağ bağlantısını keserek başarısız bağlantı ve yerel moda dönüş uyarılarını doğrula.

## 11 Ekim 2026 tarihli doğrulama raporu

- `npm test`: **8/8 birim testi geçti**.
- `npm run typecheck`: **bu ortamda TypeScript 5.8.3 ile geçti** (uygulama/peer/worker denetimleri). CI iş akışı da aynı komutu çağırır; temiz GitHub runner gerekirse derleyiciyi npm’den indirir.
- `npm run build`: **geçti**, `dist/` üretildi.
- Yerel HTTP statik rota kontrolü: **12/12 kaynak 200 OK** (HTML, JS modülleri, CSS, manifest, ikon ve `.nojekyll`).
- `node --check`: **11/11 JavaScript ve MJS dosyası sözdizimi kontrolünden geçti**.
- Geliştirme HTTP sunucusu için yol geçişi denemeleri: iki deneme `404`, bir şüpheli kodlanmış yol `403`; sunucu kökü dışındaki dosya açılmadı.
- Gerçek fotoğraf işleme ve WebRTC uçtan uca denemesi: **başlatılmaya çalışıldı, ancak tarayıcı yönetim politikası engelledi**. Chromium DevTools Protocol `Page.navigate` çağrısı `http://127.0.0.1:4173/` için `net::ERR_BLOCKED_BY_ADMINISTRATOR` döndürdü. Bu nedenle gerçek tarayıcıda görsel işleme, WebRTC bağlantısı veya uçtan uca veri aktarımı bu ortamda doğrulanmadı; başarılı olmuş gibi raporlanmıyor.

## Tarayıcı entegrasyon testini başka ortamda çalıştırma

Bu klasörde isteğe bağlı `scripts/e2e-p2p.mjs` testi bulunur. `npm run serve` çalışırken başka iki terminalde Chromium'u iki ayrı kullanıcı profili ve hata ayıklama portuyla aç:

```bash
chromium --headless=new --no-sandbox --remote-allow-origins='*' --remote-debugging-port=9222 --user-data-dir=/tmp/ortak-a about:blank
chromium --headless=new --no-sandbox --remote-allow-origins='*' --remote-debugging-port=9223 --user-data-dir=/tmp/ortak-b about:blank
node scripts/e2e-p2p.mjs
```

Bu test iki ayrı tarayıcı oturumunu aynı makinede kullanır; fiziksel iki cihaz testi değildir. Bu çalışma ortamındaki tarayıcı politikası yerel URL navigasyonunu engellediğinden burada tamamlanamadı.

Fiziksel farklı cihazlar ve Safari/Firefox üzerinde test yapılmadığı sürece bu tarayıcı/ağ kabul kriterleri doğrulanmış sayılmaz. Eşler arası özelliğin iki farklı fiziksel cihaz ve farklı ağlar arasında çalıştığı, ayrıca TURN olmadığı durumda her NAT topolojisinin desteklendiği iddia edilmez. Bu sınırlamalar giderilmeden bu PoC bir kamuya açık hesaplama pazarı olarak sunulmamalıdır.


## 11 Ekim 2026 — CI hata düzeltmesi sonrası tekrar kontrol

Kullanıcının ilk GitHub Actions çalıştırmasında `public/peer.js` içindeki iki `new Promise` yürütücüsü `resolve()` değerini TypeScript 5.8.3 denetiminde zorunlu argümansız kullanıyordu. Her iki çağrı `resolve(undefined)` olarak düzeltildi. Aynı zamanda `actions/checkout@v7`, `actions/setup-node@v7`, Node.js 24 ve `ubuntu-24.04` ile uyarı veren Node 20 tabanlı eylem sürümleri ve `ubuntu-latest` geçiş belirsizliği giderildi.

Bu paket üzerinde tekrar çalıştırılan doğrulamalar:

- `npm test`: **8/8 geçti**.
- `npm run typecheck`: **başarılı**.
- `npm run build`: **başarılı**.
- `node --check` (JS ve MJS kaynakları): **başarılı**.

Bunlar yerel doğrulamalardır. Düzeltilmiş commit henüz uzak depoya gönderilmediğinden GitHub Actions'ın başarılı olduğu veya Pages'in yeni sürümü yayınladığı iddia edilmez. Ayrıca otomatik katılımcı keşfi ve görev dağıtımı yoktur; bunun için `collective-network-plan.md` belgesindeki ayrı koordinatör hizmetinin uygulanıp dağıtılması gerekir.

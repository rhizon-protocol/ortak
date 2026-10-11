# GitHub Pages — mevcut deponun düzeltilmesi ve yayının doğrulanması

**Hedef depo:** [`rhizon-protocol/ortak`](https://github.com/rhizon-protocol/ortak)

İlk gönderimde `Validate and deploy Ortak` derlemesi `public/peer.js` içindeki iki `resolve()` çağrısının tür hatası nedeniyle başarısız oldu. Düzeltilmiş kod ve güncellenmiş GitHub Actions akışı bu pakette yer alır. Aşağıdaki adımları mevcut depoya uygula; yeni bir depo oluşturma.

## 1. Değişikliği mevcut depoya uygula

Önce GitHub deposunun yerel bir klonunu al:

```bash
git clone https://github.com/rhizon-protocol/ortak.git
cd ortak
```

İndirilen `ortak-ci-network-hotfix.patch` dosyasını bu klasörün yanına koyduysan şu komutla değişiklikleri uygula:

```bash
git apply ../ortak-ci-network-hotfix.patch
```

Patch uygulanamıyorsa dosyalarda farklı değişiklikler olabilir. O durumda yalnızca aşağıdaki düzeltmeleri uygula ve mevcut kullanıcı değişikliklerini üzerine yazma:

- `public/peer.js`: ICE toplama işlevinde ve `bufferedamountlow` bekleyicisinde `resolve()` çağrısını `resolve(undefined)` olarak değiştir.
- `.github/workflows/pages.yml`: `actions/checkout@v7`, `actions/setup-node@v7`, `node-version: '24'` ve `runs-on: ubuntu-24.04` kullan.
- `public/service-worker.js`: önbellek anahtarını `ortak-static-v2` yap ki eski kurulu PWA önceki sayfayı göstermeye devam etmesin.
- Yeni `docs/collective-network-plan.md` dosyasını ve README'deki kapsam açıklamasını ekle. Bu sürümde otomatik katılımcı havuzu olmadığı kullanıcıya açıkça söylenmeli.

## 2. Göndermeden önce yerel test

Node.js 24 önerilir; proje runtime için Node.js 20.11+ ister.

```bash
npm test
npm run typecheck
npm run build
```

Üç komut da başarılı olmalı. Ardından değişikliği gönder:

```bash
git status --short
git add .
git commit -m "Fix CI and document collective network roadmap"
git push origin main
```

## 3. GitHub Pages ayarını kontrol et

1. Depoda **Settings → Pages** bölümünü aç.
2. **Build and deployment → Source** değerinin **GitHub Actions** olduğunu doğrula.
3. **Actions** sekmesinde yeni commit için `Validate and deploy Ortak` çalışmasını aç.
4. `build` ve `deploy` işleri başarılı olmadan uygulamanın yeni sürümünün yayınlandığını varsayma.
5. Başarılı dağıtımdan sonra `https://rhizon-protocol.github.io/ortak/` adresini yeni gizli pencere veya tarayıcı profiliyle aç. Yüklü PWA eski sürümü gösteriyorsa site verisini/servis çalışanı önbelleğini temizleyip yeniden yükle.

## 4. Mevcut sürümün gerçek sınırı

Bu hotfix derlemeyi düzeltir; otomatik katılımcı keşfi ya da iş dağıtımını eklemez. Mevcut WebRTC deneyi davet/yanıtı elle kopyalamaya dayanır. İnsanların siteyi açar açmaz gönüllü havuzuna katılması, çevrimiçi katılımcı listesinin görülmesi ve işlerin otomatik eşleşmesi için koordinatör/sinyalleşme hizmeti gerekir. Ayrıntılı tasarım, ücretsiz plan limitleri, rıza ve test geçiş ölçütleri [`collective-network-plan.md`](collective-network-plan.md) içindedir.

## 5. Canlı sürüm kabul testi

- Gerçek JPEG, PNG, WebP dosyalarını işleyip çıktıları indir.
- Bozuk dosyanın diğer dosyaları durdurmadığını doğrula.
- Mobil ve masaüstünde deneyin.
- Mevcut prototipin WebRTC testini ayrı iki fiziksel cihazda dene; tek makinedeki iki tarayıcı fiziksel cihazlar arası testi kanıtlamaz.
- İş akışı bağlantısı, cihaz/tarayıcı ve gerçek sonuçları `docs/testing.md` içine ekle.

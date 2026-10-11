# Kısa araştırma notu

**Araştırma tarihi:** 11 Ekim 2026. Kaynakların canlı sürümleri zamanla değişebilir. Aşağıdaki maddeler, resmî dokümantasyon üzerinden PoC kapsamını seçmek için yapılan kısa incelemeyi özetler.

## Teknik kaynaklar ve çıkarımlar

- [MDN — Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) ve [Transferable objects](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects): Uzun işlemleri arayüz iş parçacığından ayırma; `ArrayBuffer` gibi verileri kopyalamadan worker bağlamına taşıma. Yerel görsel işleyici bu modeli kullanır.
- [MDN — WebRTC signalling](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling) ve [Using data channels](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_data_channels): WebRTC veri aktarımı eşler arasında olabilir; fakat bağlantı pazarlığı için bir sinyalleşme kanalından SDP/ICE bilgisinin karşılıklı taşınması gerekir. PoC, bu kısmı kopyala-yapıştır yapar; ağ bağlantısı otomatik olarak garanti edilmez.
- [MDN — Installable PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable): Manifesto ve HTTPS/güvenli bağlam koşulları. Temel manifest ve statik önbellek eklendi.
- [BOINC — Getting started](https://boinc.berkeley.edu/intro.php) ve [BOINC volunteer computing paper](https://boinc.berkeley.edu/boinc_a_platform_for_volunteer_computing.pdf): Görev/sonuç modeli ve farklı bilgisayarlardan gelen sonuçları karşılaştırma/çoğaltma ile doğrulama. Ortak'ın bu PoC'si BOINC'e bağlı değildir; yinelenen işlem doğrulaması ileriki sürüm için fikir verir.
- [Acurast dokümantasyonu](https://docs.acurast.com/) ve [mimari özeti](https://docs.acurast.com/acurast-protocol/architecture/architecture/): Telefon tabanlı hesaplama ağı, sağlayıcı eşleştirme ve güvenilir çalıştırma/TEE yaklaşımı. Ortak, donanım destekli uzaktan kanıt iddiasında bulunmaz; yalnızca kullanıcı onaylı WebRTC prototipidir.
- [Golem — Overview](https://docs.golem.network/docs/golem/overview), [requestor architecture](https://docs.golem.network/docs/golem/overview/requestor): Kaynak sağlayıcı/talep eden, görev parçalama ve uzaktaki kontrollü çalışma modeli. Golem entegrasyonu veya ücret/GLM akışı yoktur.
- [Salad Cloud docs](https://docs.salad.com/) ve [Salad Cloud overview](https://github.com/SaladTechnologies/salad-cloud-docs): Dağıtılmış kaynaklarda kapsayıcı iş yükleri çalıştırma yaklaşımı. Yerel tarayıcı PoC'si için kapsayıcı çalışma ortamı fazla ağır olur; entegrasyon yapılmadı.
- [FAR AI distributed inference](https://farlabs.ai/products/farai): Tüketici GPU'larını yönlendirme ve doğrulama katmanı üzerinden gerçek zamanlı çıkarım için kullanma fikri. Bu, genel web tarayıcısında dosya dönüştürme ile aynı dağıtım modeli değildir; entegrasyon yapılmadı.
- [Render Network — how it works](https://rendernetwork.com/how-it-works) ve [Knowledge Base](https://know.rendernetwork.com/): GPU düğümlerinde paralel render ve talep/sağlayıcı pazarı. Bu PoC GPU render işi değil; Render'a iş göndermez.
- [ffmpeg.wasm — Overview](https://ffmpegwasm.netlify.app/docs/overview/) ve [Performance](https://ffmpegwasm.netlify.app/docs/performance/): Wasm üzerinde medya işlemeyi worker'a alır; ek çekirdek dosyalarının indirilmesi ve çok iş parçacıklı modda çapraz kaynak izolasyonu gibi şartları bulunur. Fotoğraf için yerleşik API'ler yeterli olduğundan eklenmedi.
- [Transformers.js](https://huggingface.co/docs/transformers.js/en/index) ve [WebGPU guide](https://huggingface.co/docs/transformers.js/guides/webgpu): Tarayıcıda WASM/WebGPU ile model çıkarımı mümkün, fakat model dosyaları, bellek ve WebGPU uyumluluğu maliyeti var. İlk PoC'nin AI hedefi olmadığı için kullanılmadı.

## Mimari kararın özeti

PoC'nin amacı ücretsiz kalabilen küçük bir ürün ve gerçek cihazlar arası aktarımı kanıtlanabilir biçimde sınamaktır. Bu nedenle ilk sürüm için tarayıcı API'leri, Web Workers, statik PWA ve manuel sinyalleşmeli WebRTC seçildi. Hesaplama pazarı, blokzincir, model çalıştırma, veri tabanı ve ücretli servisler kapsam dışı bırakıldı.

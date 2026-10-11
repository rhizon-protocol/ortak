# Katkı Rehberi

Ortak'a katkı verdiğin için teşekkürler. Kullanıcı arayüzü ve dokümantasyon öncelikle Türkçe; kod, değişken adları, commit mesajları ve teknik yorumlar İngilizce olabilir.

## Başlamadan önce

1. Kullanıcı dosyalarını veya gizli bilgileri issue/PR'lara ekleme.
2. Büyük değişikliklerden önce bir Issue açıp kapsamı tartış.
3. Küçük, odaklı pull request'ler gönder.

## Yerel doğrulama

Node.js 20.11+ ile:

```bash
npm test
npm run build
npm run typecheck
npm run serve
```

## Güvenlik ilkeleri

- Varsayılan işleme yerel kalmalı.
- Dosya paylaşımı açık kullanıcı onayı olmadan başlamamalı.
- İlk sürümde uzaktan rastgele kod çalıştırma ekleme.
- Ölçülmeyen dağıtık işlem başarısını iddia etme.
- Yeni bir dış servis, analiz/telemetri veya ücretli bağımlılık ekliyorsan PR açıklamasında nedenini ve gizlilik etkisini belirt.

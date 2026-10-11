# Değişiklik günlüğü

Bu dosya önemli kullanıcıya dönük değişiklikleri ve bilinen sınırlamaları listeler.

## Geliştirme — CI düzeltmesi ve ağ mimarisi açıklığı

- TypeScript denetiminin bulduğu WebRTC kodundaki iki sıfır argümanlı `resolve()` çağrısı `resolve(undefined)` olarak düzeltildi.
- GitHub Actions `checkout` ve `setup-node` eylemleri Node.js 24 ile çalışan güncel ana sürümlere geçirildi; runner `ubuntu-24.04` olarak sabitlendi.
- Kullanıcı arayüzü, bu sürümde otomatik katılımcı keşfi ve otomatik görev dağıtımı olmadığını açıkça söylüyor.
- Otomatik presence, WebRTC sinyalleşmesi, gönüllü katılım, görev eşleştirme ve ücretsiz altyapı kotaları için `docs/collective-network-plan.md` eklendi.
- Service worker önbellek sürümü artırıldı; eski arayüz sürümünün güncellemeyi gizlemesi önleniyor.

## 0.1.0-alpha — ilk açık pilot hazırlığı

- Türkçe öncelikli fotoğraf küçültme, yeniden boyutlandırma ve biçim dönüştürme arayüzü.
- Yerel görev kuyruğu, Web Worker ile işleme, iptal ve temel ölçümler.
- Tekil indirme ve toplu ZIP çıktı.
- Deneysel, elle sinyalleşmeli WebRTC DataChannel akışı ve alıcı onayı.
- PWA manifestosu, temel servis çalışanı önbelleği, GitHub Pages iş akışı.
- Katkı, davranış, güvenlik, araştırma, mimari, yayın ve test belgeleri.

### Yayın notu

İlk gönderimdeki GitHub Actions tür denetimi hatası düzeltildi. Bu düzeltmenin uzak depoya gönderilip `Validate and deploy Ortak` iş akışının başarılı tamamlandığı ayrıca doğrulanmalıdır. İki fiziksel cihaz arasında WebRTC ve otomatik katılımcı havuzu henüz doğrulanmış/uygulanmış değildir; dağıtık modun tüm ağlarda çalıştığı iddia edilmez.


## Unreleased

- Define a zero-mandatory-cost policy for hosting, peer discovery, and WebRTC fallback behavior.
- Make the TypeScript fallback more compatible with Windows npm environments by invoking the npm JavaScript CLI when available.

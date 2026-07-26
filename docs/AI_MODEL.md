# 🤖 Project Nucleus

> **AI Model Seçim Rehberi**
>
> Bu doküman, projede Claude Code ile çalışırken senaryoya göre hangi modelin ve efor (effort) seviyesinin seçileceğini tanımlar.
>
> Ürün dokümanı değildir; geliştirme süreci aracıdır. `CONTRIBUTING.md` içindeki "AI-Assisted Development" ilkeleriyle birlikte okunmalıdır.

---

# Efor Seviyeleri

Güncel modellerde düşünme (thinking) ayrı bir açma/kapama ayarı değildir; model gerektiğinde kendisi düşünür. Kontrol edilen tek şey **efor seviyesidir**.

| Model | Kullanılabilir Efor Seviyeleri |
|-------|-------------------------------|
| Fable 5 | Low → Medium → High → Extra High → Max → Ultracode (xHigh + Workflows) |
| Opus 5 | Low → Medium → High → Extra High → Max → Ultracode (xHigh + Workflows) |
| Sonnet 5 | Low → Medium → High → Extra High → Max → Ultracode (xHigh + Workflows) |
| Haiku 4.5 | Efor ayarı yok |

Genel ilkeler:

- **Extra High (xHigh):** Kodlama ve ajan tipi işler için önerilen üst seviye; Claude Code'un zor işlerdeki varsayılanı.
- **Max:** Maliyet yerine doğruluğun öncelikli olduğu nadir durumlar.
- **Low / Medium:** Fable 5'te düşük seviyeler bile çok güçlüdür; rutin işlerde gerçek tasarruf kolu budur.

---

# Model Hiyerarşisi

Yetenek sırası (yukarıdan aşağıya): **Fable 5 → Opus 5 → Sonnet 5 → Haiku 4.5**

- **Fable 5** en yetenekli modeldir; Opus'un üzerindeki Mythos sınıfı kademede yer alır.
- **Opus 5**, Fable'ın maliyetine değmeyen ama Sonnet'e fazla gelen işler için orta-üst kademedir.
- **Sonnet 5** hız/kalite dengesi; küçük ve orta işlerin varsayılanıdır.
- **Haiku 4.5** en hızlı ve en ucuz seçenektir; basit mekanik işler için uygundur.

---

# Senaryo Tablosu

| Senaryo | Model | Efor | Neden |
|---------|-------|------|-------|
| Projeyi ilk kez başlatma | Fable 5 | Medium | Dokümantasyonu analiz eder, proje bağlamını oluşturur. |
| Dokümanları okuma ve özetleme | Fable 5 | Medium | Dokümanlar arasındaki ilişkiyi daha iyi kurar. |
| Yeni faza başlama (Roadmap) | Fable 5 | Medium | Faz kapsamını doğru yorumlar, ileriye sıçramaz. |
| Mimari kararlar | Fable 5 | High / xHigh | Alternatifleri değerlendirir ve gerekçelendirir. |
| Tauri + Rust geliştirme | Fable 5 | Medium – High | Backend ve frontend arasındaki ilişkiyi korur. |
| React / UI geliştirme | Fable 5 | Medium | UI Guidelines'a daha tutarlı uyar. |
| Büyük refactor | Fable 5 | High / xHigh | Mevcut mimariyi bozmadan düzenleme yapma olasılığı artar. |
| Kod inceleme (Code Review) | Fable 5 | High / xHigh | Kod kalitesi ve mimari uyumu değerlendirir. |
| Performans optimizasyonu | Fable 5 | High / xHigh | Darboğazları analiz etmek için ek muhakeme faydalıdır. |
| Yeni widget tasarımı (Phase 5+) | Fable 5 | High / xHigh | API ve mimari kararlar içerir. |
| Fable gerekmeyen orta ağırlıkta işler | Opus 5 | High | Fable maliyetine değmeyen ama Sonnet'e fazla gelen işler. |
| Küçük özellik ekleme | Sonnet 5 | Medium | Hızlı ve yeterli. |
| Basit UI düzenlemeleri | Sonnet 5 | Low | Derin analiz gerektirmez. |
| Küçük bug düzeltmeleri | Sonnet 5 | Low | En hızlı seçenek. |
| README / Dokümantasyon | Sonnet 5 | Low | Yazım ve düzenleme için yeterli. |
| Mekanik / şablon işler | Haiku 4.5 | — | Efor ayarı yoktur; en ucuz ve en hızlı seçenek. |

---

# Notlar

- Fable 5'te düşünme her zaman açıktır ve kapatılamaz; derinliği efor seviyesi belirler.
- Sonnet 5'te de varsayılan davranış uyarlanabilir düşünmedir; düşünmeyi kapatmak yerine düşük efor seçmek önerilir.
- Maliyet oranı (girdi/çıktı, milyon jeton başına): Fable 5 → 10$/50$ · Opus 5 → 5$/25$ · Sonnet 5 → 3$/15$ · Haiku 4.5 → 1$/5$.
- Model ve efor seçimi bir öneridir; iş beklenenden zor çıkarsa seviye yükseltilmeli, kolay çıkarsa düşürülmelidir.

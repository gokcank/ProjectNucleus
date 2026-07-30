<div align="center">
  <h1>Project Nucleus 🧩</h1>
  <p><strong>A Modular Control Center for Linux</strong><br><em>Linux için Modüler Kontrol Merkezi</em></p>
  <br>

  <!-- Showcase screenshot/GIF goes here -->

<br><br>

[![Linux](https://img.shields.io/badge/LINUX-FCC624?style=for-the-badge&logo=linux&logoColor=black)](https://www.linux.org/)
[![Rust](https://img.shields.io/badge/RUST-000000?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![Tauri](https://img.shields.io/badge/TAURI-FFC131?style=for-the-badge&logo=tauri&logoColor=black)](https://tauri.app/)
[![React](https://img.shields.io/badge/REACT-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TYPESCRIPT-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TAILWIND%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)<br>
[![License](https://img.shields.io/badge/LICENSE-MIT-4c1?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/VERSION-V0.1.0-007EC6?style=for-the-badge)](https://github.com/gokcank/ProjectNucleus)
</div>

---

## 🇬🇧 English

### Overview

**Project Nucleus** is a modular, customizable control center for Linux, built with Tauri and React. Instead of scattering everyday tools across multiple applications, menus, and keyboard shortcuts, Nucleus brings them together into a single floating panel — productivity tools and utilities, all one shortcut away.

It isn't a desktop environment or a system monitor replacement; it's a fast, focused companion that sits on top of your existing Linux desktop (GNOME first) and stays out of the way until you need it.

### Features

- **Floating Panel:** A borderless, glass-styled panel toggled with a global shortcut or the tray icon, anchored to the top-right corner of your primary screen.
- **Card Dashboard:** A responsive, searchable grid of cards you can reorder, resize, and show or hide from Settings.
- **Productivity:** Clipboard History, Notes, Timer, Stopwatch, Pomodoro, Quick Links, Todo.
- **Utilities:** Colour Picker — pick any colour on screen and copy it.
- **Battery:** Charge level for the machine and for peripherals — a wireless mouse or headset.
- **Network:** Connection type/SSID plus local and public IP at a glance.
- **At-a-Glance Monitoring:** CPU and RAM cards for a quick status check — not a full monitoring suite.
- **Theming:** Light, Dark, or System — tracked live from the actual desktop color scheme via the XDG Settings portal, not guessed.

### Tech Stack

- **Backend:** Rust, Tauri v2
- **Frontend:** React, TypeScript, Vite
- **Styling:** Tailwind CSS v4
- **System Integration:** zbus (D-Bus / NetworkManager, UPower), ashpd (XDG Desktop Portals — Colour Picker, Settings)
- **Platform:** Linux (GNOME first), X11 today with Wayland support planned

### Architecture & Philosophy

Nucleus follows a **cards-before-widgets** approach: real, concrete cards were built first (Phase 3), and the shared Widget Engine (Phase 5) was only extracted once common patterns emerged — not designed upfront. The frontend never talks to the system directly; every privileged operation goes through a Rust command, keeping platform access on one side and presentation on the other. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`docs/DECISIONS.md`](docs/DECISIONS.md) for the full reasoning behind these choices.

### Security

The frontend never executes arbitrary system commands — all privileged operations (D-Bus calls, portal requests, colour scheme reads) are handled by the Rust backend and exposed only through explicit, narrow Tauri commands. Every window capability is opted into individually in `src-tauri/capabilities/`, rather than granted broadly.

### Status

Project Nucleus is in **early, active development** (see [`docs/ROADMAP.md`](docs/ROADMAP.md)) and is not yet published as a packaged release. Expect breaking changes.

---

## 🇹🇷 Türkçe

### Genel Bakış

**Project Nucleus**, Tauri ve React ile geliştirilmiş, modüler ve özelleştirilebilir bir Linux kontrol merkezidir. Günlük kullanılan araçları birden fazla uygulama, menü ve klavye kısayoluna dağıtmak yerine, tek bir kayan panelde bir araya getirir — üretkenlik araçları ve yardımcı programlar, tek bir kısayol uzağınızda.

Bir masaüstü ortamı ya da sistem izleme aracı değildir; mevcut Linux masaüstünüzün (öncelik GNOME) üzerinde duran, hızlı ve odaklı bir yardımcıdır — ihtiyaç duyulmadığında görünmez.

### Özellikler

- **Kayan Panel:** Genel bir kısayol veya tepsi simgesiyle açılıp kapanan, çerçevesiz, cam görünümlü, birincil ekranın sağ üst köşesine sabitlenmiş panel.
- **Kart Panosu:** Ayarlar'dan yeniden sıralanabilen, boyutlandırılabilen, gösterilip gizlenebilen, aranabilir duyarlı kart ızgarası.
- **Üretkenlik:** Pano Geçmişi, Notlar, Zamanlayıcı, Kronometre, Pomodoro, Hızlı Bağlantılar, Yapılacaklar.
- **Yardımcı Programlar:** Renk Seçici — ekrandaki herhangi bir rengi seçip kopyalayın.
- **Pil:** Makinenin ve çevre birimlerinin (kablosuz fare, kulaklık) şarj durumu.
- **Ağ:** Bağlantı türü/SSID ile yerel ve genel IP adresi tek bakışta.
- **Anlık Durum:** Hızlı bir bakış için CPU ve RAM kartları — tam bir izleme paketi değil.
- **Tema:** Açık, Koyu veya Sistem — tahmin edilerek değil, XDG Settings portalı üzerinden masaüstünün gerçek renk şemasından canlı olarak takip edilir.

### Kullanılan Teknolojiler

- **Arka Uç:** Rust, Tauri v2
- **Ön Yüz:** React, TypeScript, Vite
- **Stil:** Tailwind CSS v4
- **Sistem Entegrasyonu:** zbus (D-Bus / NetworkManager, UPower), ashpd (XDG Desktop Portals — Renk Seçici, Ayarlar)
- **Platform:** Linux (öncelik GNOME), şu an X11, Wayland desteği planlanıyor

### Mimari & Felsefe

Nucleus, **önce kart, sonra widget** yaklaşımını izler: önce gerçek, somut kartlar inşa edildi (Faz 3), ortak Widget Engine (Faz 5) ise yalnızca ortak örüntüler netleştikten sonra, baştan tasarlanmadan çıkarıldı. Ön yüz sistemle asla doğrudan konuşmaz; her yetkili işlem bir Rust komutundan geçer, platform erişimi ve sunum katmanı birbirinden ayrı kalır. Bu kararların tam gerekçesi için [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) ve [`docs/DECISIONS.md`](docs/DECISIONS.md) dosyalarına bakın.

### Güvenlik

Ön yüz asla rastgele sistem komutu çalıştırmaz — tüm yetkili işlemler (D-Bus çağrıları, portal istekleri, renk şeması okuma) Rust arka ucu tarafından yönetilir ve yalnızca açıkça tanımlanmış, dar kapsamlı Tauri komutlarıyla dışa açılır. Her pencere yetkisi, geniş kapsamlı değil, `src-tauri/capabilities/` içinde tek tek onaylanır.

### Durum

Project Nucleus **erken ve aktif geliştirme** aşamasındadır (bkz. [`docs/ROADMAP.md`](docs/ROADMAP.md)) ve henüz paketlenmiş bir sürüm olarak yayınlanmamıştır. Kırılgan değişiklikler olabilir.

---

<div align="center">
  <!-- Logo goes here -->
</div>

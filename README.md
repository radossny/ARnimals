# Wizyta zwierzaka – MVP

Aplikacja webowa dla dzieci (ok. 3–7 lat): wybierz zwierzątko, świadomie zezwól
na kamerę, zobacz zwierzątko w swoim otoczeniu. Statyczna, bez backendu, bez
kroku budowania, bez konta, bez reklam, bez śledzenia.

---

## 1. Decyzja architektoniczna

**Statyczna aplikacja jednostronicowa z HTML, CSS i modułów Vanilla JS.** Bez
frameworka, bez bundlera, bez zależności w czasie działania. Pliki kopiuje się
bez zmian na hosting HTTPS i aplikacja działa.

Uzasadnienie najważniejszych decyzji:

| Decyzja | Powód |
|---|---|
| Brak frameworka | Zakres funkcji to automat stanów z czterema ekranami. React czy Vue kosztowałyby 40–120 KB i niczego by nie uprościły. |
| Moduły ES bez bundlera | Pięć małych modułów pozostaje czytelnych i wymienialnych. Docelowe przeglądarki w pełni obsługują `type="module"`. |
| Progressive enhancement zamiast wymuszania AR | Tylko część przeglądarek mobilnych obsługuje prawdziwe AR przestrzenne. Tryb A działa wszędzie, tryb B jest dołączany. |
| `<model-viewer>` tylko w `js/ar.js` | Jedyna opcjonalna biblioteka zewnętrzna. W pełni zamknięta: `prepare()`, `activate()`, `dispose()`. Wymiana (np. na three.js + WebXR) dotyczy wyłącznie tego pliku. |
| Biblioteka ładowana leniwie | Wczytywana wyłącznie wtedy, gdy dla wybranego zwierzęcia skonfigurowano GLB/USDZ. W wersji z rysunkami zastępczymi nie powstaje **ani jedno** dodatkowe zapytanie sieciowe. |
| Rysunki SVG w kodzie źródłowym | Brak pobierania obrazów, dowolne skalowanie, żadnych obcych znaków towarowych ani postaci. |
| Warstwa zwierzątka w DOM/CSS zamiast canvas | Wyraźnie oszczędniejsza dla baterii i temperatury niż stale przerysowywany canvas. Pętla `requestAnimationFrame` ustawia tylko trzy zmienne CSS; kompozycję przejmuje GPU. |

**Automat stanów:** `select → consent → (ar | stage) → select`. Zmianę
wykonuje `showScreen()`; widoczna jest zawsze tylko jedna sekcja `<section>`,
a fokus przechodzi na jej nagłówek.

**Uruchomienie kamery jest przypięte do dokładnie jednego miejsca:** obsługi
kliknięcia przycisku „Włącz kamerę”. `getUserMedia()` nie jest wywoływane
nigdzie indziej.

### Biblioteki zewnętrzne

Dokładnie jedna, i to opcjonalna: **`<model-viewer>`** (Apache-2.0, Google).
Potrzebna, ponieważ łączy trzy zależne od platformy ścieżki AR (WebXR,
Scene Viewer, AR Quick Look) pod wspólnym interfejsem i dostarcza renderowanie
GLB, obsługę sesji oraz wykrywanie podłoża. Własna implementacja byłaby dla
MVP nieproporcjonalnym nakładem.

Zachowanie awaryjne: gdy pliku brakuje, pobieranie się nie powiedzie, trwa zbyt
długo albo urządzenie nie zgłasza AR, aplikacja **po cichu** przechodzi do
trybu A. Dziecko nie widzi komunikatu o błędzie – widzi swoje zwierzątko.

---

## 2. Różnice Android / iOS

Aplikacja **nigdy** nie analizuje User-Agenta. Wszystkie rozgałęzienia opierają
się na wykrywaniu możliwości.

| Sprawdzenie | Co się dzieje |
|---|---|
| `navigator.xr.isSessionSupported('immersive-ar')` | Android/Chromium z WebXR → `<model-viewer>` uruchamia sesję WebXR w przeglądarce. |
| `document.createElement('a').relList.supports('ar')` | iOS/iPadOS Safari → AR Quick Look. Gdy skonfigurowano tylko USDZ, aplikacja używa bezpośrednio odnośnika `<a rel="ar">` bez biblioteki. |
| `modelViewer.canActivateAR` | Rozstrzygnięcie ostateczne. Obejmuje też urządzenia z Androidem bez WebXR, ale ze Scene Viewerem – bez konieczności samodzielnego wykrywania Scene Viewera. |
| wszystkie trzy negatywne | Tryb A. |

Dalsze różnice platformowe uwzględnione w kodzie:

* **Formaty plików:** Android i podgląd 3D potrzebują `GLB`, iOS AR Quick Look
  potrzebuje `USDZ`. Obie ścieżki konfiguruje się osobno dla każdego zwierzęcia.
* **`playsinline` + `muted`:** bez tych atrybutów iOS przechodzi przy starcie
  wideo do pełnoekranowego odtwarzacza. Oba są ustawione na `<video>`.
* **`facingMode`:** iOS niezawodnie akceptuje `{ exact: 'environment' }`,
  część urządzeń z Androidem zgłasza przy tym `OverconstrainedError`. Dlatego
  druga próba z `{ ideal: 'environment' }`. Trzeciej próby z dowolną kamerą
  świadomie **nie ma**.
* **Aktywacja przez użytkownika:** `activateAR()` wymaga świeżej akcji
  użytkownika. Dlatego najpierw ekran AR z przyciskiem „Postaw zwierzątko”,
  którego obsługa kliknięcia wywołuje `activateAR()` synchronicznie.
* **Bezpieczne konteksty:** `getUserMedia` i WebXR istnieją tylko po HTTPS
  (wyjątek: `http://localhost`). Bez HTTPS aplikacja pokazuje swój przyjazny
  komunikat.
* **Przeglądarki wbudowane w aplikacje** (Instagram, Facebook, częściowo
  komunikatory) blokują `getUserMedia`, szczególnie na iOS. Wskazówka dla
  dorosłych w komunikacie błędu sugeruje otwarcie strony w Safari lub Chrome.

---

## 3. Struktura projektu

```
zwierzak/
├── index.html                    Wszystkie cztery ekrany + okna dialogowe
├── styles.css                    Wygląd, animacje spoczynkowe, reduced motion
├── manifest.webmanifest          Manifest aplikacji webowej
├── js/
│   ├── app.js                    Sterowanie przebiegiem, ekrany, teksty błędów
│   ├── animals.js                Centralna konfiguracja zwierząt i aplikacji
│   ├── placeholders.js           Wbudowane zastępcze rysunki SVG
│   ├── camera.js                 Tryb A: strumień, warstwa, gesty, zdjęcie
│   └── ar.js                     Tryb B: zamknięte użycie model-viewer
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── icon-maskable-512.png
├── models/                       (pusty) miejsce na GLB i USDZ
├── vendor/                       (pusty) miejsce na model-viewer.min.js
└── deploy/
    ├── _headers                  Netlify / Cloudflare Pages
    ├── nginx.conf.example
    └── apache.htaccess.example
```

Rozmiar pierwszego pobrania w wersji wyjściowej: **65 KB bez kompresji,
18 KB z gzip** (HTML, CSS, pięć modułów JS, manifest). Ikony pobiera dopiero
ten, kto doda aplikację do ekranu głównego. Pierwsze pobranie mieści się więc
znacznie poniżej docelowych 500 KB.

---

## 4. Uruchamianie i hosting

### Test lokalny

`file://` nie zadziała (moduły ES i `getUserMedia` wymagają origin).
Wystarczy dowolny serwer plików statycznych:

```bash
python3 -m http.server 8000
# albo
npx --yes serve .
```

Następnie otwórz `http://localhost:8000`. `localhost` liczy się jako bezpieczny
kontekst, więc kamera działa tam także bez certyfikatu.

### Test na telefonie

Telefon nie sięgnie do `localhost` komputera, a przez adres IP w sieci lokalnej
brakuje HTTPS – kamera pozostanie wtedy wyłączona. Dwie drogi:

```bash
# a) tunel HTTPS
npx --yes localtunnel --port 8000

# b) lokalny certyfikat
mkcert -install && mkcert 192.168.1.20
npx --yes http-server -S -C 192.168.1.20.pem -K 192.168.1.20-key.pem
```

Na Androidzie można dodatkowo użyć `chrome://inspect` z przekierowaniem portu;
przekierowane porty również liczą się jako bezpieczny kontekst.

### Publikacja

Skopiuj wszystkie pliki do katalogu głównego hostingu statycznego z HTTPS
(Netlify, Cloudflare Pages, GitHub Pages, S3+CloudFront, nginx, Apache).
Dodatkowo:

1. Przejmij nagłówki z katalogu `deploy/` (patrz punkt 5).
2. Ustaw trwałe przekierowanie z HTTP na HTTPS.
3. Ustaw typy MIME dla `.glb` (`model/gltf-binary`) i `.usdz`
   (`model/vnd.usdz+zip`), gdy tylko dojdą modele.
4. GitHub Pages: ścieżki względne są używane konsekwentnie, więc podkatalog
   działa bez żadnych zmian.

### Szczególny przypadek: GitHub Pages

Działa, z trzema ograniczeniami. Co działa bez zmian:

* **HTTPS** jest przy `*.github.io` włączone automatycznie – kamera działa.
  Przy własnej domenie włącz dodatkowo „Enforce HTTPS” w ustawieniach
  repozytorium.
* **Ścieżki względne** i `"start_url": "./"` w manifeście: aplikacja działa
  także pod adresem `nazwa-uzytkownika.github.io/repozytorium/`.
* **CSP** działa dzięki znacznikowi `<meta>` w `index.html`.
* Dołączony jest plik **`.nojekyll`**. Bez niego Jekyll przetwarza katalog
  i pomija przy tym wszystko, co zaczyna się od `_`.

Co przepada, ponieważ GitHub Pages nie pozwala na **własne nagłówki HTTP**:

| Nagłówek | Skutek | Rekompensata |
|---|---|---|
| `Permissions-Policy` | Bez wpływu na działanie: domyślna wartość dla `camera` to i tak `self`, a mikrofonu ani lokalizacji aplikacja nigdy nie żąda. | – |
| `X-Frame-Options` / `frame-ancestors` | `frame-ancestors` w znaczniku `<meta>` jest przez przeglądarki **ignorowane**. Stronę mogą więc osadzić w ramce osoby postronne. | Krótki skrypt zabezpieczający przed ramkami albo Cloudflare przed hostingiem |
| `X-Content-Type-Options` | Brak odpowiednika w `<meta>`. | – |
| `Strict-Transport-Security` | `github.io` w całości jest na liście HSTS preload, przeglądarki i tak wymuszają tam HTTPS. | Przy własnej domenie: proxy albo inny hosting |

Poza tym: **typów MIME nie da się skonfigurować**. Dla GLB to bez znaczenia,
dla **USDZ** stanowi ryzyko – AR Quick Look bywa odmawia obsługi pliku
dostarczonego jako `application/octet-stream`. Gdy dojdą prawdziwe modele,
sprawdź celowo przypadek testowy C3 na iPhonie. Jeśli zawiedzie, najmniejszym
krokiem naprzód jest Cloudflare Pages: to samo postępowanie, ale plik
`deploy/_headers` jest tam faktycznie uwzględniany.

Na koniec: GitHub Pages wysyła wszystko z `Cache-Control: max-age=600`. Zmiany
mogą więc potrzebować do dziesięciu minut, zanim staną się widoczne.

---

## 5. Nagłówki bezpieczeństwa

Pełne przykłady: `deploy/_headers`, `deploy/nginx.conf.example`,
`deploy/apache.htaccess.example`. W skrócie:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self';
  img-src 'self' data: blob:; media-src 'self' blob: mediastream:;
  connect-src 'self'; font-src 'self'; manifest-src 'self';
  object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none';
  upgrade-insecure-requests
Permissions-Policy: camera=(self), microphone=(), geolocation=(),
  xr-spatial-tracking=(self), accelerometer=(self), gyroscope=(self),
  magnetometer=(), payment=(), usb=(), display-capture=(),
  browsing-topics=(), interest-cohort=()
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: no-referrer
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
```

Uwagi:

* `Permissions-Policy` **nie da się** ustawić przez `<meta>`, wyłącznie jako
  nagłówek HTTP. CSP jest dodatkowo w `index.html` jako `<meta>`, aby działała
  także na hostingach bez konfiguracji nagłówków.
* `camera=(self)` jest konieczne, `microphone=()` całkowicie blokuje mikrofon –
  aplikacja nigdy o niego nie prosi.
* `xr-spatial-tracking=(self)` jest potrzebne tylko dla opcjonalnej ścieżki
  WebXR. Kto nie używa trybu B, może ustawić `()`.
* Jeśli `<model-viewer>` jest ładowany z CDN, trzeba rozszerzyć `script-src`
  (a zależnie od wersji także `style-src 'unsafe-inline'` z powodu stylów
  w Shadow DOM). Czystsze rozwiązanie: umieścić plik w `vendor/` i zachować
  restrykcyjną CSP.

### Jakie dane przetwarza aplikacja

Nic nie opuszcza urządzenia. Żadnych ciasteczek, żadnego `localStorage` ani
`sessionStorage`, żadnej analityki, żadnej czcionki ani obrazu z obcych
serwerów, żadnego pytania o lokalizację ani mikrofon, żadnego rozpoznawania
twarzy ani obiektów. Strumień z kamery trafia wyłącznie do elementu `<video>`
w pamięci i jest kończony przez `track.stop()` przy opuszczeniu widoku, przy
przejściu w tło (`visibilitychange`) oraz przy zamknięciu strony (`pagehide`).

---

## 6. Plan testów

### Przygotowanie
Otwórz stronę po HTTPS. Przed powtórzeniami zresetuj uprawnienie do kamery
w ustawieniach witryny.

### A – Funkcje podstawowe (Android i iOS)

| # | Krok | Oczekiwanie |
|---|---|---|
| A1 | Wczytanie strony | Wybór sześciu zwierząt, dwie kolumny, żadnego pytania o kamerę |
| A2 | Sprawdzenie zakładki Sieć | Tylko HTML, CSS, 5 plików JS, manifest. Żadnej obcej domeny |
| A3 | Dotknięcie zwierzątka | Karta widocznie reaguje, pojawia się ekran zgody |
| A4 | „Wróć” | Powrót do wyboru, nadal żadnego pytania o kamerę |
| A5 | „Włącz kamerę” | Systemowe okno pojawia się dopiero teraz |
| A6 | Zezwolenie | Obraz na żywo z **tylnej** kamery, zwierzątko na wierzchu |
| A7 | Przeciąganie zwierzątka | Zwierzątko podąża za palcem, nie opuszcza kadru |
| A8 | Gest dwoma palcami | Zwierzątko powiększa się i pomniejsza |
| A9 | „Większe”/„Mniejsze” | Ten sam efekt bez gestu |
| A10 | „Na środek” | Zwierzątko wraca na środek w wyjściowym rozmiarze |
| A11 | „Inne” | Pojawia się kolejne zwierzątko, kamera działa dalej |
| A12 | „Wyłącz” | Dioda/wskaźnik kamery gaśnie, pojawia się ekran wyboru |
| A13 | Blokada urządzenia lub przełączenie aplikacji | Wskaźnik gaśnie natychmiast; po powrocie komunikat „Kamera robi sobie przerwę” z przyciskiem „Dalej” |

### B – Przypadki błędów

| # | Ustawienie | Oczekiwanie |
|---|---|---|
| B1 | Odmowa dostępu do kamery | „Kamera nie chce się teraz bawić…”, bez widocznego kodu błędu |
| B2 | Komputer bez tylnej kamery | Start z dostępną kamerą albo komunikat „Nie mogę tutaj znaleźć kamery” |
| B3 | Kamera zajęta przez inną aplikację (Android) | „Kamera bawi się teraz z inną aplikacją…” |
| B4 | Wywołanie przez `http://` (nie localhost) | Przyjazny komunikat, bez awarii |
| B5 | Otwarcie z przeglądarki wbudowanej w aplikację | Przyjazny komunikat, wskazówka dla dorosłych o Safari/Chrome |
| B6 | Ustawienie ścieżki GLB na adres z błędem 404 | Bez widocznego komunikatu lądujemy w trybie kamery |
| B7 | Włączenie trybu samolotowego na ekranie AR | Ciche przejście do trybu kamery |

### C – Tryb AR (dopiero z prawdziwymi modelami)

| # | Urządzenie | Oczekiwanie |
|---|---|---|
| C1 | Android, Chrome, dostępne ARCore | Wskazówka ruchu, ustawienie na podłodze, przeciąganie/obrót/skalowanie |
| C2 | Android bez ARCore | Brak ekranu AR, od razu tryb kamery |
| C3 | iPhone/iPad, Safari | Otwiera się AR Quick Look, USDZ zostaje ustawiony |
| C4 | Samsung Internet | WebXR albo Scene Viewer, w przeciwnym razie tryb kamery |
| C5 | Powrót z AR | Aplikacja pokazuje znów wybór, żaden strumień nie działa |

### D – Dostępność

| # | Krok | Oczekiwanie |
|---|---|---|
| D1 | Obsługa wyłącznie klawiaturą | Wszystkie ekrany osiągalne, fokus zawsze widoczny |
| D2 | Fokus na zwierzątku w obrazie, strzałki | Zwierzątko się porusza, `+`/`-` skalują, `Home` resetuje |
| D3 | VoiceOver / TalkBack | Nazwy zwierząt, etykiety przycisków i komunikaty statusu są odczytywane |
| D4 | Aktywne „ogranicz ruch” | Brak animacji kołysania, obsługa bez zmian |
| D5 | Czcionka systemowa 200 % | Żaden tekst nie jest ucięty, przyciski nadal ≥ 48 px |
| D6 | Kontrola kontrastu | Tekst ≥ 4,5:1, elementy sterujące ≥ 3:1 |

### E – Wydajność i zasoby

| # | Krok | Oczekiwanie |
|---|---|---|
| E1 | Lighthouse Mobile | Wydajność i dostępność ≥ 90 |
| E2 | 10 minut w trybie kamery | Urządzenie pozostaje letnie, klatki ≥ 30 fps |
| E3 | 20 przejść między wyborem a kamerą | Zużycie pamięci stabilne, brak otwartych ścieżek w `chrome://media-internals` |
| E4 | Ograniczenie „Slow 3G” | Ekran wyboru i tak pojawia się szybko |
| E5 | Starsze urządzenie (< 3 GB RAM) | Animacja automatycznie się redukuje, brak zacinania |

---

## 7. Znane ograniczenia

1. **Tryb A nie jest AR przestrzennym.** Zwierzątko to warstwa bez głębi:
   przy poruszaniu telefonem pozostaje w tym samym miejscu ekranu i nie jest
   zasłaniane przez meble. To świadoma decyzja na rzecz dostępności.
2. **Tryb B jest bez modeli nieaktywny.** Dopóki `glb`/`usdz` mają wartość
   `null`, uruchamia się wyłącznie tryb A.
3. **Wykrywanie podłoża nie jest sterowalne.** Wskazówka ruchu reaguje na
   zdarzenia `ar-status` z `<model-viewer>`. Wewnątrz AR Quick Look i Scene
   Viewera interfejs należy do systemu operacyjnego – własne wskazówki, kolory
   czy przyciski nie są tam możliwe.
4. **Skalowanie w trybie AR** zależy od platformy. `ar-scale="auto"` pozwala
   zmieniać rozmiar; na iOS obiekt jest umieszczany w skali rzeczywistej.
5. **Gest szczypania w przeglądarkach wbudowanych** bywa zakłócany przez ich
   własną obsługę gestów. Dlatego zawsze dostępne są przyciski
   „Większe”/„Mniejsze”.
6. **Tryb zdjęć** jest celowo wyłączony (`APP_SETTINGS.photoMode`). Po jego
   włączeniu, jeśli zasoby 2D leżą na obcej domenie, reguła bezpieczeństwa
   canvasu uniemożliwi eksport („tainted canvas”). Dlatego zasoby zawsze
   hostuj u siebie.
7. **Brak trybu offline.** Service workera świadomie nie ma: mniej miejsca na
   urządzeniu, mniejsza powierzchnia ataku, brak nieaktualnych wersji.
8. **Brak dopracowania orientacji poziomej.** Paski obsługi działają w poziomie,
   ale są zaprojektowane pod orientację pionową.
9. **Zapasowe rozwiązanie dla `<dialog>`** jest dołączone, ale bardzo stare
   przeglądarki (iOS < 15.4) pokazują okno bez przyciemnionego tła.
10. **Bez HTTPS nie ma kamery.** To wymóg przeglądarek, a nie błąd aplikacji.

---

## 8. Zastąpienie rysunków zastępczych prawdziwymi modelami

### Krok 1 – przygotowanie zasobów

Na każde zwierzę przypadają maksymalnie cztery pliki:

| Plik | Zastosowanie | Zalecenie |
|---|---|---|
| `podglad.webp` | Karta na ekranie wyboru | 512 × 512, WebP albo AVIF, < 40 KB |
| `zwierze.webp` | Animowany zasób 2D w trybie kamery | animowany WebP albo animowany SVG, < 250 KB |
| `zwierze.glb` | Android, WebXR, Scene Viewer | kompresja Draco albo Meshopt, < 3 MB, tekstury ≤ 1024 px |
| `zwierze.usdz` | iOS AR Quick Look | przekonwertowany z tego samego GLB |

Praktyczna droga: Blender → eksport glTF → `gltf-transform optimize`
(Draco, tekstury WebP) → `usdzconvert` albo Reality Converter dla wersji USDZ.
Model ustaw tak, aby stopy stały na **Y = 0**, a zwierzę patrzyło w kierunku
**−Z**; inaczej będzie w AR unosić się w powietrzu albo stać tyłem.

### Krok 2 – umieszczenie plików

```
models/lew.glb     models/lew.usdz
images/lew.webp    images/lew-animowany.webp
```

### Krok 3 – dostosowanie `js/animals.js`

```js
{
  id: 'lion',
  name: 'Lew',
  altText: 'Wesoły lew z dużą grzywą',
  color: '#FFE6BC',
  palette: { primary: '#FFD79A', secondary: '#F2A03F', accent: '#FFF6E6' },
  shape: 'lion',
  idle: 'bob',
  preview: 'images/lew.webp',
  sprite:  'images/lew-animowany.webp',
  glb:     'models/lew.glb',
  usdz:    'models/lew.usdz',
  modelScale: 1.1
}
```

Pojedyncze pola mogą nadal pozostać `null`. Aplikacja dowolnie je łączy: jest
obrazek podglądu, brakuje 3D? Wtedy karta z obrazkiem i tryb kamery. Nie ma
niczego? Wtedy rysunek zastępczy SVG. Obrazek, który się nie wczyta, zostaje
w czasie działania zastąpiony rysunkiem – aplikacja nigdy nie przerywa pracy.

### Krok 4 – włączenie AR

```bash
npm pack @google/model-viewer
tar -xzf google-model-viewer-*.tgz
cp package/dist/model-viewer.min.js vendor/model-viewer.min.js
```

Następnie sprawdź typy MIME na serwerze (punkt 4) i przetestuj według planu C.

### Krok 5 – oznaczenie „Zastępczy” znika samo

Etykieta „Zastępczy” na karcie znika automatycznie, gdy tylko dla danego
zwierzęcia wpisano `preview` albo `sprite`.

### Dodanie nowego zwierzęcia

Dopisz wpis do `ANIMALS`. Siatka, ekran zgody, przełączanie zwierząt
i komunikaty dla czytników ekranu dostosują się same. Przy nieznanej wartości
`shape` użyta zostanie neutralna figura zastępcza `generic`.

---

## Licencja i treści

Wszystkie figury zastępcze, ikony i teksty powstały na potrzeby tego projektu.
Nie użyto żadnych chronionych postaci, znaków towarowych ani cudzych krojów
pisma; interfejs korzysta wyłącznie z zaokrąglonej czcionki systemowej
urządzenia.

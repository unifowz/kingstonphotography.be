# Kingston Photography — albums beheren

## Snel starten op Windows

1. Pak de volledige ZIP uit (niet rechtstreeks vanuit de ZIP openen).
2. Installeer Python 3.9 of nieuwer als je dat nog niet hebt. Vink bij installatie **Add Python to PATH** aan.
3. Dubbelklik op `START.bat`. De website opent op http://127.0.0.1:8000/.
4. Laat het terminalvenster open. Stoppen: Ctrl+C of het venster sluiten.

Geen extra Python-pakketten nodig. Je kunt ook `index.html` direct openen; die gebruikt de laatst gegenereerde fotolijst.

## Foto's toevoegen en namen aanpassen

Alle albums staan in `albums/`. Er zitten al 13 foto's in twee albums:

- `albums/Barcelona - 24H 2026/`
- `albums/Spa - ELMS 2026/`

Maak bijvoorbeeld de map `albums/Zolder 2027/` en zet je foto's rechtstreeks daarin. De mapnaam wordt automatisch de albumnaam in de filters en de fotoviewer. Hernoem de map om de titel aan te passen. Verwijder foto's of een volledige albummap om ze te verwijderen uit de galerij.

Met `START.bat`: vernieuw de browser na elke wijziging (F5).
Met direct geopende HTML of IntelliJ's webserver: voer na elke wijziging `UPDATE-ALBUMS.bat` uit en vernieuw daarna de pagina.

Ondersteund: JPG, JPEG, PNG, WebP, AVIF en GIF, ook hoofdletters. HEIC/RAW eerst omzetten naar JPG of WebP. Lege mappen, verborgen bestanden en submappen binnen een album worden overgeslagen. Een beschadigd bestand geeft een melding in de viewer.

Albums en foto's worden op naam gesorteerd, met natuurlijke nummering: `1.jpg`, `2.jpg`, `10.jpg`. Gebruik bijvoorbeeld `01-start.jpg`, `02-pitstop.jpg` om de volgorde te bepalen. Spaties, accenten, `#` en `&` in namen worden ondersteund. De grote achtergrond bovenaan is bij elk bezoek een willekeurige liggende foto uit alle albums; de intro eindigt altijd op diezelfde foto. Staande foto's worden daarvoor niet gekozen.

## Bewerken in IntelliJ

Open de uitgepakte projectmap. Bewerk:

- `index.html`: teksten, navigatie en de contactlink.
- `styles.css`: kleuren, lettertypes en layout.
- `script.js`: filters, menu en fotoviewer.
- `albums/`: albumtitels en foto's.

`albums.js` is gegenereerd; niet handmatig aanpassen. Contactgegevens (e-mail, telefoon, Instagram, btw-nummer) staan in de contactsectie en de footer van `index.html`. Het logo staat in `assets/`: `logo.png` (volledig), `logo-mark.png` (icoon voor header en intro), `favicon.png` en `apple-touch-icon.png`.

## Terminal (Windows, macOS, Linux)

Vanuit deze projectmap:

```sh
python update_albums.py --serve
```

Op macOS/Linux heet het commando meestal `python3`. Op Windows werkt ook `py -3`.
Een andere poort: `python update_albums.py --serve --port 8001`.

## Publiceren op statische hosting

1. Voer `UPDATE-ALBUMS.bat` uit (of `python update_albums.py`).
2. Upload `index.html`, `styles.css`, `script.js`, `albums.js`, `assets/` en `albums/` met dezelfde mapstructuur.
3. Upload na veranderingen ook de nieuwe `albums.js` en gewijzigde foto's. Verwijder oude foto's op de hosting als je ze ook daar weg wilt hebben.

De gepubliceerde website heeft geen Python of backend nodig. Alleen foto's op de server zetten zonder de fotolijst opnieuw te genereren is niet voldoende. `START.bat` is uitsluitend een lokale previewserver, geen publieke hosting.

De bestaande foto's zijn overgenomen van de externe adressen in je aangeleverde HTML; de bronvermeldingen staan nog op de pagina. De galerij gebruikt nu lokale bestanden. Google Fonts en de bestaande externe links hebben wel internet nodig.

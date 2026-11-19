#!/usr/bin/env python3
"""
Injecte le menu (partials/menu.html ou menu-en.html) en dur dans le HTML
de chaque page, entre deux marqueurs.

Pourquoi : le menu était chargé en JavaScript (fetch + localStorage), donc
absent du code source des pages. Les liens de navigation n'étaient donc pas
visibles par les robots d'indexation, ce qui pénalise le maillage interne.

Usage :
    python3 build.py

Le script est idempotent : on peut le relancer autant de fois que nécessaire.
Après modification du menu, éditer partials/menu.html puis relancer ce script.
"""

import re
import pathlib

ROOT = pathlib.Path(__file__).parent
MENU_FR = ROOT / "partials" / "menu.html"
MENU_EN = ROOT / "partials" / "menu-en.html"

START = "<!-- MENU:START (genere par build.py depuis partials/, ne pas editer ici) -->"
END = "<!-- MENU:END -->"

PAGES_FR = ["index.html"]  # rglob couvre aussi pages/machines/
PAGES_EN = ["index-en.html"]


def body_inner(path: pathlib.Path) -> str:
    """Retourne le contenu de <body> du partial, sans les balises body."""
    text = path.read_text(encoding="utf-8")
    match = re.search(r"<body[^>]*>(.*)</body>", text, re.DOTALL)
    if not match:
        raise ValueError(f"Pas de <body> dans {path}")
    return match.group(1).strip()


def indent_block(html: str, prefix: str = "                    ") -> str:
    lines = [line.rstrip() for line in html.splitlines()]
    out = []
    for line in lines:
        out.append(prefix + line.lstrip() if line.strip() else "")
    return "\n".join(out)


def inject(page: pathlib.Path, menu_html: str) -> str:
    """Retourne 'updated', 'ok' (deja a jour) ou 'skip' (pas de div #menu)."""
    text = page.read_text(encoding="utf-8")
    block = f"{START}\n{indent_block(menu_html)}\n{END}"

    # Cas 1 : deja injecte -> on remplace entre les marqueurs
    pattern = re.compile(re.escape(START) + r".*?" + re.escape(END), re.DOTALL)
    if pattern.search(text):
        new_text = pattern.sub(lambda m: block, text, count=1)
        if new_text != text:
            page.write_text(new_text, encoding="utf-8")
            return "updated"
        return "ok"

    # Cas 2 : premiere injection -> on remplace le div vide
    empty = re.compile(r'<div id="menu"\s*>\s*</div>', re.IGNORECASE)
    if not empty.search(text):
        return "skip"
    new_text = empty.sub(
        lambda m: '<div id="menu">\n' + block + "\n                </div>", text, count=1
    )
    page.write_text(new_text, encoding="utf-8")
    return "updated"



# ---------------------------------------------------------------------------
# Calculateur de prix
# ---------------------------------------------------------------------------

import json

TARIFS = json.loads((ROOT / "partials" / "tarifs.json").read_text(encoding="utf-8"))
CALC_TPL = (ROOT / "partials" / "calculateur.html").read_text(encoding="utf-8")

CALC_PAGES = {
    "pages/marquage.html": "laiton",
    "pages/tampons-acrylique.html": "acrylique",
    "pages/tampons-caoutchouc.html": "caoutchouc",
}

CALC_START = "<!-- CALC:START (genere par build.py) -->"
CALC_END = "<!-- CALC:END -->"


def _fr(v) -> str:
    """6.5 -> '6,5' ; 13.0 -> '13'"""
    s = ("%.2f" % float(v)).rstrip("0").rstrip(".")
    return s.replace(".", ",")


def _origine(m, key):
    return m["origines"].get(key)


def grille_html(matiere_key: str) -> str:
    """Grille des paliers pour toutes les origines disponibles."""
    m = TARIFS["matieres"][matiere_key]
    origines = m["origines"]
    keys = list(origines.keys())

    head = "".join(
        f"<th>{origines[k]['drapeau']} {origines[k]['label']}<br><small>{origines[k]['delai']}</small></th>"
        for k in keys
    )
    rows = [f"      <tr><th>Surface</th>{head}</tr>"]

    pas = origines[keys[0]].get("pas_cm2", TARIFS["pas_cm2"])
    for i in range(6):
        lo, hi = i * pas, (i + 1) * pas
        label = ("Jusqu'à " + _fr(hi) + " cm²") if i == 0 else (_fr(lo) + " à " + _fr(hi) + " cm²")
        cells = "".join(
            f"<td>{int(origines[k]['base_eur'] + origines[k].get('increment_eur', TARIFS['increment_eur']) * i)} €</td>"
            for k in keys
        )
        rows.append(f"      <tr><td>{label}</td>{cells}</tr>")

    # ligne "au-delà" : une valeur par origine
    cells = "".join(
        f"<td>+{int(origines[k].get('increment_eur', TARIFS['increment_eur']))} € / {_fr(pas)} cm²</td>"
        for k in keys
    )
    rows.append(f"      <tr><td>Au-delà</td>{cells}</tr>")
    return "\n".join(rows)


def bloc_origines(matiere_key: str) -> str:
    """Sélecteur France / Vietnam (uniquement si plusieurs origines)."""
    m = TARIFS["matieres"][matiere_key]
    origines = m["origines"]
    if len(origines) < 2:
        seul = origines[list(origines.keys())[0]]
        fin = "" if seul["label"] == "France" else " Fabrication française sur devis."
        return (f'  <p class="calc-origine-seule">{seul["drapeau"]} Fabrication {seul["label"]}'
                f' — {seul["delai"]}.{fin}</p>')
    items = []
    for k, o in origines.items():
        checked = " checked" if k == "vietnam" else ""
        items.append(
            f'    <label class="calc-origine-option">\n'
            f'      <input type="radio" name="calc-origine-{matiere_key}" value="{k}" data-role="origine"{checked}>\n'
            f'      <span class="calc-origine-titre">{o["drapeau"]} Fabriqué en {o["label"]}</span>\n'
            f'      <span class="calc-origine-meta">{o["delai"]} · dès {int(o["base_eur"])} €</span>\n'
            f'    </label>'
        )
    return '  <div class="calc-origines">\n' + "\n".join(items) + '\n  </div>'


def bloc_calculateur(matiere_key: str) -> str:
    m = TARIFS["matieres"][matiere_key]
    origines = m["origines"]
    defaut = "vietnam" if "vietnam" in origines else list(origines.keys())[0]
    o = origines[defaut]
    pas = o.get("pas_cm2", TARIFS["pas_cm2"])
    inc = o.get("increment_eur", TARIFS["increment_eur"])

    # grilles serialisees pour le JS
    grilles = {k: {"base": v["base_eur"], "pas": v.get("pas_cm2", TARIFS["pas_cm2"]),
                   "inc": v.get("increment_eur", TARIFS["increment_eur"]),
                   "label": v["label"], "delai": v["delai"], "note": v.get("note", ""),
                   "manche": m.get("option_manche_eur", 0)}
               for k, v in origines.items()}
    import json as _json
    grilles_attr = _json.dumps(grilles, ensure_ascii=False).replace('"', "&quot;")

    epaisseur = ""
    base = o["base_eur"]
    if m.get("epaisseurs"):
        opts = "".join(f'<option value="{e["base_eur"]}">{e["label"]}</option>' for e in m["epaisseurs"])
        epaisseur = (
            '  <div class="calc-row">\n'
            '    <label for="calc-e-' + matiere_key + '">Épaisseur</label>\n'
            '    <span></span>\n'
            '    <select id="calc-e-' + matiere_key + '" data-role="epaisseur" '
            'style="grid-column:2/4;padding:7px 9px;border:1.5px solid #ddd6cb;border-radius:7px;font:inherit">'
            + opts + '</select>\n'
            '  </div>'
        )

    if m.get("option_manche_eur"):
        option = (
            '  <div class="calc-row calc-row-check">\n'
            '    <label for="calc-m-' + matiere_key + '">Option manche vissable (+'
            + str(m["option_manche_eur"]) + ' €)</label>\n'
            '    <input type="checkbox" id="calc-m-' + matiere_key + '" data-role="manche">\n'
            '  </div>'
        )
    else:
        option = ""

    html = (CALC_TPL
            .replace("{{BASE}}", str(base))
            .replace("{{PAS}}", str(pas))
            .replace("{{INC}}", str(inc))
            .replace("{{MANCHE}}", str(m.get("option_manche_eur", 0)))
            .replace("{{LIBELLE}}", m["label"])
            .replace("{{LIBELLE_TITRE}}", m["label"][0].lower() + m["label"][1:])
            .replace("{{ID}}", matiere_key)
            .replace("{{ORIGINE_DEFAUT}}", defaut)
            .replace("{{GRILLES}}", grilles_attr)
            .replace("{{PRIX_DEFAUT}}", str(int(base)))
            .replace("{{ORIGINES}}", bloc_origines(matiere_key))
            .replace("{{EPAISSEUR}}", epaisseur)
            .replace("{{OPTION_MANCHE}}", option)
            .replace("{{GRILLE}}", grille_html(matiere_key))
            .replace("{{AVIS_RESUME}}", resume_avis(matiere_key)))
    return f"{CALC_START}\n{html}\n{CALC_END}"


def inject_calculateur() -> None:
    """Photos sous le titre (grande image + 3 vignettes) et calculateur a droite."""
    for rel, matiere in CALC_PAGES.items():
        page = ROOT / rel
        if not page.exists():
            print("  ! page absente :", rel)
            continue
        text = page.read_text(encoding="utf-8")
        calc = bloc_calculateur(matiere)

        if "calculateur.js" not in text:
            text = text.replace("</head>",
                                '    <script src="../assets/calculateur.js" defer></script>\n</head>', 1)

        pattern = re.compile(re.escape(CALC_START) + r".*?" + re.escape(CALC_END), re.DOTALL)
        if pattern.search(text):
            text = pattern.sub(lambda m: calc, text, count=1)
            page.write_text(text, encoding="utf-8")
            print("  ~", rel, "(mis a jour)")
            continue

        m = re.search(r'[ \t]*<div class="img-group">.*?</div>', text, re.DOTALL)
        images = m.group(0) if m else ""
        rest_html = ""
        gallery = ""

        if m:
            text = text[:m.start()] + "<!-- GALERIE:RESTE -->" + text[m.end():]
            parts = _media_parts(images)
            photos = [x for x in parts if x.startswith("<img")]
            videos = [x for x in parts if x.startswith("<video")]

            # la video en media principal si elle existe, sinon la 1re photo
            if videos:
                hero_parts = [videos[0]]
                pool, rest_videos = photos, videos[1:]
            else:
                hero_parts = [photos[0]] if photos else []
                pool, rest_videos = photos[1:], []
            thumbs = pool[:3]
            leftover_photos = pool[3:]
            leftovers = leftover_photos + rest_videos

            hero_parts += thumbs
            gallery = ('            <div class="img-group">\n'
                       + "\n".join("                " + x for x in hero_parts)
                       + '\n            </div>')
            if leftovers:
                rest_html = ('            <div class="img-group">\n'
                             + "\n".join("                " + x for x in leftovers)
                             + '\n            </div>')

        hero = ('\n        <div class="calc-hero">\n'
                '          <div class="calc-hero-media">\n'
                + gallery + '\n'
                '          </div>\n'
                '          <div class="calc-hero-buy">\n'
                + calc + '\n'
                '          </div>\n'
                '        </div>\n')

        h1_end = text.find("</h1>")
        if h1_end == -1:
            print("  ! pas de <h1> :", rel)
            continue
        h1_end += len("</h1>")
        # un sous-titre <h2> suit-il immediatement ? on insere apres lui
        window = text[h1_end:h1_end + 600]
        m2 = re.search(r"</h2>", window)
        if m2 and window[:m2.start()].count("<p") == 0:
            insert_at = h1_end + m2.end()
        else:
            insert_at = h1_end
        text = text[:insert_at] + hero + text[insert_at:]
        text = text.replace("<!-- GALERIE:RESTE -->", rest_html, 1)

        page.write_text(text, encoding="utf-8")
        print("  +", rel, f"({len(hero_parts)} medias en hero, {len(leftovers)} en galerie)")





def ensure_analytics() -> None:
    """Ajoute le bloc consentement + GTM sur les pages qui ne l'ont pas."""
    block = (ROOT / "partials" / "analytics.html").read_text(encoding="utf-8")
    pages = [ROOT / "index.html", ROOT / "index-en.html"]
    pages += sorted((ROOT / "pages").rglob("*.html"))
    count = 0
    for page in pages:
        text = page.read_text(encoding="utf-8")
        if "GTM-M5853GF7" in text:
            continue
        if "</head>" not in text:
            continue
        page.write_text(text.replace("</head>", block + "</head>", 1), encoding="utf-8")
        count += 1
    print(f"GTM : {count} page(s) instrumentee(s)")


# ---------------------------------------------------------------------------
# Avis clients
# ---------------------------------------------------------------------------

AVIS = json.loads((ROOT / "partials" / "avis.json").read_text(encoding="utf-8"))
AVIS_PAGES = {"pages/marquage.html": "laiton"}
AVIS_START = "<!-- AVIS:START (genere par build.py) -->"
AVIS_END = "<!-- AVIS:END -->"


def resume_avis(matiere_key: str) -> str:
    """Petite ligne de confiance affichee dans le calculateur."""
    if matiere_key not in AVIS_PAGES.values():
        return ""
    avis = AVIS.get(matiere_key) or []
    if not avis:
        return ""
    a = AVIS["agregat"]
    return (
        '<p class="calc-avis">'
        '<span class="calc-avis-stars" aria-hidden="true">★★★★★</span> '
        f'<a href="{a["url"]}" target="_blank" rel="noopener">'
        f'Avis clients — voir sur {a["plateforme"]}</a>'
        '</p>'
    )


def bloc_avis(matiere_key: str) -> str:
    if matiere_key not in AVIS_PAGES.values():
        return ""
    avis = AVIS.get(matiere_key) or []
    if not avis:
        return ""
    a = AVIS["agregat"]
    items = []
    for v in avis:
        qui = v["auteur"] + ((" — " + v["contexte"]) if v.get("contexte") else "")
        items.append(
            '          <figure class="avis-item">\n'
            f'            <blockquote>« {v["texte"]} »</blockquote>\n'
            f'            <figcaption>{qui} · <span class="avis-date">{v["date"]}</span> · '
            f'<a href="{v["url"]}" target="_blank" rel="noopener">original</a></figcaption>\n'
            '          </figure>'
        )
    return (f'{AVIS_START}\n'
            '        <section class="avis-bloc">\n'
            '          <header class="avis-head">\n'
            '            <h2>Ce qu\u2019en disent nos clients</h2>\n'
            f'            <p><span class="avis-stars" aria-hidden="true">★★★★★</span> Avis publiés publiquement sur '
            f'<a href="{a["url"]}" target="_blank" rel="noopener">{a["plateforme"]}</a></p>\n'
            '          </header>\n'
            + "\n".join(items) + '\n'
            '        </section>\n'
            f'{AVIS_END}')


def inject_avis() -> None:
    for rel, matiere in AVIS_PAGES.items():
        page = ROOT / rel
        if not page.exists():
            continue
        text = page.read_text(encoding="utf-8")
        bloc = bloc_avis(matiere)
        if not bloc:
            continue
        pattern = re.compile(re.escape(AVIS_START) + r".*?" + re.escape(AVIS_END), re.DOTALL)
        if pattern.search(text):
            text = pattern.sub(lambda m: bloc, text, count=1)
        else:
            hero_end = text.find('</div>', text.find('<div class="calc-hero">'))
            # on cherche la fin du hero : derniere </div> avant <div class="product-container">
            anchor = text.find('<div class="product-container">')
            if anchor == -1:
                continue
            text = text[:anchor] + bloc + '\n\n        ' + text[anchor:]
        page.write_text(text, encoding="utf-8")
        print("  +", rel, "(avis)")



# ---------------------------------------------------------------------------
# Plaques gravees (calculateur dedie)
# ---------------------------------------------------------------------------

PLAQUES = json.loads((ROOT / "partials" / "plaques.json").read_text(encoding="utf-8"))
PLAQUES_TPL = (ROOT / "partials" / "calculateur-plaques.html").read_text(encoding="utf-8")
PLAQUES_PAGE = "pages/plaques-laiton.html"
CALC_PLAQUES_START = "<!-- CALC-PLAQUES:START -->"
CALC_PLAQUES_END = "<!-- CALC-PLAQUES:END -->"


def _fr_plaques(v) -> str:
    s = ("%.2f" % float(v)).rstrip("0").rstrip(".")
    return s.replace(".", ",")


def bloc_calculateur_plaques() -> str:
    ep = PLAQUES["epaisseurs"]
    pas = PLAQUES["pas_cm2"]

    # radios d'epaisseur
    radios = []
    for i, (k, v) in enumerate(ep.items()):
        checked = " checked" if i == 0 else ""
        radios.append(
            '    <label class="calc-origine-option">\n'
            f'      <input type="radio" name="pl-epaisseur" value="{k}" data-role="epaisseur"{checked}>\n'
            f'      <span class="calc-origine-titre">Épaisseur {v["label"]}</span>\n'
            f'      <span class="calc-origine-meta">dès {_fr_plaques(v["base"])} € · +{_fr_plaques(v["increment"])} € par palier</span>\n'
            '    </label>'
        )
    epaisseurs = '  <div class="calc-origines">\n' + "\n".join(radios) + '\n  </div>'

    # finitions
    finitions = "\n".join(
        f'      <option value="{f["id"]}">{f["label"]}</option>' for f in PLAQUES["finitions"]
    )

    # options
    options = (
        '  <div class="calc-row calc-row-check">\n'
        '    <label for="pl-trous">Trous de fixation (4 coins)</label>\n'
        '    <input type="checkbox" id="pl-trous" data-role="option" data-label="avec trous">\n'
        '  </div>\n'
        '  <div class="calc-row calc-row-check">\n'
        '    <label for="pl-chanfrein">Chanfrein</label>\n'
        '    <input type="checkbox" id="pl-chanfrein" data-role="option" data-label="avec chanfrein">\n'
        '  </div>'
    )

    # grille
    first = ep[list(ep.keys())[0]]
    rows = ['      <tr><th>Surface</th><th>3 mm</th><th>2 mm</th></tr>']
    for i in range(8):
        lo, hi = i * pas, (i + 1) * pas
        label = ("Jusqu'à " + _fr_plaques(hi) + " cm²") if i == 0 else (_fr_plaques(lo) + " à " + _fr_plaques(hi) + " cm²")
        cells = "".join(
            f'<td>{_fr_plaques(ep[k]["base"] + ep[k]["increment"] * i)} €</td>' for k in ep
        )
        rows.append(f'      <tr><td>{label}</td>{cells}</tr>')
    cells = "".join(f'<td>+{_fr_plaques(ep[k]["increment"])} € / {_fr_plaques(pas)} cm²</td>' for k in ep)
    rows.append(f'      <tr><td>Au-delà</td>{cells}</tr>')
    grille = ('    <table>\n' + "\n".join(rows) + '\n    </table>')

    data = json.dumps(PLAQUES, ensure_ascii=False).replace('"', "&quot;")

    html = (PLAQUES_TPL
            .replace("{{DATA}}", data)
            .replace("{{EPAISSEURS}}", epaisseurs)
            .replace("{{FINITIONS}}", finitions)
            .replace("{{OPTIONS}}", options)
            .replace("{{PRIX_DEFAUT}}", _fr_plaques(first["base"]))
            .replace("{{GRILLE}}", grille))
    return f"{CALC_PLAQUES_START}\n{html}\n{CALC_PLAQUES_END}"


def inject_calculateur_plaques() -> None:
    page = ROOT / PLAQUES_PAGE
    if not page.exists():
        print("  ! page plaques absente")
        return
    text = page.read_text(encoding="utf-8")
    bloc = bloc_calculateur_plaques()
    pattern = re.compile(re.escape(CALC_PLAQUES_START) + r".*?" + re.escape(CALC_PLAQUES_END), re.DOTALL)
    if pattern.search(text):
        text = pattern.sub(lambda m: bloc, text, count=1)
    else:
        anchor = text.find('<div class="calc-hero-buy">')
        if anchor == -1:
            print("  ! ancre calculee introuvable")
            return
        end = text.find('>', anchor) + 1
        text = text[:end] + "\n" + bloc + text[end:]
    page.write_text(text, encoding="utf-8")
    print("  +", PLAQUES_PAGE, "(calculateur plaques)")


def main() -> None:
    menu_fr = body_inner(MENU_FR)
    menu_en = body_inner(MENU_EN)

    targets = []
    for name in PAGES_FR:
        targets.append((ROOT / name, menu_fr))
    for name in PAGES_EN:
        targets.append((ROOT / name, menu_en))
    for page in sorted((ROOT / "pages").rglob("*.html")):
        # les pages anglaises utilisent le menu anglais
        if "menu-loader-en.js" in page.read_text(encoding="utf-8"):
            targets.append((page, menu_en))
        else:
            targets.append((page, menu_fr))

    ensure_analytics()

    print("Calculateur plaques :")
    inject_calculateur_plaques()

    print("Avis clients :")
    inject_avis()

    print("Calculateur :")
    inject_calculateur()

    updated, skipped, already = [], [], []
    for page, menu in targets:
        status = inject(page, menu)
        if status == "updated":
            updated.append(page)
        elif status == "skip":
            skipped.append(page)
        else:
            already.append(page)

    print(f"{len(updated)} page(s) mise(s) a jour :")
    for p in updated:
        print("  +", p.relative_to(ROOT))
    if already:
        print(f"\n{len(already)} page(s) deja a jour.")
    if skipped:
        print(f"\n{len(skipped)} page(s) sans div #menu (ignorees) :")
        for p in skipped:
            print("  -", p.relative_to(ROOT))


if __name__ == "__main__":
    main()

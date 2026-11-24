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
CALC_TPL_EN = (ROOT / "partials" / "calculateur-en.html").read_text(encoding="utf-8")

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


def grille_html(matiere_key: str, lang: str = "fr") -> str:
    """Grille des paliers pour toutes les origines disponibles."""
    m = TARIFS["matieres"][matiere_key]
    origines = m["origines"]
    keys = list(origines.keys())

    if lang == "en":
        head = "".join(
            f"<th>{origines[k]['drapeau']} {origines[k]['label']}<br><small>{origines[k].get('delai_en', origines[k]['delai'])}</small></th>"
            for k in keys
        )
        rows = [f"      <tr><th>Area</th>{head}</tr>"]
    else:
        head = "".join(
            f"<th>{origines[k]['drapeau']} {origines[k]['label']}<br><small>{origines[k]['delai']}</small></th>"
            for k in keys
        )
        rows = [f"      <tr><th>Surface</th>{head}</tr>"]

    pas = origines[keys[0]].get("pas_cm2", TARIFS["pas_cm2"])
    for i in range(6):
        lo, hi = i * pas, (i + 1) * pas
        if lang == "en":
            label = ("Up to " + _fr(hi) + " cm²") if i == 0 else (_fr(lo) + " to " + _fr(hi) + " cm²")
        else:
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
    rows.append(f"      <tr><td>{'Beyond' if lang == 'en' else 'Au-delà'}</td>{cells}</tr>")
    return "\n".join(rows)


def bloc_origines(matiere_key: str, lang: str = "fr") -> str:
    """Sélecteur France / Vietnam (uniquement si plusieurs origines)."""
    m = TARIFS["matieres"][matiere_key]
    origines = m["origines"]
    if len(origines) < 2:
        seul = origines[list(origines.keys())[0]]
        if lang == "en":
            delai = seul.get("delai_en", seul["delai"])
            made = "Made in" if seul["label"] == "France" else "Made in"
            return (f'  <p class="calc-origine-seule">{seul["drapeau"]} {made} {seul["label"]}'
                    f' — {delai}.</p>')
        fin = "" if seul["label"] == "France" else " Fabrication française sur devis."
        return (f'  <p class="calc-origine-seule">{seul["drapeau"]} Fabrication {seul["label"]}'
                f' — {seul["delai"]}.{fin}</p>')
    items = []
    for k, o in origines.items():
        checked = " checked" if k == "vietnam" else ""
        if lang == "en":
            items.append(
                f'    <label class="calc-origine-option">\n'
                f'      <input type="radio" name="calc-origine-{matiere_key}" value="{k}" data-role="origine"{checked}>\n'
                f'      <span class="calc-origine-titre">{o["drapeau"]} Made in {o["label"]}</span>\n'
                f'      <span class="calc-origine-meta">{o.get("delai_en", o["delai"])} · from €{int(o["base_eur"])}</span>\n'
                f'    </label>'
            )
        else:
            items.append(
                f'    <label class="calc-origine-option">\n'
                f'      <input type="radio" name="calc-origine-{matiere_key}" value="{k}" data-role="origine"{checked}>\n'
                f'      <span class="calc-origine-titre">{o["drapeau"]} Fabriqué en {o["label"]}</span>\n'
                f'      <span class="calc-origine-meta">{o["delai"]} · dès {int(o["base_eur"])} €</span>\n'
                f'    </label>'
            )
    return '  <div class="calc-origines">\n' + "\n".join(items) + '\n  </div>'


def bloc_calculateur(matiere_key: str, lang: str = "fr") -> str:
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
            '    <label for="calc-m-' + matiere_key + '">'
            + (('Screw-on handle option (+\u20ac' + str(m["option_manche_eur"]) + ')')
               if lang == "en"
               else ('Option manche vissable (+' + str(m["option_manche_eur"]) + ' \u20ac)'))
            + '</label>\n'
            '    <input type="checkbox" id="calc-m-' + matiere_key + '" data-role="manche">\n'
            '  </div>'
        )
    else:
        option = ""

    tpl = CALC_TPL_EN if lang == "en" else CALC_TPL

    # libelles de la grille JS
    if lang == "en":
        grilles = {k: {"base": v["base_eur"], "pas": v.get("pas_cm2", TARIFS["pas_cm2"]),
                       "inc": v.get("increment_eur", TARIFS["increment_eur"]),
                       "label": v["label"], "delai": v.get("delai_en", v["delai"]),
                       "note": v.get("note_en", v.get("note", "")),
                       "manche": m.get("option_manche_eur", 0)}
                   for k, v in origines.items()}
        grilles_attr = _json.dumps(grilles, ensure_ascii=False).replace('"', "&quot;")
        libelle = m.get("label_en", m["label"])
    else:
        libelle = m["label"]

    html = (tpl
            .replace("{{BASE}}", str(base))
            .replace("{{PAS}}", str(pas))
            .replace("{{INC}}", str(inc))
            .replace("{{MANCHE}}", str(m.get("option_manche_eur", 0)))
            .replace("{{LIBELLE}}", libelle)
            .replace("{{LIBELLE_TITRE}}", libelle[0].lower() + libelle[1:])
            .replace("{{ID}}", matiere_key)
            .replace("{{ORIGINE_DEFAUT}}", defaut)
            .replace("{{GRILLES}}", grilles_attr)
            .replace("{{PRIX_DEFAUT}}", str(int(base)))
            .replace("{{ORIGINES}}", bloc_origines(matiere_key, lang))
            .replace("{{EPAISSEUR}}", epaisseur)
            .replace("{{OPTION_MANCHE}}", option)
            .replace("{{GRILLE}}", grille_html(matiere_key, lang))
            .replace("{{AVIS_RESUME}}", resume_avis(matiere_key) if lang == "fr" else ""))
    return f"{CALC_START}\n{html}\n{CALC_END}"


CALC_PAGES_EN = {"pages/leather-stamps-en.html": "laiton"}


def inject_calculateur_en() -> None:
    """Calculateur en anglais, meme grille de prix que le francais."""
    for rel, matiere in CALC_PAGES_EN.items():
        page = ROOT / rel
        if not page.exists():
            print("  ! page absente :", rel)
            continue
        text = page.read_text(encoding="utf-8")
        calc = bloc_calculateur(matiere, "en")
        pattern = re.compile(re.escape(CALC_START) + r".*?" + re.escape(CALC_END), re.DOTALL)
        if not pattern.search(text):
            print("  ! marqueurs absents :", rel)
            continue
        text = pattern.sub(lambda m: calc, text, count=1)
        page.write_text(text, encoding="utf-8")
        print("  +", rel, "(calculateur EN)")


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
        '<a href="#avis">Avis clients — lire les retours</a>'
        '</p>'
    )



def _provenance(v: dict) -> str:
    """Mention de source sous un avis : lien si verifiable, sinon provenance."""
    src = v.get("source", "")
    if v.get("url"):
        return (f'            <figcaption>{v["auteur"]} · {v["date"]} · '
                f'<a href="{v["url"]}" target="_blank" rel="noopener">{src or "avis d\u2019origine"}</a></figcaption>')
    suffixe = (" · " + src) if src else ""
    return (f'            <figcaption>{v["auteur"]} · <span class="avis-date">{v["date"]}</span>'
            f'{suffixe}</figcaption>')

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
            + _provenance(v) + '\n'
            '          </figure>'
        )
    return (f'{AVIS_START}\n'
            '        <section class="avis-bloc" id="avis">\n'
            '          <header class="avis-head">\n'
            '            <h2>Ce qu\u2019en disent nos clients</h2>\n'
            '            <p>Retours reçus après livraison · '
            f'<a href="{a["url"]}" target="_blank" rel="noopener">d\u2019autres avis sur {a["plateforme"]}</a></p>\n'
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


def _port_txt() -> str:
    liv = PLAQUES.get("livraison") or {}
    return ("<strong>%s €</strong> pour toute commande inférieure à %s €, "
            "<strong>offerts à partir de %s €</strong>") % (
        _fr_plaques(liv.get("frais_eur", 10)), liv.get("seuil_eur", 80), liv.get("seuil_eur", 80))


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
        '    <label for="pl-trous">Trous de fixation</label>\n'
        '    <input type="checkbox" id="pl-trous" data-role="option" data-label="avec trous">\n'
        '  </div>\n'
        '  <div class="calc-row calc-row-check">\n'
        '    <label for="pl-chanfrein">Chanfrein</label>\n'
        '    <input type="checkbox" id="pl-chanfrein" data-role="option" data-label="avec chanfrein">\n'
        '  </div>\n'
        '  <div class="calc-row calc-row-check">\n'
        '    <label for="pl-adhesif">Adhésif double face (sans perçage)</label>\n'
        '    <input type="checkbox" id="pl-adhesif" data-role="option" data-label="avec adhésif double face">\n'
        '  </div>\n'
        '  <p class="calc-hint-line">Nombre, position des trous et chanfrein : à définir ensemble lors du devis.</p>'
    )

    # grille
    first = ep[list(ep.keys())[0]]
    entetes = "".join(f'<th>{ep[k]["label"]}</th>' for k in ep)
    rows = [f'      <tr><th>Surface</th>{entetes}</tr>']
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

    rem = sorted(PLAQUES.get("remises", []), key=lambda r: r["a_partir_de"])
    hint = []
    for i, r in enumerate(rem):
        pct = int(round(r["taux"] * 100))
        if i == 0:
            hint.append(f'−{pct} % dès {r["a_partir_de"]} plaques')
        else:
            hint.append(f'−{pct} % au-delà de {r["a_partir_de"] - 1}')
    remise_hint = " · ".join(hint)

    port_txt = _port_txt()

    data = json.dumps(PLAQUES, ensure_ascii=False).replace('"', "&quot;")

    html = (PLAQUES_TPL
            .replace("{{DATA}}", data)
            .replace("{{EPAISSEURS}}", epaisseurs)
            .replace("{{FINITIONS}}", finitions)
            .replace("{{OPTIONS}}", options)
            .replace("{{PRIX_DEFAUT}}", _fr_plaques(first["base"]))
            .replace("{{REMISE_HINT}}", remise_hint)
            .replace("{{GRILLE}}", grille)
            .replace("{{PORT_TXT}}", port_txt))
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
    text = text.replace("{{PORT_TXT}}", _port_txt())
    page.write_text(text, encoding="utf-8")
    print("  +", PLAQUES_PAGE, "(calculateur plaques)")



# ---------------------------------------------------------------------------
# Donnees structurees Product (AggregateOffer) pour les pages produit
# ---------------------------------------------------------------------------

FIL_ARIANE = {
    "pages/marquage.html": "Matoirs et tampons en laiton",
    "pages/tampons-acrylique.html": "Tampons en acrylique",
    "pages/tampons-caoutchouc.html": "Tampons en caoutchouc",
    "pages/plaques-laiton.html": "Plaques gravées en laiton",
}

JSONLD_START = "<!-- JSONLD-PRODUIT:START -->"
JSONLD_END = "<!-- JSONLD-PRODUIT:END -->"

JSONLD_PAGES = {
    "pages/marquage.html": {
        "matiere": "laiton",
        "materiau": "Laiton",
        "nom": "Matoir et tampon de marquage en laiton gravé sur mesure",
        "image": "assets/img-stamps/Matoir_01.webp",
        "desc": "Matoir en laiton massif gravé sur mesure : logo, nom de marque ou motif. "
                "Marquage à chaud ou à froid sur cuir et bois. Fabrication France ou Vietnam.",
    },
    "pages/tampons-acrylique.html": {
        "matiere": "acrylique",
        "materiau": "Acrylique",
        "nom": "Tampon de marquage en acrylique gravé sur mesure",
        "image": "assets/img-tamponsacrylique/tamponsAcrylique_1.JPG",
        "desc": "Tampon en acrylique gravé au laser, pour le marquage à froid sur cuir tanné végétal, "
                "savon, cire ou poterie. Épaisseur 5 ou 10 mm. Fabrication française.",
    },
    "pages/tampons-caoutchouc.html": {
        "matiere": "caoutchouc",
        "materiau": "Caoutchouc",
        "nom": "Tampon en caoutchouc gravé sur mesure",
        "image": "assets/img-tamponscaoutchouc/tampons-caoutchouc4.jpeg",
        "desc": "Tampon en caoutchouc gravé sur mesure pour marquer papier, carton et bois à l'encre. "
                "Fabrication française.",
    },
}

# dimensions maximales prises en compte par les calculateurs (mm)
TAILLE_MAX_MM = {"marquage": 120, "tampons-acrylique": 120, "tampons-caoutchouc": 120}


def _bornes_prix_stamp(matiere_key: str):
    """Prix mini et maxi reels d'une gamme de tampons, d'apres tarifs.json."""
    m = TARIFS["matieres"][matiere_key]
    pas = m.get("pas_cm2", TARIFS["pas_cm2"])
    inc = m.get("increment_eur", TARIFS["increment_eur"])
    # 144 cm2 = 120 x 120 mm, la limite des curseurs
    paliers_max = max(1, __import__("math").ceil((120 * 120 / 100) / pas))
    bas, haut = None, None
    for o in m["origines"].values():
        o_pas = o.get("pas_cm2", pas)
        o_inc = o.get("increment_eur", inc)
        paliers = max(1, __import__("math").ceil((120 * 120 / 100) / o_pas))
        mini = o["base_eur"]
        maxi = o["base_eur"] + o_inc * (paliers - 1)
        for e in (m.get("epaisseurs") or []):
            mini = min(mini, e["base_eur"])
            maxi = max(maxi, e["base_eur"] + o_inc * (paliers - 1))
        bas = mini if bas is None else min(bas, mini)
        haut = maxi if haut is None else max(haut, maxi)
    return bas, haut


def _bornes_prix_plaques():
    ep = PLAQUES["epaisseurs"]
    pas = PLAQUES["pas_cm2"]
    a_max = (PLAQUES["dimensions"]["max_mm"] / 10) ** 2
    paliers = max(1, __import__("math").ceil(a_max / pas))
    bas = min(v["base"] for v in ep.values())
    haut = max(v["base"] + v["increment"] * (paliers - 1) for v in ep.values())
    return bas, haut


def _jsonld_offre(low, high, url, materiau="Laiton"):
    import math
    return {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": None,          # complete par l'appelant
        "image": None,
        "description": None,
        "brand": {"@type": "Brand", "name": "AM Marquage"},
        "material": materiau,
        "offers": {
            "@type": "AggregateOffer",
            "url": url,
            "priceCurrency": "EUR",
            "lowPrice": f"{low:.2f}",
            "highPrice": f"{high:.2f}",
            "offerCount": 2,
            "availability": "https://schema.org/InStock",
            "seller": {"@type": "Organization", "name": "AM Marquage"},
        },
    }


def inject_jsonld_produit() -> None:
    for rel, meta in JSONLD_PAGES.items():
        page = ROOT / rel
        if not page.exists():
            continue
        bas, haut = _bornes_prix_stamp(meta["matiere"])
        d = _jsonld_offre(bas, haut, "https://am-outilscuir.com/" + rel, meta.get("materiau", "Laiton"))
        d["name"] = meta["nom"]
        d["image"] = "https://am-outilscuir.com/" + meta["image"]
        d["description"] = meta["desc"]
        _write_jsonld(page, d, FIL_ARIANE.get(rel))

    # plaques
    page = ROOT / "pages/plaques-laiton.html"
    if page.exists():
        bas, haut = _bornes_prix_plaques()
        d = _jsonld_offre(bas, haut, "https://am-outilscuir.com/pages/plaques-laiton.html")
        d["name"] = "Plaque gravée sur mesure en laiton"
        d["image"] = "https://am-outilscuir.com/assets/img-plaques/plaques2.webp"
        d["description"] = ("Plaque en laiton massif gravée sur mesure : branding, plaque professionnelle, "
                            "plaque de porte, boîte aux lettres. Épaisseur 3 ou 2 mm, toutes formes sur mesure.")
        _write_jsonld(page, d, FIL_ARIANE["pages/plaques-laiton.html"])


def _fil_ariane(nom: str, url: str) -> dict:
    return {
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "AM Marquage",
             "item": "https://am-outilscuir.com/"},
            {"@type": "ListItem", "position": 2, "name": nom, "item": url},
        ],
    }


def _write_jsonld(page: pathlib.Path, data: dict, nom_ariane: str = None) -> None:
    import json as _json
    text = page.read_text(encoding="utf-8")
    if nom_ariane:
        data = {"@context": "https://schema.org",
                "@graph": [data, _fil_ariane(nom_ariane, data["offers"]["url"])]}
        data["@graph"][0].pop("@context", None)
    body = _json.dumps(data, ensure_ascii=False, indent=2)
    body = "\n".join("    " + l for l in body.splitlines())
    bloc = (f"{JSONLD_START}\n"
            '    <script type="application/ld+json">\n'
            f"{body}\n"
            '    </script>\n'
            f"{JSONLD_END}")
    pattern = re.compile(re.escape(JSONLD_START) + r".*?" + re.escape(JSONLD_END), re.DOTALL)
    if pattern.search(text):
        text = pattern.sub(lambda m: bloc, text, count=1)
    else:
        text = text.replace("</head>", bloc + "\n</head>", 1)
    page.write_text(text, encoding="utf-8")
    print("  +", page.relative_to(ROOT), "(Product JSON-LD)")



# ---------------------------------------------------------------------------
# Selecteur de langue FR / EN
# ---------------------------------------------------------------------------

LANG_START = "<!-- LANG-SWITCH:START -->"
LANG_END = "<!-- LANG-SWITCH:END -->"

# page -> (page equivalente, langue de la page, langue cible, libelle du lien)
LANG_PAIRS = {
    "index.html": ("/index-en.html", "FR", "EN", "English version"),
    "index-en.html": ("/", "EN", "FR", "Version française"),
    "pages/marquage.html": ("/pages/leather-stamps-en.html", "FR", "EN", "English version"),
    "pages/leather-stamps-en.html": ("/pages/marquage.html", "EN", "FR", "Version française"),
    "pages/alphabets.html": ("/pages/alphabets-en.html", "FR", "EN", "English version"),
    "pages/alphabets-en.html": ("/pages/alphabets.html", "EN", "FR", "Version française"),
    "pages/contact.html": ("/pages/contact-en.html", "FR", "EN", "English version"),
    "pages/contact-en.html": ("/pages/contact.html", "EN", "FR", "Version française"),
    "pages/emporte-pièces.html": ("/pages/cutting-tools.html", "FR", "EN", "English version"),
    "pages/cutting-tools.html": ("/pages/emporte-pièces.html", "EN", "FR", "Version française"),
    "pages/moules-cuir.html": ("/pages/leather-molds.html", "FR", "EN", "English version"),
    "pages/leather-molds.html": ("/pages/moules-cuir.html", "EN", "FR", "Version française"),
    "pages/conditions.html": ("/pages/terms-conditions-en.html", "FR", "EN", "English version"),
    "pages/terms-conditions-en.html": ("/pages/conditions.html", "EN", "FR", "Version française"),
    "pages/mentions-légales.html": ("/pages/legal-informations-en.html", "FR", "EN", "English version"),
    "pages/legal-informations-en.html": ("/pages/mentions-légales.html", "EN", "FR", "Version française"),
    "pages/politique-de-confidentialité.html": ("/pages/privacy-policy-en.html", "FR", "EN", "English version"),
    "pages/privacy-policy-en.html": ("/pages/politique-de-confidentialité.html", "EN", "FR", "Version française"),
}


def menu_avec_langue(menu_html: str, rel: str) -> str:
    """Insere le selecteur de langue dans le menu, quand la page a une paire."""
    if rel not in LANG_PAIRS:
        return menu_html
    cible, langue, autre, titre = LANG_PAIRS[rel]
    bloc = ('<div class="lang-switch">\n'
            f'  <span class="lang-current">{langue}</span>'
            f'<a href="{cible}" hreflang="{autre.lower()}" lang="{autre.lower()}" title="{titre}">{autre}</a>\n'
            '</div>\n')
    return menu_html.replace('<div class="menu-bg">', '<div class="menu-bg">\n' + bloc, 1)


def inject_lang_switch() -> None:
    for rel, (cible, langue, autre, titre) in LANG_PAIRS.items():
        page = ROOT / rel
        if not page.exists():
            print("  ! page absente :", rel)
            continue
        text = page.read_text(encoding="utf-8")
        bloc = (f"{LANG_START}\n"
                '    <div class="lang-switch">\n'
                f'      <span class="lang-current">{langue}</span>'
                f'<a href="{cible}" hreflang="{autre.lower()}" lang="{autre.lower()}" title="{titre}">{autre}</a>\n'
                '    </div>\n'
                f"    {LANG_END}")
        pattern = re.compile(re.escape(LANG_START) + r".*?" + re.escape(LANG_END), re.DOTALL)
        if pattern.search(text):
            text = pattern.sub(lambda m: bloc, text, count=1)
        else:
            m = re.search(r'([ \t]*)<div id="menu">', text)
            if not m:
                print("  ! ancre menu absente :", rel)
                continue
            text = text[:m.start()] + bloc + "\n" + text[m.start():]
        page.write_text(text, encoding="utf-8")
        print("  +", rel, "(selecteur de langue)")


def main() -> None:
    menu_fr = body_inner(MENU_FR)
    menu_en = body_inner(MENU_EN)

    targets = []
    for name in PAGES_FR:
        targets.append((ROOT / name, menu_fr))
    for name in PAGES_EN:
        targets.append((ROOT / name, menu_en))
    for page in sorted((ROOT / "pages").rglob("*.html")):
        base = menu_en if "menu-loader-en.js" in page.read_text(encoding="utf-8") else menu_fr
        targets.append((page, base))

    # selecteur de langue applique une seule fois, sur toutes les pages
    targets = [(page, menu_avec_langue(m, page.relative_to(ROOT).as_posix())) for page, m in targets]

    ensure_analytics()

    print("Donnees structurees produit :")
    inject_jsonld_produit()

    print("Calculateur plaques :")
    inject_calculateur_plaques()

    print("Avis clients :")
    inject_avis()

    print("Calculateur :")
    inject_calculateur()

    print("Calculateur EN :")
    inject_calculateur_en()

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

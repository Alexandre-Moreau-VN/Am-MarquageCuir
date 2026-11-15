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

PAGES_FR = ["index.html"]
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


def inject(page: pathlib.Path, menu_html: str) -> bool:
    text = page.read_text(encoding="utf-8")
    block = f"{START}\n{indent_block(menu_html)}\n{END}"

    # Cas 1 : deja injecte -> on remplace entre les marqueurs
    pattern = re.compile(re.escape(START) + r".*?" + re.escape(END), re.DOTALL)
    if pattern.search(text):
        new_text = pattern.sub(lambda m: block, text, count=1)
        changed = new_text != text
        page.write_text(new_text, encoding="utf-8")
        return changed

    # Cas 2 : premiere injection -> on remplace le div vide
    empty = re.compile(r'<div id="menu"\s*>\s*</div>', re.IGNORECASE)
    if not empty.search(text):
        return False
    new_text = empty.sub(
        lambda m: '<div id="menu">\n' + block + "\n                </div>", text, count=1
    )
    page.write_text(new_text, encoding="utf-8")
    return True


def main() -> None:
    menu_fr = body_inner(MENU_FR)
    menu_en = body_inner(MENU_EN)

    targets = []
    for name in PAGES_FR:
        targets.append((ROOT / name, menu_fr))
    for name in PAGES_EN:
        targets.append((ROOT / name, menu_en))
    for page in sorted((ROOT / "pages").glob("*.html")):
        # les pages anglaises utilisent le menu anglais
        if "menu-loader-en.js" in page.read_text(encoding="utf-8"):
            targets.append((page, menu_en))
        else:
            targets.append((page, menu_fr))

    updated, skipped = [], []
    for page, menu in targets:
        if inject(page, menu):
            updated.append(page)
        else:
            skipped.append(page)

    print(f"{len(updated)} page(s) mise(s) a jour :")
    for p in updated:
        print("  +", p.relative_to(ROOT))
    if skipped:
        print(f"\n{len(skipped)} page(s) sans div #menu (ignorees) :")
        for p in skipped:
            print("  -", p.relative_to(ROOT))


if __name__ == "__main__":
    main()

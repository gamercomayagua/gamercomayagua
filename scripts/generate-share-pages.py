"""Generate static Open Graph pages from the public catalog snapshots."""
from hashlib import sha256
import html
import json
from pathlib import Path
import re
import unicodedata
from urllib.parse import urlencode, urljoin, urlsplit

ROOT = Path(__file__).resolve().parents[1]
SITE = "https://gamercomayagua.github.io/gamercomayagua/"
DEFAULT_IMAGE = urljoin(SITE, "assets/logo-compartir.png")
BRAND = "Gamer Comayagua"


def read_json(path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def write(path, content):
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")


def image_url(value):
    if not isinstance(value, str) or not value:
        return ""
    address = urlsplit(value)
    return value if address.scheme == "https" and address.netloc else ""


def preview_image(photo):
    if urlsplit(photo).hostname != "phone-depot-cdn.ingeniacode.com":
        return photo or DEFAULT_IMAGE
    params = {"url": photo, "w": 400, "h": 400, "fit": "contain", "cbg": "white", "output": "jpg", "q": 78}
    return "https://wsrv.nl/?" + urlencode(params)


def slug(text):
    chars = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", chars.lower()).strip("-")[:70].rstrip("-")


def compact_title(value):
    return " ".join(value.split())[:140]


def landing(path, title, description, image, destination):
    image = preview_image(image)
    escape = lambda value: html.escape(value, quote=True)
    write(path, f"""<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{escape(title)}</title>
<meta name="description" content="{escape(description)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="{BRAND}">
<meta property="og:title" content="{escape(title)}">
<meta property="og:description" content="{escape(description)}">
<meta property="og:url" content="{SITE}{path}">
<meta property="og:image" content="{escape(image)}">
<meta property="og:image:alt" content="{escape(title if image != DEFAULT_IMAGE else BRAND)}">
<script defer src="../../assets/js/abrir-enlace.js"></script>
</head><body><main><h1>{escape(title)}</h1><p>{escape(description)}</p>
<a id="storeLink" href="{escape(destination)}">Abrir en {BRAND}</a>
</main></body></html>
""")


def products():
    rows = {}
    for part in read_json("data/meta.json")["parts"]:
        for product in read_json(part)["products"]:
            product_id = str(product.get("id", ""))
            if re.fullmatch(r"[A-Za-z0-9_-]{1,50}", product_id) and product.get("name"):
                rows.setdefault(product_id, (product["name"], product.get("category", ""), image_url(product.get("photo"))))
    own = read_json("data/productos-propios.json")
    for product in own["products"]:
        product_id = str(product.get("id", ""))
        if product.get("active") is not True or not product.get("name") or not re.fullmatch(r"[A-Za-z0-9_-]{1,43}", product_id):
            continue
        thumbnail = f"assets/vistas-previas/{product_id}.jpg"
        photo = urljoin(SITE, thumbnail) if (ROOT / thumbnail).is_file() else image_url(product.get("image"))
        rows["propio-" + product_id] = (product["name"], product.get("category", ""), photo)
    return rows


def main():
    product_links = {}
    category_images = {}
    for product_id, (raw_name, category, photo) in sorted(products().items()):
        bucket = int(product_id[-2:]) % 20 if product_id.isdecimal() else "propios"
        path = f"p/{bucket}/{product_id}.html"
        name = compact_title(raw_name)
        label = compact_title(category)
        description = (f"{label} · " if label else "") + "Consultá precio, disponibilidad y envíos a Honduras."
        landing(path, f"{name} | {BRAND}", description, photo, SITE + "?" + urlencode({"producto": product_id}))
        product_links[product_id] = path
        if category and (category not in category_images or not category_images[category]):
            category_images[category] = photo

    category_links = {}
    for category in sorted(category_images):
        label = compact_title(category)
        suffix = sha256(category.encode()).hexdigest()[:8]
        path = f"c/catalogo/{slug(label) or 'categoria'}-{suffix}.html"
        landing(path, f"{label} | {BRAND}", f"Explorá los productos de {label}. Envíos a toda Honduras.",
                category_images[category], SITE + "?" + urlencode({"categoria": category}) + "#catalogo")
        category_links[category] = path

    write("data/enlaces.json", json.dumps({"products": product_links, "categories": category_links},
                                          ensure_ascii=False, separators=(",", ":")) + "\n")
    print(f"{len(product_links)} productos, {len(category_links)} categorías")


if __name__ == "__main__":
    main()

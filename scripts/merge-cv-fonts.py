# Merge a Latin and a Georgian subset into one font per weight, so a word
# mixing both scripts (or a Georgian word with a hyphen) is a single run.
#
# Usage (the merged output is committed; rerun only to change the fonts):
#   npm i --no-save @fontsource/dm-sans @fontsource/noto-sans-georgian @fontsource/noto-serif-georgian
#   mkdir -p /tmp/cv-fonts && cp node_modules/@fontsource/*/files/*-{latin,georgian}-{400,600,700}-normal.woff /tmp/cv-fonts/
#   pip install fonttools && python3 scripts/merge-cv-fonts.py /tmp/cv-fonts public/fonts/cv
import os
import sys
from fontTools.ttLib import TTFont
from fontTools.merge import Merger

src, out = sys.argv[1], sys.argv[2]
pairs = {
    "cv-sans": ("dm-sans-latin-{w}-normal.woff", "noto-sans-georgian-georgian-{w}-normal.woff"),
    "cv-serif": ("noto-serif-georgian-latin-{w}-normal.woff", "noto-serif-georgian-georgian-{w}-normal.woff"),
}
for name, (latin, georgian) in pairs.items():
    for w in (400, 600, 700):
        files = []
        for f in (latin, georgian):
            font = TTFont(f"{src}/{f.format(w=w)}")
            font.flavor = None
            tmp = f"{out}/.tmp-{f.format(w=w)}.ttf"
            font.save(tmp)
            files.append(tmp)
        merged = Merger().merge(files)
        merged.flavor = "woff"
        merged.save(f"{out}/{name}-{w}.woff")
        for tmp in files:
            os.remove(tmp)
        print(name, w, "units", TTFont(files[0])["head"].unitsPerEm, TTFont(files[1])["head"].unitsPerEm)

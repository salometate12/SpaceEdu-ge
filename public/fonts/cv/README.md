Fonts embedded in the CV PDF (src/components/cv/pdf).

- cv-sans-{400,600,700}.woff — DM Sans (Latin) + Noto Sans Georgian (Georgian)
- cv-serif-{400,600,700}.woff — Noto Serif Georgian (Latin + Georgian)

Each is one font with both scripts on purpose: react-pdf splits text into
runs by font, and a word whose letters come from two fonts (a Georgian word
with a hyphen, „React-ისა“) was broken at the boundary with an extra hyphen
(„ვებ--“). Built from the @fontsource v5 subsets ("latin" / "georgian") with
scripts/merge-cv-fonts.py (fontTools Merger). All sources are SIL Open Font
License 1.1, which allows embedding in documents.

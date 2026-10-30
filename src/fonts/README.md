# Self-hosted fonts

All fonts are loaded with `next/font/local` (Turbopack's `next/font/google`
download kept failing on Vercel). Each is SIL Open Font License 1.1; the
licence is in its folder.

| Folder | Source | What's in the file |
|---|---|---|
| `noto-sans-georgian` | google/fonts `ofl/notosansgeorgian` | variable, wght 400–700, width fixed at 100 |
| `noto-serif-georgian` | google/fonts `ofl/notoserifgeorgian` | variable, wght 400–700, width fixed at 100 |
| `sora` | google/fonts `ofl/sora` | variable, wght 500–700 |
| `dm-sans` | google/fonts `ofl/dmsans` | variable, wght 400–700, optical size fixed at its default |
| `jetbrains-mono` | @fontsource/jetbrains-mono 5.2.8 | static 400, 500, 600 |

The variable files are cut with fontTools to the georgian, latin and
latin-ext ranges (what `next/font/google` was asked for, plus latin-ext),
so one file per font covers every character the site writes.

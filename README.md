# SpaceEdu.ge

მინიმალისტური ფლეშბარათების პლატფორმა — **Next.js**, **TypeScript**, **Tailwind CSS**, **Lucide React**, **Vercel AI SDK** (Google Gemini).

## დაყენება

```bash
npm install
cp .env.local.example .env.local
# დაამატე GOOGLE_GENERATIVE_AI_API_KEY
npm run dev
```

გახსენი [http://localhost:3000](http://localhost:3000)

## AI პაკეტები

```bash
npm install ai @ai-sdk/google zod mammoth youtube-transcript
```

| პაკეტი | დანიშნულება |
|--------|-------------|
| `ai` | Vercel AI SDK (`generateObject`) |
| `@ai-sdk/google` | Google Gemini 2.5 Flash (მულტიმოდალური) |
| `zod` | JSON სქემის ვალიდაცია |
| `mammoth` | DOCX → ტექსტი |
| `youtube-transcript` | YouTube ტრანსკრიპტი |

### `.env.local`

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
```

გასაღები: [Google AI Studio](https://aistudio.google.com/apikey)

**ალტერნატივა (OpenAI GPT-4o):**

```bash
npm install @ai-sdk/openai
```

```env
OPENAI_API_KEY=sk-...
```

შემდეგ `src/app/api/generate-cards/route.ts`-ში შეცვალე `google('gemini-2.5-flash')` → `openai('gpt-4o')`.

## ფუნქციები

- **მთავარი** — კოლოფების ბადე პროგრესით (ქართული UI)
- **ბარათების გენერაცია** (`/generate`) — AI მულტიმოდალური შეყვანა
- **სწავლა** — 3D flip, `არ ვიცი` / `ვიცი`, კლავიშები

### შეყვანის ტიპები (AI)

| ტაბი | ფორმატები |
|------|-----------|
| სურათი / ფაილი | PNG, JPEG, PDF, DOCX, TXT |
| აუდიო | MP3, WAV, M4A |
| ვიდეო | MP4, WebM |
| YouTube | ბმული (ტრანსკრიპტი) |
| ტექსტი | ხელით შეყვანა |

**მნიშვნელოვანი:** AI ყოველთვის აგენერირებს კითხვა/პასუხს **ქართულად**, მიუხედავად შეყვანის ენისა.

## სტრუქტურა

```
src/
├── app/api/generate-cards/route.ts
├── app/generate/page.tsx
├── components/CardGenerator.tsx
├── lib/i18n.ts              # ქართული ტექსტები
├── lib/ai/prompts.ts        # სისტემური პრომპტი
└── lib/custom-decks.ts      # AI კოლოფები (localStorage)
```

## კლავიშები (სწავლა)

| კლავიში | მოქმედება |
|---------|-----------|
| `Space` | გადატრიალება |
| `←` | არ ვიცი |
| `→` | ვიცი |

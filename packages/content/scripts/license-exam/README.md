# Licensing-exam question bank

The Ministry of Labor publishes the bank for the electricians' licensing exams (טכנאים, הנדסאים
ומהנדסים) as a PDF on https://www.gov.il/he/pages/electricity-questions. It is updated from time
to time; the version and date are printed in the page header. The PDF holds questions only, no answers.

`extract.py` turns the PDF into:

- `content/license-exam/bank.json`: `meta` (version, PDF date, count) and `questions`, each with its
  number (`n`, "שאלה N"), the ministry serial, `level` (`all`, `practical-engineer` or `engineer`,
  read from the two tables at the end of the PDF), stem lines, figures and four options.
- `apps/web/public/images/license-exam/q<NNNN>-*.webp`: figure crops at 200 dpi. Stems or options set
  as stacked formulas are cropped whole and flagged `stemRendered` / `rendered`.

## Refreshing after a new version

```bash
curl -L -o /tmp/bank.pdf "https://www.gov.il/BlobFolder/generalpage/electricity-questions/he/mahat_exams_maagarq-18-1.pdf"
python3 -m venv /tmp/venv && /tmp/venv/bin/pip install pymupdf pillow python-bidi
/tmp/venv/bin/python -I packages/content/scripts/license-exam/extract.py /tmp/bank.pdf content/license-exam apps/web/public/images/license-exam
pnpm --filter @electricademy/content test
```

gov.il blocks plain HTTP clients on its pages (Cloudflare), but the PDF link itself downloads; if the
file name changes, copy the new link from the page in a browser.

The script prints questions it could not parse cleanly ("needs review"); check those against the PDF.
Text is rebuilt from glyph positions (the PDF stores Hebrew/English mixed lines in visual order) and
verified with the Unicode bidi algorithm, so it matches what the PDF shows.

## Answer key

`content/license-exam/answers.json` maps question numbers to `{ answer, serial, source?, explanation? }`.
Entries whose `serial` no longer matches the question (the bank was renumbered) are ignored, and the
tests list them. Questions without a key are still usable: the exam simulator scores only keyed
questions and shows the rest for self-review.

## Overrides and hand-picked crops

- `content/license-exam/overrides.json`: a hand-checked rewrite of a question (its stem and options as text with
  `$LaTeX$`, pipe tables, extraction glitches fixed) and the figures to keep, by file name. The app applies an override
  only while the question's serial and option count still match, so a renumbered bank falls back to the extraction.
  `pnpm --filter @electricademy/content test` checks they still match.
- `crops.json` (next to this README): page regions for drawings the automatic cropper splits into fragments or
  misses (graphs drawn as many tiles, vector diagrams). `extract.py` renders each to `q<NNNN>-c<k>.webp` and appends
  it to the question's figures; the override then lists it.

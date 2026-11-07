# Legislation figures

Wikisource ("ספר החוקים הפתוח") leaves out most illustrations ("(((איור הושמט)))") and keeps the
conductor-loading drawings on Wikimedia Commons. The figures on /law are cropped from the original
Reshumot scans (Kovetz HaTakanot), downloaded from `https://olaw.org.il/takanot/takanot-<issue>.pdf`.
Regulations are not subject to copyright (Copyright Act 2007, section 6).

- `crops.json`: issue, PDF page, crop box (fractions of the page) and rotation for each figure.
- `extract.py <pdf dir> <out dir> crops.json`: renders at 200 dpi, crops, rotates, trims margins, writes WebP.
- `table_cells.py <pdf dir> <out dir>`: finds the grid of the installation-methods table
  (issue 7349, pages 737–741) and crops the drawing cell of each of the 31 rows.

Requires poppler (`pdftoppm`), Pillow and NumPy. Output goes to `apps/web/public/images/legislation/<slug>/`,
and `content/legislation/figures.json` maps each image link / omission note (in document order) to a file.
Tests check that the mapping still matches the source after `legislation:import`.

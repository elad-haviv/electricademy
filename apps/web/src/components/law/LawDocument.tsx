import type { Block, LawDoc } from "@electricademy/content";

/*
 * Renders a parsed Open Law Book document. All `html` strings come from the parser in
 * @electricademy/content, which escapes the source text and only emits its own tags.
 */

const Html = ({ as: Tag = "span", html, className }: { as?: "span" | "p" | "div" | "h2" | "h3"; html: string; className?: string }) => (
  <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />
);

function indent(depth: number) {
  return { paddingInlineStart: `${Math.max(0, depth - 1) * 1.75}rem` };
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "heading":
      if (block.level === 4) return <Html as="p" html={block.html} className="law-subheading" />;
      return (
        <div id={block.id} className={block.level === 2 ? "law-chapter" : "law-subchapter"}>
          <Html as={block.level === 2 ? "h2" : "h3"} html={block.html} />
          {block.amendment && <span className="law-amendment">תיקון: {block.amendment}</span>}
        </div>
      );
    case "section":
      return (
        <section id={block.id} className="law-section">
          {(block.number || block.title || block.amendment) && (
            <div className="law-section-head">
              {block.number && (
                <a href={`#${block.id}`} className="law-section-number" aria-label={`קישור לסעיף ${block.number}`}>
                  {block.number}
                </a>
              )}
              {block.title && <Html html={block.title} className="law-section-title" />}
              {block.amendment && <span className="law-amendment">תיקון: {block.amendment}</span>}
            </div>
          )}
          <div className="law-section-body">
            {block.body.map((b, i) => (
              <BlockView key={i} block={b} />
            ))}
          </div>
        </section>
      );
    case "para":
      return <p className={block.definition ? "law-para law-def" : "law-para"} style={indent(block.depth)} dangerouslySetInnerHTML={{ __html: block.html }} />;
    case "table":
      return (
        <div className="law-table-wrap" style={indent(block.depth)}>
          <table className="law-table">
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r}>
                  {row.cells.map((cell, c) => {
                    const Cell = cell.header ? "th" : "td";
                    return (
                      <Cell
                        key={c}
                        colSpan={cell.colspan > 1 ? cell.colspan : undefined}
                        rowSpan={cell.rowspan > 1 ? cell.rowspan : undefined}
                        dangerouslySetInnerHTML={{ __html: cell.html }}
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "rule":
      return <hr className="my-6 border-slate-200 dark:border-slate-800" />;
  }
}

export function LawDocument({ doc }: { doc: LawDoc }) {
  return (
    <article className="law-doc">
      {doc.intro && <Html as="p" html={doc.intro} className="law-intro" />}
      {doc.blocks.map((b, i) => (
        <BlockView key={i} block={b} />
      ))}
      {(doc.published || doc.signatures.length > 0) && (
        <footer className="law-signoff">
          {doc.published && <Html as="p" html={doc.published} />}
          {doc.signatures.map((s, i) => (
            <Html as="p" key={i} html={s} className="font-semibold" />
          ))}
        </footer>
      )}
    </article>
  );
}

import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { Callout } from "@electricademy/ui";
import { MiniQuiz } from "./MiniQuiz";
import { VoltageDropCalculator } from "./calculators/VoltageDropCalculator";

const components = {
  Callout,
  MiniQuiz,
  VoltageDropDemo: () => <VoltageDropCalculator compact />,
};

/** Renders trusted MDX from the /content directory (not user input). */
export function Mdx({ source }: { source: string }) {
  return (
    <div className="prose-content">
      <MDXRemote
        source={source}
        components={components}
        options={{
          // Content is trusted (from the repo). Allow JSX expressions such as choices={[...]},
          // while next-mdx-remote still blocks dangerous JS (eval, require, etc.).
          blockJS: false,
          mdxOptions: { remarkPlugins: [remarkMath, remarkGfm], rehypePlugins: [rehypeKatex] } }}
      />
    </div>
  );
}

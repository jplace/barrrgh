import fs from "fs";
import path from "path";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";
import cssnano from "cssnano";

export default class {
  async data() {
    const rawFilepath = path.join(
      import.meta.dirname,
      "../_includes/css/styles.css"
    );
    return {
      permalink: "css/styles.css",
      eleventyExcludeFromCollections: true,
      rawFilepath,
      rawCss: await fs.readFileSync(rawFilepath),
    };
  }

  async render({ rawCss, rawFilepath }) {
    return await postcss([tailwindcss(), cssnano()])
      .process(rawCss, { from: rawFilepath })
      .then((result) => result.css);
  }
}

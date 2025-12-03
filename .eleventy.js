const pluginRss = require("@11ty/eleventy-plugin-rss");
const markdownIt = require("markdown-it");
const fs = require("fs");
const posthtml = require("posthtml");
const beautifyHtml = require("js-beautify").html;
const { DateTime } = require("luxon");

module.exports = function (config) {
  const isDev = process.env.PROJECT_DEV === "true";
  if (isDev) {
    console.log("Running with PROJECT_DEV set to true");
  }

  // Adding this just for the absoluteUrl filter used in 11ty examples
  config.addPlugin(pluginRss);

  // Support rendering data to markdown
  let markdown = markdownIt({
    html: true,
    linkify: true,
    typographer: true,
  });
  config.setLibrary("md", markdown);
  config.addFilter("markdown", (value) => markdown.render(value));

  // Formatting for dates
  config.addFilter("readableDate", (dateStr) => {
    return DateTime.fromISO(dateStr, { zone: "utc" }).toLocaleString(
      DateTime.DATE_FULL
    );
  });
  config.addFilter("htmlDateString", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("yyyy-LL-dd");
  });

  // Default href filter
  config.addFilter("defaultHref", function (value, defaultHref) {
    if (value === "#") {
      return defaultHref;
    } else {
      return value;
    }
  });

  config.addFilter("keys", (obj) => {
    return Object.keys(obj);
  });

  config.addCollection("ingredientsToDrinks", (collectionApi) => {
    const ingredientTagToDrinks = {};
    for (const drink of collectionApi.getFilteredByTag("drink")) {
      const ingredientTags = drink.data.ingredientTags;
      const drinkSlug = drink.fileSlug;

      for (const ingredientTag of ingredientTags) {
        if (ingredientTagToDrinks[ingredientTag] === undefined) {
          ingredientTagToDrinks[ingredientTag] = [];
        }
        ingredientTagToDrinks[ingredientTag].push(drinkSlug);
      }
    }
    return ingredientTagToDrinks;
  });

  config.addCollection("drinkSlugsToDrinks", (collectionApi) => {
    const drinkSlugsToDrinks = {};
    for (const drink of collectionApi.getFilteredByTag("drink")) {
      const drinkSlug = drink.fileSlug;
      const drinkTitle = drink.data.title;
      const ingredients = drink.data.ingredients;
      const drinkUrl = drink.url;

      drinkSlugsToDrinks[drinkSlug] = {
        drinkTitle,
        ingredients,
        drinkUrl,
      };
    }
    return drinkSlugsToDrinks;
  });

  // Pass through static assets
  config.addPassthroughCopy("./src/site/images");
  config.addPassthroughCopy("./src/site/fonts");
  config.addPassthroughCopy("./src/site/_redirects");
  config.addPassthroughCopy("./src/site/_headers");
  config.addPassthroughCopy("./src/site/css/tom-select.css");

  // Optimize HTML
  config.addTransform("posthtml", async function (content, outputPath) {
    if (outputPath.endsWith(".html")) {
      const { html } = await posthtml([
        require("posthtml-alt-always")(),
        require("posthtml-link-noreferrer")(),
        require("htmlnano")({
          minifySvg: false,
        }),
      ]).process(content);

      if (isDev) {
        return beautifyHtml(html, { indent_size: 2 });
      } else {
        return html;
      }
    }
    return content;
  });

  return {
    dir: {
      input: "src/site",
      output: "dist",
    },
    templateFormats: ["njk", "11ty.js", "md"],
  };
};

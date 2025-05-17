const htmlmin = require("html-minifier-terser");


module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy({ "static/": "/" }); // static root files like robots.txt, favicon

  eleventyConfig.setDataDeepMerge(true);

  eleventyConfig.addTransform("htmlmin", async function (content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      return await htmlmin.minify(content, {
        collapseWhitespace: true,
        removeComments: true,
        useShortDoctype: true
      });
    }
    return content;
  });

  return {
    dir: {
      input: "src",              // source content folder
      includes: "_includes",     // reusable partials/macros
      data: "_data",             // shared site-wide data files
      output: "dist"             // final generated output
    },
    passthroughFileCopy: true,
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html"]
  };
};

# NanoMDParser

A markdown parser written in JavaScript with **eight** custom functions built in. This parser was born out of frustration of all other parsers, but mainly due to the fact that there's no parser tiny enough in terms of file-size that applies common sense in terms of security for links. This one is 3kb give or take if you minify it.

**FYI:** this parser uses whatever CSS stylesheet you use on your website. It does NOT load any separate CSS.

**These are the custom functions:**

1. All **`<a href>`** links (e.g. `[Google](https://www.google.com/)`) have `rel="noopener noreferrer"` added to them automatically as an normal layer of security. This should be standard practice by the way. Did I have to add this through the parser? No, but I did.
2. **The `extl` syntax:** `[Google](https://www.google.com/)` generates a link, just like normal. Using the `extl` syntax before the URL like this `[Google](extl https://www.google.com/)` adds `target="_blank_"` to the link while keeping the `rel="noopener noreferrer"`.
3. `::` with or without `-class-name` followed by its content and closed with `::` will insert a `<span>` element. **Example:** `:: -css-class-name content of span element ::` generates this: `<span class="css-class-name">content of span element</span>`. **Important:** do not forget to add a blank space, just like the example shows.
4. `:::` functions the same way the `::` for `span` does, but will generate a `<div>` element instead. You can combine these by adding `span` within `div` elements.
5. Images are automatically given the `loading="lazy"` attribute added to them.
6. The parser automatically checks if you're using `DOMPurify` and based on that, either sanitizes the HTML output, or not. Simple as that.
7. The parser has an list of `HTML` elements serving as an "do not care about these" if, and when, you write pure HTML within a markdown document. Those elements are rendered just like normal by your browser.
8. The parser looks for the `data-md-src="name-of-document.md"` in your HTML document without the need for a specific `ID`, which means that you can render multiple markdown files with ease within the same HTML document.

**Example on how to load one markdown document:** use this `<div data-md-src="name-of-document.md"></div>` and the markdown document will be rendered within that `div` element.

**Fixing DOMPurify 3.3.0 whitelist removal of `target="_blank"` for links**
`const purifyOptions = { ADD_ATTR: ["target"] };`
`return window.DOMPurify.sanitize(rawHtml, purifyOptions);`

We need to accept the XSS security setting which DOMPurify offers and provide, while directly after tell it to allow our `extl` syntax for external links to pass through. Obviously, this might change - so stay tuned :)

## The JS code for your HTML document

**The following JavaScript code is required in your HTML document in order for the parser to function:**

`<script>
(async function () {
const containers = document.querySelectorAll("[data-md-src]");
for (const el of containers) {
const src = el.getAttribute("data-md-src");
if (!src) continue;
try {
const resp = await fetch(src);
if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
const rawMd = await resp.text();
const html = window.parseMarkdown(rawMd);
el.innerHTML = html;
} catch (err) {
console.error(`${src} was not rendered.`, err);
el.innerHTML = `<div class="rendmd">${src} is not displayed.</div>`;
}}})();
</script>`

Feel free to edit and change the messages displayed in the console and on the HTML page to your liking and/ or, to suit your needs.

## Why another `.md` parser?

Because I got tired of large parsers which required "extending" and what not to get what I wanted - so I made my own. **Is this perfect? Obviously not.** But it does what I need it to do, and those wanting to change / extend etc, can. Just do it, I don't care. Feel free to fork it if you're craving to make changes.

## The DOMPurify thing...

The HTML example document below uses the latest stable link from `jsdelivr` (`https://cdn.jsdelivr.net/npm/dompurify/dist/purify.min.js`) which means that the DOMPurify library is always the latest. The parser's built in functionality even prints out a console message with all the data you need when **DOMPurify** is being used, including which version running.

## HTML dummy template

Example on how to use this parser.
**HTML dummy template:**

`<!DOCTYPE html>
<html>
<head>
<title>Markdown Parsed</title>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,minimum-scale=1">
<script src="https://cdn.jsdelivr.net/npm/dompurify/dist/purify.min.js"></script>
<link href="style.css" rel="stylesheet" />
</head>
<body>
<div data-md-src="name-of-document.md"></div>
<div data-md-src="another-name-of-document.md"></div>
<script src="nanoparser.js"></script>
<script>
(async function () {
const containers = document.querySelectorAll("[data-md-src]");
for (const el of containers) {
const src = el.getAttribute("data-md-src");
if (!src) continue;
try {
const resp = await fetch(src);
if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
const rawMd = await resp.text();
const html = window.parseMarkdown(rawMd);
el.innerHTML = html;
} catch (err) {
console.error(`${src} was not rendered.`, err);
el.innerHTML = `<div class="rendmd">${src} is not displayed.</div>`;
}}})();
</script>
</body>
</html>`

## A version without DOMPurify? Yes.

If you want this parser, but without the inclusion of DOMPurify, use the parser namned `nanoparser-nodp.js` instead.

## Questions? Okay...

Submit you know what **or**, send an email to: projektnano.xyz@proton.me
Have a whatever day you're having :)
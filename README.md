# The NanoMDParser

A markdown parser written in JavaScript with **eight** custom functions built in. This parser was was made because I needed a custom parser allowing me to create external links alonside some other custom basic functions. It's also ver tiny, 3kb give or take if you minify it and 4kb if you don't.

**These are the custom functions:**

1. `rel="noopener noreferrer"` is added by default to all links without any additional input or formatting.
2. The **`extl`** syntax adds `target="_blank_"` to links using the following syntax: `[Google](extl https://www.google.com/)` while keeping the `rel="noopener noreferrer"` intact.
3. `::` with or without `-class-name` followed by its content will create a `<span>` element. **Example:** `:: -css-class-name content of span element ::` creates this: `<span class="css-class-name">content of span element</span>`.
4. `:::` functions the same way the `::` does, but will create a `<div>` element instead. You can add `span` elements within `div` elements.
5. The `loading="lazy"` attribute is added automatically to image elements.
6. The parser automatically checks if you're using `DOMPurify` and based on that, either sanitizes the HTML output or not.
7. The parser has an list of whitelisted `HTML` elements you can use in your document if ever needed.
8. The parser looks for the `data-md-src="name-of-document.md"` in your document without the need for a specific ID or class, allowing you to render multiple markdown files within the same document.

**Example on how to load a markdown document:**

`<div data-md-src="name-of-document.md"></div>`

The `name-of-document.md` document will be rendered within that `<div>` element, no matter where that `<div>` is placed within your document.

**Fixing DOMPurify 3.3.0 whitelist removal of `target="_blank"` for links:**

`const purifyOptions = { ADD_ATTR: ["target"] };`

`return window.DOMPurify.sanitize(rawHtml, purifyOptions);`

The XSS security which DOMPurify offers and provide is useful, but DOMPurify did - for some reason - remove `target="_blank"` for some reason, which is why I had to add the code above to allow the `extl` syntax.

## The DOMPurify thing...

The HTML `example.html` document uses the latest stable link from `jsdelivr` (`https://cdn.jsdelivr.net/npm/dompurify/dist/purify.min.js`), ensuring the latest DOMPurify library at all times. The parser's built in functionality has a console message with all the data you need when **DOMPurify** is being used, including which version. This document acts as an example of how to use the parser in an HTML document.

## A version without DOMPurify? Yes.

If you want this parser, but without the inclusion of DOMPurify, use the parser namned `nanoparser-nodp.js` instead.

## Questions? Okay...

Submit you know what **or**, send an email to: projektnano.xyz@proton.me

Have a whatever day you're having :)
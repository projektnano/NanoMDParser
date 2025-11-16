(() => {
"use strict";
function escapeBackticks(txt) {
return txt.replace(/`/g, "&#96;");
}
function escapeHtmlOutsideTags(txt) {
const tagRegex = /<\/?[a-z][\w:-]*\b[^>]*>|<!--[\s\S]*?-->/gi;
const parts = txt.split(tagRegex);
const tags = txt.match(tagRegex) || [];
const escaped = [];
for (let i = 0; i < parts.length; i++) {
if (parts[i]) {
escaped.push(
parts[i].replace(/[&<>\"']/g, ch => ({
"&": "&amp;",
"<": "&lt;",
">": "&gt;",
"\"": "&quot;",
"'": "&#39;"
})[ch])
);
}
if (i < tags.length) escaped.push(tags[i]);
}
return escaped.join("");
}
function parseInline(txt) {
const rawLinks = [];
txt = txt.replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, m => {
const i = rawLinks.length;
rawLinks.push(m);
return `@@RAW_LINK_${i}@@`;
});
txt = escapeHtmlOutsideTags(txt);
txt = txt.replace(/:::\s+-([^\s]+)\s+([\s\S]+?)\s+:::/g,(_, cls, inner) => `<div class="${cls}">${inner}</div>`);
txt = txt.replace(/:::\s+([\s\S]+?)\s+:::/g,(_, inner) => `<div>${inner}</div>`);
txt = txt.replace(/::(?!:)\s+-([^\s]+)\s+([\s\S]+?)\s+::/g,(_, cls, inner) => `<span class="${cls}">${inner}</span>`);
txt = txt.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>");
txt = txt.replace(/\*(.+?)\*/g,"<em>$1</em>");
txt = txt.replace(/`([^`]+?)`/g,"<code>$1</code>");
txt = txt.replace(/!\[([^\]]*)]\(([^)]+)\)/g,'<img src="$2" alt="$1" loading="lazy">');
txt = txt.replace(/\[([^\]]+)]\s*\(?\s*(extl\s+)?([^)\s]+)\s*\)?/g,(m, label, extl, url) => {
const target = extl ? ' target="_blank"' : "";
return `<a href="${url}" rel="noopener noreferrer"${target}>${label}</a>`;
});
txt = txt.replace(/@@RAW_LINK_(\d+)@@/g, (_, i) => rawLinks[Number(i)]);
return txt;
}
function parseMarkdown(md) {
if (typeof md !== "string") {
throw new TypeError("That's not a string, carry on.");
}
const lines = md.split(/\r?\n/);
const out = [];
let inList = false;
let listTag = "";
let inCodeBlock = false;
let codeLang = "";
let inBlockquote = false;
for (let rawLine of lines) {
if (/^\s*-{3,}\s*$/.test(rawLine)) {
if (inList) { out.push(`</${listTag}>`); inList = false; listTag = ""; }
if (inBlockquote) { out.push("</blockquote>"); inBlockquote = false; }
out.push("<hr>");
continue;
}
const bqMatch = rawLine.match(/^>\s?(.*)$/);
if (bqMatch) {
if (!inBlockquote) {
if (inList) { out.push(`</${listTag}>`); inList = false; listTag = ""; }
out.push("<blockquote>");
inBlockquote = true;
}
const inner = bqMatch[1];
if (inner.trim()) {
out.push(`<p>${parseInline(inner)}</p>`);
}
continue;
} else if (inBlockquote) {
out.push("</blockquote>");
inBlockquote = false;
}
const unorderedMatch = rawLine.match(/^\s*[-*+]\s+/);
const orderedMatch = rawLine.match(/^\s*\d+\.\s+/);
if (unorderedMatch) {
if (!inList) { out.push("<ul>"); inList = true; listTag = "ul"; }
const li = parseInline(rawLine.replace(/^\s*[-*+]\s+/, ""));
out.push(`<li>${li}</li>`);
continue;
} else if (orderedMatch) {
if (!inList) { out.push("<ol>"); inList = true; listTag = "ol"; }
const li = parseInline(rawLine.replace(/^\s*\d+\.\s+/, ""));
out.push(`<li>${li}</li>`);
continue;
} else if (inList) {
out.push(`</${listTag}>`);
inList = false;
listTag = "";
}
const heading = rawLine.match(/^(#{1,6})\s+(.*)$/);
if (heading) {
const lvl = heading[1].length;
out.push(`<h${lvl}>${parseInline(heading[2])}</h${lvl}>`);
continue;
}
const fence = rawLine.match(/^```(\w+)?\s*$/);
if (fence) {
if (inCodeBlock) {
out.push("</code></pre>");
inCodeBlock = false;
codeLang = "";
} else {
codeLang = fence[1] ? fence[1].toLowerCase() : "";
const cls = codeLang ? `class="language-${codeLang}"` : "";
out.push(`<pre><code${cls}>`);
inCodeBlock = true;
}
continue;
}
if (inCodeBlock) {
out.push(escapeBackticks(escapeHtmlOutsideTags(rawLine)));
continue;
}
if (!rawLine.trim()) continue;
if (/^<\s*[a-zA-Z]/.test(rawLine.trim())) {
out.push(parseInline(rawLine));
continue;
}
const inlineResult = parseInline(rawLine);
if (/^<(div|section|article|header|footer|nav|figure|table|aside|main|blockquote|pre|hr|ul|ol|li|h[1-6])\b/i.test(inlineResult.trim())) {
out.push(inlineResult);
continue;
}
out.push(`<p>${inlineResult}</p>`);
}
if (inList) out.push(`</${listTag}>`);
if (inCodeBlock) out.push("</code></pre>");
if (inBlockquote) out.push("</blockquote>");
return out.join("\n");
}
window.parseMarkdown = parseMarkdown;
})();
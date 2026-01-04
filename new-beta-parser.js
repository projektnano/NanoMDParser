(() => {
    "use strict";

    if (typeof window.__dompurifyLogShown === "undefined") {
        window.__dompurifyLogShown = false;
    }

    if (typeof window.__dompurifyWarnShown === "undefined") {
        window.__dompurifyWarnShown = false;
    }

	function escapeBackticks(txt) {
        return txt.replace(/`/g, "`");
    }

	function escapeHtmlOutsideTags(txt) {
        return txt;
    }
	
	function decodeHtmlEntities(txt) {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = txt;
        return textarea.value;
    }
	
	function parseInline(txt) {
        txt = txt.replace(/(<a\b[^>]*>)([\s\S]*?)(<\/a>)/gi, (m, start, content, end) => {
            let inner = content.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
            inner = inner.replace(/\*(.+?)\*/g, "<em>$1</em>");
            return start + inner + end;
        });

	    const rawHtmlElements = [];
	    txt = txt.replace(/<([a-z][\w:-]*)\b[^>]*>[\s\S]*?<\/\1>|<([a-z][\w:-]*)\b[^>]*\/>/gi, m => {
	        const i = rawHtmlElements.length;
	        rawHtmlElements.push(m);
	        return `@@RAW_HTML_${i}@@`;
	    });

		const regexTag = /\|\|(.*)\|\|/g;
		txt = txt.replace(regexTag, (_, content) => {
		    return `<span class="tag">${content}</span>`;
		});
		
		const regexHero = /\/\/(.*)\/\//g;
		txt = txt.replace(regexHero, (_, content) => {
		    return `<div class="hero">${content.trim()}</div>`;
		});

	    const regexMark = /==([^=]+)==/g;
	    txt = txt.replace(regexMark, (_, content) => {
	        return `<mark>${content}</mark>`;
	    });

	    const regexDivCombined = /:::\s*(?:-([^\s]+)\s+)?([\s\S]+?)\s*:::/g;
	    txt = txt.replace(regexDivCombined, (_, cls, inner) => {
            
			const content = inner.trim().split(/\r?\n/).map(line => {
                const trimmed = line.trim();
                return trimmed ? `<p>${trimmed}</p>` : "";
            }).join("");

	        if (cls) {
	            return `<div class="${cls}">${content}</div>`;
	        } else {
	            return `<div>${content}</div>`;
	        }
	    });

	    const regexSpanCombined = /::\s*(?:-([^\s]+)\s+)?([\s\S]+?)\s*::/g;
	    txt = txt.replace(regexSpanCombined, (_, cls, inner) => {
	        const content = inner.trim();
	        if (cls) {
	            return `<span class="${cls}">${content}</span>`;
	        } else {
	            return `<span>${content}</span>`;
	        }
	    });

	    txt = txt.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
	    txt = txt.replace(/\*(.+?)\*/g, "<em>$1</em>");
	    txt = txt.replace(/`([^`]+?)`/g, "<code>$1</code>");
		// ![Alt Text](this-picture-name-becomes-the-alt-text.png "altt")
		txt = txt.replace(/!\[([^\]]*)]\(([^)]+)(?:\s+altt)?\)/g, (match, altText, src) => {
		    const fileName = src.split('/').pop().split('.')[0]; 
		    return `<img src="${src}" alt="${fileName.replace(/-/g, ' ')}" loading="lazy">`;
		});
		
		txt = txt.replace(/\[([^\]]+)]\s*\(?\s*(extl\s+)?([^)\s]+)\s*\)?/g, (m, label, extl, url) => {

	        const target = extl ? 'target="_blank"' : "";
            const processedLabel = label.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>");
	        return `<a href="${url}" rel="noopener noreferrer"${target}>${processedLabel}</a>`;
	    });   

	    txt = escapeHtmlOutsideTags(txt);
	    txt = txt.replace(/@@RAW_HTML_(\d+)@@/g, (_, i) => rawHtmlElements[Number(i)]);
	    return txt;
	}

    function renderTable(rows) {
        if (rows.length < 2) return rows.map(r => `<p>${parseInline(r)}</p>`).join("\n");
        const isTable = /^\|?(\s*:?-+:?\s*\|?)+\s*$/.test(rows[1].trim());
        if (!isTable) return rows.map(r => `<p>${parseInline(r)}</p>`).join("\n");
        
        let html = "<table><thead>";
        const headerCells = rows[0].trim().replace(/^\||\|$/g, "").split("|");
        
        html += "<tr>" + headerCells.map((c, index) => {
            return `<th>${parseInline(c.trim())}</th>`;
        }).join("") + "</tr></thead><tbody>";
        
        for (let i = 2; i < rows.length; i++) {
            const bodyCells = rows[i].trim().replace(/^\||\|$/g, "").split("|");
            html += "<tr>" + bodyCells.map((c, index) => {
                return `<td>${parseInline(c.trim())}</td>`;
            }).join("") + "</tr>";
        }
        html += "</tbody></table>";
        return html;
    }

	function internalParse(md) {
		if (typeof md !== "string") {
            throw new TypeError("String? Continue...");
        }
        const lines = md.split(/\r?\n/);
        const out = [];
        let inList = false;
        let listTag = "";
        let inCodeBlock = false;
        let codeLang = "";
        let inBlockquote = false;
        let inTable = false;
        let tableRows = [];
		for (let i = 0; i < lines.length; i++) {
            let rawLine = lines[i];
            const looksLikeTable = rawLine.trim().includes("|");
            if (looksLikeTable && !inCodeBlock && !inList && !inBlockquote) {
                if (!inTable) {
                    inTable = true;
                    tableRows = [];
                }
                tableRows.push(rawLine);
                if (i < lines.length - 1 && lines[i+1].trim().includes("|")) {
                    continue; 
                } else {
                    out.push(renderTable(tableRows));
                    inTable = false;
                    tableRows = [];
                    continue;
                }}
		    if (/^\s*-{3,}\s*$/.test(rawLine)) {
		        if (inList) { 
					out.push(`</${listTag}>`); inList = false;
				}
		        if (inBlockquote) {
					out.push("</blockquote>"); inBlockquote = false;
				}
		        out.push("<hr>");
                continue;
            }

		    const bqMatch = rawLine.match(/^>\s?(.*)$/);
		    if (bqMatch) {
		        if (!inBlockquote) {
		            if (inList) {
						out.push(`</${listTag}>`); inList = false;
					}
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
		        if (!inList) {
					out.push("<ul>"); inList = true; listTag = "ul";
				}

		        const li = parseInline(rawLine.replace(/^\s*[-*+]\s+/, ""));
                out.push(`<li>${li}</li>`);
                continue;

		    } else if (orderedMatch) {
		        if (!inList) {
					out.push("<ol>"); inList = true; listTag = "ol";
				}

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
                const content = heading[2];
                out.push(`<h${lvl}>${parseInline(content)}</h${lvl}>`);
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
                out.push(decodeHtmlEntities(escapeBackticks(rawLine)) + '\n');
		        continue;
            }
		    if (!rawLine.trim()) continue;

            const inlineResult = parseInline(rawLine);
            if (/^<(div|img|section|article|header|footer|nav|figure|table|aside|blockquote|pre|code)/i.test(inlineResult.trim())) {
		        out.push(inlineResult);
		    } else {
		        out.push(`<p>${inlineResult}</p>`);
		    }
		}
		if (inList) out.push(`</${listTag}>`);
        if (inBlockquote) out.push("</blockquote>");
        if (inCodeBlock) out.push("</code></pre>");
        return out.join("\n");
	}

    function parseMarkdown(md) {
        const rawHtml = internalParse(md);
		if (typeof window.DOMPurify !== "undefined" && 
		typeof window.DOMPurify.sanitize === "function") {
		    if (!window.__dompurifyLogShown) {
                const version = window.DOMPurify.version || "unknown";
                console.log(`%cDOMPurify ${version} levererar saniterad HTML.`, "color: #28a745;");
                window.__dompurifyLogShown = true;
            }
            return window.DOMPurify.sanitize(rawHtml);
        
		} else {
            if (!window.__dompurifyWarnShown) {
                console.warn("DOMPurify körs inte. HTML är osaniterad.");
                window.__dompurifyWarnShown = true;
            }
            return rawHtml;
        }
    }
    if (typeof module !== "undefined" && module.exports) {
        module.exports = parseMarkdown;
    } else {
        window.parseMarkdown = parseMarkdown;
    }
})();

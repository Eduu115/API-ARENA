import assert from "node:assert/strict";
import test from "node:test";
import { toHtml } from "../src/lib/markdownSafe.js";

test("escapes raw html and drops javascript links", () => {
  const html = toHtml(`<script>alert(1)</script>
<img src=x onerror="alert(1)">
[click](javascript:alert(1))
[ok](https://apiarena.net/en/news)
![x](javascript:alert(1))
![cover](https://cdn.apiarena.net/a.png)
`);
  const lower = html.toLowerCase();
  assert.equal(lower.includes("<script"), false);
  assert.equal(html.includes("<img src=x"), false);
  assert.equal(lower.includes("javascript:"), false);
  assert.equal(html.includes('href="https://apiarena.net/en/news"'), true);
  assert.equal(html.includes('src="https://cdn.apiarena.net/a.png"'), true);
  assert.equal(html.includes("&lt;script&gt;"), true);
});

test("renders the toolbar subset", () => {
  const html = toHtml(`# Title
**bold** and *italic*
- one
1. two
> quoted
\`code\`
\`\`\`
int x = 1;
\`\`\`
| A | B |
| --- | --- |
| 1 | 2 |
`);
  assert.equal(html.includes("<h1>Title</h1>"), true);
  assert.equal(html.includes("<strong>bold</strong>"), true);
  assert.equal(html.includes("<em>italic</em>"), true);
  assert.equal(html.includes("<li>one</li>"), true);
  assert.equal(html.includes("<pre><code>int x = 1;</code></pre>"), true);
  assert.equal(html.includes("<th>A</th>"), true);
});

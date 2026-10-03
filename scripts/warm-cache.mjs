// Pre-renders the ISR pages after a deploy so the first real visitor doesn't pay for the render.
//   node scripts/warm-cache.mjs https://rasakatha.lk [maxBookPages=150]
// Visits the key pages (home, categories, category pages, sale, new arrivals) and the newest book pages from the sitemap.
const base = (process.argv[2] || "").replace(/\/$/, "");
const maxBooks = Number(process.argv[3]) || 150;
if (!base) {
  console.error("usage: node scripts/warm-cache.mjs <site url> [maxBookPages]");
  process.exit(1);
}
const xml = await (await fetch(`${base}/sitemap.xml`)).text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/^https?:\/\/[^/]+/, base));
const books = urls.filter((u) => u.includes("/book/")).slice(-maxBooks);
const pages = urls.filter((u) => !u.includes("/book/") && !u.includes("/author/"));
const queue = [...pages, ...books];
let ok = 0;
let fail = 0;
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const url = queue.shift();
      try {
        const res = await fetch(url);
        if (res.ok) ok++;
        else fail++;
      } catch {
        fail++;
      }
    }
  })
);
console.log(`warmed ${ok} pages (${fail} failed)`);

import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const target = url.startsWith("http") ? url : `https://${url}`;
    const parsedUrl = new URL(target);
    const baseUrl = parsedUrl.origin;

    // Fetch homepage
    const response = await fetch(baseUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LLMsTxtBot/1.0)" },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Could not reach target website" }, { status: 400 });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $("title").text().trim() || parsedUrl.hostname;
    const description =
      $('meta[name="description"]').attr("content")?.trim() ||
      "Documentation, guides, and developer references.";

    // Extract internal doc/api links
    const docLinks: { title: string; href: string }[] = [];
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      let linkText = $(el).text().trim().replace(/\s+/g, " ");

      if (href && (href.includes("doc") || href.includes("api") || href.includes("guide") || href.includes("capital"))) {
        try {
          const fullUrl = href.startsWith("http") ? href : new URL(href, baseUrl).toString();

          // Fallback: If link text is empty or too long/short, derive a clean label from the URL path
          const isGeneric = /^(read( the)? guide|learn more|read more|get started|view more|explore)$/i.test(linkText);

          if (!linkText || linkText.length < 2 || linkText.length > 60 || isGeneric) {
            const slug = new URL(fullUrl).pathname.split("/").filter(Boolean).pop() || "Overview";
            linkText = slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
          }

          if (
            fullUrl.startsWith(baseUrl) &&
            !docLinks.some((l) => l.href === fullUrl) &&
            fullUrl !== baseUrl
          ) {
            docLinks.push({ title: linkText, href: fullUrl }); // <-- use linkText here
          }
        } catch {
          // Ignore malformed hrefs
        }
      }
    });

    // Assemble llms.txt standard output
    let markdown = `# ${title}\n\n> ${description}\n\n## Documentation\n`;
    if (docLinks.length > 0) {
      docLinks.slice(0, 20).forEach((link) => {
        markdown += `- [${link.title}](${link.href})\n`;
      });
    } else {
      markdown += `- [Home](${baseUrl}): Main landing page\n`;
    }

    return NextResponse.json({ markdown, count: Math.max(docLinks.length, 1) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to generate file" }, { status: 500 });
  }
}
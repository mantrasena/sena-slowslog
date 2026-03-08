import jsPDF from "jspdf";

interface ArticleForPDF {
  title: string;
  subtitle?: string | null;
  content?: string | null;
  published_at?: string | null;
  author_name?: string;
}

const stripHtml = (html: string): string => {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

export const exportArticlesToPDF = (articles: ArticleForPDF[]) => {
  const now = new Date();
  const y4 = now.getFullYear();
  const m2 = String(now.getMonth() + 1).padStart(2, "0");
  const d2 = String(now.getDate()).padStart(2, "0");
  const filename = `backup-${y4}${m2}${d2}`;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const mg = 25;
  const mw = pw - mg * 2;
  let pageNum = 1;

  const footer = () => {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(170, 170, 170);
    doc.text(`${pageNum}`, pw / 2, ph - 10, { align: "center" });
  };

  const newPage = () => {
    footer();
    doc.addPage();
    pageNum++;
    return mg;
  };

  articles.forEach((article, idx) => {
    if (idx > 0) {
      footer();
      doc.addPage();
      pageNum++;
    }

    let y = mg;

    // ── Accent bar ──
    doc.setFillColor(40, 40, 40);
    doc.rect(mg, y, 32, 1, "F");
    y += 10;

    // ── Title ──
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(25, 25, 25);
    const titleLines: string[] = doc.splitTextToSize(article.title || "Untitled", mw);
    for (const line of titleLines) {
      if (y > ph - 20) y = newPage();
      doc.text(line, mg, y);
      y += 10;
    }
    y += 1;

    // ── Subtitle ──
    if (article.subtitle) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(90, 90, 90);
      const subLines: string[] = doc.splitTextToSize(article.subtitle, mw);
      for (const line of subLines) {
        if (y > ph - 20) y = newPage();
        doc.text(line, mg, y);
        y += 6.5;
      }
      y += 3;
    }

    // ── Meta ──
    const parts = [
      article.author_name ? `by ${article.author_name}` : null,
      article.published_at
        ? new Date(article.published_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : null,
    ].filter(Boolean);

    if (parts.length) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(140, 140, 140);
      doc.text(parts.join("  ·  "), mg, y);
      y += 8;
    }

    // ── Separator ──
    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.3);
    doc.line(mg, y, pw - mg, y);
    y += 10;

    // ── Body ──
    doc.setFontSize(10.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(45, 45, 45);

    const raw = stripHtml(article.content || "");
    const paragraphs = raw.split(/\n{2,}/);

    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (!trimmed) continue;

      const lines: string[] = doc.splitTextToSize(trimmed, mw);
      for (const line of lines) {
        if (y > ph - 20) y = newPage();
        doc.text(line, mg, y);
        y += 5.5;
      }
      y += 4; // paragraph gap
    }

    footer();
  });

  // Export info on page 1
  doc.setPage(1);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 180, 180);
  doc.text(
    `Exported ${now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}  ·  ${articles.length} article(s)`,
    mg,
    ph - 15
  );

  doc.save(`${filename}.pdf`);
};

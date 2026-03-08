import jsPDF from "jspdf";

interface ArticleForPDF {
  title: string;
  subtitle?: string | null;
  content?: string | null;
  published_at?: string | null;
  author_name?: string;
}

const stripHtml = (html: string) => {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

export const exportArticlesToPDF = (articles: ArticleForPDF[], _filename?: string) => {
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const filename = `backup-${dateStr}`;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 24;
  const maxWidth = pageWidth - margin * 2;

  const addPageNumber = (pageNum: number) => {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180);
    doc.text(`${pageNum}`, pageWidth / 2, pageHeight - 12, { align: "center" });
  };

  let globalPage = 1;

  articles.forEach((article, idx) => {
    if (idx > 0) {
      doc.addPage();
      globalPage++;
    }

    let y = margin + 10;

    // Top accent line
    doc.setDrawColor(60);
    doc.setLineWidth(0.8);
    doc.line(margin, margin, margin + 40, margin);

    // Title
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30);
    const titleLines = doc.splitTextToSize(article.title || "Untitled", maxWidth);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 9 + 2;

    // Subtitle
    if (article.subtitle) {
      doc.setFontSize(13);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100);
      const subLines = doc.splitTextToSize(article.subtitle, maxWidth);
      doc.text(subLines, margin, y);
      y += subLines.length * 6 + 4;
    }

    // Meta line
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(140);
    const meta = [
      article.author_name && `by ${article.author_name}`,
      article.published_at && new Date(article.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    ].filter(Boolean).join("  ·  ");
    if (meta) {
      doc.text(meta, margin, y);
      y += 10;
    }

    // Separator
    doc.setDrawColor(220);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Content body
    doc.setFontSize(10.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50);
    const text = stripHtml(article.content || "");
    const paragraphs = text.split(/\n\s*\n/);

    for (const paragraph of paragraphs) {
      const trimmed = paragraph.trim();
      if (!trimmed) continue;

      const lines = doc.splitTextToSize(trimmed, maxWidth);
      for (const line of lines) {
        if (y > pageHeight - 24) {
          addPageNumber(globalPage);
          doc.addPage();
          globalPage++;
          y = margin;
        }
        doc.text(line, margin, y);
        y += 5.2;
      }
      y += 3; // paragraph spacing
    }

    addPageNumber(globalPage);
  });

  // Cover info on first page footer area
  doc.setPage(1);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180);
  doc.text(`Exported on ${now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}  ·  ${articles.length} article(s)`, margin, pageHeight - 18);

  doc.save(`${filename}.pdf`);
};

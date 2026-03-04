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

export const exportArticlesToPDF = (articles: ArticleForPDF[], filename = "articles-backup") => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;

  articles.forEach((article, idx) => {
    if (idx > 0) doc.addPage();

    let y = margin;

    // Title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    const titleLines = doc.splitTextToSize(article.title || "Untitled", maxWidth);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 8 + 4;

    // Subtitle
    if (article.subtitle) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(120);
      const subLines = doc.splitTextToSize(article.subtitle, maxWidth);
      doc.text(subLines, margin, y);
      y += subLines.length * 6 + 4;
    }

    // Meta
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150);
    const meta = [
      article.author_name && `by ${article.author_name}`,
      article.published_at && new Date(article.published_at).toLocaleDateString(),
    ].filter(Boolean).join(" · ");
    if (meta) {
      doc.text(meta, margin, y);
      y += 8;
    }

    // Separator
    doc.setDrawColor(200);
    doc.line(margin, y, margin + 30, y);
    y += 8;

    // Content
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30);
    const text = stripHtml(article.content || "");
    const lines = doc.splitTextToSize(text, maxWidth);

    for (const line of lines) {
      if (y > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 5.5;
    }
  });

  doc.save(`${filename}.pdf`);
};

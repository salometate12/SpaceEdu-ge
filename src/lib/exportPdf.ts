import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function exportToPdf(elementId: string, filename: string) {
  const target = document.getElementById(elementId);
  if (!target) return;

  const canvas = await html2canvas(target, { scale: 2, backgroundColor: "#0A0A0F" });
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  pdf.save(`${filename}.pdf`);
}

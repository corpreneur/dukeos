import jsPDF from "jspdf";

// ─── Shared helpers ───

const BRAND = { name: "DukeOS", tagline: "Pet Waste Removal" };
const COLORS = { primary: [34, 120, 60] as [number, number, number], dark: [30, 30, 30] as [number, number, number], muted: [120, 120, 120] as [number, number, number] };

function addHeader(doc: jsPDF, title: string) {
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, 210, 36, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(BRAND.name, 14, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(BRAND.tagline, 14, 26);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(title, 196, 22, { align: "right" });
  return 44; // next Y position
}

function addFooter(doc: jsPDF) {
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(200, 200, 200);
  doc.line(14, pageHeight - 16, 196, pageHeight - 16);
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text(`Generated ${new Date().toLocaleDateString()} — ${BRAND.name}`, 14, pageHeight - 10);
  doc.text("Confidential", 196, pageHeight - 10, { align: "right" });
}

function labelValue(doc: jsPDF, label: string, value: string, x: number, y: number) {
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "normal");
  doc.text(label, x, y);
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.dark);
  doc.setFont("helvetica", "bold");
  doc.text(value, x, y + 5);
}

// ─── Invoice PDF ───

interface InvoiceData {
  customerName: string;
  customerEmail: string;
  address: string;
  plan: string;
  frequency: string;
  numDogs: number;
  priceCents: number;
  startedAt: string;
  subscriptionId: string;
}

export function generateInvoicePDF(data: InvoiceData) {
  const doc = new jsPDF();
  let y = addHeader(doc, "INVOICE");

  // Invoice details
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(14, y, 182, 30, 3, 3, "F");
  labelValue(doc, "Customer", data.customerName || data.customerEmail, 20, y + 8);
  labelValue(doc, "Address", data.address, 80, y + 8);
  labelValue(doc, "Invoice Date", new Date().toLocaleDateString(), 150, y + 8);
  y += 38;

  labelValue(doc, "Subscription ID", data.subscriptionId.slice(0, 8).toUpperCase(), 14, y);
  labelValue(doc, "Start Date", new Date(data.startedAt).toLocaleDateString(), 80, y);
  y += 16;

  // Line items table
  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(...COLORS.primary);
  doc.rect(14, y, 182, 10, "F");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("Description", 18, y + 7);
  doc.text("Qty", 120, y + 7);
  doc.text("Rate", 145, y + 7);
  doc.text("Amount", 175, y + 7);
  y += 10;

  const rate = data.priceCents / 100;
  const freqMap: Record<string, number> = { weekly: 4, biweekly: 2, monthly: 1 };
  const visitsPerMonth = freqMap[data.frequency] || 4;

  // Row
  doc.setTextColor(...COLORS.dark);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const desc = `${data.plan} Plan — ${data.frequency} (${data.numDogs} dog${data.numDogs > 1 ? "s" : ""})`;
  doc.text(desc, 18, y + 7);
  doc.text(`${visitsPerMonth}`, 120, y + 7);
  doc.text(`$${rate.toFixed(2)}`, 145, y + 7);
  const total = rate * visitsPerMonth;
  doc.text(`$${total.toFixed(2)}`, 175, y + 7);
  doc.setDrawColor(230, 230, 230);
  doc.line(14, y + 10, 196, y + 10);
  y += 16;

  // Total
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(120, y, 76, 14, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Monthly Total:", 124, y + 9);
  doc.setTextColor(...COLORS.primary);
  doc.text(`$${total.toFixed(2)}`, 192, y + 9, { align: "right" });

  addFooter(doc);
  doc.save(`DukeOS-Invoice-${data.subscriptionId.slice(0, 8).toUpperCase()}.pdf`);
}

// ─── Yard Health Report PDF ───

interface YardHealthData {
  address: string;
  plan: string;
  frequency: string;
  numDogs: number;
  totalVisits: number;
  proofPhotos: number;
  issuesFound: number;
  issuesResolved: number;
  aiAnalysis: string;
  generatedAt: string;
}

export function generateYardHealthPDF(data: YardHealthData) {
  const doc = new jsPDF();
  let y = addHeader(doc, "YARD HEALTH REPORT");

  // Property info
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(14, y, 182, 20, 3, 3, "F");
  labelValue(doc, "Property", data.address, 20, y + 6);
  labelValue(doc, "Plan", `${data.plan} — ${data.frequency}`, 100, y + 6);
  labelValue(doc, "Dogs", `${data.numDogs}`, 170, y + 6);
  y += 28;

  // Metric cards
  const metrics = [
    { label: "Total Visits", value: `${data.totalVisits}` },
    { label: "Proof Photos", value: `${data.proofPhotos}` },
    { label: "Issues Found", value: `${data.issuesFound}` },
    { label: "Resolved", value: `${data.issuesResolved}` },
  ];
  const cardW = 42;
  metrics.forEach((m, i) => {
    const x = 14 + i * (cardW + 4);
    doc.setFillColor(240, 248, 240);
    doc.roundedRect(x, y, cardW, 20, 2, 2, "F");
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.primary);
    doc.text(m.value, x + cardW / 2, y + 10, { align: "center" });
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.text(m.label, x + cardW / 2, y + 17, { align: "center" });
  });
  y += 28;

  // AI Analysis
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.dark);
  doc.text("AI Analysis", 14, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);

  // Clean markdown and wrap text
  const cleanText = data.aiAnalysis
    .replace(/#{1,3}\s/g, "")
    .replace(/\*\*/g, "")
    .replace(/- /g, "• ");

  const lines = doc.splitTextToSize(cleanText, 178);
  const pageHeight = doc.internal.pageSize.getHeight();

  for (const line of lines) {
    if (y > pageHeight - 24) {
      addFooter(doc);
      doc.addPage();
      y = 20;
    }
    doc.text(line, 14, y);
    y += 4.5;
  }

  addFooter(doc);
  doc.save(`DukeOS-YardHealth-${new Date().toISOString().slice(0, 10)}.pdf`);
}

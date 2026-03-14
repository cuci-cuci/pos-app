import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

/**
 * Generate a PDF from a receipt HTML element and trigger download.
 * Uses html2canvas to render the receipt DOM to a canvas, then embeds in a PDF.
 */
export async function downloadReceiptPdf(
  receiptElement: HTMLElement,
  filename = 'struk',
): Promise<void> {
  const canvas = await html2canvas(receiptElement, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
  })

  const imgData = canvas.toDataURL('image/png')
  const imgWidth = 80 // mm (receipt width for thermal)
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [imgWidth, imgHeight + 10],
  })

  pdf.addImage(imgData, 'PNG', 0, 5, imgWidth, imgHeight)
  pdf.save(`${filename}.pdf`)
}

/**
 * Generate a receipt PDF and return as Blob for sharing.
 */
export async function getReceiptPdfBlob(
  receiptElement: HTMLElement,
): Promise<Blob> {
  const canvas = await html2canvas(receiptElement, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
  })

  const imgData = canvas.toDataURL('image/png')
  const imgWidth = 80
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [imgWidth, imgHeight + 10],
  })

  pdf.addImage(imgData, 'PNG', 0, 5, imgWidth, imgHeight)
  return pdf.output('blob')
}

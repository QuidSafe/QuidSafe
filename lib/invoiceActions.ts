import { Platform } from 'react-native';
import type { Invoice } from './types';
import { generateInvoiceHTML } from './invoicePdf';

export async function downloadInvoicePDF(invoice: Invoice, businessName?: string): Promise<void> {
  const html = generateInvoiceHTML(invoice, businessName);

  if (Platform.OS === 'web') {
    // Web: open in new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
    return;
  }

  // Native: use expo-print to generate PDF and expo-sharing to share
  try {
    const Print = await import('expo-print');
    const Sharing = await import('expo-sharing');
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Invoice - ${invoice.clientName}` });
    }
  } catch (error) {
    // Fallback: just print
    try {
      const Print = await import('expo-print');
      await Print.printAsync({ html });
    } catch {
      // Silent fail
    }
  }
}

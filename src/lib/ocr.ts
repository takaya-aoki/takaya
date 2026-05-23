import Tesseract from 'tesseract.js';

export interface ExtractedCardData {
  companyName: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  address: string;
  rawText: string;
}

export async function performOCR(imageData: string): Promise<ExtractedCardData> {
  const result = await Tesseract.recognize(imageData, 'jpn+eng', {
    logger: () => {},
  });

  const rawText = result.data.text;
  return parseBusinessCardText(rawText);
}

export function parseBusinessCardText(rawText: string): ExtractedCardData {
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  let companyName = '';
  let fullName = '';
  let phoneNumber = '';
  let email = '';
  let address = '';

  // Company name patterns (Japanese)
  const companyPatterns = [
    /(.{2,20}(?:株式会社|有限会社|合同会社|一般社団法人|公益財団法人|NPO法人|LLC|Inc\.|Ltd\.|Corp\.|Co\.,?\s*Ltd\.?))/,
    /(?:株式会社|有限会社|合同会社)\s*(.{2,20})/,
    /(.{2,20})\s*(?:株式会社|有限会社|合同会社)/,
  ];

  // Phone number patterns
  const phonePatterns = [
    /(?:携帯|Mobile|TEL|Tel|tel)[\s:：]*([0-9０-９]{2,4}[-－][0-9０-９]{4}[-－][0-9０-９]{4})/i,
    /(?:携帯|Mobile)[\s:：]*(\+?[0-9０-９\-－\s]{10,15})/i,
    /(0[789]0[-－]?\d{4}[-－]?\d{4})/,  // Mobile: 070/080/090
    /(0\d{1,4}[-－]\d{2,4}[-－]\d{4})/,   // Fixed line
  ];

  // Email pattern
  const emailPattern = /[\w.+-]+@[\w-]+\.[\w.]+/;

  // Address patterns
  const addressPatterns = [
    /〒?\d{3}[-－]\d{4}/,
    /[東西南北].+[都道府県]/,
  ];

  for (const line of lines) {
    // Extract email
    const emailMatch = line.match(emailPattern);
    if (emailMatch && !email) {
      email = emailMatch[0];
    }

    // Extract phone number - prioritize mobile numbers
    if (!phoneNumber) {
      for (const pattern of phonePatterns) {
        const match = line.match(pattern);
        if (match) {
          phoneNumber = match[1] || match[0];
          // Normalize full-width numbers
          phoneNumber = phoneNumber.replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
          phoneNumber = phoneNumber.replace(/[-－]/g, '-');
          break;
        }
      }
    }

    // Extract address
    if (!address) {
      for (const pattern of addressPatterns) {
        if (pattern.test(line)) {
          address = line;
          break;
        }
      }
    }
  }

  // Extract company name
  for (const line of lines) {
    if (companyName) break;
    for (const pattern of companyPatterns) {
      const match = line.match(pattern);
      if (match) {
        companyName = match[0].trim();
        break;
      }
    }
  }

  // Extract full name - Japanese names are typically 2-4 kanji characters
  // Look for lines that look like names (not company, not phone, not email, not address)
  for (const line of lines) {
    if (fullName) break;
    // Skip lines we already identified
    if (line === companyName || line === email || line === address) continue;
    if (line.match(emailPattern)) continue;
    if (line.match(/\d{3}/)) continue; // Skip lines with phone-like numbers
    if (line.match(/(?:株式会社|有限会社|合同会社)/)) continue;
    if (line.match(/〒|\d{3}[-－]\d{4}/)) continue;

    // Japanese name pattern: 2-6 kanji/hiragana characters (name)
    const japaneseNameMatch = line.match(/^([一-鿿぀-ゟ゠-ヿ]{2,6})\s*([一-鿿぀-ゟ゠-ヿ]{2,6})?$/);
    // Or romaji name
    const romajiNameMatch = line.match(/^([A-Z][a-z]+)\s+([A-Z][a-z]+)(?:\s+[A-Z][a-z]+)?$/);

    if (japaneseNameMatch && line.length <= 8) {
      fullName = line;
    } else if (romajiNameMatch) {
      fullName = line;
    }
  }

  return {
    companyName,
    fullName,
    phoneNumber,
    email,
    address,
    rawText,
  };
}

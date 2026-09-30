import { Expense } from '../types';
import { DEFAULT_FOYER_ID } from './foyerService';

export interface CsvRejection {
  rowNumber: number;
  reason: string;
  rawRow: string[];
}

export interface ValidatedCsvPayload {
  validExpenses: Expense[];
  rejections: CsvRejection[];
  totalRowsRead: number;
  detectedDelimiter: ',' | ';';
  rejectionSummary: Record<string, number>;
}

/**
 * Nettoie et valide un identifiant existant.
 */
function sanitizeOrGenerateId(rawId?: string): string {
  if (rawId && typeof rawId === 'string' && rawId.trim().length >= 3) {
    return rawId.trim();
  }
  return crypto.randomUUID();
}

/**
 * Convertit un montant quelconque (français avec virgule, espaces, devises, ou point) en number.
 */
export function parseAmount(raw: any): number | null {
  if (typeof raw === 'number' && !isNaN(raw) && isFinite(raw)) {
    return raw;
  }
  if (!raw || typeof raw !== 'string') return null;

  // Nettoyage des symboles de devises, espaces ordinaires et insécables
  let s = raw.trim().replace(/[€$£\s\u00A0\u202F]/g, '');
  if (!s) return null;

  // Détection du signe négatif
  let isNegative = false;
  if (s.startsWith('-') || (s.startsWith('(') && s.endsWith(')'))) {
    isNegative = true;
    s = s.replace(/[-()]/g, '');
  } else if (s.startsWith('+')) {
    s = s.slice(1);
  }

  // Gestion des séparateurs 1.234,50 vs 1,234.50 vs 12,50
  const commaIdx = s.lastIndexOf(',');
  const dotIdx = s.lastIndexOf('.');

  if (commaIdx > -1 && dotIdx > -1) {
    if (commaIdx > dotIdx) {
      // Format français : 1.234,50 -> 1234.50
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      // Format anglo-saxon : 1,234.50 -> 1234.50
      s = s.replace(/,/g, '');
    }
  } else if (commaIdx > -1) {
    // Format français simple : 12,50 -> 12.50
    s = s.replace(',', '.');
  }

  const num = parseFloat(s);
  if (isNaN(num) || !isFinite(num)) return null;

  return isNegative ? -num : num;
}

/**
 * Parse une date au format français (DD/MM/YYYY) ou standard ISO (YYYY-MM-DD).
 */
export function parseDate(raw: any): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const s = raw.trim();
  if (!s) return null;

  // Format français DD/MM/YYYY ou DD-MM-YYYY
  const dmyMatch = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const hour = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 12;
    const min = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0;
    const sec = dmyMatch[6] ? parseInt(dmyMatch[6], 10) : 0;

    const date = new Date(year, month, day, hour, min, sec);
    if (!isNaN(date.getTime()) && date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
      return date.toISOString();
    }
  }

  // Format ISO ou standard
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return d.toISOString();
  }

  return null;
}

/**
 * Parseur CSV conforme RFC 4180 gérant les guillemets, retours à la ligne et détection de séparateur.
 */
export function parseCSV(rawText: string): { rows: string[][]; detectedDelimiter: ',' | ';' } {
  // Suppression de l'éventuel BOM UTF-8 (\uFEFF)
  const text = rawText.startsWith('\uFEFF') ? rawText.slice(1) : rawText;

  // Détection du séparateur en dehors des guillemets sur la première ligne
  let detectedDelimiter: ',' | ';' = ';';
  let inQuotes = false;
  let semiCount = 0;
  let commaCount = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (!inQuotes) {
      if (char === ';') semiCount++;
      else if (char === ',') commaCount++;
      else if (char === '\n' || char === '\r') break;
    }
  }

  if (commaCount > semiCount) {
    detectedDelimiter = ',';
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        currentField += '"';
        i++; // Sauter l'échappement ""
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === detectedDelimiter && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && text[i + 1] === '\n') {
        i++;
      }
      currentRow.push(currentField.trim());
      currentField = '';
      if (currentRow.length > 0 && currentRow.some(c => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(c => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return { rows, detectedDelimiter };
}

/**
 * Normalise un nom de colonne pour correspondre aux synonymes sans accent ni caractère spécial.
 */
function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Parse et valide complètement un fichier CSV pour en extraire des dépenses nettoyées et assignées au foyer actif.
 */
export function parseAndValidateCsv(
  csvText: string,
  targetFoyerId: string = DEFAULT_FOYER_ID,
  options?: { fallbackUser?: string }
): ValidatedCsvPayload {
  const { rows, detectedDelimiter } = parseCSV(csvText);

  if (rows.length === 0) {
    return {
      validExpenses: [],
      rejections: [],
      totalRowsRead: 0,
      detectedDelimiter,
      rejectionSummary: {},
    };
  }

  const headers = rows[0].map(h => normalizeHeader(h));

  // Identification des index de colonnes
  const findIndex = (terms: string[]) =>
    headers.findIndex(h => terms.some(t => h.includes(t)));

  const dateIdx = findIndex(['date', 'jour', 'timestamp', 'createdat', 'quand']);
  const amountIdx = findIndex(['montant', 'prix', 'amount', 'total', 'somme', 'valeur']);
  const descIdx = findIndex(['description', 'titre', 'libelle', 'intitule', 'motif', 'designation', 'objet']);
  const catIdx = findIndex(['categor', 'rubrique', 'type']);
  const userIdx = findIndex(['user', 'utilisateur', 'membre', 'payeur', 'payepar', 'auteur', 'qui']);
  const storeIdx = findIndex(['magasin', 'enseigne', 'commerce', 'store', 'boutique', 'lieu']);
  const idIdx = findIndex(['id', 'identifiant', 'uuid']);

  const validExpenses: Expense[] = [];
  const rejections: CsvRejection[] = [];
  const rejectionSummary: Record<string, number> = {};

  const addRejection = (rowNumber: number, reason: string, rawRow: string[]) => {
    rejections.push({ rowNumber, reason, rawRow });
    rejectionSummary[reason] = (rejectionSummary[reason] || 0) + 1;
  };

  const totalRowsRead = rows.length - 1;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 1;

    // Ligne vide
    if (row.length === 0 || row.every(c => c.length === 0)) {
      continue;
    }

    // Extraction des champs bruts
    const rawDate = dateIdx !== -1 ? row[dateIdx] : null;
    const rawAmount = amountIdx !== -1 ? row[amountIdx] : null;
    const rawDesc = descIdx !== -1 ? row[descIdx] : null;
    const rawCat = catIdx !== -1 ? row[catIdx] : null;
    const rawUser = userIdx !== -1 ? row[userIdx] : (options?.fallbackUser || null);
    const rawStore = storeIdx !== -1 ? row[storeIdx] : null;
    const rawId = idIdx !== -1 ? row[idIdx] : undefined;

    // 1. Validation du montant
    const amount = parseAmount(rawAmount);
    if (amount === null) {
      addRejection(rowNumber, 'Montant numérique manquant ou invalide', row);
      continue;
    }

    // 2. Validation de la date
    const date = parseDate(rawDate);
    if (!date) {
      addRejection(rowNumber, 'Date manquante ou invalide', row);
      continue;
    }

    // 3. Validation de la description
    let desc = typeof rawDesc === 'string' ? rawDesc.trim() : '';
    if (!desc) {
      addRejection(rowNumber, 'Description manquante', row);
      continue;
    }

    // Ajout du magasin dans la description si présent et non redondant
    if (rawStore && typeof rawStore === 'string' && rawStore.trim()) {
      const storeTrimmed = rawStore.trim();
      if (!desc.toLowerCase().includes(storeTrimmed.toLowerCase())) {
        desc = `${desc} (${storeTrimmed})`;
      }
    }

    // 4. Validation de l'utilisateur
    const user = typeof rawUser === 'string' ? rawUser.trim() : '';
    if (!user) {
      addRejection(rowNumber, 'Utilisateur manquant', row);
      continue;
    }

    // 5. Catégorie par défaut 'Divers'
    const category = typeof rawCat === 'string' && rawCat.trim() ? rawCat.trim() : 'Divers';

    // 6. Exclusion stricte de tout champ sensible et assignation au foyer actif
    validExpenses.push({
      id: sanitizeOrGenerateId(rawId),
      description: desc,
      amount,
      date,
      user,
      category,
      foyer_id: targetFoyerId,
      created_at: new Date().toISOString(),
    });
  }

  return {
    validExpenses,
    rejections,
    totalRowsRead,
    detectedDelimiter,
    rejectionSummary,
  };
}

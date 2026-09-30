import {
  getCalendarDateParts,
  getExpenseYear,
  getExpenseMonth,
  getExpenseDay,
  getExpenseMonthKey,
  getExpenseCalendarKey,
  isExpenseInMonth,
  isExpenseInYear,
  isExpenseBeforeMonth,
  formatDateFrench,
  formatDateForInput,
  formatDateTimeLocalForInput,
  toStoredExpenseDate,
} from '../utils/dateUtils';
import { parseDate } from '../utils/csvImportValidator';

let totalTests = 0;
let passedTests = 0;

function assert(description: string, condition: boolean) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ [PASS] ${description}`);
  } else {
    console.error(`❌ [FAIL] ${description}`);
  }
}

console.log("=== VÉRIFICATION DE L'UNIFORMISATION DES DATES (FUSEAU FRANÇAIS) ===");

// 1. Dépense saisie le 30 septembre à 23h59 à Paris (heure d'été UTC+2 -> 21h59 UTC)
{
  const isoUtcSummer = "2026-09-30T21:59:00.000Z";
  const parts = getCalendarDateParts(isoUtcSummer);

  assert("1a. 21h59 UTC en été est bien le 30 septembre à Paris", parts.year === 2026 && parts.month === 8 && parts.day === 30);
  assert("1b. Heure Paris 23h59", parts.hour === 23 && parts.minute === 59);
  assert("1c. Appartient au mois de septembre (mois 8)", isExpenseInMonth(isoUtcSummer, 2026, 8));
  assert("1d. N'appartient PAS au mois d'octobre", !isExpenseInMonth(isoUtcSummer, 2026, 9));
  assert("1e. Clé de mois '2026-09'", getExpenseMonthKey(isoUtcSummer) === "2026-09");
  assert("1f. Clé calendaire '2026-09-30'", getExpenseCalendarKey(isoUtcSummer) === "2026-09-30");
  assert("1g. getExpenseYear direct", getExpenseYear(isoUtcSummer) === 2026);
  assert("1h. getExpenseMonth direct", getExpenseMonth(isoUtcSummer) === 8);
  assert("1i. getExpenseDay direct", getExpenseDay(isoUtcSummer) === 30);
}

// 2. Dépense saisie le 1er octobre à 00h01 à Paris (heure d'été UTC+2 -> 30 sept 22h01 UTC)
{
  const isoUtcMidnight = "2026-09-30T22:01:00.000Z";
  const parts = getCalendarDateParts(isoUtcMidnight);

  assert("2a. 22h01 UTC le 30 sept est bien le 1er OCTOBRE à Paris", parts.year === 2026 && parts.month === 9 && parts.day === 1);
  assert("2b. Heure Paris 00h01", parts.hour === 0 && parts.minute === 1);
  assert("2c. Appartient bien au mois d'OCTOBRE (mois 9)", isExpenseInMonth(isoUtcMidnight, 2026, 9));
  assert("2d. N'appartient PAS à septembre", !isExpenseInMonth(isoUtcMidnight, 2026, 8));
  assert("2e. Clé de mois '2026-10'", getExpenseMonthKey(isoUtcMidnight) === "2026-10");
  assert("2f. Clé calendaire '2026-10-01'", getExpenseCalendarKey(isoUtcMidnight) === "2026-10-01");
}

// 3. Changement d'heure été/hiver (fin octobre : UTC+2 vers UTC+1)
{
  // En hiver (ex: 15 décembre), Paris est UTC+1
  const winterEvening = "2026-12-31T23:30:00.000Z"; // 23h30 UTC le 31 déc = 00h30 le 1er JANVIER 2027 à Paris
  const winterParts = getCalendarDateParts(winterEvening);

  assert("3a. 23h30 UTC le 31 déc devient le 1er janvier 2027 à Paris", winterParts.year === 2027 && winterParts.month === 0 && winterParts.day === 1);
  assert("3b. Appartient à l'année 2027", isExpenseInYear(winterEvening, 2027));
  assert("3c. N'appartient plus à l'année 2026", !isExpenseInYear(winterEvening, 2026));
}

// 4. Date CSV au format DD/MM/YYYY
{
  const csvDate = parseDate("15/03/2026");
  assert("4a. Date CSV convertie en ISO non null", csvDate !== null);
  if (csvDate) {
    const parts = getCalendarDateParts(csvDate);
    assert("4b. Jour 15 extrait", parts.day === 15);
    assert("4c. Mois de mars (2) extrait", parts.month === 2);
    assert("4d. Année 2026 extraite", parts.year === 2026);
    assert("4e. Formatage français correct", formatDateFrench(csvDate) === "15 mars 2026");
  }
}

// 5. Date pure formulaire 'YYYY-MM-DD' (garantie d'absence de décalage)
{
  const formDate = "2026-10-01";
  const parts = getCalendarDateParts(formDate);

  assert("5a. Date brute YYYY-MM-DD garde son jour 1", parts.day === 1);
  assert("5b. Date brute YYYY-MM-DD garde son mois octobre (9)", parts.month === 9);
  assert("5c. Date brute YYYY-MM-DD garde son année 2026", parts.year === 2026);
  assert("5d. Clé calendaire reste '2026-10-01'", getExpenseCalendarKey(formDate) === "2026-10-01");
}

// 6. Formatage pour les formulaires (<input type="date"> et <input type="datetime-local">)
{
  const testIso = "2026-05-14T08:45:00.000Z";
  assert("6a. formatDateForInput renvoie YYYY-MM-DD", /^\d{4}-\d{2}-\d{2}$/.test(formatDateForInput(testIso)));
  assert("6b. formatDateTimeLocalForInput renvoie YYYY-MM-DDTHH:mm", /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(formatDateTimeLocalForInput(testIso)));
}

// 7. Comparaison mensuelle et antériorité
{
  const marchExpense = "2026-03-15T10:00:00.000Z";
  const aprilExpense = "2026-04-02T10:00:00.000Z";

  assert("7a. Mars 2026 est avant Avril 2026", isExpenseBeforeMonth(marchExpense, 2026, 3));
  assert("7b. Avril 2026 n'est pas avant Avril 2026", !isExpenseBeforeMonth(aprilExpense, 2026, 3));
}

// 8. Conversion toStoredExpenseDate
{
  const stored1 = toStoredExpenseDate("2026-09-30");
  assert("8a. YYYY-MM-DD stocké à midi UTC pour immunité fuseaux", stored1 === "2026-09-30T12:00:00.000Z");
  assert("8b. La date stockée résout au 30 septembre à Paris", getCalendarDateParts(stored1).day === 30 && getCalendarDateParts(stored1).month === 8);
}

console.log(`\nRésultats : ${passedTests}/${totalTests} tests réussis.`);
if (passedTests !== totalTests) {
  process.exit(1);
}

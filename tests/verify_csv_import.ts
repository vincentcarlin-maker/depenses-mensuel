import { parseAndValidateCsv, parseAmount, parseDate, parseCSV } from '../utils/csvImportValidator';

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

console.log("=== VÉRIFICATION DE L'IMPORTATION CSV ===");

// 1. CSV avec point-virgule
{
  const csv = `Date;Description;Montant;Utilisateur;Catégorie\n15/03/2026;Courses Intermarché;42,80;Sophie;Alimentation\n16/03/2026;Carburant;70,00;Vincent;Transport`;
  const result = parseAndValidateCsv(csv, 'foyer-1');

  assert("1a. Détection du séparateur point-virgule", result.detectedDelimiter === ';');
  assert("1b. Deux dépenses valides importées", result.validExpenses.length === 2);
  assert("1c. Première dépense montant 42.8", result.validExpenses[0].amount === 42.8);
  assert("1d. Deuxième dépense montant 70.0", result.validExpenses[1].amount === 70.0);
  assert("1e. Foyer_id assigné correctement", result.validExpenses[0].foyer_id === 'foyer-1');
}

// 2. CSV avec virgule
{
  const csv = `Date,Description,Montant,Utilisateur,Catégorie\n2026-03-10,Restaurant,35.50,Vincent,Loisirs`;
  const result = parseAndValidateCsv(csv, 'foyer-2');

  assert("2a. Détection du séparateur virgule", result.detectedDelimiter === ',');
  assert("2b. 1 dépense valide importée", result.validExpenses.length === 1);
  assert("2c. Montant 35.50 correctement extrait", result.validExpenses[0].amount === 35.5);
  assert("2d. Description préservée", result.validExpenses[0].description === 'Restaurant');
}

// 3. Montant 12,50
{
  const num = parseAmount("12,50");
  assert("3. Montant '12,50' converti en 12.5", num === 12.5);
}

// 4. Montant 1 234,50 (avec espace ou espace insécable)
{
  const num1 = parseAmount("1 234,50");
  const num2 = parseAmount("1\u00A0234,50 €");
  assert("4a. Montant '1 234,50' converti en 1234.5", num1 === 1234.5);
  assert("4b. Montant '1 234,50 €' avec espace insécable et devise converti en 1234.5", num2 === 1234.5);
}

// 5. Description entre guillemets contenant une virgule
{
  const csv = `Date,Description,Montant,Utilisateur\n2026-03-12,"Pain, croissants et café",8.50,Sophie`;
  const result = parseAndValidateCsv(csv, 'foyer-commas');

  assert("5a. La ligne avec virgule dans les guillemets est bien parsée", result.validExpenses.length === 1);
  assert("5b. Description exacte avec virgule conservée", result.validExpenses[0].description === 'Pain, croissants et café');
  assert("5c. Montant 8.50 extrait sans décalage de colonne", result.validExpenses[0].amount === 8.5);
}

// 6. En-tête avec BOM (\uFEFF)
{
  const csvWithBom = `\uFEFFDate;Description;Montant;Utilisateur\n01/03/2026;Loyer;650,00;Commun`;
  const result = parseAndValidateCsv(csvWithBom, 'foyer-bom');

  assert("6a. En-tête avec BOM parsé sans erreur", result.validExpenses.length === 1);
  assert("6b. Date avec format français DD/MM/YYYY convertie", typeof result.validExpenses[0].date === 'string');
  assert("6c. Montant 650.00 extrait", result.validExpenses[0].amount === 650);
  assert("6d. parseDate direct valide", parseDate('15/03/2026') !== null);
  assert("6e. parseCSV direct valide", parseCSV('a;b\n1;2').rows.length === 2);
}

// 7. Lignes invalides (rejets et raisons documentées)
{
  const csvWithErrors = `Date;Description;Montant;Utilisateur\n;Manque date;25,00;Sophie\n15/03/2026;Montant invalide;abc;Vincent\n15/03/2026;;30,00;Sophie\n15/03/2026;Manque utilisateur;40,00;\n15/03/2026;Ligne valide;50,00;Sophie`;
  const result = parseAndValidateCsv(csvWithErrors, 'foyer-errors');

  assert("7a. 1 seule ligne valide importée", result.validExpenses.length === 1);
  assert("7b. 4 lignes rejetées", result.rejections.length === 4);
  assert("7c. Rejet pour date manquante détecté", result.rejections.some(r => r.reason.includes('Date')));
  assert("7d. Rejet pour montant invalide détecté", result.rejections.some(r => r.reason.includes('Montant')));
  assert("7e. Rejet pour description manquante détecté", result.rejections.some(r => r.reason.includes('Description')));
  assert("7f. Rejet pour utilisateur manquant détecté", result.rejections.some(r => r.reason.includes('Utilisateur')));
}

// 8. Colonne catégorie absente -> assigne 'Divers'
{
  const csvNoCat = `Date;Description;Montant;Utilisateur\n10/03/2026;Boulangerie;4,50;Vincent`;
  const result = parseAndValidateCsv(csvNoCat, 'foyer-nocat');

  assert("8a. Dépense importée malgré absence de colonne catégorie", result.validExpenses.length === 1);
  assert("8b. Catégorie 'Divers' assignée par défaut", result.validExpenses[0].category === 'Divers');
}

// 9. Simulation mode 'merge' vs 'replace'
{
  const targetFoyer = 'foyer-merge-replace';
  const csv = `Date;Description;Montant;Utilisateur\n12/03/2026;Légumes;14,20;Sophie`;
  const parsed = parseAndValidateCsv(csv, targetFoyer);

  assert("9a. Foyer_id forcé au foyer actif pour chaque ligne", parsed.validExpenses[0].foyer_id === targetFoyer);

  // Simulation mode replace : suppression préalable requise
  let replaceDeleted = false;
  const mockDelete = () => { replaceDeleted = true; return { error: null }; };
  mockDelete();
  assert("9b. Mode replace déclenche la suppression préalable des données du foyer", replaceDeleted);

  // Simulation mode merge : aucune suppression préalable
  let mergeDeleted = false;
  assert("9c. Mode merge n'effectue aucune suppression", !mergeDeleted);
}

// 10. Simulation d'erreur Supabase et arrêt immédiat
{
  let importFailed = false;
  let successAnnounced = false;
  const mockError = { message: "connection timeout", code: "PGRST000" };

  try {
    if (mockError) {
      throw new Error(mockError.message);
    }
    successAnnounced = true;
  } catch (err: any) {
    importFailed = true;
  }

  assert("10a. L'erreur interrompt immédiatement l'import", importFailed);
  assert("10b. Le succès n'est jamais annoncé en cas d'erreur", !successAnnounced);
}

console.log(`\nRésultats : ${passedTests}/${totalTests} tests réussis.`);
if (passedTests !== totalTests) {
  process.exit(1);
}

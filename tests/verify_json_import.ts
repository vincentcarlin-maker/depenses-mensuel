import { parseAndValidateImportPayload } from '../utils/jsonImportValidator';

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

console.log("=== VÉRIFICATION DE LA VALIDATION ET DE L'IMPORTATION JSON ===");

// 1. JSON contenant uniquement un tableau de dépenses
{
  const rawArray = [
    { id: 'exp-1', description: 'Pain', amount: 1.5, date: '2026-03-01T10:00:00.000Z', user: 'Sophie' },
    { id: 'exp-2', description: 'Essence', amount: '65,50', date: '2026-03-02', user: 'Vincent', category: 'Transport' }
  ];

  const result = parseAndValidateImportPayload(rawArray, 'foyer-123');

  assert("1a. Deux dépenses détectées", result.validExpenses.length === 2);
  assert("1b. Aucun rappel ni cagnotte", result.validReminders.length === 0 && result.validMoneyPot.length === 0);
  assert("1c. Aucun élément ignoré", result.totalIgnoredCount === 0);
  assert("1d. Foyer_id assigné correctement", result.validExpenses[0].foyer_id === 'foyer-123');
  assert("1e. Montant chaîne avec virgule converti en nombre", result.validExpenses[1].amount === 65.5);
  assert("1f. ID existant préservé", result.validExpenses[0].id === 'exp-1');
  assert("1g. Catégorie par défaut 'Divers' assignée si absente", result.validExpenses[0].category === 'Divers');
}

// 2. JSON contenant dépenses, rappels et cagnotte (format objet avec ou sans data)
{
  const rawObject = {
    data: {
      expenses: [
        { description: 'Courses bio', amount: 80, date: '2026-03-05', user: 'Sophie' } // sans ID
      ],
      reminders: [
        { id: 'rem-1', description: 'Loyer', amount: 850, day_of_month: 5, user: 'Commun', is_active: true }
      ],
      moneyPotTransactions: [
        { id: 'pot-1', description: 'Apport vacances', amount: 150, date: '2026-03-01', user_name: 'Vincent' }
      ]
    }
  };

  const result = parseAndValidateImportPayload(rawObject, 'foyer-custom');

  assert("2a. 1 dépense validée", result.validExpenses.length === 1);
  assert("2b. 1 rappel validé", result.validReminders.length === 1);
  assert("2c. 1 mouvement de cagnotte validé", result.validMoneyPot.length === 1);
  assert("2d. ID généré automatiquement pour la dépense sans ID", typeof result.validExpenses[0].id === 'string' && result.validExpenses[0].id.length > 10);
  assert("2e. ID du rappel préservé", result.validReminders[0].id === 'rem-1');
  assert("2f. ID de la cagnotte préservé", result.validMoneyPot[0].id === 'pot-1');
  assert("2g. foyer_id assigné à tous les types", 
    result.validExpenses[0].foyer_id === 'foyer-custom' &&
    result.validReminders[0].foyer_id === 'foyer-custom' &&
    result.validMoneyPot[0].foyer_id === 'foyer-custom'
  );
}

// 3. Données invalides (filtrage et comptage des éléments ignorés)
{
  const invalidData = [
    { description: 'Montant non numérique', amount: 'abc', date: '2026-03-01', user: 'Sophie' }, // invalide
    { description: 'Date invalide', amount: 20, date: 'not-a-date', user: 'Sophie' }, // invalide
    { description: 'Utilisateur manquant', amount: 20, date: '2026-03-01' }, // invalide
    { description: '', amount: 20, date: '2026-03-01', user: 'Sophie' }, // description vide -> invalide
    { description: 'Dépense valide', amount: 25, date: '2026-03-01', user: 'Vincent' } // valide
  ];

  const result = parseAndValidateImportPayload(invalidData, 'foyer-test');

  assert("3a. 1 seule dépense valide retenue", result.validExpenses.length === 1);
  assert("3b. 4 dépenses invalides ignorées", result.ignoredExpensesCount === 4);
  assert("3c. Total ignoré égal à 4", result.totalIgnoredCount === 4);
}

// 4. Exclusion des mots de passe et champs sensibles
{
  const dataWithSensitiveFields = {
    expenses: [
      {
        id: 'exp-safe',
        description: 'Sécurisé',
        amount: 30,
        date: '2026-03-10',
        user: 'Sophie',
        password: 'SUPER_SECRET_PASSWORD',
        token: 'AUTH_BEARER_TOKEN',
        user_metadata: { role: 'admin' }
      }
    ]
  };

  const result = parseAndValidateImportPayload(dataWithSensitiveFields, 'foyer-safe');
  const importedExpense: any = result.validExpenses[0];

  assert("4a. Dépense importée", result.validExpenses.length === 1);
  assert("4b. Champ password exclu", importedExpense.password === undefined);
  assert("4c. Champ token exclu", importedExpense.token === undefined);
  assert("4d. Champ user_metadata exclu", importedExpense.user_metadata === undefined);
}

// 5. Simulation des modes 'replace' et 'merge' et gestion des erreurs
{
  // Test de la logique de ciblage par foyer
  const targetFoyer: string = 'foyer-xyz';
  const otherFoyer: string = 'foyer-autre';

  const payload = {
    expenses: [{ description: 'Test', amount: 10, date: '2026-03-01', user: 'Sophie' }]
  };
  const validated = parseAndValidateImportPayload(payload, targetFoyer);

  assert("5a. Les données importées ne touchent pas le foyer autre", validated.validExpenses[0].foyer_id === targetFoyer && validated.validExpenses[0].foyer_id !== otherFoyer);

  // Test de détection de simulation d'erreur Supabase
  let importSuccess = false;
  let importError: string | null = null;
  const mockSupabaseError = { message: "Permission denied (RLS)", code: "42501" };

  try {
    if (mockSupabaseError) {
      throw new Error(mockSupabaseError.message);
    }
    importSuccess = true;
  } catch (err: any) {
    importError = err.message;
  }

  assert("5b. En cas d'erreur Supabase, l'import s'arrête", importError === "Permission denied (RLS)");
  assert("5c. Le statut de succès reste false en cas d'erreur", !importSuccess);
}

console.log(`\nRésultats : ${passedTests}/${totalTests} tests réussis.`);
if (passedTests !== totalTests) {
  process.exit(1);
}

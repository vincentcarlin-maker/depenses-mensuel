import {
  getMoneyPotImpactForAdd,
  getMoneyPotImpactForDelete,
  getMoneyPotImpactForUpdate,
  getMoneyPotImpactForUndoDelete,
  getMoneyPotImpactForUndoUpdate,
} from '../utils/moneyPotUtils';
import { User } from '../types';

let totalTests = 0;
let passedTests = 0;

function assertEqual(testName: string, actual: number | null, expected: number | null) {
  totalTests++;
  const passed = actual === expected;
  if (passed) {
    passedTests++;
    console.log(`✅ [PASS] ${testName}: ${actual} === ${expected}`);
  } else {
    console.error(`❌ [FAIL] ${testName}: attendu ${expected}, obtenu ${actual}`);
  }
}

console.log("=== VÉRIFICATION DU SENS DES OPÉRATIONS DE CAGNOTTE COMMUNE ===");

// 1. Dépense Commun de +100 € -> cagnotte -100 €
assertEqual(
  "1. Dépense Commun +100 €",
  getMoneyPotImpactForAdd({ user: User.Commun, amount: 100 }),
  -100
);

// 2. Rentrée / Remboursement Commun de -20 € -> cagnotte +20 €
assertEqual(
  "2. Rentrée / Remboursement Commun -20 €",
  getMoneyPotImpactForAdd({ user: User.Commun, amount: -20 }),
  20
);

// 3. Suppression d'une dépense Commun
// - Dépense de +100 € supprimée -> cagnotte +100 €
assertEqual(
  "3a. Suppression dépense Commun +100 €",
  getMoneyPotImpactForDelete({ user: User.Commun, amount: 100 }),
  100
);
// - Opération de -20 € supprimée -> cagnotte -20 €
assertEqual(
  "3b. Suppression remboursement Commun -20 €",
  getMoneyPotImpactForDelete({ user: User.Commun, amount: -20 }),
  -20
);

// 4. Modification du montant d'une dépense Commun
// - 100 € vers 150 € : opération de -50 €
assertEqual(
  "4a. Modification 100 € vers 150 €",
  getMoneyPotImpactForUpdate(
    { user: User.Commun, amount: 100 },
    { user: User.Commun, amount: 150 }
  ),
  -50
);

// - 100 € vers 80 € : opération de +20 €
assertEqual(
  "4b. Modification 100 € vers 80 €",
  getMoneyPotImpactForUpdate(
    { user: User.Commun, amount: 100 },
    { user: User.Commun, amount: 80 }
  ),
  20
);

// - -20 € vers -30 € : opération de +10 €
assertEqual(
  "4c. Modification -20 € vers -30 €",
  getMoneyPotImpactForUpdate(
    { user: User.Commun, amount: -20 },
    { user: User.Commun, amount: -30 }
  ),
  10
);

// 5. Annulation d'une modification
// - Annuler 100 -> 150 (doit annuler le -50 € -> +50 €)
assertEqual(
  "5a. Annulation modification 100 € -> 150 €",
  getMoneyPotImpactForUndoUpdate(
    { user: User.Commun, amount: 100 },
    { user: User.Commun, amount: 150 }
  ),
  50
);

// - Annuler 100 -> 80 (doit annuler le +20 € -> -20 €)
assertEqual(
  "5b. Annulation modification 100 € -> 80 €",
  getMoneyPotImpactForUndoUpdate(
    { user: User.Commun, amount: 100 },
    { user: User.Commun, amount: 80 }
  ),
  -20
);

// - Annuler -20 -> -30 (doit annuler le +10 € -> -10 €)
assertEqual(
  "5c. Annulation modification -20 € -> -30 €",
  getMoneyPotImpactForUndoUpdate(
    { user: User.Commun, amount: -20 },
    { user: User.Commun, amount: -30 }
  ),
  -10
);

// 6. Annulation d'une suppression
// - Annuler suppression +100 € -> cagnotte -100 €
assertEqual(
  "6a. Annulation suppression dépense +100 €",
  getMoneyPotImpactForUndoDelete({ user: User.Commun, amount: 100 }),
  -100
);

// - Annuler suppression remboursement -20 € -> cagnotte +20 €
assertEqual(
  "6b. Annulation suppression remboursement -20 €",
  getMoneyPotImpactForUndoDelete({ user: User.Commun, amount: -20 }),
  20
);

// 7. Non-régression pour Sophie et Vincent (aucun impact sur la cagnotte)
assertEqual(
  "7a. Dépense Sophie",
  getMoneyPotImpactForAdd({ user: User.Sophie, amount: 100 }),
  null
);
assertEqual(
  "7b. Dépense Vincent",
  getMoneyPotImpactForDelete({ user: User.Vincent, amount: 100 }),
  null
);
assertEqual(
  "7c. Modification Sophie -> Vincent",
  getMoneyPotImpactForUpdate(
    { user: User.Sophie, amount: 100 },
    { user: User.Vincent, amount: 100 }
  ),
  null
);

console.log(`\nRésultat : ${passedTests}/${totalTests} tests réussis.`);
if (passedTests !== totalTests) {
  process.exit(1);
}

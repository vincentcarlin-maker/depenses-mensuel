import { DeletionQueue } from '../utils/deletionQueue';

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

console.log("=== VÉRIFICATION DU GESTIONNAIRE DE SUPPRESSIONS RAPIDES ET ANNULATIONS ===");

// 1. Une seule suppression
{
  const queue = new DeletionQueue();
  const exp = { id: 'exp-1', description: 'Pain', amount: 1.2 };
  const actionId = 'act-1';

  const enqueued = queue.enqueueDelete(actionId, exp);
  assert("1a. Une seule suppression est acceptée", enqueued);
  assert("1b. L'action est en attente", queue.isActionPending(actionId));
  assert("1c. La dépense est verrouillée", queue.isExpensePending(exp.id));

  const executed = queue.executeDelete(actionId);
  assert("1d. La suppression est exécutée en base", executed);
  assert("1e. Une seule écriture en base enregistrée", queue.getExecutedDbWrites().length === 1 && queue.getExecutedDbWrites()[0] === 'exp-1');
  assert("1f. La dépense n'est plus verrouillée après exécution", !queue.isExpensePending(exp.id));
}

// 2. Deux suppressions rapides
{
  const queue = new DeletionQueue();
  const exp1 = { id: 'exp-1', description: 'Courses', amount: 45 };
  const exp2 = { id: 'exp-2', description: 'Essence', amount: 60 };

  const act1Enqueued = queue.enqueueDelete('act-1', exp1);
  const act2Enqueued = queue.enqueueDelete('act-2', exp2);

  assert("2a. Première suppression rapide acceptée", act1Enqueued);
  assert("2b. Deuxième suppression rapide acceptée", act2Enqueued);
  assert("2c. Deux actions indépendantes sont en attente", queue.getPendingActions().length === 2);

  // Exécution de la première
  const act1Exec = queue.executeDelete('act-1');
  assert("2d. Première action exécutée indépendamment", act1Exec);
  assert("2e. Deuxième action toujours en attente", queue.isActionPending('act-2'));

  // Exécution de la deuxième
  const act2Exec = queue.executeDelete('act-2');
  assert("2f. Deuxième action exécutée indépendamment", act2Exec);
  assert("2g. Les deux écritures sont enregistrées en base", queue.getExecutedDbWrites().length === 2);
}

// 3. Suppression puis annulation
{
  const queue = new DeletionQueue();
  const exp = { id: 'exp-1', description: 'Restaurant', amount: 35 };
  const actionId = 'act-1';

  queue.enqueueDelete(actionId, exp);
  const cancelled = queue.cancel(actionId);

  assert("3a. L'action est annulée avec succès", cancelled !== null && cancelled.id === actionId);
  assert("3b. L'action n'est plus en attente", !queue.isActionPending(actionId));
  assert("3c. Le verrou de la dépense est libéré", !queue.isExpensePending(exp.id));

  // Tenter d'exécuter l'écriture en base après annulation
  const executed = queue.executeDelete(actionId);
  assert("3d. L'écriture en base est bloquée si annulée", !executed);
  assert("3e. Aucune écriture en base n'a eu lieu", queue.getExecutedDbWrites().length === 0);
}

// 4. Deux suppressions puis annulation de la seconde
{
  const queue = new DeletionQueue();
  const exp1 = { id: 'exp-1', description: 'Pharmacie', amount: 15 };
  const exp2 = { id: 'exp-2', description: 'Boulangerie', amount: 4 };

  queue.enqueueDelete('act-1', exp1);
  queue.enqueueDelete('act-2', exp2);

  // Annuler la deuxième
  const cancelled2 = queue.cancel('act-2');
  assert("4a. Seule la 2e action est annulée", cancelled2 !== null && cancelled2.id === 'act-2');
  assert("4b. La 1ère action reste en attente", queue.isActionPending('act-1'));
  assert("4c. La 2e action n'est plus en attente", !queue.isActionPending('act-2'));

  // Exécution du timer de la 1ère
  const exec1 = queue.executeDelete('act-1');
  assert("4d. La 1ère suppression est enregistrée en base", exec1);

  // Exécution du timer éventuel de la 2e
  const exec2 = queue.executeDelete('act-2');
  assert("4e. La 2e suppression n'est PAS enregistrée en base", !exec2);

  const writes = queue.getExecutedDbWrites();
  assert("4f. Exactement 1 seule écriture en base (exp-1)", writes.length === 1 && writes[0] === 'exp-1');
}

// 5. Double clic sur Supprimer
{
  const queue = new DeletionQueue();
  const exp = { id: 'exp-double', description: 'Cadeau', amount: 50 };

  const firstClick = queue.enqueueDelete('act-click-1', exp);
  const secondClick = queue.enqueueDelete('act-click-2', exp); // Même exp.id !

  assert("5a. Premier clic accepté", firstClick);
  assert("5b. Deuxième clic consécutif refusé (anti-double-clic)", !secondClick);
  assert("5c. Une seule action en attente", queue.getPendingActions().length === 1);

  queue.executeDelete('act-click-1');
  assert("5d. Une seule écriture en base après double clic", queue.getExecutedDbWrites().length === 1);
}

// 6. Vérification qu'une seule écriture est faite par dépense même en cas de multi-appel execute
{
  const queue = new DeletionQueue();
  const exp = { id: 'exp-multi', description: 'Cinéma', amount: 22 };

  queue.enqueueDelete('act-multi', exp);
  const firstExec = queue.executeDelete('act-multi');
  const secondExec = queue.executeDelete('act-multi'); // Rappel accidentel

  assert("6a. Première exécution autorisée", firstExec);
  assert("6b. Deuxième exécution bloquée (idempotence)", !secondExec);
  assert("6c. Une seule écriture en base enregistrée", queue.getExecutedDbWrites().length === 1);
}

console.log(`\nRésultats : ${passedTests}/${totalTests} tests réussis.`);
if (passedTests !== totalTests) {
  process.exit(1);
}

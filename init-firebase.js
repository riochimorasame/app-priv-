// ══════════════════════════════════════════════════════════════
// SCRIPT D'INITIALISATION — InvestPro Firebase
// À exécuter UNE SEULE FOIS dans la console de ton navigateur
// (sur la page de l'app déjà connectée) OU via Node.js
//
// Prérequis : être connecté à Firebase Auth dans l'appli
// ══════════════════════════════════════════════════════════════
//
// USAGE dans la console du navigateur :
//   1. Ouvre ton appli InvestPro
//   2. Connecte-toi avec ton compte
//   3. Ouvre les DevTools > Console
//   4. Colle ce script et appuie sur Entrée
//
// USAGE Node.js (Firebase Admin SDK) :
//   npm install firebase-admin
//   node init-firebase.js
// ══════════════════════════════════════════════════════════════

// ─── VERSION NAVIGATEUR (compat SDK v9) ───────────────────────
// Ce bloc utilise les variables `db` et `uid` déjà disponibles
// dans l'appli InvestPro après login.

async function initFirebaseCollections() {
  if (typeof db === 'undefined' || typeof uid === 'undefined') {
    console.error('❌ db ou uid non disponibles. Assure-toi d\'être connecté dans l\'appli.');
    return;
  }

  console.log('🔥 Démarrage de l\'initialisation des collections Firebase...');

  // ── Schémas des collections ──────────────────────────────────

  const COLLECTIONS = {

    // Collection : assets
    // Représente les actifs du portefeuille
    assets: {
      schema: {
        sym:    'string — symbole court (ex: "ETI")',
        name:   'string — nom complet (ex: "Ecobank (ETI)")',
        type:   'string — catégorie ("Action BRVM" | "Obligation d\'État" | "Immobilier")',
        color:  'string — couleur hex pour les graphiques',
        value:  'number — valeur actuelle en F CFA',
        cost:   'number — coût d\'acquisition total en F CFA',
        change: 'number — variation en % (peut être négatif)',
      },
      sampleDocs: [
        { sym:'ETI', name:'Ecobank (ETI)',  type:'Action BRVM',       color:'#60a5fa', value:680000, cost:646000, change:5.2  },
        { sym:'SON', name:'Sonatel',        type:'Action BRVM',       color:'#4ade80', value:520000, cost:463500, change:12.1 },
        { sym:'OCI', name:'Orange CI',      type:'Action BRVM',       color:'#fbbf24', value:410000, cost:415740, change:-1.4 },
        { sym:'TG',  name:'Bon du Trésor',  type:"Obligation d'État", color:'#a78bfa', value:500000, cost:500000, change:0    },
        { sym:'IMM', name:'Terrain Tokoin', type:'Immobilier',        color:'#94a3b8', value:340000, cost:288000, change:18   },
      ]
    },

    // Collection : transactions
    // Historique de toutes les opérations financières
    transactions: {
      schema: {
        type:   'string — "buy" | "sell" | "div" | "dep"',
        asset:  'string — nom de l\'actif concerné',
        amount: 'number — montant en F CFA (toujours positif)',
        qty:    'number — quantité d\'unités (0 si non applicable)',
        date:   'string — date ISO "YYYY-MM-DD"',
        note:   'string — commentaire libre',
      },
      sampleDocs: [
        { type:'buy',  asset:'Ecobank (ETI)', amount:646000, qty:10, date:'2025-11-15', note:'Position initiale'            },
        { type:'dep',  asset:'Dépôt initial', amount:500000, qty:0,  date:'2025-10-01', note:'Fonds de départ'              },
        { type:'div',  asset:'Sonatel',       amount:28000,  qty:0,  date:'2026-01-10', note:'Dividende annuel'             },
        { type:'buy',  asset:'Bon du Trésor', amount:500000, qty:1,  date:'2026-02-01', note:'Obligation 6.5% 2 ans'        },
        { type:'sell', asset:'Orange CI',     amount:50000,  qty:2,  date:'2026-03-20', note:'Prise de bénéfice partielle'  },
      ]
    },

    // Collection : alerts
    // Alertes de prix configurées par l'utilisateur
    alerts: {
      schema: {
        asset:  'string — nom de l\'actif surveillé',
        cond:   'string — condition ("Prix ≥ seuil" | "Prix ≤ seuil" | "Variation ≥ +5%" | "Variation ≤ -3%")',
        val:    'number — valeur seuil en F CFA (0 si condition en %)',
        active: 'boolean — alerte activée ou non',
      },
      sampleDocs: [
        { asset:'Ecobank (ETI)', cond:'Prix ≥ seuil',    val:750000, active:true  },
        { asset:'Sonatel',       cond:'Variation ≥ +5%', val:0,      active:true  },
        { asset:'Orange CI',     cond:'Prix ≤ seuil',    val:380000, active:false },
      ]
    },

    // Collection : objectifs
    // Objectifs financiers personnels
    objectifs: {
      schema: {
        name:    'string — intitulé de l\'objectif',
        target:  'number — montant cible en F CFA',
        current: 'number — montant atteint à ce jour en F CFA',
        date:    'string — date d\'échéance ISO "YYYY-MM-DD"',
        color:   'string — couleur hex pour la barre de progression',
      },
      sampleDocs: [
        { name:'Capital 5M FCFA',            target:5000000, current:2450000, date:'2027-12-31', color:'#4ade80' },
        { name:'Revenu passif 100k/mois',    target:100000,  current:43200,   date:'2027-06-01', color:'#22d3ee' },
        { name:'Diversification immobilier', target:1000000, current:340000,  date:'2027-01-01', color:'#fbbf24' },
      ]
    },

    // Collection : notifications
    // Notifications et alertes affichées dans le panneau latéral
    notifications: {
      schema: {
        type: 'string — couleur sémantique "green" | "red" | "amber" | "blue"',
        cat:  'string — catégorie courte ("PERFORMANCE" | "ALERTE" | "DIVIDENDE" | "DÉPÔT" | "RAPPEL")',
        msg:  'string — message descriptif affiché à l\'utilisateur',
        time: 'string — temps relatif affiché (ex: "Il y a 2h")',
      },
      sampleDocs: [
        { type:'green', cat:'PERFORMANCE', msg:'Sonatel +12.1% — objectif mensuel atteint',         time:'Il y a 2h'        },
        { type:'amber', cat:'ALERTE',      msg:'Orange CI en légère baisse (-1.4%). Surveiller.',    time:'Il y a 5h'        },
        { type:'blue',  cat:'DIVIDENDE',   msg:'Dividende Sonatel de 28 000 F CFA reçu',             time:'Il y a 3 jours'   },
        { type:'green', cat:'DÉPÔT',       msg:'Bon du Trésor — intérêts trimestriels disponibles',  time:'Il y a 1 semaine' },
        { type:'red',   cat:'RAPPEL',      msg:'Rebalancement du portefeuille conseillé ce mois',    time:'Il y a 2 semaines'},
      ]
    },
  };

  // ── Écriture Firestore en batch ──────────────────────────────
  const results = {};

  for (const [colName, config] of Object.entries(COLLECTIONS)) {
    const colPath = `users/${uid}/${colName}`;

    // Vérifier si la collection existe déjà
    const existing = await db.collection(colPath).limit(1).get();
    if (!existing.empty) {
      console.warn(`⚠️  Collection "${colName}" déjà existante — ignorée (${existing.size}+ doc(s))`);
      results[colName] = 'skipped';
      continue;
    }

    // Écrire en batch
    const batch = db.batch();
    for (const doc of config.sampleDocs) {
      const ref = db.collection(colPath).doc();
      batch.set(ref, doc);
    }
    await batch.commit();

    console.log(`✅  Collection "${colName}" créée avec ${config.sampleDocs.length} document(s)`);
    results[colName] = `created (${config.sampleDocs.length} docs)`;
  }

  console.log('\n🎉 Initialisation terminée !');
  console.table(results);
  console.log('\n📋 Structure Firestore créée :');
  console.log(`  users/${uid}/`);
  Object.keys(COLLECTIONS).forEach(c => console.log(`    ├── ${c}/`));

  return results;
}

// ── Lancement automatique ──────────────────────────────────────
initFirebaseCollections().catch(err => {
  console.error('❌ Erreur lors de l\'initialisation :', err);
});


// ══════════════════════════════════════════════════════════════
// VERSION NODE.JS — Firebase Admin SDK
// Décommente et adapte si tu veux exécuter depuis un terminal
// ══════════════════════════════════════════════════════════════

/*
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Télécharge depuis Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'mon-app-priv'
});

const db = admin.firestore();

// Remplace par l'UID de l'utilisateur cible
const uid = 'UID_DE_TON_UTILISATEUR';

// Même logique que ci-dessus, mais avec admin.firestore.FieldValue, etc.
// La structure des collections est identique.
*/

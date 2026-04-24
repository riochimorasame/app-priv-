import { db } from './init-firebase.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Vos données à importer automatiquement
const expertises = [
    { titre: "Installation Basse Tension", categorie: "Domestique", description: "Norme NF C 15-100" },
    { titre: "Maintenance Industrielle", categorie: "Industrie", description: "Armoires électriques" },
    { titre: "Dépannage Urgent", categorie: "Service", description: "Intervention 24h/7j" }
];

async function importerTout() {
    console.log("Début de l'importation automatique...");
    for (const item of expertises) {
        try {
            const docRef = await addDoc(collection(db, "expertises"), item);
            console.log(`Succès : ${item.titre} ajouté avec l'ID ${docRef.id}`);
        } catch (e) {
            console.error("Erreur pour ", item.titre, e);
        }
    }
    console.log("Importation terminée !");
}

importerTout();
# 💾 Système de Persistance des Simulations

## Vue d'ensemble

Le système de persistance des simulations permet de **sauvegarder et recharger** des configurations complètes de simulation Sparkplug B, incluant l'état critique `bdSeq` et `seq` pour chaque node et device.

## ⚡ Conformité Sparkplug B

### État Sauvegardé

Pour chaque **Node (EoN)** :
- ✅ `bdSeq` (Birth/Death Sequence Number)
- ✅ `seq` (Message Sequence Number)
- ✅ Configuration complète
- ✅ Métriques et leurs valeurs
- ✅ Liste des devices

Pour chaque **Device** :
- ✅ `bdSeq` (Birth/Death Sequence Number)
- ✅ `seq` (Message Sequence Number)
- ✅ Configuration et métriques

### Incrémentation de bdSeq (CRITICAL)

**Selon la spécification Sparkplug B (ISO/IEC 20237:2023)** :

> Le `bdSeq` **DOIT** s'incrémenter à chaque **reconnexion** ou **rebirth** d'un Edge Node.

**Comportement lors du chargement** :
```typescript
// État sauvegardé
bdSeq: 5

// État après chargement
bdSeq: 6  // ✅ Automatiquement incrémenté
```

**Pourquoi ?**
- Le chargement d'une simulation = nouvelle session
- Nouvelle session = nouveau cycle de vie Sparkplug B
- Nouveau cycle = bdSeq DOIT s'incrémenter
- ✅ **Garantit la conformité Sparkplug B**

### Continuité de seq

Le numéro de séquence `seq` **continue** depuis la dernière valeur sauvegardée :

```typescript
// État sauvegardé
seq: 42

// État après chargement
seq: 42  // ✅ Continue (pas de reset)

// Prochain message
seq: 43  // ✅ Incrémente normalement
```

## 📂 Structure de Stockage

### LocalStorage Keys

```
sparkplug_simulation_metadata        → Index de toutes les simulations
sparkplug_simulation_{id}            → Snapshot de simulation
sparkplug_simulation_autosave        → Sauvegarde automatique
```

### Format de Snapshot

```typescript
{
  id: "sim_1234567890_abc123",
  name: "Production Water Treatment Plant",
  description: "Configuration complète avec 3 stations de pompage",
  createdAt: 1234567890000,
  lastModified: 1234567890000,
  version: "1.0.0",
  nodes: [
    {
      id: "node-1",
      config: { /* Configuration EoN */ },
      metrics: [ /* Métriques */ ],
      devices: [ /* Devices */ ],
      state: {
        bdSeq: "5",           // BigInt as string
        seq: 42,
        lastPublishTime: 1234567890000,
        birthSent: true
      },
      deviceStates: {
        "device-1": {
          bdSeq: "3",
          seq: 18,
          lastPublishTime: 1234567890000,
          birthSent: true
        }
      }
    }
  ]
}
```

## 🎯 Utilisation

### 1. Sauvegarder une Simulation

```typescript
import { SimulationPersistenceService } from './services/simulationPersistence';

// Dans votre composant
const simulationEngine = /* votre instance */;
const nodes = /* Map de nodes */;

// Récupérer l'état
const { nodeStates, deviceStates } = simulationEngine.getSimulationState();

// Sauvegarder
const id = SimulationPersistenceService.saveSimulation(
  "Ma Simulation",
  nodes,
  nodeStates,
  deviceStates,
  "Description optionnelle"
);

console.log(`Simulation sauvegardée avec ID: ${id}`);
```

### 2. Charger une Simulation

```typescript
// Charger le snapshot
const snapshot = SimulationPersistenceService.loadSimulation(id);

if (snapshot) {
  // ✅ bdSeq déjà incrémenté automatiquement

  // Restaurer les nodes
  snapshot.nodes.forEach(nodeSnapshot => {
    // Recréer le node avec sa config
    const node = createNode(nodeSnapshot.config);

    // Restaurer l'état
    simulationEngine.restoreSimulationState(
      nodeStates,
      deviceStates
    );
  });
}
```

### 3. Auto-Save

Le système inclut une sauvegarde automatique :

```typescript
// Toutes les 30 secondes
setInterval(() => {
  if (simulationRunning) {
    SimulationPersistenceService.autoSave(nodes, nodeStates, deviceStates);
  }
}, 30000);

// Charger l'auto-save au démarrage
if (SimulationPersistenceService.hasAutoSave()) {
  const snapshot = SimulationPersistenceService.loadAutoSave();
  // Restaurer...
}
```

### 4. Exporter/Importer

```typescript
// Exporter vers fichier JSON
SimulationPersistenceService.exportSimulation(id);
// → Télécharge: Ma_Simulation_sim_123.json

// Importer depuis fichier
const file = /* File object */;
const newId = await SimulationPersistenceService.importSimulation(file);
```

## 🖥️ Interface Utilisateur

### SimulationManager Component

```tsx
import { SimulationManager } from './components/simulator/SimulationManager';

<SimulationManager
  onClose={() => setShowManager(false)}
  onLoad={(id) => loadSimulation(id)}
  onSave={(name, desc) => saveCurrentSimulation(name, desc)}
  canSave={isSimulationRunning}
/>
```

**Fonctionnalités UI** :
- 📋 Liste de toutes les simulations sauvegardées
- 💾 Sauvegarder la simulation actuelle
- 📂 Charger une simulation
- 📤 Exporter en JSON
- 📥 Importer depuis JSON
- 🗑️ Supprimer une simulation
- 📊 Statistiques de stockage

## 📊 Exemple Complet

### Scénario : Station de Traitement d'Eau

```typescript
// 1. Configuration initiale
const waterPlant = {
  nodes: [
    {
      groupId: "WaterTreatment",
      edgeNodeId: "PumpStation_01",
      bdSeq: 0,  // Initial
      seq: 0
    }
  ]
};

// 2. Simulation tourne...
// bdSeq: 0, seq: 0 → 1 → 2 → 3 → ...

// 3. Sauvegarde
SimulationPersistenceService.saveSimulation(
  "Water Plant - Config Production",
  nodes,
  nodeStates,
  deviceStates
);
// ✅ Sauvegardé: bdSeq: 0, seq: 15

// 4. Page refresh / Redémarrage

// 5. Chargement
const loaded = SimulationPersistenceService.loadSimulation(id);
// ✅ bdSeq automatiquement incrémenté: 0 → 1
// ✅ seq continue: 15

// 6. Simulation reprend
// bdSeq: 1 (nouvelle session)
// seq: 15 → 16 → 17 → ... (continue)

// 7. Rebirth manuel
simulationEngine.handleRebirth(node);
// bdSeq: 1 → 2 (incrémente selon spec Sparkplug B)
```

## 🔍 Logs de Débogage

Lors du chargement, des logs détaillés sont affichés :

```
✅ Simulation "Water Plant - Config Production" loaded (bdSeq incremented for Sparkplug B compliance)
📊 Node PumpStation_01: bdSeq 0 → 1
📊 Node FilterStation_01: bdSeq 0 → 1
✅ Simulation state restored
   Nodes: 2
   Devices: 5
   [node-1] bdSeq: 1, seq: 15
   [node-2] bdSeq: 1, seq: 8
```

## ⚠️ Limitations

### Stockage LocalStorage
- **Limite** : ~5-10 MB selon le navigateur
- **Conseil** : Exporter les simulations volumineuses en JSON

### État Non Sauvegardé
- ❌ Connexions MQTT actives (doivent être recréées)
- ❌ Timers en cours (redémarrés au chargement)
- ❌ Historique des messages (seulement état actuel)

### BigInt Serialization
Les `BigInt` sont convertis en `string` pour JSON :
```typescript
bdSeq: BigInt(5)     → "5"
bdSeq: "5"           → BigInt(5)
```

## 🚀 Avantages

### Pour le Développement
- ✅ Tester des scénarios complexes rapidement
- ✅ Partager des configurations entre développeurs
- ✅ Reproduire des bugs avec état exact

### Pour la Production
- ✅ Reprendre une simulation après crash
- ✅ Conformité Sparkplug B garantie
- ✅ Traçabilité de l'état bdSeq/seq
- ✅ Sauvegarde automatique toutes les 30s

## 📝 Best Practices

### 1. Nommer les Simulations
```typescript
// ✅ Bon
"Production - Water Treatment - 3 Pumps"
"Test - High Load Scenario - 10 Nodes"

// ❌ Éviter
"test"
"simulation1"
```

### 2. Descriptions
```typescript
// ✅ Utile
"Configuration de production avec 3 stations de pompage.
Charge nominale: 450m³/h. bdSeq initial: 5"

// ❌ Peu utile
"test"
```

### 3. Exporter Régulièrement
- Exporter les configurations stables
- Versionner les exports (Git LFS recommandé)
- Backup hors navigateur

### 4. Surveillance bdSeq
```typescript
// Vérifier dans les logs
console.log(`Current bdSeq: ${node.bdSeq}`);

// Devrait s'incrémenter à chaque:
// - Chargement de simulation
// - Reconnexion MQTT
// - Rebirth manuel
```

## 🔧 API Reference

### SimulationPersistenceService

#### `saveSimulation(name, nodes, nodeStates, deviceStates, description?): string`
Sauvegarde une simulation et retourne son ID.

#### `loadSimulation(id): SimulationSnapshot | null`
Charge une simulation (bdSeq auto-incrémenté).

#### `getAllSimulations(): SimulationMetadata[]`
Liste toutes les simulations.

#### `deleteSimulation(id): boolean`
Supprime une simulation.

#### `exportSimulation(id): void`
Exporte en fichier JSON.

#### `importSimulation(file): Promise<string>`
Importe depuis fichier JSON.

#### `autoSave(nodes, nodeStates, deviceStates): void`
Sauvegarde automatique.

#### `hasAutoSave(): boolean`
Vérifie si auto-save existe.

#### `getStorageStats(): { totalSimulations, totalSize, sizeFormatted }`
Statistiques de stockage.

## 🎓 Conformité Spec Sparkplug B

### Référence ISO/IEC 20237:2023

**Section 6.2.2 - Birth/Death Sequence Number (bdSeq)** :

> The bdSeq number MUST be included in every NBIRTH and NDEATH message.
> The bdSeq number MUST increment on every new session or rebirth.
> The bdSeq number allows SCADA systems to detect missed DEATH messages.

✅ **Notre implémentation respecte cette exigence** en incrémentant automatiquement `bdSeq` lors du chargement d'une simulation (= nouvelle session).

**Section 6.2.3 - Sequence Number (seq)** :

> The seq number MUST increment for every message published.
> The seq number allows detection of message loss.

✅ **Notre implémentation** continue le `seq` depuis la dernière valeur sauvegardée, garantissant la continuité.

## 📞 Support

Pour toute question sur la persistance des simulations :
- Consulter les logs console
- Vérifier `localStorage` dans DevTools
- Examiner les snapshots exportés

---

**Dernière mise à jour** : 2025-11-15
**Version** : 1.0.0
**Conformité** : Sparkplug B (ISO/IEC 20237:2023)

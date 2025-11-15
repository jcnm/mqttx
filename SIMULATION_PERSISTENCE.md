# 💾 Système de Persistance des Simulations

## Vue d'ensemble

Le système de persistance des simulations permet de **sauvegarder et recharger** des configurations complètes de simulation Sparkplug B, incluant l'état critique `bdSeq` et `seq` pour chaque node et device.

## 🔧 Backends de Stockage Disponibles

Le système supporte **trois backends de stockage** différents, permettant de choisir la meilleure option selon les besoins :

### 1. 💾 LocalStorage (Browser)
- **Stockage** : Navigateur web local
- **Capacité** : ~5-10 MB
- **Persistance** : Par utilisateur/navigateur
- **Partage** : Non partageable
- **Idéal pour** : Tests locaux, développement rapide
- **Disponibilité** : Toujours disponible

### 2. 🔴 Redis (Server)
- **Stockage** : Serveur Redis
- **Capacité** : Illimitée (dépend du serveur)
- **Persistance** : Partagée entre tous les utilisateurs
- **Partage** : Multi-utilisateurs
- **Idéal pour** : Production, collaboration en équipe
- **Disponibilité** : Nécessite Redis configuré
- **TTL** : 90 jours par défaut

### 3. 📁 Fichier (Server)
- **Stockage** : Système de fichiers serveur (`./data/simulations/`)
- **Capacité** : Illimitée (dépend du disque)
- **Persistance** : Permanente
- **Partage** : Multi-utilisateurs
- **Idéal pour** : Archivage, versioning Git, backup
- **Disponibilité** : Toujours disponible (côté serveur)
- **Format** : Fichiers JSON lisibles

### Changement de Backend

Le backend peut être changé à tout moment via l'interface SimulationManager :

```typescript
// Via l'interface
// Sélecteur dropdown dans la barre de statistiques

// Via code
import { persistenceManager } from './services/persistence/SimulationPersistenceManager';

// Changer de backend
await persistenceManager.switchBackend('redis');

// Vérifier disponibilité
const available = await persistenceManager.isBackendAvailable('redis');

// Copier une simulation vers un autre backend
const newId = await persistenceManager.copyToBackend('sim_123', 'file');

// Synchroniser toutes les simulations vers un autre backend
const count = await persistenceManager.syncToBackend('file');
console.log(`${count} simulations synchronisées`);
```

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

### LocalStorage Backend

```
sparkplug_simulation_metadata        → Index de toutes les simulations
sparkplug_simulation_{id}            → Snapshot de simulation
sparkplug_simulation_autosave        → Sauvegarde automatique
sparkplug_storage_backend_preference → Backend sélectionné
```

### Redis Backend

```
simulation:{id}                      → Snapshot JSON (TTL: 90 jours)
simulation:metadata                  → Index des simulations
simulation:autosave                  → Sauvegarde automatique
```

**API Endpoints** :
- `GET /api/simulations` - Liste toutes les simulations
- `GET /api/simulations/:id` - Récupère une simulation
- `POST /api/simulations` - Sauvegarde une simulation
- `DELETE /api/simulations/:id` - Supprime une simulation
- `GET /api/simulations/stats` - Statistiques

### File Backend

```
./data/simulations/{id}.json         → Fichier JSON de simulation
./data/simulations/metadata.json     → Index des simulations
./data/simulations/autosave.json     → Sauvegarde automatique
```

**API Endpoints** :
- `GET /api/simulations/file` - Liste toutes les simulations
- `GET /api/simulations/file/:id` - Récupère une simulation
- `POST /api/simulations/file` - Sauvegarde une simulation
- `DELETE /api/simulations/file/:id` - Supprime une simulation
- `GET /api/simulations/file/stats` - Statistiques
- `GET /api/simulations/file/health` - Vérification disponibilité

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
import { persistenceManager } from './services/persistence/SimulationPersistenceManager';

// Dans votre composant
const simulationEngine = /* votre instance */;
const nodes = /* Map de nodes */;

// Récupérer l'état
const { nodeStates, deviceStates } = simulationEngine.getSimulationState();

// Sauvegarder (utilise le backend actuellement sélectionné)
const id = await persistenceManager.saveSimulation(
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
// Charger le snapshot (depuis le backend actuel)
const snapshot = await persistenceManager.loadSimulation(id);

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

### 3. Changer de Backend

```typescript
// Vérifier les backends disponibles
const backends = await persistenceManager.getAvailableBackends();
console.log(backends);
// [
//   { type: 'localStorage', name: 'localStorage', available: true, current: true },
//   { type: 'redis', name: 'redis', available: true, current: false },
//   { type: 'file', name: 'file', available: true, current: false }
// ]

// Changer de backend
const success = await persistenceManager.switchBackend('redis');
if (success) {
  console.log('✅ Backend changé vers Redis');
}

// Le backend choisi est sauvegardé dans localStorage
// Il sera automatiquement réutilisé au prochain chargement de la page
```

### 4. Auto-Save

Le système inclut une sauvegarde automatique :

```typescript
// Toutes les 30 secondes
setInterval(() => {
  if (simulationRunning) {
    await persistenceManager.autoSave(nodes, nodeStates, deviceStates);
  }
}, 30000);

// Charger l'auto-save au démarrage
if (await persistenceManager.hasAutoSave()) {
  const snapshot = await persistenceManager.loadAutoSave();
  // Restaurer...
}
```

### 5. Exporter/Importer

```typescript
// Exporter vers fichier JSON
await persistenceManager.exportSimulation(id);
// → Télécharge: Ma_Simulation_sim_123.json

// Importer depuis fichier
const file = /* File object */;
const newId = await persistenceManager.importSimulation(file);
// La simulation est sauvegardée dans le backend actuel
```

### 6. Copier entre Backends

```typescript
// Copier une simulation vers un autre backend
const newId = await persistenceManager.copyToBackend('sim_123', 'file');
console.log(`Simulation copiée vers fichier: ${newId}`);

// Synchroniser toutes les simulations vers un backup
const count = await persistenceManager.syncToBackend('file');
console.log(`${count} simulations synchronisées vers fichiers`);
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
- 🔧 **Sélecteur de backend** : Choisir entre LocalStorage, Redis, ou Fichier
- 📋 Liste de toutes les simulations sauvegardées (backend actuel)
- 💾 Sauvegarder la simulation actuelle
- 📂 Charger une simulation
- 📤 Exporter en JSON
- 📥 Importer depuis JSON
- 🗑️ Supprimer une simulation
- 📊 Statistiques de stockage (par backend)
- ✅ Indicateur de backend disponible/actif
- 🟢 Indicateur d'auto-save

**Sélecteur de Backend** :
Dans la barre de statistiques, un menu déroulant permet de choisir le backend de stockage :
- 💾 LocalStorage (navigateur)
- 🔴 Redis (serveur partagé)
- 📁 Fichier (serveur permanent)

Le backend sélectionné est sauvegardé localement et utilisé pour toutes les opérations futures.

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

### Stockage LocalStorage Backend
- **Limite** : ~5-10 MB selon le navigateur
- **Conseil** : Utiliser Redis ou Fichier pour les simulations volumineuses
- **Portée** : Par navigateur/utilisateur (non partageable)

### Redis Backend
- **TTL** : 90 jours par défaut (configurable)
- **Disponibilité** : Nécessite Redis configuré et démarré
- **Connexion** : Dépend de la disponibilité réseau

### File Backend
- **Permissions** : Nécessite accès en écriture au serveur
- **Espace disque** : Dépend du serveur
- **Accès** : Partagé entre tous les utilisateurs

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

### Changement de Backend
- Les simulations ne sont **pas automatiquement synchronisées** entre backends
- Utiliser `copyToBackend()` ou `syncToBackend()` pour transférer les données
- Chaque backend a son propre stockage indépendant

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

### SimulationPersistenceManager

#### Backend Management

##### `getCurrentBackend(): StorageBackend`
Retourne le backend actuellement utilisé.

##### `getCurrentBackendType(): StorageBackendType`
Retourne le type du backend actuel ('localStorage' | 'redis' | 'file').

##### `switchBackend(type: StorageBackendType): Promise<boolean>`
Change le backend de stockage. Retourne `true` si le changement a réussi.

##### `isBackendAvailable(type: StorageBackendType): Promise<boolean>`
Vérifie si un backend est disponible.

##### `getAvailableBackends(): Promise<Array<{ type, name, available, current }>>`
Liste tous les backends avec leur statut de disponibilité.

#### Simulation Operations

##### `saveSimulation(name, nodes, nodeStates, deviceStates, description?): Promise<string>`
Sauvegarde une simulation dans le backend actuel et retourne son ID.

##### `loadSimulation(id): Promise<SimulationSnapshot | null>`
Charge une simulation depuis le backend actuel (bdSeq auto-incrémenté).

##### `getAllSimulations(): Promise<SimulationMetadata[]>`
Liste toutes les simulations du backend actuel.

##### `deleteSimulation(id): Promise<boolean>`
Supprime une simulation du backend actuel.

##### `getStats(): Promise<{ totalSimulations, totalSize, sizeFormatted }>`
Statistiques de stockage du backend actuel.

#### Import/Export

##### `exportSimulation(id): Promise<void>`
Exporte une simulation en fichier JSON (téléchargement navigateur).

##### `importSimulation(file): Promise<string | null>`
Importe une simulation depuis un fichier JSON vers le backend actuel.

#### Auto-Save

##### `autoSave(nodes, nodeStates, deviceStates): Promise<void>`
Sauvegarde automatique dans le backend actuel.

##### `hasAutoSave(): Promise<boolean>`
Vérifie si un auto-save existe dans le backend actuel.

##### `loadAutoSave(): Promise<SimulationSnapshot | null>`
Charge l'auto-save depuis le backend actuel.

#### Cross-Backend Operations

##### `copyToBackend(id, targetBackend): Promise<string | null>`
Copie une simulation vers un autre backend. Retourne le nouvel ID.

##### `syncToBackend(targetBackend): Promise<number>`
Synchronise toutes les simulations vers un autre backend. Retourne le nombre de simulations synchronisées.

##### `clearAll(): Promise<void>`
Supprime toutes les simulations du backend actuel.

### StorageBackend Interface

Tous les backends implémentent cette interface :

```typescript
interface StorageBackend {
  readonly name: string;
  isAvailable(): Promise<boolean>;
  save(snapshot: SimulationSnapshot): Promise<void>;
  load(id: string): Promise<SimulationSnapshot | null>;
  list(): Promise<SimulationMetadata[]>;
  delete(id: string): Promise<boolean>;
  getStats(): Promise<{ totalSimulations, totalSize, sizeFormatted }>;
  clearAll(): Promise<void>;
}
```

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
**Version** : 2.0.0 (Multi-Backend)
**Conformité** : Sparkplug B (ISO/IEC 20237:2023)

## 📦 Architecture Multi-Backend

Le système utilise une architecture modulaire avec :
- **Interface abstraite** : `StorageBackend` définit le contrat
- **Implémentations concrètes** : `LocalStorageBackend`, `RedisBackend`, `FileBackend`
- **Manager centralisé** : `SimulationPersistenceManager` orchestre tout
- **Singleton** : `persistenceManager` pour un accès global

**Avantages** :
- ✅ Changement de backend à chaud
- ✅ Ajout facile de nouveaux backends
- ✅ Tests unitaires simplifiés
- ✅ Séparation des préoccupations
- ✅ Synchronisation inter-backends

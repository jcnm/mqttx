# 🚀 Guide d'Utilisation MQTTX - Sparkplug B Platform

## 📋 Table des Matières

1. [Architecture Complète](#architecture-complète)
2. [Démarrage Rapide](#démarrage-rapide)
3. [Fonctionnalités Frontend](#fonctionnalités-frontend)
4. [Simulations de Plant](#simulations-de-plant)
5. [Émission de Messages](#émission-de-messages)
6. [Visualisation dans le Broker](#visualisation-dans-le-broker)
7. [API REST](#api-rest)

---

## Architecture Complète

### Stack Technique

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│  ┌──────────┬──────────┬──────────┬──────────────────┐ │
│  │  SCADA   │  Broker  │   Plant  │   Commands       │ │
│  │  View    │  Viewer  │Simulator │   Panel          │ │
│  └──────────┴──────────┴──────────┴──────────────────┘ │
│                                                          │
│  WebSocket (ws://localhost:8083)                        │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              MQTT BROKER (Aedes + Fastify)               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  • Port TCP: 1883                                 │  │
│  │  • Port WebSocket: 8083                          │  │
│  │  • API REST: 3000                                │  │
│  │  • Sparkplug Aware Features                      │  │
│  │  • State Management (Redis)                      │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                 PACKAGES SPARKPLUG B                     │
│  • @sparkplug/codec    - Encoding/Decoding              │
│  • @sparkplug/namespace - Topic Management              │
│  • @sparkplug/state    - State Tracking                 │
│  • @sparkplug/broker   - Broker Core                    │
│  • @sparkplug/scada-core - SCADA Components             │
└─────────────────────────────────────────────────────────┘
```

### Connexion Frontend ↔ Backend

✅ **OUI, le frontend est bien branché au backend !**

- **Frontend** se connecte via WebSocket : `ws://localhost:8083`
- **Backend** expose WebSocket sur port `8083` (configuré dans `sparkplug.yaml`)
- **Connexion automatique** au démarrage de l'application
- **Synchronisation en temps réel** des messages MQTT

---

## Démarrage Rapide

### 1. Démarrer le Backend (Broker MQTT)

```bash
# Terminal 1 - Broker MQTT
cd packages/broker
pnpm start

# Sorties attendues :
# 🚀 Starting Sparkplug MQTT Broker...
# ✅ Configuration loaded (version: spBv1.0)
# ✅ State manager initialized
# ✅ Redis persistence connected (ou warning si Redis non disponible)
# ✅ MQTT broker started
# ✅ REST API server listening on port 3000
#
# 📡 MQTT Broker: mqtt://localhost:1883
# 🌐 REST API: http://localhost:3000
# 📊 Health Check: http://localhost:3000/health
```

### 2. Démarrer le Frontend (Interface Web)

```bash
# Terminal 2 - Frontend React
cd packages/ui
pnpm dev

# Ouvrir dans le navigateur : http://localhost:5173
```

### 3. Vérifier la Connexion

Une fois les deux services démarrés :

1. Ouvrir `http://localhost:5173` dans le navigateur
2. En haut à droite, vérifier l'indicateur **"Connected"** (vert avec pulsation)
3. Si déconnecté, cliquer sur l'icône ⚙️ pour ouvrir les paramètres et vérifier :
   - URL : `localhost`
   - Port : `8083`
   - Protocol : `ws`

---

## Fonctionnalités Frontend

### 🎛️ Navigation Principale

Le frontend a **4 vues principales** accessibles via la barre de navigation :

#### 1. **SCADA View** (`/scada`)

Vue principale pour monitorer le système SCADA :

- Dashboard en temps réel
- État des Edge Nodes et Devices
- Métriques live
- Alertes et notifications

#### 2. **Broker Viewer** (`/broker`) ⭐

**Visualisation complète des messages Sparkplug B :**

##### Onglets disponibles :

**a) Logs** 📝
- Messages en temps réel (PUBLISH, SUBSCRIBE, etc.)
- Filtrage par :
  - Type de message (NBIRTH, NDATA, DBIRTH, DDATA, NCMD, DCMD, STATE)
  - Topic
  - Client ID
  - Période de temps
- **Message Inspector détaillé** (clic sur un message) :
  - **Overview** : Métadonnées Sparkplug (groupId, edgeNodeId, deviceId, bdSeq, seq)
  - **MQTT** : Fixed Header, Variable Header, QoS, Retain, Packet ID
  - **Raw** : Dump hexadécimal du payload
  - **Sparkplug** : Décodage du payload Protobuf avec tous les metrics
  - **Session** : Informations de session client

**b) Sessions** 👥
- Sessions MQTT actives
- Client ID, IP, Port
- État de connexion

**c) Topics** 📮
- Tous les topics actifs
- Subscriptions par client
- Hiérarchie des topics Sparkplug

**d) ACLs** 🔒
- Règles d'accès configurées
- Permissions PUBLISH/SUBSCRIBE

**e) Namespaces** 🏷️
- Namespaces Sparkplug détectés (`spBv1.0`, etc.)
- Groupes, Nodes, Devices

**f) Persistence** 💾
- État du cache Redis
- Statistiques de persistance

**Statistiques en temps réel :**
- Nombre de sessions actives
- Messages/seconde
- Total de topics
- Nombre de messages

#### 3. **Plant Simulator** (`/simulator`) ⭐

**Simulateur complet d'usine industrielle :**

##### Fonctionnalités :

**a) Canvas Interactif**
- Drag & Drop pour positionner les Edge Nodes
- Visualisation graphique de l'architecture
- Connexions entre nodes

**b) Panneau d'Outils (Tool Panel)**
- **Créer Edge Nodes** :
  - Group ID
  - Edge Node ID
  - bdSeq (Birth/Death Sequence)
- **Ajouter Devices** à chaque node
- **Configurer Métriques** par device :
  - Nom du metric
  - Type de données (Int32, Float, Boolean, String, etc.)
  - Générateur de valeurs :
    - **Static** : Valeur fixe
    - **Random** : Valeurs aléatoires dans une plage
    - **Sine Wave** : Onde sinusoïdale (amplitude, fréquence, phase)
    - **Sawtooth** : Dent de scie
    - **Square** : Signal carré
    - **Custom Expression** : Formule JavaScript personnalisée

**c) Contrôles de Simulation**
- ▶️ **Start** : Démarrer la simulation
- ⏸️ **Stop** : Arrêter la simulation
- ⚡ **Speed** : Contrôle de vitesse (0.1x à 10x)
- 🔄 **Reset** : Réinitialiser tous les nodes

**d) EoN Trace View**
- Vue de suivi en temps réel des messages envoyés par chaque node
- Statistiques :
  - Messages publiés
  - Messages/seconde
  - Uptime
  - État (ONLINE/OFFLINE)

**e) Templates de Nodes**
- Templates pré-configurés :
  - **Industrial Sensor Node** : Température, pression, humidité
  - **Motor Control Node** : Vitesse, couple, température moteur
  - **Tank Monitoring** : Niveau, température, pression
  - Templates personnalisés

#### 4. **Commands Panel** (`/commands`)

**Envoyer des commandes NCMD/DCMD :**

- **NCMD (Node Command)** :
  - Sélectionner Group ID + Edge Node ID
  - Ajouter des metrics à envoyer
  - Envoyer la commande
  - Historique des commandes envoyées

- **DCMD (Device Command)** :
  - Sélectionner Group ID + Edge Node ID + Device ID
  - Définir les metrics
  - Envoyer

- **Rebirth Request** :
  - Demander un rebirth à un node spécifique

---

## Simulations de Plant

### ✅ OUI, vous pouvez faire des simulations !

### Guide Étape par Étape :

#### 1. Ouvrir le Simulateur

Naviguer vers `/simulator` ou cliquer sur "Simulator" dans la nav bar.

#### 2. Créer un Edge Node

**Option A : Template pré-configuré**
1. Panneau de droite → Section "Templates"
2. Choisir "Industrial Sensor Node"
3. Cliquer "Add to Canvas"
4. Un node apparaît avec :
   - 3 devices pré-configurés
   - Métriques de température, pression, humidité
   - Générateurs de données réalistes

**Option B : Création manuelle**
1. Panneau de droite → Section "Create Node"
2. Remplir :
   - **Group ID** : `Group1` (ou personnalisé)
   - **Edge Node ID** : `Node1` (ou personnalisé)
   - **Birth Sequence** : `0` (auto-incrémenté)
3. Cliquer "Create Node"
4. Un node vide apparaît sur le canvas

#### 3. Ajouter des Devices

1. Sélectionner le node (clic dessus)
2. Panneau de configuration → Section "Devices"
3. Cliquer "+ Add Device"
4. Configurer :
   - **Device ID** : `Device1`
   - **Name** : `Temperature Sensor`

#### 4. Configurer des Métriques

1. Dans la section Device → Cliquer "Add Metric"
2. Configurer :
   - **Metric Name** : `Temperature`
   - **Data Type** : `Float`
   - **Generator Type** : `Sine Wave`
   - **Parameters** :
     - Min : `20`
     - Max : `40`
     - Frequency : `0.5` (Hz)
     - Phase : `0`

3. Répéter pour d'autres metrics :
   - `Pressure` (Float, Random, 900-1100)
   - `Status` (Boolean, Square Wave)
   - `Message` (String, Static, "Operational")

#### 5. Démarrer la Simulation

1. Cliquer sur le bouton **▶️ Start** en haut
2. Observer :
   - Le node change d'état à "RUNNING" (vert)
   - La trace view montre les messages envoyés
   - Le compteur de messages augmente
   - Les statistiques se mettent à jour

#### 6. Visualiser dans le Broker

1. Naviguer vers `/broker`
2. Onglet "Logs"
3. Observer les messages :
   - **NBIRTH** : Birth certificate du node (1 fois au démarrage)
   - **DBIRTH** : Birth certificates des devices
   - **NDATA** : Messages de données périodiques
   - **DDATA** : Données des devices

4. Cliquer sur un message → **Message Inspector** s'ouvre
5. Onglet "Sparkplug" :
   - Voir tous les metrics décodés
   - Valeurs actuelles
   - Timestamps
   - Sequence numbers

---

## Émission de Messages

### ✅ OUI, vous pouvez émettre des messages concrètement !

### 3 Façons d'Émettre des Messages :

#### Méthode 1 : Via le Simulateur (Recommandé)

**Messages émis automatiquement :**
- **NBIRTH** : Au démarrage du node
- **NDATA** : Toutes les X secondes (configurable via `dataFrequency`)
- **DBIRTH** : Pour chaque device
- **DDATA** : Données des devices
- **NDEATH** : Quand le node s'arrête

**Format Sparkplug B conforme :**
```json
{
  "timestamp": 1699999999999,
  "seq": 5,
  "metrics": [
    {
      "name": "Temperature",
      "timestamp": 1699999999999,
      "datatype": 9,
      "value": 25.5
    }
  ]
}
```

#### Méthode 2 : Via le Commands Panel

**Envoyer une commande NCMD :**

1. Naviguer vers `/commands`
2. Section "Node Command (NCMD)"
3. Remplir :
   - **Group ID** : `Group1`
   - **Edge Node ID** : `Node1`
4. Ajouter metric :
   - **Name** : `Rebirth`
   - **Type** : `Boolean`
   - **Value** : `true`
5. Cliquer "Send Command"

Le message est envoyé sur le topic :
```
spBv1.0/Group1/NCMD/Node1
```

**Envoyer une commande DCMD :**

1. Section "Device Command (DCMD)"
2. Ajouter Device ID : `Device1`
3. Configurer metrics
4. Envoyer

Topic :
```
spBv1.0/Group1/DCMD/Node1/Device1
```

#### Méthode 3 : Via Code (Store MQTT)

```typescript
import { useMQTTStore } from './stores/mqttStore';

const { publish } = useMQTTStore();

// Publier un message simple
publish(
  'spBv1.0/Group1/NDATA/Node1',
  Buffer.from('test'),
  { qos: 0 }
);

// Publier un message Sparkplug encodé
import { encodePayload, DataType } from '@sparkplug/codec';

const payload = {
  timestamp: BigInt(Date.now()),
  seq: 0n,
  metrics: [
    {
      name: 'Temperature',
      datatype: DataType.Float,
      value: 25.5,
    },
  ],
};

const encoded = encodePayload(payload);
publish('spBv1.0/Group1/NDATA/Node1', Buffer.from(encoded));
```

---

## Visualisation dans le Broker

### ✅ OUI, vous pouvez voir, classifier, destructurer et visualiser les messages !

### Vue Détaillée des Capacités :

#### 1. Voir les Messages en Temps Réel

**Broker Viewer → Onglet Logs :**
- Tous les messages MQTT apparaissent instantanément
- Indicateur visuel du type de message :
  - 🟢 NBIRTH (vert)
  - 🔴 NDEATH (rouge)
  - 🔵 NDATA (bleu)
  - 🟡 NCMD (jaune)
- Timestamp précis
- Topic complet
- Taille du payload

#### 2. Classifier les Messages

**Filtres Disponibles :**

**Par Type de Message :**
- NBIRTH
- NDEATH
- NDATA
- NCMD
- DBIRTH
- DDEATH
- DDATA
- DCMD
- STATE

**Par Topic :**
- Wildcards supportés (`spBv1.0/#`, `spBv1.0/Group1/+/Node1`)
- Recherche exacte
- Regex

**Par Client ID :**
- Filtrer par émetteur

**Par Période :**
- Dernière minute
- Dernière heure
- Plage personnalisée

**Par Contenu :**
- Recherche dans le payload décodé
- Filtre par nom de metric
- Filtre par valeur

#### 3. Destructurer les Messages

**Message Inspector - Onglet "Sparkplug" :**

Quand vous cliquez sur un message, vous voyez :

**a) Structure du Payload :**
```
Timestamp: 2024-11-14T10:30:45.123Z
Sequence: 5
Metrics: 3
```

**b) Chaque Metric Individuellement :**
```
┌─────────────────────────────────────────┐
│ Metric #1                               │
├─────────────────────────────────────────┤
│ Name:      Temperature                  │
│ Type:      Float (9)                    │
│ Value:     25.5                         │
│ Timestamp: 2024-11-14T10:30:45.100Z    │
│ Quality:   GOOD (192)                   │
│ Alias:     100                          │
└─────────────────────────────────────────┘
```

**c) Métadonnées Sparkplug :**
- Group ID
- Edge Node ID
- Device ID (si DDATA/DBIRTH)
- Birth/Death Sequence
- Sequence Number
- Stale flag

**d) Détails MQTT (Onglet "MQTT") :**
```
Fixed Header:
  Message Type: PUBLISH (3)
  DUP Flag: No
  QoS Level: 0
  RETAIN Flag: No
  Remaining Length: 245 bytes

Variable Header:
  Topic Name: spBv1.0/Group1/NDATA/Node1
  Packet Identifier: 12345
```

**e) Raw Bytes (Onglet "Raw") :**
```
Hex Dump:
00000000  08 95 8d f0 e8 b7 2f 10  05 1a 0e 0a 0b 54 65 6d  |....../......Tem|
00000010  70 65 72 61 74 75 72 65  10 09 25 00 00 cc 41 1a  |perature..%...A.|
...
```

#### 4. Visualiser les Données

**Plusieurs Modes de Visualisation :**

**a) Linear View**
- Liste chronologique des messages
- Détails en ligne
- Filtrage et recherche

**b) Tree View**
- Hiérarchie des topics :
  ```
  spBv1.0/
    └─ Group1/
        ├─ NBIRTH/Node1
        ├─ NDATA/Node1
        └─ DBIRTH/Node1/Device1
  ```
- Navigation par arborescence
- Statistiques par niveau

**c) Graph View**
- Graphique des relations entre nodes et devices
- Visualisation des dépendances
- Flux de messages

**d) Timeseries View**
- Graphique temporel des métriques
- Plusieurs metrics sur le même graphe
- Zoom et pan
- Export des données

---

## API REST

Le broker expose une API REST sur `http://localhost:3000` :

### Endpoints Disponibles :

#### Santé
```bash
GET /health
# Retourne : { "status": "ok", "timestamp": ... }
```

#### Statistiques du Broker
```bash
GET /api/broker/stats
# Retourne :
{
  "clients": 5,
  "sessions": 3,
  "subscriptions": 12,
  "retained": 8,
  "messagesReceived": 1234,
  "messagesSent": 5678
}
```

#### Clients Connectés
```bash
GET /api/broker/clients
# Liste tous les clients MQTT actifs
```

#### Topics Actifs
```bash
GET /api/broker/topics
# Liste tous les topics avec subscriptions
```

#### Sessions
```bash
GET /api/broker/sessions
# Détails de toutes les sessions MQTT
```

#### Publier un Message
```bash
POST /api/broker/publish
Content-Type: application/json

{
  "topic": "spBv1.0/Group1/NDATA/Node1",
  "payload": "...",  # Base64 ou JSON
  "qos": 0,
  "retain": false
}
```

---

## Résumé des Capacités

### ✅ Ce que vous POUVEZ faire :

| Fonctionnalité | Status | Description |
|----------------|--------|-------------|
| **Simulations de Plant** | ✅ COMPLET | Créer des Edge Nodes, Devices, Métriques, Templates |
| **Émission de Messages** | ✅ COMPLET | NBIRTH, NDATA, NCMD, DCMD, etc. |
| **Visualisation Broker** | ✅ COMPLET | Logs temps réel, filtres, classification |
| **Destructuration** | ✅ COMPLET | Message Inspector avec 5 onglets détaillés |
| **Décodage Sparkplug B** | ✅ COMPLET | Protobuf décodé, tous les metrics visibles |
| **Connexion Frontend-Backend** | ✅ FONCTIONNEL | WebSocket sur port 8083 |
| **API REST** | ✅ DISPONIBLE | Endpoints pour stats, publish, etc. |
| **State Management** | ✅ INTÉGRÉ | Redis persistence, session tracking |
| **Sparkplug Aware** | ✅ ACTIF | Birth certificate storage, validation |

### 📊 Tests Complets

Tous les packages ont une couverture de tests :
- `@sparkplug/codec`: 62 tests ✅
- `@sparkplug/namespace`: 119 tests ✅
- `@sparkplug/state`: 125 tests ✅
- `@sparkplug/broker`: 74 tests ✅
- `@sparkplug/scada-core`: 40 tests ✅
- `@sparkplug/ui`: 22 tests ✅

**Total : 442 tests passants** 🎉

---

## Démonstration Rapide

### Scénario Complet :

1. **Démarrer** :
   ```bash
   # Terminal 1
   cd packages/broker && pnpm start

   # Terminal 2
   cd packages/ui && pnpm dev
   ```

2. **Créer une simulation** :
   - Ouvrir `http://localhost:5173`
   - Aller sur `/simulator`
   - Utiliser template "Industrial Sensor Node"
   - Cliquer "Start"

3. **Observer les messages** :
   - Aller sur `/broker`
   - Voir les messages NBIRTH et NDATA apparaître
   - Cliquer sur un message → Inspector détaillé

4. **Envoyer une commande** :
   - Aller sur `/commands`
   - Sélectionner le node créé
   - Envoyer "Rebirth" command
   - Observer le message NCMD dans le broker

5. **Visualiser** :
   - Onglet "Sparkplug" : voir le payload décodé
   - Onglet "Raw" : voir le hex dump
   - Onglet "MQTT" : voir les headers

**Tout fonctionne de bout en bout !** 🚀

---

## Support

Pour plus d'informations :
- Documentation packages : Voir `packages/*/README.md`
- Tests : `pnpm test` dans chaque package
- Build : `pnpm build` à la racine

## Technologies Utilisées

- **Frontend** : React, TypeScript, Vite, Zustand, TailwindCSS, React Flow
- **Backend** : Node.js, Aedes MQTT, Fastify, Redis
- **Sparkplug B** : Protocol Buffers, ISO/IEC 20237:2023
- **Tests** : Vitest
- **Build** : Turbo (monorepo)

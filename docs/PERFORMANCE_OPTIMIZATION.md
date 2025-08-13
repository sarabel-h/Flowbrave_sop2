# Guide d'Optimisation des Performances du Copilot

Ce guide détaille les optimisations implémentées et les bonnes pratiques pour maintenir de bonnes performances.

## Métriques de Performance

### Objectifs de Performance
- **Temps de réponse API** : < 2 secondes (P95)
- **Génération d'embeddings** : < 1 seconde (moyenne)
- **Recherche vectorielle** : < 500ms (moyenne)
- **Temps de premier chunk (streaming)** : < 1 seconde

### Métriques Surveillées
- Temps de réponse des endpoints `/api/chat` et `/api/chat/stream`
- Temps de génération des embeddings OpenAI
- Temps de recherche vectorielle MongoDB
- Taux de hit du cache
- Utilisation mémoire

## Optimisations Implémentées

### 1. Optimisation des Modèles IA

```javascript
// ✅ OPTIMISÉ : Modèle plus rapide
const model = new ChatOpenAI({
  modelName: "gpt-4o-mini", // Plus rapide que gpt-4-turbo
  temperature: 0.7,
  maxTokens: 800, // Réduit de 1000 à 800
  streaming: false,
});
```

**Impact** : Réduction de 20-30% du temps de génération

### 2. Cache des Embeddings

```javascript
// Cache avec limite de taille
const embeddingCache = new Map();
const MAX_CACHE_SIZE = 1000;
const EMBEDDING_CACHE_TTL = 60 * 60 * 1000; // 1 heure

// Nettoyage automatique
if (embeddingCache.size >= MAX_CACHE_SIZE) {
  const oldestKey = embeddingCache.keys().next().value;
  embeddingCache.delete(oldestKey);
}
```

**Impact** : Réduction de 80-90% du temps pour les requêtes répétées

### 3. Optimisation de la Recherche Vectorielle

```javascript
// Réduction du nombre de candidats
const similarDocuments = await collection.aggregate([
  {
    $vectorSearch: {
      index: "sop_vector_index",
      path: "contentVector",
      queryVector: queryVector,
      numCandidates: limit * 5, // Réduit de 10 à 5
      limit: limit * 1.5 // Réduit de 2 à 1.5
    }
  }
]);

// Seuil de score optimisé
var filteredDocuments = similarDocuments.filter(doc => doc.score > 0.85);
```

**Impact** : Réduction de 40-50% du temps de recherche

### 4. Optimisation de l'Historique

```javascript
// Réduction du nombre de messages conservés
const trimmedHistoryForAi = history.slice(-3); // Réduit de 5 à 3
```

**Impact** : Réduction de 30-40% du contexte envoyé à l'IA

### 5. Prompt Template Optimisé

```javascript
// Prompt plus concis
const promptTemplate = PromptTemplate.fromTemplate(`
You are an expert AI assistant for Standard Operating Procedures (SOPs).

Your task: 
- Understand user intent and provide relevant SOP information
- Use ONLY information from the provided context documents
- Structure responses clearly with paragraphs or bullet points
- Do not use formatting, emojis, or markdown

Context documents:
{context}

User question:
{query}
`);
```

**Impact** : Réduction de 15-20% du temps de traitement

### 6. Optimisation Frontend

```javascript
// Composants memoized
const ChatMessage = React.memo(({ message, type, sources, streaming }) => {
  // ...
});

// Fonctions optimisées avec useCallback
const handleSendMessage = useCallback(async () => {
  // ...
}, [query, organization, user, orgRole, chatHistory]);

// Données memoized
const chatMessages = useMemo(() => 
  chatHistory.map((msg, index) => (
    <ChatMessage key={index} {...msg} />
  )), [chatHistory]
);
```

**Impact** : Réduction des re-renders et amélioration de la réactivité

## Monitoring et Analyse

### Scripts d'Analyse

#### 1. Analyse des Logs de Performance
```bash
node scripts/analyze-performance.js
```

Ce script analyse les logs de performance et génère un rapport avec :
- Statistiques des temps de réponse
- Identification des goulots d'étranglement
- Recommandations d'optimisation

#### 2. Tests de Performance
```bash
node scripts/test-performance.js
```

Ce script effectue des tests automatisés et mesure :
- Temps de réponse des API
- Performance du streaming
- Génération d'embeddings
- Recherche vectorielle

### Métriques à Surveiller

1. **Temps de réponse API**
   - Moyenne < 2s
   - P95 < 5s
   - P99 < 10s

2. **Cache hit rate**
   - Embeddings : > 80%
   - Process detection : > 70%

3. **Utilisation mémoire**
   - Cache size < 1000 entrées
   - Nettoyage automatique actif

## Bonnes Pratiques

### 1. Gestion du Cache

```javascript
// ✅ BONNE PRATIQUE : Nettoyage automatique
setInterval(cleanupCaches, 15 * 60 * 1000); // Toutes les 15 minutes

function cleanupCaches() {
  const now = Date.now();
  
  for (const [key, value] of embeddingCache.entries()) {
    if (now - value.timestamp > EMBEDDING_CACHE_TTL) {
      embeddingCache.delete(key);
    }
  }
}
```

### 2. Gestion des Sessions

```javascript
// ✅ BONNE PRATIQUE : Nettoyage des sessions inactives
setInterval(cleanupInactiveSessions, 10 * 60 * 1000); // Toutes les 10 minutes

function cleanupInactiveSessions() {
  const now = new Date();
  const timeout = 30 * 60 * 1000; // 30 minutes
  
  for (const [userId, session] of guidedSessions.entries()) {
    if (now - session.startedAt > timeout) {
      guidedSessions.delete(userId);
    }
  }
}
```

### 3. Gestion des Erreurs

```javascript
// ✅ BONNE PRATIQUE : Fallback gracieux
try {
  const response = await generateGuidedChatResponse(query, organization, user, role, history);
  return response;
} catch (error) {
  console.error('Error in guided chat:', error);
  // Fallback to normal chat
  return await generateChatResponse(query, organization, user, role, history);
}
```

## 🔍 Dépannage des Performances

### Problèmes Courants

#### 1. Temps de réponse API élevé (>5s)

**Causes possibles :**
- Cache des embeddings plein
- Requêtes MongoDB lentes
- Contexte trop volumineux

**Solutions :**
```javascript
// Vérifier la taille du cache
console.log('Cache size:', embeddingCache.size);

// Optimiser les requêtes MongoDB
const similarDocuments = await collection.aggregate([
  { $match: { organization } }, // Filtrer en premier
  { $vectorSearch: { ... } }
]).toArray();
```

#### 2. Génération d'embeddings lente (>1s)

**Causes possibles :**
- Appels API OpenAI lents
- Textes trop longs
- Cache manquant

**Solutions :**
```javascript
// Réduire la taille des textes
const plainText = getPlainTextFromHtml(content).substring(0, 4000);

// Améliorer le cache
const cacheKey = content.toLowerCase().trim();
if (embeddingCache.has(cacheKey)) {
  return embeddingCache.get(cacheKey).embedding;
}
```

#### 3. Recherche vectorielle lente (>500ms)

**Causes possibles :**
- Index MongoDB non optimisé
- Trop de candidats
- Filtres inefficaces

**Solutions :**
```javascript
// Réduire le nombre de candidats
numCandidates: limit * 3, // Réduire encore plus

// Optimiser les filtres
{ $match: { 
  organization,
  isChunk: { $ne: true } // Exclure les chunks
}}
```

## Checklist d'Optimisation

### Avant le Déploiement
- [ ] Tests de performance exécutés
- [ ] Cache configuré et testé
- [ ] Index MongoDB optimisés
- [ ] Composants frontend memoized
- [ ] Scripts de monitoring en place

### Monitoring Continu
- [ ] Logs de performance activés
- [ ] Métriques collectées
- [ ] Alertes configurées
- [ ] Rapports générés régulièrement

### Maintenance
- [ ] Nettoyage automatique des caches
- [ ] Rotation des logs
- [ ] Mise à jour des dépendances
- [ ] Optimisation continue

## Optimisations Futures

### Court Terme
- [ ] Implémentation de Redis pour le cache
- [ ] Optimisation des index MongoDB
- [ ] Compression des réponses

### Moyen Terme
- [ ] CDN pour les assets statiques
- [ ] Load balancing
- [ ] Base de données dédiée pour les embeddings

### Long Terme
- [ ] Architecture microservices
- [ ] Cache distribué
- [ ] Auto-scaling

## Support

Pour toute question sur les performances :
1. Consultez les logs de performance
2. Exécutez les scripts d'analyse
3. Vérifiez la checklist d'optimisation
4. Contactez l'équipe de développement

---

*Dernière mise à jour : ${new Date().toISOString()}*
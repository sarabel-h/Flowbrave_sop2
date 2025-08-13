# PROFILING DES PERFORMANCES DU COPILOTE

Ce document explique comment utiliser le système de profiling pour analyser et optimiser les performances du copilote.

## Vue d'ensemble

Le système de profiling ajoute des timers détaillés sur toutes les fonctions clés pour identifier les goulots d'étranglement :

- **Temps total** de chaque requête
- **Temps par composant** (extraction, routing, prompt, réponse)
- **Analyse détaillée** par étape
- **Rapports automatiques** avec recommandations

## Installation et configuration

### 1. Vérifier que le profiling est activé

Le profiling est automatiquement activé dans le code. Vérifiez que les timers sont présents :

```javascript
// Dans lib/search.js
function startTimer(step) {
  const start = performance.now();
  console.log(`[PROFILING] START: ${step}`);
  return { start, step };
}
```

### 2. Installer les dépendances pour les tests

```bash
npm install node-fetch
```

## Exécution des tests de performance

### 1. Démarrer l'application

```bash
npm run dev
```

### 2. Exécuter les tests de performance

```bash
node scripts/test-performance.js
```

### 3. Analyser les logs de profiling

```bash
node scripts/analyze-profiling.js logs/profiling.log
```

## Interprétation des résultats

### Structure des logs

Les logs de profiling suivent ce format :

```
[PROFILING] START: generateEmbedding
[PROFILING] END: generateEmbedding - 245.67ms
[PROFILING] STEP: generateEmbedding (new) - 245.67ms
```

### Catégories de profiling

1. **PROFILING** - Fonctions principales du copilote
2. **API PROFILING** - Route API principale
3. **STREAMING PROFILING** - Route de streaming

### Métriques clés

| Métrique | Description | Seuil d'alerte |
|----------|-------------|----------------|
| **Temps total** | Durée complète de la requête | > 5000ms |
| **Embedding** | Génération d'embeddings | > 500ms |
| **Recherche vectorielle** | Recherche dans MongoDB | > 300ms |
| **Appel LLM** | Génération de réponse | > 2000ms |
| **Connexion DB** | Ouverture/fermeture DB | > 100ms |

## Analyse des goulots d'étranglement

### 1. Embeddings lents (> 500ms)

**Symptômes :**
```
[PROFILING] STEP: generateEmbedding (new) - 750.23ms
```

**Solutions :**
- ✅ Cache des embeddings déjà implémenté
- 🔄 Considérer un cache Redis
- 🔄 Optimiser la taille des chunks

### 2. Recherche vectorielle lente (> 300ms)

**Symptômes :**
```
[PROFILING] STEP: searchSimilarContent - vector search - 450.12ms
```

**Solutions :**
- 🔄 Optimiser les index MongoDB
- 🔄 Implémenter un cache de résultats
- 🔄 Réduire le nombre de candidats

### 3. Appels LLM lents (> 2000ms)

**Symptômes :**
```
[PROFILING] STEP: generateChatResponse - model invocation - 3500.45ms
```

**Solutions :**
- ✅ Modèle optimisé (gpt-4o-mini)
- 🔄 Optimiser les prompts
- 🔄 Réduire le contexte

### 4. Connexions DB lentes (> 100ms)

**Symptômes :**
```
[PROFILING] STEP: searchSimilarContent - DB connection - 150.67ms
```

**Solutions :**
- 🔄 Implémenter un pool de connexions
- 🔄 Optimiser la configuration MongoDB

## Optimisations recommandées

### 1. Cache Redis pour les embeddings

```javascript
// Implémenter un cache Redis
const redis = require('redis');
const client = redis.createClient();

async function getCachedEmbedding(content) {
  const key = `embedding:${content.hash()}`;
  const cached = await client.get(key);
  if (cached) return JSON.parse(cached);
  
  const embedding = await generateEmbedding(content);
  await client.setex(key, 3600, JSON.stringify(embedding));
  return embedding;
}
```

### 2. Pool de connexions MongoDB

```javascript
// Utiliser un pool de connexions
const { MongoClient } = require('mongodb');
const client = new MongoClient(uri, {
  maxPoolSize: 10,
  minPoolSize: 5
});
```

### 3. Cache des résultats de recherche

```javascript
// Cache des résultats de recherche
const searchCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedSearchResults(query, organization) {
  const key = `${query}_${organization}`;
  const cached = searchCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.results;
  }
  
  const results = await searchSimilarContent(query, organization);
  searchCache.set(key, { results, timestamp: Date.now() });
  return results;
}
```

## 🎯 Tests spécifiques

### Test d'une requête simple

```bash
# Test d'une requête normale
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Comment créer un SOP?",
    "organization": "test-org",
    "user": "test@example.com",
    "role": "admin",
    "useGuidedMode": false,
    "useStreaming": false
  }'
```

### Test du streaming

```bash
# Test du streaming
curl -X POST http://localhost:3000/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Guide-moi pour l'onboarding",
    "organization": "test-org",
    "user": "test@example.com",
    "role": "admin"
  }'
```

## Exemple de rapport

```
# RAPPORT DE PROFILING DU COPILOTE

## RÉSUMÉ GLOBAL
- **Durée totale mesurée:** 2847.23ms
- **Nombre total d'étapes:** 15
- **Durée moyenne par étape:** 189.81ms

## ANALYSE PAR CATÉGORIE

### PROFILING
- **Durée totale:** 2847.23ms
- **Nombre d'étapes:** 15
- **Durée moyenne:** 189.81ms

#### Détail des étapes:
| Étape | Compte | Total (ms) | Moyenne (ms) | Min (ms) | Max (ms) | P95 (ms) |
|-------|--------|------------|--------------|----------|----------|----------|
| generateEmbedding (new) | 1 | 245.67 | 245.67 | 245.67 | 245.67 | 245.67 |
| searchSimilarContent - vector search | 1 | 156.89 | 156.89 | 156.89 | 156.89 | 156.89 |
| generateChatResponse - model invocation | 1 | 2156.45 | 2156.45 | 2156.45 | 2156.45 | 2156.45 |

## IDENTIFICATION DES GOULOTS D'ÉTRANGLEMENT

### Étapes lentes (> 1000ms en moyenne):
| Catégorie | Étape | Moyenne (ms) | Compte | Total (ms) |
|-----------|-------|--------------|--------|------------|
| PROFILING | generateChatResponse - model invocation | 2156.45 | 1 | 2156.45 |

## RECOMMANDATIONS D'OPTIMISATION
- **LLM:** Considérer un modèle plus rapide ou optimiser les prompts
```

## Dépannage

### Problèmes courants

1. **Logs non générés**
   - Vérifier que l'application est en mode développement
   - Vérifier les permissions d'écriture des logs

2. **Temps anormalement élevés**
   - Vérifier la connectivité réseau
   - Vérifier les performances de la base de données
   - Vérifier les quotas API OpenAI

3. **Erreurs de parsing**
   - Vérifier le format des logs
   - Vérifier l'encodage des fichiers

### Commandes utiles

```bash
# Nettoyer les anciens logs
rm -f logs/*.log

# Surveiller les logs en temps réel
tail -f logs/profiling.log

# Analyser les logs les plus récents
ls -la logs/ | tail -5
```

## Ressources supplémentaires

- [Documentation MongoDB Performance](https://docs.mongodb.com/manual/core/performance/)
- [OpenAI API Rate Limits](https://platform.openai.com/docs/guides/rate-limits)
- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/performance/) 
# Configuration MongoDB Atlas pour la Recherche Vectorielle

Ce guide vous aide à configurer MongoDB Atlas pour utiliser les nouvelles fonctionnalités de recherche vectorielle.

## Prérequis

- ✅ Compte MongoDB Atlas
- ✅ Cluster M10+ (recommandé pour les fonctionnalités avancées)
- ✅ Atlas Search activé
- ✅ Vector Search activé

## Configuration Étape par Étape

### 1. Vérifier votre Cluster

1. Connectez-vous à [MongoDB Atlas](https://cloud.mongodb.com)
2. Sélectionnez votre projet
3. Vérifiez que votre cluster est en version **7.0+**
4. Assurez-vous d'avoir un cluster **M10+** (M0/M2/M5 ne supportent pas Vector Search)

### 2. Activer Atlas Search

1. Dans votre cluster, allez dans l'onglet **"Search"**
2. Cliquez sur **"Create Search Index"**
3. Choisissez **"JSON Editor"**
4. Utilisez cette configuration pour l'index vectoriel :

```json
{
  "mappings": {
    "dynamic": true,
    "fields": {
      "contentVector": {
        "dimensions": 1536,
        "similarity": "cosine",
        "type": "knnVector"
      }
    }
  }
}
```

5. Nommez l'index : `sop_vector_index`
6. Cliquez sur **"Create"**

### 3. Créer l'Index Textuel

1. Créez un autre index de recherche
2. Utilisez cette configuration :

```json
{
  "mappings": {
    "dynamic": true,
    "fields": {
      "title": {
        "type": "autocomplete",
        "tokenization": "standard",
        "foldDiacritics": false,
        "maxGrams": 7,
        "minGrams": 3
      },
      "content": {
        "type": "text",
        "analyzer": "lucene.standard"
      },
      "tags": {
        "type": "text",
        "analyzer": "lucene.standard"
      }
    }
  }
}
```

3. Nommez l'index : `sop_text_index`
4. Cliquez sur **"Create"**

### 4. Vérifier les Index

1. Attendez que les index soient créés (peut prendre 5-10 minutes)
2. Vérifiez le statut dans l'onglet **"Search"**
3. Les index doivent afficher **"Active"**

### 5. Tester la Configuration

Exécutez le script de vérification :

```bash
npm run check-indexes
```

## Configuration Alternative (Cluster M0/M2/M5)

Si vous avez un cluster de niveau inférieur, vous pouvez utiliser une version simplifiée :

### Index Vectoriel Simplifié

```json
{
  "mappings": {
    "dynamic": true,
    "fields": {
      "contentVector": {
        "dimensions": 1536,
        "similarity": "cosine",
        "type": "knnVector"
      }
    }
  }
}
```

### Index Textuel Simplifié

```json
{
  "mappings": {
    "dynamic": true,
    "fields": {
      "title": {
        "type": "text",
        "analyzer": "lucene.standard"
      },
      "content": {
        "type": "text",
        "analyzer": "lucene.standard"
      }
    }
  }
}
```

## Problèmes Courants

### Erreur "command not found"

**Cause :** Cluster ne supporte pas Vector Search
**Solution :** 
- Mettre à jour vers M10+
- Ou utiliser la version simplifiée

### Erreur "Index not found"

**Cause :** Index pas encore créé
**Solution :**
- Attendre 5-10 minutes
- Vérifier le statut dans Atlas
- Relancer le script de vérification

### Erreur "Dimensions mismatch"

**Cause :** Dimensions incorrectes
**Solution :**
- Vérifier que les dimensions sont 1536
- Recréer l'index avec les bonnes dimensions

## Monitoring

### Vérifier les Performances

1. Dans Atlas, allez dans **"Performance Advisor"**
2. Surveillez les requêtes lentes
3. Vérifiez l'utilisation des index

### Logs de l'Application

```javascript
// Activer les logs détaillés
console.log("DEBUG - Index status");
console.log("Vector index:", vectorIndexStatus);
console.log("Text index:", textIndexStatus);
```

## Migration des Données

Si vous avez des données existantes :

1. **Sauvegarder** vos données actuelles
2. **Recréer** les embeddings avec le nouveau modèle
3. **Mettre à jour** les documents avec les nouveaux vecteurs

```javascript
// Script de migration
const documents = await collection.find({}).toArray();
for (const doc of documents) {
  const newEmbedding = await generateEmbedding(doc.content);
  await collection.updateOne(
    { _id: doc._id },
    { $set: { contentVector: newEmbedding } }
  );
}
```

## Checklist de Configuration

- [ ] Cluster M10+ ou supérieur
- [ ] Atlas Search activé
- [ ] Vector Search activé
- [ ] Index vectoriel créé (`sop_vector_index`)
- [ ] Index textuel créé (`sop_text_index`)
- [ ] Index composés créés
- [ ] Test de connexion réussi
- [ ] Test de recherche réussi

## Support

Si vous rencontrez des problèmes :

1. **Documentation MongoDB Atlas :** https://docs.atlas.mongodb.com/
2. **Support Atlas :** Via le chat dans l'interface Atlas
3. **Communauté :** MongoDB Community Forums

## Prochaines Étapes

Une fois la configuration terminée :

1. **Tester** la recherche vectorielle
2. **Optimiser** les performances
3. **Surveiller** l'utilisation
4. **Former** l'équipe aux nouvelles fonctionnalités

Votre système de recherche vectorielle est maintenant prêt ! 
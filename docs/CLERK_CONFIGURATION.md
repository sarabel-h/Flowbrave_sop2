# Configuration de plusieurs comptes Clerk

Ce document explique comment configurer et utiliser plusieurs comptes Clerk dans votre application SOP-MVP.

## Vue d'ensemble

L'application est configurée pour utiliser automatiquement différents comptes Clerk selon l'environnement :
- **Production** : Utilise les clés de production (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`)
- **Développement** : Utilise les clés de développement (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_DEV`, `CLERK_SECRET_KEY_DEV`)
- **Test** : Utilise les clés de test (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_TEST`, `CLERK_SECRET_KEY_TEST`)

## Configuration

### 1. Créer le fichier .env.local

Créez un fichier `.env.local` à la racine du projet avec le contenu suivant :

```env
# Clés Clerk de production (compte existant)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_votre_cle_production
CLERK_SECRET_KEY=sk_test_votre_cle_production_secrete

# Nouvelles clés Clerk pour développement (nouveau compte)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_DEV=pk_test_votre_nouvelle_cle_publique
CLERK_SECRET_KEY_DEV=sk_test_votre_nouvelle_cle_secrete

# Autres variables d'environnement
MONGODB_URI=votre_uri_mongodb
BLOB_READ_WRITE_TOKEN=votre_token_blob
```

### 2. Utiliser le script de configuration

Exécutez le script de configuration pour vérifier votre setup :

```bash
node scripts/setup-clerk.js
```

Ce script vous indiquera :
- Si vos clés sont correctement configurées
- Quelles clés manquent
- Comment les ajouter

## Utilisation

### En développement

Quand vous lancez `npm run dev`, l'application utilisera automatiquement les clés de développement (`_DEV`).

### En production

En production, l'application utilisera les clés de production standard.

### Vérification

Pour vérifier quelle configuration est utilisée :

1. Ouvrez la console du navigateur
2. Lancez l'application
3. Regardez les logs qui affichent la configuration actuelle

## Structure des fichiers

- `lib/clerk-config.js` : Gestion centralisée de la configuration Clerk
- `app/layout.tsx` : Utilise la configuration selon l'environnement
- `next.config.mjs` : Expose les variables d'environnement
- `scripts/setup-clerk.js` : Script d'aide à la configuration

## Avantages

✅ **Séparation des environnements** : Vos comptes de dev et prod restent séparés
✅ **Pas de conflit** : L'ancienne configuration reste intacte
✅ **Flexibilité** : Facile d'ajouter d'autres environnements
✅ **Debugging** : Logs clairs pour identifier quelle configuration est utilisée

## Dépannage

### Problème : Les clés ne sont pas détectées

1. Vérifiez que le fichier `.env.local` existe
2. Redémarrez le serveur de développement
3. Vérifiez que les noms des variables sont exacts

### Problème : Mauvais compte utilisé

1. Vérifiez la variable `NODE_ENV`
2. En développement, assurez-vous que les clés `_DEV` sont définies
3. Consultez les logs dans la console du navigateur

### Problème : Erreur d'authentification

1. Vérifiez que les clés Clerk sont valides
2. Assurez-vous que le domaine est autorisé dans votre dashboard Clerk
3. Vérifiez que les webhooks sont configurés correctement

## Migration depuis l'ancienne configuration

Si vous aviez une configuration simple avant :

1. Gardez vos anciennes clés comme clés de production
2. Ajoutez vos nouvelles clés avec le suffixe `_DEV`
3. L'application utilisera automatiquement les bonnes clés selon l'environnement

## Support

Pour toute question sur cette configuration, consultez :
- La documentation Clerk : https://clerk.com/docs
- Les logs de l'application dans la console du navigateur
- Le script `scripts/setup-clerk.js` pour diagnostiquer les problèmes



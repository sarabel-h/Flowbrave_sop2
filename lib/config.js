// 🚀 CONFIGURATION DES OPTIMISATIONS COPILOT
export const COPILOT_CONFIG = {
  // Optimisations LangChain
  LANGCHAIN: {
    USE_STREAMING: true,           // Activer le streaming par défaut
    USE_OPTIMIZED_MODEL: true,     // Utiliser gpt-4o-mini au lieu de gpt-4-turbo
    MAX_TOKENS: 1000,              // Limiter les tokens pour plus de rapidité
    MAX_HISTORY_MESSAGES: 7,       // ✅ CORRIGÉ : Augmenter l'historique pour meilleur contexte
  },
  
  // Optimisations de cache
  CACHE: {
    ENABLE_EMBEDDING_CACHE: true,  // Cache des embeddings
    ENABLE_PROCESS_CACHE: true,    // Cache de détection de processus
    EMBEDDING_CACHE_TTL: 60 * 60 * 1000,    // 1 heure
    PROCESS_CACHE_TTL: 5 * 60 * 1000,       // 5 minutes
  },
  
  // Optimisations de recherche
  SEARCH: {
    USE_KEYWORD_FILTER: true,      // Filtrage par mots-clés avant IA
    MAX_SEARCH_RESULTS: 5,         // Limiter les résultats de recherche
    MIN_RELEVANCE_SCORE: 0.6,      // Score de pertinence minimum
  },
  
  // Optimisations de performance
  PERFORMANCE: {
    ENABLE_AUTO_CLEANUP: true,     // Nettoyage automatique des caches
    CLEANUP_INTERVAL: 15 * 60 * 1000, // 15 minutes
    SESSION_CLEANUP_INTERVAL: 10 * 60 * 1000, // 10 minutes
  }
};

// Fonction pour obtenir la configuration
export function getCopilotConfig() {
  return COPILOT_CONFIG;
}

// Fonction pour vérifier si une optimisation est activée
export function isOptimizationEnabled(category, setting) {
  return COPILOT_CONFIG[category]?.[setting] ?? false;
} 
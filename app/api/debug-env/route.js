import { NextResponse } from 'next/server';
import { debugEnvironmentVariables } from '@/lib/debug-env';

export async function GET() {
  try {
    // Afficher les variables d'environnement dans la console du serveur
    debugEnvironmentVariables();
    
    // Retourner un message de confirmation
    return NextResponse.json({
      message: 'Variables d\'environnement affichées dans la console du serveur',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erreur lors du debug des variables d\'environnement:', error);
    return NextResponse.json(
      { error: 'Erreur lors du debug des variables d\'environnement' },
      { status: 500 }
    );
  }
} 
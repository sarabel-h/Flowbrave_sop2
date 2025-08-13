import { NextResponse } from 'next/server';
import { advancedSearch } from '@/lib/search';

// PROFILING UTILITIES
function startTimer(step) {
  const start = performance.now();
  console.log(`[ADVANCED SEARCH API] START: ${step}`);
  return { start, step };
}

function endTimer(timer) {
  const end = performance.now();
  const duration = end - timer.start;
  console.log(`[ADVANCED SEARCH API] END: ${timer.step} - ${duration.toFixed(2)}ms`);
  return duration;
}

export async function POST(request) {
  const totalTimer = startTimer("Advanced Search API - Total Request");
  
  try {
    // Parse the request body
    const parseTimer = startTimer("Advanced Search API - Request parsing");
    const body = await request.json();
    const { 
      query, 
      organization, 
      user, 
      role, 
      limit = 10,
      tags = [],
      dateRange = null,
      contentType = null,
      minScore = 0.7,
      includeChunks = false
    } = body;
    endTimer(parseTimer);

    console.log("Advanced Search Request:", { 
      query, 
      organization, 
      user, 
      role,
      limit,
      tags,
      dateRange,
      contentType,
      minScore,
      includeChunks
    });
        
    // Validate input
    const validationTimer = startTimer("Advanced Search API - Input validation");
    if (!query || !organization) {
      endTimer(validationTimer);
      endTimer(totalTimer);
      return NextResponse.json(
        { error: 'Query and organization are required' },
        { status: 400 }
      );
    }
    endTimer(validationTimer);

    // Perform advanced search
    const searchTimer = startTimer("Advanced Search API - Search execution");
    const results = await advancedSearch(query, organization, user, role, {
      limit,
      tags,
      dateRange,
      contentType,
      minScore,
      includeChunks
    });
    endTimer(searchTimer);

    // Format response
    const responseTimer = startTimer("Advanced Search API - Response formatting");
    const formattedResponse = {
      results,
      metadata: {
        totalResults: results.length,
        query,
        filters: {
          tags,
          dateRange,
          contentType,
          minScore,
          includeChunks
        },
        searchTime: Date.now()
      }
    };
    endTimer(responseTimer);
    
    logStep("Advanced Search API - Total Request", endTimer(totalTimer));
    return NextResponse.json(formattedResponse);

  } catch (error) {
    console.error('Error in advanced search route:', error);
    logStep("Advanced Search API - Total Request (error)", endTimer(totalTimer));
    
    return NextResponse.json(
      { 
        error: 'Failed to perform advanced search',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Fonction utilitaire pour logger les étapes
function logStep(step, duration) {
  console.log(`[ADVANCED SEARCH API] STEP: ${step} - ${duration.toFixed(2)}ms`);
} 
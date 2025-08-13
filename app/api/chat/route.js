import { NextResponse } from 'next/server';
import { generateChatResponse, generateGuidedChatResponse, generateChatResponseStreaming } from '@/lib/search';
import { getCollection } from '@/lib/db';

// PROFILING UTILITIES
function startTimer(step) {
  const start = performance.now();
  console.log(`[API PROFILING] START: ${step}`);
  return { start, step };
}

function endTimer(timer) {
  const end = performance.now();
  const duration = end - timer.start;
  console.log(`[API PROFILING] END: ${timer.step} - ${duration.toFixed(2)}ms`);
  return duration;
}

function logStep(step, duration) {
  console.log(`[API PROFILING] STEP: ${step} - ${duration.toFixed(2)}ms`);
}

export async function POST(request) {
  const totalTimer = startTimer("API POST - Total Request");
  
  try {
    // Parse the request body
    const parseTimer = startTimer("API POST - Request parsing");
    const body = await request.json();
    const { query, organization, user, role, history = [], useGuidedMode = true, useStreaming = false } = body;
    endTimer(parseTimer);

    console.log("Role:", role);
    console.log("Guided mode:", useGuidedMode);
    console.log("Streaming mode:", useStreaming);
        
    // Validate input
    const validationTimer = startTimer("API POST - Input validation");
    if (!query || !organization) {
      endTimer(validationTimer);
      endTimer(totalTimer);
      return NextResponse.json(
        { error: 'Query and organization are required' },
        { status: 400 }
      );
    }
    endTimer(validationTimer);

    const userMessage = {
      type: 'user',
      message: query,
      organization: organization,
      user: user,
      createdAt: new Date(),
    };

    let response;

    // OPTIMIZED CHOICE: Streaming vs Guided vs Normal
    if (useStreaming) {
      // Use new streaming function
      console.log("Using streaming mode");
      const streamingTimer = startTimer("API POST - Streaming response generation");
      const streamingResponse = await generateChatResponseStreaming(query, organization, user, role, history);
      endTimer(streamingTimer);
      
      // Return streaming response
      endTimer(totalTimer);
      return new Response(streamingResponse.stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
        },
      });
    } else if (useGuidedMode) {
      // Use new guided function (with automatic fallback to your existing function)
      console.log("Using guided mode");
      const guidedTimer = startTimer("API POST - Guided response generation");
      response = await generateGuidedChatResponse(query, organization, user, role, history);
      endTimer(guidedTimer);
    } else {
      // Use your existing function directly
      console.log("Using normal chat");
      const normalTimer = startTimer("API POST - Normal response generation");
      response = await generateChatResponse(query, organization, user, role, history);
      endTimer(normalTimer);
    }

    const aiMessage = {
      type: 'ai',
      message: response.response,
      sources: response.sources,
      organization: organization,
      user: user,
      createdAt: new Date(),
      // New fields for guidance
      guidedMode: response.guidedMode || false,
      progress: response.progress || null,
      currentStep: response.currentStep || null,
      processTitle: response.processTitle || '',
      stepCompleted: response.stepCompleted || false,
      completed: response.completed || false
    };

    // Add response to db
    const dbTimer = startTimer("API POST - Database save");
    const { client, collection: chats } = await getCollection("chat");
    const inserted = await chats.insertMany([
      userMessage,
      aiMessage,
    ]);

    console.log("Chat inserted:", inserted);
    // Close the MongoDB connection
    client.close();
    endTimer(dbTimer);
        
    // Return the response with all new fields
    const responseTimer = startTimer("API POST - Response formatting");
    const finalResponse = NextResponse.json({
      response: response.response,
      sources: response.sources || [],
      // New fields for guidance (safe even if undefined)
      guidedMode: response.guidedMode || false,
      progress: response.progress || null,
      currentStep: response.currentStep || null,
      processTitle: response.processTitle || '',
      stepCompleted: response.stepCompleted || false,
      completed: response.completed || false
    });
    endTimer(responseTimer);
    
    logStep("API POST - Total Request", endTimer(totalTimer));
    return finalResponse;

  } catch (error) {
    console.error('Error in chat route:', error);
    
    // Fallback to normal chat on any error
    try {
      const fallbackTimer = startTimer("API POST - Error fallback");
      const body = await request.json();
      const { query, organization, user, role, history = [] } = body;
      
      const fallbackResponse = await generateChatResponse(query, organization, user, role, history);
      
      const userMessage = {
        type: 'user',
        message: query,
        organization: organization,
        user: user,
        createdAt: new Date(),
      };

      const aiMessage = {
        type: 'ai',
        message: fallbackResponse.response,
        sources: fallbackResponse.sources,
        organization: organization,
        user: user,
        createdAt: new Date(),
        guidedMode: false,
        fallback: true
      };

      // Save fallback to db
      const { client, collection: chats } = await getCollection("chat");
      await chats.insertMany([userMessage, aiMessage]);
      client.close();

      const fallbackResponseTimer = startTimer("API POST - Fallback response formatting");
      const finalResponse = NextResponse.json({
        response: fallbackResponse.response,
        sources: fallbackResponse.sources || [],
        guidedMode: false,
        fallback: true
      });
      endTimer(fallbackResponseTimer);
      
      endTimer(fallbackTimer);
      logStep("API POST - Total Request (fallback)", endTimer(totalTimer));
      return finalResponse;
    } catch (fallbackError) {
      logStep("API POST - Total Request (error)", endTimer(totalTimer));
      return NextResponse.json(
        { error: 'Failed to generate chat response' },
        { status: 500 }
      );
    }
  }
}
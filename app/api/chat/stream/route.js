import { NextResponse } from 'next/server';
import { generateChatResponseStreaming } from '@/lib/search';
import { getCollection } from '@/lib/db';

// PROFILING UTILITIES
function startTimer(step) {
  const start = performance.now();
  console.log(`[STREAMING PROFILING] START: ${step}`);
  return { start, step };
}

function endTimer(timer) {
  const end = performance.now();
  const duration = end - timer.start;
  console.log(`[STREAMING PROFILING] END: ${timer.step} - ${duration.toFixed(2)}ms`);
  return duration;
}

function logStep(step, duration) {
  console.log(`[STREAMING PROFILING] STEP: ${step} - ${duration.toFixed(2)}ms`);
}

export async function POST(request) {
  console.log("Copilot /chat/stream called");
  const totalTimer = startTimer("STREAMING API - Total Request");
  
  try {
    // Parse the request body
    const parseTimer = startTimer("STREAMING API - Request parsing");
    const body = await request.json();
    const { query, organization, user, role, history = [] } = body;
    endTimer(parseTimer);

    console.log("STREAMING - Starting streaming chat");
    console.log("Request payload:", { query, organization, user, role, historyLength: history?.length });
        
    // Validate input
    const validationTimer = startTimer("STREAMING API - Input validation");
    if (!query || !organization) {
      console.warn("Missing query or organization");
      endTimer(validationTimer);
      endTimer(totalTimer);
      return NextResponse.json(
        { error: 'Query and organization are required' },
        { status: 400 }
      );
    }
    if (!user) {
      console.warn("Missing user");
      endTimer(validationTimer);
      endTimer(totalTimer);
      return NextResponse.json(
        { error: 'User is required' },
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

    // Get streaming response
    const streamingTimer = startTimer("STREAMING API - Streaming response generation");
    console.log("Sending to generateChatResponseStreaming:", { query, organization, user, role, historyLength: history?.length });
    const streamingResponse = await generateChatResponseStreaming(query, organization, user, role, history);
    endTimer(streamingTimer);
    
    if (!streamingResponse) {
      console.error("streamingResponse is null");
      endTimer(totalTimer);
      return NextResponse.json(
        { error: 'Streaming response generation failed' },
        { status: 500 }
      );
    }
    
    if (!streamingResponse.stream) {
      console.error("streamingResponse.stream is null");
      endTimer(totalTimer);
      return NextResponse.json(
        { error: 'Stream is null' },
        { status: 500 }
      );
    }
    
    console.log("Streaming response generated successfully");
    
    // Create a readable stream from the LangChain stream
    const streamTimer = startTimer("STREAMING API - Stream creation");
    console.log("Creating ReadableStream for frontend");
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullResponse = '';
          const chunkTimer = startTimer("STREAMING API - Chunk processing");
          
          let chunkCount = 0;
          for await (const chunk of streamingResponse.stream) {
            const text = chunk;
            fullResponse += text;
            chunkCount++;
            
            // Send chunk to client
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: text })}\n\n`));
          }
          console.log(`📦 Processed ${chunkCount} chunks, total response length: ${fullResponse.length}`);
          endTimer(chunkTimer);
          
          // Send sources at the end
          const sourcesTimer = startTimer("STREAMING API - Sources sending");
          console.log("📚 Sending sources to frontend:", streamingResponse.sources?.length || 0, "sources");
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            sources: streamingResponse.sources,
            done: true 
          })}\n\n`));
          endTimer(sourcesTimer);
          
          // Save to database
          const dbTimer = startTimer("STREAMING API - Database save");
          console.log("💾 Saving chat messages to database");
          const aiMessage = {
            type: 'ai',
            message: fullResponse,
            sources: streamingResponse.sources,
            organization: organization,
            user: user,
            createdAt: new Date(),
            streaming: true
          };

          const { client, collection: chats } = await getCollection("chat");
          await chats.insertMany([userMessage, aiMessage]);
          client.close();
          console.log("✅ Chat messages saved to database");
          endTimer(dbTimer);
          
          controller.close();
          console.log("✅ Stream controller closed successfully");
        } catch (error) {
          console.error('❌ Error in streaming:', error);
          controller.error(error);
        }
      }
    });
    endTimer(streamTimer);

    logStep("STREAMING API - Total Request", endTimer(totalTimer));
    console.log("📤 Returning stream to frontend");
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('❌ Error in /chat/stream route:', error);
    logStep("STREAMING API - Total Request (error)", endTimer(totalTimer));
    return NextResponse.json(
      { error: 'Failed to generate streaming chat response' },
      { status: 500 }
    );
  }
} 
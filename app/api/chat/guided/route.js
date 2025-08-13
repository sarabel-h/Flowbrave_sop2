import { NextResponse } from 'next/server';
import { generateGuidedChatResponse } from '@/lib/search';
import { getCollection } from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { query, organization, user, role, history = [] } = body;

    console.log("🎯 GUIDED MODE - Request received:", { query, organization, user });

    // Validate input
    if (!query || !organization || !user) {
      return NextResponse.json(
        { error: 'Query, organization, and user are required' },
        { status: 400 }
      );
    }

    const userMessage = {
      type: 'user',
      message: query,
      organization: organization,
      user: user,
      createdAt: new Date(),
    };

    // Get guided response
    const guidedResponse = await generateGuidedChatResponse(query, organization, user, role, history);

    const aiMessage = {
      type: 'ai',
      message: guidedResponse.response,
      sources: guidedResponse.sources,
      organization: organization,
      user: user,
      createdAt: new Date(),
      guidedMode: guidedResponse.guidedMode || false,
      progress: guidedResponse.progress || null,
      currentStep: guidedResponse.currentStep || null,
      processTitle: guidedResponse.processTitle || '',
      stepCompleted: guidedResponse.stepCompleted || false,
      completed: guidedResponse.completed || false
    };

    // Save to database
    const { client, collection: chats } = await getCollection("chat");
    await chats.insertMany([userMessage, aiMessage]);
    client.close();

    return NextResponse.json({
      response: guidedResponse.response,
      sources: guidedResponse.sources || [],
      guidedMode: guidedResponse.guidedMode || false,
      progress: guidedResponse.progress || null,
      currentStep: guidedResponse.currentStep || null,
      processTitle: guidedResponse.processTitle || '',
      stepCompleted: guidedResponse.stepCompleted || false,
      completed: guidedResponse.completed || false
    });

  } catch (error) {
    console.error('❌ Error in guided chat route:', error);
    return NextResponse.json(
      { error: 'Failed to generate guided chat response' },
      { status: 500 }
    );
  }
} 
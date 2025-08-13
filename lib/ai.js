// This file is a helper 
// to utilize the OpenAI API

// Import the OpenAI library
import OpenAI from 'openai';

// Create a new OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to generate content using openAI
export async function generate(prompt) {

  // Create a new completion
  const completion = await client.chat.completions.create({
    
    // Define the model to be used
    model: 'gpt-4o',
    response_format: { type: "json_object" },
    
    // Define the messages to be sent to the model
    messages: [
      { 
        role: 'system', 
        content: 'You are a smart AI assistant that generates SOPs.'
      },
      { role: 'user', content: prompt },
    ],
  });

  // Return the content
  return completion.choices[0].message.content;
}
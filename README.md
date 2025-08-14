# Agents-MVP Documentation

## Running the Application

### Prerequisites
- Node.js installed on your system
- npm (Node Package Manager)

### Local Development
1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```
This will start the application in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### Authentication Flow
The application now supports public sign-up without invitation:

- **Sign In**: `/auth/login` - Login page for existing users
- **Sign Up**: `/auth/signup` - Public registration page (no invitation required)
- **Forgot Password**: `/auth/forgot-password` - Password recovery

Users can freely create accounts and get a 30-day free trial automatically.

### Other Available Scripts
- `npm run build`: Builds the application for production
- `npm start`: Runs the built application in production mode
- `npm run lint`: Runs the linter to check for code issues
- `npm run seed`: Seeds the database with initial SOP data

## Deploying on Vercel

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Visit [Vercel](https://vercel.com) and sign up/login

3. Import your repository:
   - Click "Import Project"
   - Select your repository
   - Vercel will automatically detect it as a Next.js project

4. Configure environment variables:
   - Add the following environment variables in Vercel's project settings:
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Your Clerk Publishable Key
     - `CLERK_SECRET_KEY`: Your Clerk Secret Key
     - `MONGODB_URI`: Your MongoDB Atlas URI
     - `BLOB_READ_WRITE_TOKEN`: Your Vercel Blob Read/Write Token
     - `OPENAI_API_KEY`: Your OpenAI API key
     - Any other environment variables required by your application

5. Deploy:
   - Click "Deploy"
   - Vercel will automatically build and deploy your application

## Modifying AI Prompts

The AI prompts are configured in the application's codebase. To modify them:

1. Navigate to `/app/api/generateSopWithAi/route.js` for the SOP generation logic
2. Navigate to `/lib/search.js` for the copilot logic

## Changing AI Models

Here how you can change the AI model for both SOP generation and Copilot:

### For SOP generation (Direct OpenAI Integration)
1. Open `/lib/ai.js`
2. Locate the client.chat.completions.create API calls (it's inside the `generate` function)
3. Modify the model parameter to use your desired model

### For Copilot (LangChain Integration)
1. Open `/lib/search.js`
2. Find the ChatOpenAI initialization (it's inside the `generateChatResponse` function)
3. Update the model configuration in the ChatOpenAI instance

Example of changing the model:
```javascript
const model = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
            modelName: "gpt-4o-mini",
    temperature: 0.7,
});
```

```javascript
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
```

Note: Make sure to use models that are compatible with your OpenAI API access and subscription level.
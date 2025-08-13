"use client"

import React from "react"
import { useEffect, useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"
import AppSidebar from "@/components/AppSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import ReactMarkdown from 'react-markdown'
import useAuth from "@/components/auth"
import { getRole } from "../../lib/access-control"
import remarkBreaks from 'remark-breaks';
import TrialDialog from "@/components/TrialDialog";
import BillingCheck from "@/components/BillingCheck";
import Loading from "@/components/Loading"


// ✅ OPTIMISÉ : Memoized ChatMessage component
const ChatMessage = React.memo(({ message, type, sources = [], streaming = false }) => {
  console.log("MESSAGE", message);
  return (
    <div className={`mb-4 flex ${type === 'user' ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] text-sm rounded-2xl p-5 message-shadow message-slide-in ${type === 'user' ? "user-message text-white" : "ai-message text-gray-800"}`}>
        <ReactMarkdown remarkPlugins={[remarkBreaks]} children={message} components={{ ol: ({ className, ...props }) => <ol className={`${className || ''} ms-4 my-5 space-y-5`} {...props}></ol> }} />
        
        {/* Streaming indicator */}
        {streaming && (
          <div className="inline-block ml-2">
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        
        {/* Related SOPs pills */}
        {type === 'ai' && sources && sources.length > 0 && !streaming && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-1">Related SOPs:</div>
            <div className="flex flex-wrap gap-1">
              {sources.map((source, idx) => (
                <span 
                  key={idx} 
                  className="bg-gray-200 text-gray-800 text-xs px-2 py-0.5 rounded-full"
                  title={source.title}
                >
                  {source.title.length > 20 ? source.title.substring(0, 20) + '...' : source.title}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
});

ChatMessage.displayName = 'ChatMessage';

// ✅ OPTIMISÉ : Memoized SearchResult component
const SearchResult = React.memo(({ result }) => {
  return (
    <div className="border rounded-lg p-3 mb-2 hover:bg-gray-50">
      <h3 className="font-medium">{result.title}</h3>
      <div className="text-sm text-gray-500 mt-1">
        {result.content?.substring(0, 150).replace(/<[^>]*>/g, '')}...
      </div>
      <div className="flex gap-1 mt-2">
        {result.tags?.map((tag, i) => (
          <span key={i} className="bg-gray-200 text-sm px-2 py-0.5 rounded-full">
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
});

SearchResult.displayName = 'SearchResult';

export default function Copilot() {
  const [query, setQuery] = useState("")
  const [chatHistory, setChatHistory] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  
  // Get user's organization ID
  const { user, orgRole, fallback } = useAuth({ authPage: false, shouldRedirect: true });
  
  const organization = user?.organizationMemberships?.[0]?.organization;

  // ✅ OPTIMISÉ : Memoized fetchChats function
  const fetchChats = useCallback(async () => {
    try {
      const response = await fetch(`/api/getChats?organization=${organization?.id}&user=${user?.emailAddresses[0].emailAddress}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }
  
      const data = await response.json();
      setChatHistory(data.chats || []);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  }, [organization?.id, user?.emailAddresses]);

  useEffect(() => {
    if (!fallback) fetchChats();
  }, [fallback, fetchChats]);

  // ✅ OPTIMISÉ : Memoized handleSendMessage function
  const handleSendMessage = useCallback(async () => {
    if (!query.trim() || !organization) return

    // Add user message to chat
    const updatedHistory = [...chatHistory, { message: query, type: 'user', sources: [] }];
    setChatHistory(updatedHistory);
    
    // Set searching state
    setIsSearching(true)

    console.log("orgRole", orgRole, getRole(orgRole));
    
    try {
      // 🚀 TRY STREAMING FIRST
      const useStreaming = true; // Enable streaming with guided mode support
      
      // Check if this query needs guided mode
      const shouldUseGuidedMode = needsGuidedMode(query);
      
      if (shouldUseGuidedMode) {
        console.log("🎯 Frontend: Using guided mode for query:", query);
        // Use guided endpoint
        const response = await fetch('/api/chat/guided', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: query,
            organization: organization?.id,
            user: user.emailAddresses[0].emailAddress,
            role: getRole(orgRole),
            history: chatHistory,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Guided chat request failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Add AI response to chat history with guided mode data
        setChatHistory(prev => [
          ...prev, 
          { 
            message: data.response, 
            type: 'ai',
            sources: data.sources || [],
            guidedMode: data.guidedMode,
            progress: data.progress,
            currentStep: data.currentStep,
            processTitle: data.processTitle,
            stepCompleted: data.stepCompleted,
            completed: data.completed
          }
        ]);
        
        // Set search results for reference
        setSearchResults(data.sources || []);
        
      } else if (useStreaming) {
        try {
          console.log("🚀 Frontend: Attempting streaming chat");
          // Use streaming endpoint
          const response = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: query,
            organization: organization?.id,
            user: user.emailAddresses[0].emailAddress,
            role: getRole(orgRole),
            history: chatHistory,
          }),
        });
        
        if (!response.ok) {
          console.error("❌ Frontend: Streaming failed with status:", response.status, response.statusText);
          throw new Error(`Streaming chat request failed: ${response.status} ${response.statusText}`);
        }
        
        console.log("✅ Frontend: Streaming response received successfully");
        
        // Handle streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let streamingMessage = '';
        let sources = [];
        
        // Add initial AI message placeholder
        setChatHistory(prev => [
          ...prev, 
          { 
            message: '', 
            type: 'ai',
            sources: [],
            streaming: true
          }
        ]);
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  
                  if (data.chunk) {
                    streamingMessage += data.chunk;
                    
                    // Update the streaming message
                    setChatHistory(prev => {
                      const newHistory = [...prev];
                      const lastMessage = newHistory[newHistory.length - 1];
                      if (lastMessage && lastMessage.type === 'ai' && lastMessage.streaming) {
                        lastMessage.message = streamingMessage;
                      }
                      return newHistory;
                    });
                  }
                  
                  if (data.sources) {
                    sources = data.sources;
                  }
                  
                  if (data.done) {
                    // Finalize the message
                    setChatHistory(prev => {
                      const newHistory = [...prev];
                      const lastMessage = newHistory[newHistory.length - 1];
                      if (lastMessage && lastMessage.type === 'ai' && lastMessage.streaming) {
                        lastMessage.message = streamingMessage;
                        lastMessage.sources = sources;
                        lastMessage.streaming = false;
                      }
                      return newHistory;
                    });
                    
                    // Set search results for reference
                    setSearchResults(sources || []);
                  }
                } catch (e) {
                  console.error('Error parsing streaming data:', e);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
        } catch (streamingError) {
          console.error("Frontend: Streaming failed, fallback to standard chat:", streamingError);
          console.log("Frontend: Attempting fallback to /api/chat");
          // Fallback to normal chat
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: query,
              organization: organization?.id,
              user: user.emailAddresses[0].emailAddress,
              role: getRole(orgRole),
              history: chatHistory,
              useStreaming: false,
            }),
          });
          
          if (!response.ok) {
            console.error("Frontend: Fallback chat also failed with status:", response.status, response.statusText);
            throw new Error(`Chat request failed: ${response.status} ${response.statusText}`)
          }
          
          console.log("Frontend: Fallback chat successful");
          const data = await response.json();
          
          // Add AI response to chat history with sources
          setChatHistory(prev => [
            ...prev, 
            { 
              message: data.response, 
              type: 'ai',
              sources: data.sources || []
            }
          ]);
          
          // Set search results for reference
          setSearchResults(data.sources || []);
        }
      } else {
        console.log("Frontend: Using standard chat (streaming disabled)");
        // Fallback to normal chat
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: query,
            organization: organization?.id,
            user: user.emailAddresses[0].emailAddress,
            role: getRole(orgRole),
            history: chatHistory,
            useStreaming: false,
          }),
        });
        
        if (!response.ok) {
          console.error("Frontend: Standard chat failed with status:", response.status, response.statusText);
          throw new Error(`Chat request failed: ${response.status} ${response.statusText}`)
        }
        
        console.log("Frontend: Standard chat successful");
        const data = await response.json();
        
        // Add AI response to chat history with sources
        setChatHistory(prev => [
          ...prev, 
          { 
            message: data.response, 
            type: 'ai',
            sources: data.sources || []
          }
        ]);
        
        // Set search results for reference
        setSearchResults(data.sources || []);
      }
      
    } catch (error) {
      console.error('Frontend: Final error in chat processing:', error)
      setChatHistory(prev => [
        ...prev, 
        { 
          message: "Sorry, I encountered an error while processing your request. Please try again later.", 
          type: 'ai',
          sources: []
        }
      ])
    } finally {
      setIsSearching(false)
      setQuery("")
    }
  }, [query, organization, user, orgRole, chatHistory]);

  // ✅ OPTIMISÉ : Memoized auto-scroll function
  const scrollToBottom = useCallback(() => {
    const chatContainer = document.querySelector('.overflow-y-auto');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, []);

  // ✅ NOUVEAU : Function to detect if query needs guided mode
  const needsGuidedMode = useCallback((query) => {
    const guidedKeywords = [
      'guide me', 'help me', 'how to', 'steps for', 'process for',
      'walk me through', 'show me how', 'explain how',
      'guide-moi', 'aide-moi', 'comment faire', 'étapes pour', 'processus pour',
      'can you guide', 'could you help', 'peux-tu m\'aider', 'pourrais-tu me guider'
    ];
    
    const lowerQuery = query.toLowerCase();
    return guidedKeywords.some(keyword => lowerQuery.includes(keyword));
  }, []);


  // ✅ OPTIMISÉ : Memoized chat messages
  const chatMessages = useMemo(() => 
    chatHistory.map((msg, index) => (
      <ChatMessage 
        key={index} 
        message={msg.message} 
        type={msg.type || 'user'} 
        sources={msg.sources}
        streaming={msg.streaming}
      />
    )), [chatHistory]
  );

  // Add useEffect for auto-scrolling
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, scrollToBottom]); // Scroll when chat history changes

  // Show loading state while auth is being checked
  if (fallback) {
    return <Loading screen={true} />;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-white w-full">
        {/* Sidebar */}
        <AppSidebar user={user} />

        {/* Main content */}
        <div className="flex flex-1 w-auto flex-col overflow-hidden">

          <div className="flex-1 overflow-auto p-4 md:p-6 md:px-12">
            <div className="flex h-full flex-col rounded-lg border">
              <div className="flex-1 overflow-y-auto p-4">
                
                {/* Chat messages */}
                {/* {console.log("chatHistory", chatHistory, chatHistory.reverse())} */}
                {chatMessages}
                
                {/* Loading indicator */}
                {isSearching && (
                  <div className="flex justify-start mb-4">
                    <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                      <div className="flex items-center">
                        <div className="animate-pulse mr-2 text-sm">Thinking</div>
                        <div className="flex space-x-1">
                          <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Input area */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask about any SOP..."
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1"
                    disabled={isSearching}
                  />
                  <Button onClick={handleSendMessage} disabled={isSearching}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  You can ask questions about all of your SOPs
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* For Trial use case handling */}
      <TrialDialog user={user} />

      {/* For checking user billing status */}
      <BillingCheck user={user} />

    </SidebarProvider>
  )
}


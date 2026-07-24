import { Message, Provider } from '../store/useAIStore';

export const fetchOllama = async (
  messages: Message[],
  provider: Provider,
  onChunk: (text: string) => void
): Promise<void> => {
  try {
    // We only send the role and content to the API
    const formattedMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Make the HTTP request to the Termux localhost server
    const response = await fetch(`${provider.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: provider.defaultModel,
        messages: formattedMessages,
        stream: false, // Set to false to avoid React Native fetch stream lockups
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    
    // Pass the completed text back to the store
    if (data.message && data.message.content) {
      onChunk(data.message.content);
    }
  } catch (error) {
    console.error('Ollama Fetch Error:', error);
    onChunk('\n[Error: Could not connect to Termux server. Is Ollama running?]');
  }
};


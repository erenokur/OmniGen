import { useAIStore } from '../store/useAIStore';
import { fetchOllama } from './ollama';

export const generateResponse = async () => {
  // Read current state directly from Zustand without React hooks
  const store = useAIStore.getState();
  const { 
    activeProviderId, 
    providers, 
    messages, 
    updateLastMessage, 
    setIsGenerating 
  } = store;

  // Find the selected provider configuration
  const provider = providers.find((p) => p.id === activeProviderId);
  
  if (!provider || messages.length === 0) return;
  
  // Ensure the last message is from the user before we generate a response
  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== 'user') return;

  setIsGenerating(true);

  try {
    if (provider.type === 'ollama') {
      await fetchOllama(messages, provider, (text) => {
        updateLastMessage(text);
      });
    } else {
      // Future-proofing for OpenAI/Anthropic routes
      console.warn(`Provider type ${provider.type} is not yet implemented.`);
    }
  } catch (error) {
    console.error('Router Error:', error);
  } finally {
    setIsGenerating(false);
  }
};


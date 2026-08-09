import { useAIStore } from '../store/useAIStore';
import { fetchOllama } from './ollama';

export const generateResponse = async () => {
  const store = useAIStore.getState();
  const { activeProviderId, providers, messages, updateLastMessage, replaceLastMessage, setIsGenerating } = store;

  const provider = providers.find((p) => p.id === activeProviderId);
  if (!provider || messages.length === 0) return;
  
  if (messages[messages.length - 1].role !== 'user') return;

  setIsGenerating(true);
  replaceLastMessage("⏳ Ollama'ya bağlanıyor...");

  try {
    if (provider.type === 'ollama') {
      let hasStarted = false;
      await fetchOllama(
        messages,
        provider,
        (text) => {
          if (!hasStarted) {
            replaceLastMessage(text);
            hasStarted = true;
            return;
          }
          updateLastMessage(text);
        },
        () => {
          if (!hasStarted) {
            replaceLastMessage('⚠️ Model yanıtı boş döndü.');
          }
        },
        (errorText) => replaceLastMessage(`❌ ${errorText}`)
      );
    } else {
      console.warn("Cloud API henüz yazılmadı.");
    }
  } catch (error: any) {
    replaceLastMessage(`❌ Sistem Hatası: ${error.message}`);
  } finally {
    setIsGenerating(false);
  }
};

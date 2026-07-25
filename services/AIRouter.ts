import { useAIStore } from '../store/useAIStore';
import { fetchOllama } from './ollama';

export const generateResponse = async () => {
  const store = useAIStore.getState();
  const { activeProviderId, providers, messages, replaceLastMessage, setIsGenerating } = store;

  const provider = providers.find((p) => p.id === activeProviderId);
  if (!provider || messages.length === 0) return;
  
  if (messages[messages.length - 1].role !== 'user') return;

  setIsGenerating(true);
  replaceLastMessage("⏳ Termux'a bağlanıyor..."); // Kullanıcıya geri bildirim veriyoruz

  try {
    if (provider.type === 'ollama') {
      await fetchOllama(
        messages,
        provider,
        (text) => replaceLastMessage(text), // Başarılı olursa bekleme metnini sil ve cevabı yaz
        (errorText) => replaceLastMessage(`❌ ${errorText}`) // Hata olursa hatayı ekrana bas
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

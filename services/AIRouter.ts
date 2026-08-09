import { useAIStore } from '../store/useAIStore';
import { fetchOllama } from './ollama';

export const generateResponse = async () => {
  const store = useAIStore.getState();
  const { activeProviderId, providers, messages, updateLastMessage, replaceLastMessage, setIsGenerating } = store;

  const provider = providers.find((p) => p.id === activeProviderId);
  if (!provider || messages.length === 0) return;
  
  if (messages[messages.length - 1].role !== 'user') return;

  setIsGenerating(true);
  const MAX_WAIT_SECONDS = 5 * 60;
  let hasStarted = false;
  let isTimedOut = false;
  const formatRemaining = (remainingSeconds: number) => {
    const safeSeconds = Math.max(remainingSeconds, 0);
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };
  replaceLastMessage(`⏳ Yanıt bekleniyor (${formatRemaining(MAX_WAIT_SECONDS)})`);

  try {
    if (provider.type === 'ollama') {
      const controller = new AbortController();
      let secondsLeft = MAX_WAIT_SECONDS;
      const countdownId = setInterval(() => {
        if (hasStarted || isTimedOut) return;

        secondsLeft -= 1;
        replaceLastMessage(`⏳ Yanıt bekleniyor (${formatRemaining(secondsLeft)})`);

        if (secondsLeft <= 0) {
          clearInterval(countdownId);
          const latestMessages = useAIStore.getState().messages;
          const lastMessage = latestMessages[latestMessages.length - 1];
          const stillWaiting =
            lastMessage?.role === 'assistant' &&
            lastMessage.content.startsWith('⏳ Yanıt bekleniyor');

          controller.abort();
          isTimedOut = true;
          replaceLastMessage(
            stillWaiting
              ? '❌ 5 dakika doldu. Modelden yanıt alınamadı.'
              : lastMessage?.content || '❌ 5 dakika doldu. Modelden yanıt alınamadı.'
          );
        }
      }, 1000);

      await fetchOllama(
        messages,
        provider,
        (text) => {
          if (isTimedOut) return;
          if (!hasStarted) {
            replaceLastMessage(text);
            hasStarted = true;
            return;
          }
          updateLastMessage(text);
        },
        () => {
          clearInterval(countdownId);
          if (isTimedOut) return;
          if (!hasStarted) {
            replaceLastMessage('⚠️ Model yanıtı boş döndü.');
          }
        },
        (errorText) => {
          clearInterval(countdownId);
          if (isTimedOut) return;
          replaceLastMessage(`❌ ${errorText}`);
        },
        controller.signal
      );
      clearInterval(countdownId);
    } else {
      console.warn("Cloud API henüz yazılmadı.");
      replaceLastMessage('❌ Cloud API henüz yazılmadı.');
    }
  } catch (error: any) {
    replaceLastMessage(`❌ Sistem Hatası: ${error.message}`);
  } finally {
    setIsGenerating(false);
  }
};

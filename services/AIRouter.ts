import { useAIStore } from '../store/useAIStore';
import { fetchOllama } from './ollama';

export const generateResponse = async () => {
  const store = useAIStore.getState();
  const { activeProviderId, providers, messages, addMessage, setIsGenerating } = store;

  const provider = providers.find((p) => p.id === activeProviderId);
  if (!provider || messages.length === 0) return;

  const requestMessages = messages.filter(
    (message) =>
      !(
        message.role === 'assistant' &&
        (message.content.startsWith('⏳') ||
          message.content.startsWith('❌') ||
          message.content.startsWith('⚠️ Model yanıtı boş döndü.'))
      )
  );
  const hasUserMessage = requestMessages.some((message) => message.role === 'user');
  if (!hasUserMessage) return;

  setIsGenerating(true);
  const MAX_WAIT_MINUTES = 5;
  let waitingMinute = 0;
  let isFinished = false;
  let responseBuffer = '';

  try {
    if (provider.type === 'ollama') {
      const controller = new AbortController();
      const countdownId = setInterval(() => {
        if (isFinished) return;
        waitingMinute += 1;
        addMessage({
          id: Date.now().toString(),
          role: 'assistant',
          content: `⏳ Yanıt bekleniyor (${waitingMinute}/${MAX_WAIT_MINUTES})`,
        });
        if (waitingMinute >= MAX_WAIT_MINUTES) {
          clearInterval(countdownId);
          isFinished = true;
          controller.abort();
          addMessage({
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: '❌ 5 dakika doldu. Modelden yanıt alınamadı.',
          });
        }
      }, 60_000);
      try {
        await fetchOllama(
          requestMessages,
          provider,
          (text) => {
            if (isFinished) return;
            responseBuffer += text;
          },
          () => {
            clearInterval(countdownId);
            if (isFinished) return;
            isFinished = true;
            addMessage({
              id: Date.now().toString(),
              role: 'assistant',
              content: responseBuffer.trim() ? responseBuffer : '⚠️ Model yanıtı boş döndü.',
            });
          },
          (errorText) => {
            clearInterval(countdownId);
            if (isFinished) return;
            isFinished = true;
            addMessage({
              id: Date.now().toString(),
              role: 'assistant',
              content: `❌ ${errorText}`,
            });
          },
          controller.signal
        );
      } finally {
        clearInterval(countdownId);
      }
    } else {
      console.warn("Cloud API henüz yazılmadı.");
      addMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: '❌ Cloud API henüz yazılmadı.',
      });
    }
  } catch (error: any) {
    addMessage({
      id: Date.now().toString(),
      role: 'assistant',
      content: `❌ Sistem Hatası: ${error.message}`,
    });
  } finally {
    setIsGenerating(false);
  }
};

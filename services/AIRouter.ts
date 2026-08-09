import { useAIStore } from '../store/useAIStore';
import { fetchOllama } from './ollama';

const createMessageId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const generateResponse = async () => {
  const store = useAIStore.getState();
  const { activeProviderId, providers, messages, addMessage, removeStatusMessages, setIsGenerating } = store;

  const provider = providers.find((p) => p.id === activeProviderId);
  if (!provider || messages.length === 0) {
    removeStatusMessages();
    return;
  }

  const requestMessages = messages.filter((message) => message.kind !== 'status');
  if (requestMessages[requestMessages.length - 1]?.role !== 'user') {
    removeStatusMessages();
    return;
  }

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
          id: createMessageId(),
          role: 'assistant',
          content: `⏳ Yanıt bekleniyor (${waitingMinute}/${MAX_WAIT_MINUTES})`,
          kind: 'status',
        });
        if (waitingMinute >= MAX_WAIT_MINUTES) {
          clearInterval(countdownId);
          isFinished = true;
          controller.abort();
          removeStatusMessages();
          addMessage({
            id: createMessageId(),
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
            removeStatusMessages();
            addMessage({
              id: createMessageId(),
              role: 'assistant',
              content: responseBuffer.trim() ? responseBuffer : '⚠️ Model yanıtı boş döndü.',
            });
          },
          (errorText) => {
            clearInterval(countdownId);
            if (isFinished) return;
            isFinished = true;
            removeStatusMessages();
            addMessage({
              id: createMessageId(),
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
      removeStatusMessages();
      addMessage({
        id: createMessageId(),
        role: 'assistant',
        content: '❌ Cloud API henüz yazılmadı.',
      });
    }
  } catch (error: any) {
    removeStatusMessages();
    addMessage({
      id: createMessageId(),
      role: 'assistant',
      content: `❌ Sistem Hatası: ${error.message}`,
    });
  } finally {
    setIsGenerating(false);
  }
};

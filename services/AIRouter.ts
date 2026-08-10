import { useAIStore } from '../store/useAIStore';
import { fetchOllama } from './ollama';
import { createMessageId } from '../utils/messageId';
let activeController: AbortController | null = null;
let isStoppedByUser = false;

const stripJsonCodeFence = (text: string) => {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced?.[1]?.trim() ?? trimmed;
};

const extractReadableTextFromJson = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const text = value.trim();
    return text.length > 0 ? text : null;
  }

  if (Array.isArray(value)) {
    const parts = value
      .map((item) => extractReadableTextFromJson(item))
      .filter((item): item is string => typeof item === 'string' && item.length > 0);
    return parts.length > 0 ? parts.join('\n') : null;
  }

  if (!value || typeof value !== 'object') return null;

  const objectValue = value as Record<string, unknown>;
  const preferredKeys = ['text', 'response', 'content', 'output', 'answer', 'result', 'message'];
  for (const key of preferredKeys) {
    const extracted = extractReadableTextFromJson(objectValue[key]);
    if (extracted) return extracted;
  }

  return null;
};

const toReadableAssistantText = (rawText: string) => {
  const candidate = stripJsonCodeFence(rawText);
  if (!candidate) return rawText;

  try {
    const parsed = JSON.parse(candidate);
    return extractReadableTextFromJson(parsed) ?? rawText;
  } catch {
    return rawText;
  }
};

export const stopGeneration = () => {
  if (!activeController) return;
  isStoppedByUser = true;
  activeController.abort();
};

export const generateResponse = async () => {
  if (activeController) return;

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
  let hasResponseStarted = false;
  let fullAssistantResponse = '';
  isStoppedByUser = false;

  try {
    if (provider.type === 'ollama') {
      const controller = new AbortController();
      activeController = controller;
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
            content: `❌ ${MAX_WAIT_MINUTES} dakika doldu. Modelden yanıt alınamadı.`,
          });
        }
      }, 60_000);
      try {
        await fetchOllama(
          requestMessages,
          provider,
          (text) => {
            if (isFinished) return;
            fullAssistantResponse += text;
            if (!hasResponseStarted) {
              hasResponseStarted = true;
              clearInterval(countdownId);
              removeStatusMessages();
              addMessage({
                id: createMessageId(),
                role: 'assistant',
                content: '✅ Yanıt geldi, yazılıyor...',
                kind: 'status',
              });
              addMessage({
                id: createMessageId(),
                role: 'assistant',
                content: text,
              });
              return;
            }
            useAIStore.getState().updateLastMessage(text);
          },
          () => {
            clearInterval(countdownId);
            if (isFinished) return;
            isFinished = true;
            if (!hasResponseStarted) {
              removeStatusMessages();
              addMessage({
                id: createMessageId(),
                role: 'assistant',
                content: '⚠️ Model yanıtı boş döndü.',
              });
              return;
            }
            const normalizedText = toReadableAssistantText(fullAssistantResponse);
            if (normalizedText !== fullAssistantResponse) {
              useAIStore.getState().replaceLastMessage(normalizedText);
            }
            removeStatusMessages();
          },
          (errorText) => {
            clearInterval(countdownId);
            if (isFinished) return;
            isFinished = true;
            removeStatusMessages();
            addMessage({
              id: createMessageId(),
              role: 'assistant',
              content: isStoppedByUser ? '⏹️ Yanıt durduruldu.' : `❌ ${errorText}`,
            });
          },
          controller.signal
        );
      } finally {
        clearInterval(countdownId);
        activeController = null;
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
    activeController = null;
    setIsGenerating(false);
  }
};

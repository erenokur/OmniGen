import { Message, Provider } from '../store/useAIStore';

export const fetchOllama = async (
  messages: Message[],
  provider: Provider,
  onChunk: (text: string) => void,
  onComplete: () => void,
  onError: (text: string) => void,
  signal?: AbortSignal
): Promise<void> => {
  let isCompleted = false;
  const safeComplete = () => {
    if (isCompleted) return;
    isCompleted = true;
    onComplete();
  };

  try {
    const formattedMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const baseUrl = provider.baseUrl.replace(/\/+$/, '');
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: provider.defaultModel,
        messages: formattedMessages,
        stream: true,
      }),
      signal,
    });

    if (!response.ok) {
      const rawText = await response.text();
      onError(`HTTP Hatası ${response.status}:\n${rawText}`);
      return;
    }

    if (!response.body) {
      const rawText = await response.text();
      try {
        const data = JSON.parse(rawText);
        if (data.message?.content) {
          onChunk(data.message.content);
          safeComplete();
        } else if (data.error) {
          onError(data.error);
        } else {
          onError(`Beklenmeyen Format:\n${rawText.substring(0, 100)}`);
        }
      } catch {
        onError(`JSON Çözülemedi:\n${rawText.substring(0, 100)}`);
      }
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const data = JSON.parse(trimmed);
          if (data.error) {
            onError(data.error);
            return;
          }
          if (data.message?.content) {
            onChunk(data.message.content);
          }
          if (data.done) {
            safeComplete();
            return;
          }
        } catch {
          onError(`JSON Çözülemedi:\n${trimmed.substring(0, 100)}`);
          return;
        }
      }
    }

    if (buffer.trim()) {
      try {
        const data = JSON.parse(buffer.trim());
        if (data.error) {
          onError(data.error);
          return;
        }
        if (data.message?.content) {
          onChunk(data.message.content);
        }
      } catch {
        onError(`JSON Çözülemedi:\n${buffer.trim().substring(0, 100)}`);
        return;
      }
    }

    safeComplete();
  } catch (error: any) {
    if (error.name === 'AbortError') {
      onError('İstek iptal edildi veya zaman aşımına uğradı.');
      return;
    }
    onError(`Ağ Hatası:\n${error.message}\nBase URL'i ve Ollama servis durumunu kontrol edin.`);
  }
};

export const fetchOllamaModels = async (baseUrl: string): Promise<string[]> => {
  try {
    const cleanedBaseUrl = baseUrl.replace(/\/+$/, '');
    const response = await fetch(`${cleanedBaseUrl}/api/tags`);
    const rawText = await response.text();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${rawText}`);
    }

    const data = JSON.parse(rawText);
    const models = Array.isArray(data.models)
      ? data.models
          .map((item: any) => item?.model)
          .filter((name: unknown): name is string => typeof name === 'string' && name.trim().length > 0)
      : [];

    return Array.from(new Set<string>(models));
  } catch (error: any) {
    throw new Error(`Ollama model listesi alınamadı: ${error.message}`);
  }
};

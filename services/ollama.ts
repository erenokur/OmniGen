import { Message, Provider } from '../store/useAIStore';

export const fetchOllama = async (
  messages: Message[],
  provider: Provider,
  onSuccess: (text: string) => void,
  onError: (text: string) => void
): Promise<void> => {
  try {
    const formattedMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await fetch(`${provider.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: provider.defaultModel,
        messages: formattedMessages,
        stream: false,
      }),
    });

    // Parse etmeden önce veriyi düz metin olarak alıyoruz
    const rawText = await response.text();

    if (!response.ok) {
      onError(`HTTP Hatası ${response.status}:\n${rawText}`);
      return;
    }

    try {
      const data = JSON.parse(rawText);
      if (data.message && data.message.content) {
        onSuccess(data.message.content); // Başarılıysa içeriği bas
      } else {
        onError(`Beklenmeyen Format:\n${rawText.substring(0, 100)}`);
      }
    } catch (e) {
      onError(`JSON Çözülemedi:\n${rawText.substring(0, 100)}`);
    }

  } catch (error: any) {
    onError(`Ağ Hatası:\n${error.message}\nIP adresini ve OLLAMA_HOST=0.0.0.0 ayarını kontrol edin.`);
  }
};

import React, { useState } from 'react';
import { 
  View, TextInput, TouchableOpacity, FlatList, StyleSheet, Text, 
  ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAIStore } from '../store/useAIStore';
import { generateResponse } from '../services/AIRouter';
import { ChatBubble } from '../components/ChatBubble';
import { ProviderMenu } from '../components/ProviderMenu';

export default function ChatScreen() {
  const [inputText, setInputText] = useState('');
  const insets = useSafeAreaInsets();
  const { messages, addMessage, isGenerating, activeProviderId } = useAIStore();

  const handleSend = async () => {
    if (!inputText.trim() || isGenerating) return;

    addMessage({ id: Date.now().toString(), role: 'user', content: inputText.trim() });
    setInputText('');
    Keyboard.dismiss();

    addMessage({ id: (Date.now() + 1).toString(), role: 'assistant', content: '⏳ Bağlanıyor...' });
    await generateResponse();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
            <ProviderMenu />
          </View>

          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ChatBubble message={item} />}
            contentContainerStyle={styles.listContent}
          />

          <View style={[styles.inputWrapper, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder={activeProviderId ? "Mesaj yaz..." : "Sağlayıcı seçin"}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
              {isGenerating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.sendButtonText}>Gönder</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { padding: 16, borderBottomWidth: 1, borderColor: '#E5E5EA', backgroundColor: '#FFF' },
  listContent: { paddingVertical: 16 },
  inputWrapper: { flexDirection: 'row', padding: 12, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#E5E5EA', alignItems: 'flex-end' },
  input: { flex: 1, backgroundColor: '#F2F2F7', borderRadius: 20, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, minHeight: 40, maxHeight: 120, fontSize: 16 },
  sendButton: { backgroundColor: '#007AFF', borderRadius: 20, paddingHorizontal: 16, height: 40, justifyContent: 'center', marginLeft: 8 },
  sendButtonText: { color: '#FFF', fontWeight: '600' }
});

import React, { useState } from 'react';
import { 
  View, TextInput, TouchableOpacity, FlatList, StyleSheet, Text, 
  KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback, Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAIStore } from '../store/useAIStore';
import { generateResponse, stopGeneration } from '../services/AIRouter';
import { ChatBubble } from '../components/ChatBubble';
import { ProviderMenu } from '../components/ProviderMenu';
import { createMessageId } from '../utils/messageId';

export default function ChatScreen() {
  const [inputText, setInputText] = useState('');
  const insets = useSafeAreaInsets();
  const { messages, addMessage, isGenerating, activeProviderId, clearMessages, resetAppState } = useAIStore();

  const handleSend = async () => {
    if (!inputText.trim() || isGenerating) return;

    addMessage({ id: createMessageId(), role: 'user', content: inputText.trim() });
    setInputText('');
    Keyboard.dismiss();

    addMessage({ id: createMessageId(), role: 'assistant', content: '⏳ Bekleyin...', kind: 'status' });
    await generateResponse();
  };

  const handleStop = () => {
    if (!isGenerating) return;
    stopGeneration();
  };

  const handleResetApp = () => {
    Alert.alert(
      'Uygulamayı sıfırla',
      'Tüm mesajlar ve sağlayıcı bilgileri silinecek. Devam etmek istiyor musunuz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: () => {
            if (isGenerating) {
              stopGeneration();
            }
            resetAppState();
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
            <View style={styles.headerContent}>
              <ProviderMenu />
              <View style={styles.headerActions}>
                <TouchableOpacity style={[styles.clearButton, isGenerating && styles.clearButtonDisabled]} onPress={clearMessages} disabled={isGenerating}>
                  <Text style={styles.clearButtonText}>Temizle</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.resetButton} onPress={handleResetApp}>
                  <Text style={styles.resetButtonText}>Sıfırla</Text>
                </TouchableOpacity>
              </View>
            </View>
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
            <TouchableOpacity style={styles.sendButton} onPress={isGenerating ? handleStop : handleSend}>
              {isGenerating ? <Text style={styles.sendButtonText}>Durdur</Text> : <Text style={styles.sendButtonText}>Gönder</Text>}
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
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  clearButton: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#FFE5E5', borderRadius: 8 },
  clearButtonDisabled: { opacity: 0.5 },
  clearButtonText: { color: '#D11A2A', fontWeight: '600' },
  resetButton: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#FFEFD6', borderRadius: 8 },
  resetButtonText: { color: '#A75A00', fontWeight: '600' },
  listContent: { paddingVertical: 16 },
  inputWrapper: { flexDirection: 'row', padding: 12, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#E5E5EA', alignItems: 'flex-end' },
  input: { flex: 1, backgroundColor: '#F2F2F7', borderRadius: 20, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, minHeight: 40, maxHeight: 120, fontSize: 16 },
  sendButton: { backgroundColor: '#007AFF', borderRadius: 20, paddingHorizontal: 16, height: 40, justifyContent: 'center', marginLeft: 8 },
  sendButtonText: { color: '#FFF', fontWeight: '600' }
});

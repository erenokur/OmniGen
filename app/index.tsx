import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  Text,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAIStore } from '../store/useAIStore';
import { generateResponse } from '../services/AIRouter';
import { ChatBubble } from '../components/ChatBubble';
import { ProviderMenu } from '../components/ProviderMenu';

export default function ChatScreen() {
  const [inputText, setInputText] = useState('');
  
  const { messages, addMessage, isGenerating } = useAIStore();

  const handleSend = async () => {
    if (!inputText.trim() || isGenerating) return;

    addMessage({
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
    });

    setInputText('');

    addMessage({
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
    });

    await generateResponse();
  };

     return (
    // 1. Removed 'bottom' from edges so it doesn't conflict with the keyboard
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView 
        style={styles.container} 
        // 2. Force behavior for Android
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        // Optional: add keyboardVerticalOffset if it still overlaps slightly
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.header}>
          <ProviderMenu />
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ChatBubble message={item} />}
          contentContainerStyle={styles.listContent}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Message local Ollama..."
            multiline
            maxLength={1000}
          />
          <TouchableOpacity 
            style={[styles.sendButton, (!inputText.trim() || isGenerating) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.sendButtonText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F2F7', // Arka plan rengini bütüne yaymak için
  },
  container: {
    flex: 1,
  },
  header: { 
    padding: 16, 
    borderBottomWidth: 1, 
    borderColor: '#E5E5EA', 
    alignItems: 'flex-end', 
    backgroundColor: '#FFF' 
  },
  listContent: {
    paddingVertical: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    minHeight: 40,
    maxHeight: 120,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 40,
    justifyContent: 'center',
    marginLeft: 8,
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#A1C6EA',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});


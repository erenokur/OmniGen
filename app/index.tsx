import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  Text,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAIStore } from '../store/useAIStore';
import { generateResponse } from '../services/AIRouter';
import { ChatBubble } from '../components/ChatBubble';
import { ProviderMenu } from '../components/ProviderMenu';

export default function ChatScreen() {
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  
  // State from Zustand
  const { messages, addMessage, isGenerating, activeProviderId } = useAIStore();
  
  // Dynamically calculate the phone's physical bounds
  const insets = useSafeAreaInsets();

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || isGenerating) return;

    addMessage({
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
    });

    setInputText('');
    
    // Optional: Dismiss keyboard on send for a cleaner view
    // Keyboard.dismiss();

    addMessage({
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
    });

    await generateResponse();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      // Force padding on BOTH iOS and Android because of edgeToEdgeEnabled: true
      behavior="padding"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.innerContainer}>
          
          {/* Header: Manual top padding handles the notch */}
          <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
            <ProviderMenu />
          </View>

          {/* Chat Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ChatBubble message={item} />}
            contentContainerStyle={styles.listContent}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />

          {/* Input Area: Manual bottom padding handles the home indicator when keyboard is closed */}
          <View style={[styles.inputWrapper, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder={activeProviderId ? "Type a message..." : "Add a provider first"}
              multiline
              maxLength={1000}
              editable={!!activeProviderId}
            />
            <TouchableOpacity 
              style={[styles.sendButton, (!inputText.trim() || isGenerating || !activeProviderId) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim() || isGenerating || !activeProviderId}
            >
              {isGenerating ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.sendButtonText}>Send</Text>
              )}
            </TouchableOpacity>
          </View>

        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F2F2F7' 
  },
  innerContainer: {
    flex: 1,
  },
  header: { 
    padding: 16, 
    paddingBottom: 12,
    borderBottomWidth: 1, 
    borderColor: '#E5E5EA', 
    backgroundColor: '#FFF', 
    alignItems: 'flex-end' 
  },
  listContent: { 
    paddingVertical: 16,
    paddingHorizontal: 8
  },
  inputWrapper: { 
    flexDirection: 'row', 
    padding: 12, 
    backgroundColor: '#FFFFFF', 
    borderTopWidth: 1, 
    borderColor: '#E5E5EA', 
    alignItems: 'flex-end' 
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
    fontSize: 16 
  },
  sendButton: { 
    backgroundColor: '#007AFF', 
    borderRadius: 20, 
    paddingHorizontal: 16, 
    height: 40, 
    justifyContent: 'center', 
    marginLeft: 8,
    marginBottom: 0
  },
  sendButtonDisabled: { 
    backgroundColor: '#A1C6EA' 
  },
  sendButtonText: { 
    color: '#FFFFFF', 
    fontWeight: '600', 
    fontSize: 16 
  },
});

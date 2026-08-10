import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Message, useAIStore } from '../store/useAIStore';

interface ChatBubbleProps {
  message: Message;
}

export const ChatBubble = ({ message }: ChatBubbleProps) => {
  const isUser = message.role === 'user';
  const updateMessageContent = useAIStore((state) => state.updateMessageContent);
  const [isEditing, setIsEditing] = useState(false);
  const [draftContent, setDraftContent] = useState(message.content);
  const canEdit = message.kind !== 'status';

  useEffect(() => {
    if (!isEditing) {
      setDraftContent(message.content);
    }
  }, [message.content, isEditing]);

  const displayContent = message.content || ' ';
  const messageTimestamp = useMemo(() => {
    if (typeof message.createdAt === 'number' && Number.isFinite(message.createdAt)) {
      return message.createdAt;
    }
    const [prefix] = message.id.split('-');
    const parsed = Number(prefix);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
    return Date.now();
  }, [message.createdAt, message.id]);

  const formattedDate = useMemo(
    () =>
      new Date(messageTimestamp).toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    [messageTimestamp]
  );

  const handleSave = () => {
    updateMessageContent(message.id, draftContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraftContent(message.content);
    setIsEditing(false);
  };

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.aiContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        {isEditing ? (
          <>
            <TextInput
              style={[styles.editInput, isUser ? styles.userText : styles.aiText]}
              value={draftContent}
              onChangeText={setDraftContent}
              multiline
              autoFocus
            />
            <View style={styles.editActions}>
              <TouchableOpacity onPress={handleCancel} style={styles.actionButton}>
                <Text style={[styles.actionButtonText, isUser ? styles.userText : styles.aiText]}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.actionButton}>
                <Text style={[styles.actionButtonText, isUser ? styles.userText : styles.aiText]}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : canEdit ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsEditing(true)}
            accessibilityRole="button"
            accessibilityLabel="Mesajı düzenle"
            accessibilityHint="Mesaj metnini düzenlemek için çift dokunun"
          >
            <Text style={[styles.text, isUser ? styles.userText : styles.aiText]}>{displayContent}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={[styles.text, isUser ? styles.userText : styles.aiText]}>{displayContent}</Text>
        )}
        <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.aiTimestamp]}>{formattedDate}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', marginVertical: 4, flexDirection: 'row', paddingHorizontal: 16 },
  userContainer: { justifyContent: 'flex-end' },
  aiContainer: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 16, minHeight: 40, justifyContent: 'center' },
  userBubble: { backgroundColor: '#007AFF', borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: '#E5E5EA', borderBottomLeftRadius: 4 },
  text: { fontSize: 16, lineHeight: 22 },
  editInput: { fontSize: 16, lineHeight: 22, minWidth: 180, minHeight: 60, padding: 0 },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 10 },
  actionButton: { paddingVertical: 4 },
  actionButtonText: { fontSize: 13, fontWeight: '600', color: '#1C1C1E' },
  timestamp: { fontSize: 11, marginTop: 8, opacity: 0.7 },
  userText: { color: '#FFFFFF' },
  aiText: { color: '#000000' },
  userTimestamp: { color: '#FFFFFF', textAlign: 'right' },
  aiTimestamp: { color: '#3A3A3C', textAlign: 'left' },
});

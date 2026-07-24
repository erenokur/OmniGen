import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  TextInput,
  FlatList 
} from 'react-native';
import { useAIStore, Provider } from '../store/useAIStore';

export const ProviderMenu = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  // New Provider Form State
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'ollama' | 'openai'>('openai');
  const [newUrl, setNewUrl] = useState('https://api.openai.com/v1');
  const [newKey, setNewKey] = useState('');

  const { providers, activeProviderId, setActiveProvider, addProvider } = useAIStore();

  const handleAdd = () => {
    if (!newName.trim()) return;
    
    const newProvider: Provider = {
      id: Date.now().toString(),
      name: newName,
      type: newType,
      baseUrl: newUrl,
      apiKey: newKey, // In a production app, save this to expo-secure-store!
      defaultModel: newType === 'openai' ? 'gpt-4o' : 'llama3'
    };
    
    addProvider(newProvider);
    setIsAdding(false);
    setNewName('');
    setNewKey('');
  };

  const activeProvider = providers.find(p => p.id === activeProviderId);

  return (
    <View>
      {/* The Header Button */}
      <TouchableOpacity 
        style={styles.headerButton} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.headerButtonText}>
          ⚙️ {activeProvider?.name || 'Select Provider'}
        </Text>
      </TouchableOpacity>

      {/* The Settings Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>AI Providers</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>

            {!isAdding ? (
              // List Existing Providers
              <>
                <FlatList
                  data={providers}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={[
                        styles.providerItem, 
                        activeProviderId === item.id && styles.providerItemActive
                      ]}
                      onPress={() => {
                        setActiveProvider(item.id);
                        setModalVisible(false);
                      }}
                    >
                      <Text style={[
                        styles.providerName,
                        activeProviderId === item.id && styles.providerNameActive
                      ]}>
                        {item.name} ({item.type})
                      </Text>
                    </TouchableOpacity>
                  )}
                />
                <TouchableOpacity 
                  style={styles.addButton} 
                  onPress={() => setIsAdding(true)}
                >
                  <Text style={styles.addButtonText}>+ Add New Provider</Text>
                </TouchableOpacity>
              </>
            ) : (
              // Add New Provider Form
              <View style={styles.formContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Provider Name (e.g., Work OpenAI)"
                  value={newName}
                  onChangeText={setNewName}
                />
                <View style={styles.typeSelector}>
                  <TouchableOpacity 
                    style={[styles.typeButton, newType === 'openai' && styles.typeActive]}
                    onPress={() => {
                      setNewType('openai');
                      setNewUrl('https://api.openai.com/v1');
                    }}
                  >
                    <Text>OpenAI</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.typeButton, newType === 'ollama' && styles.typeActive]}
                    onPress={() => {
                      setNewType('ollama');
                      setNewUrl('http://192.168.1.X:11434'); // Example local IP
                    }}
                  >
                    <Text>Ollama</Text>
                  </TouchableOpacity>
                </View>
                
                <TextInput
                  style={styles.input}
                  placeholder="Base URL"
                  value={newUrl}
                  onChangeText={setNewUrl}
                  autoCapitalize="none"
                />
                
                {newType === 'openai' && (
                  <TextInput
                    style={styles.input}
                    placeholder="API Key (sk-...)"
                    value={newKey}
                    onChangeText={setNewKey}
                    secureTextEntry
                  />
                )}
                
                <View style={styles.formActions}>
                  <TouchableOpacity onPress={() => setIsAdding(false)} style={styles.cancelBtn}>
                    <Text>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleAdd} style={styles.saveBtn}>
                    <Text style={{color: 'white'}}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  headerButton: { padding: 8, backgroundColor: '#E5E5EA', borderRadius: 8 },
  headerButtonText: { fontSize: 14, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  closeText: { color: '#007AFF', fontSize: 16 },
  providerItem: { padding: 16, borderBottomWidth: 1, borderColor: '#EEE' },
  providerItemActive: { backgroundColor: '#F0F8FF' },
  providerName: { fontSize: 16 },
  providerNameActive: { fontWeight: 'bold', color: '#007AFF' },
  addButton: { marginTop: 20, padding: 16, backgroundColor: '#E5E5EA', borderRadius: 8, alignItems: 'center' },
  addButtonText: { color: '#007AFF', fontWeight: '600' },
  formContainer: { gap: 12 },
  input: { borderWidth: 1, borderColor: '#CCC', padding: 12, borderRadius: 8, fontSize: 16 },
  typeSelector: { flexDirection: 'row', gap: 10 },
  typeButton: { flex: 1, padding: 12, borderWidth: 1, borderColor: '#CCC', borderRadius: 8, alignItems: 'center' },
  typeActive: { backgroundColor: '#E5E5EA', borderColor: '#007AFF' },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 10 },
  cancelBtn: { padding: 12 },
  saveBtn: { padding: 12, backgroundColor: '#007AFF', borderRadius: 8 }
});


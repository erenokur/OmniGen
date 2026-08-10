import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  TextInput,
  FlatList,
  Alert
} from 'react-native';
import { useAIStore, Provider } from '../store/useAIStore';
import { fetchOllamaModels } from '../services/ollama';

export const ProviderMenu = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  // New Provider Form State
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'ollama' | 'openai'>('openai');
  const [newUrl, setNewUrl] = useState('https://api.openai.com/v1');
  const [newKey, setNewKey] = useState('');
  const [newModel, setNewModel] = useState('gpt-4o');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [modelFetchError, setModelFetchError] = useState('');

  const { providers, activeProviderId, setActiveProvider, addProvider, removeProvider } = useAIStore();

  const handleAdd = () => {
    if (!newName.trim() || !newModel.trim()) return;
    
    const newProvider: Provider = {
      id: Date.now().toString(),
      name: newName,
      type: newType,
      baseUrl: newUrl,
      apiKey: newKey, // In a production app, save this to expo-secure-store!
      defaultModel: newModel.trim()
    };
    
    addProvider(newProvider);
    setIsAdding(false);
    setNewName('');
    setNewKey('');
    setNewModel('gpt-4o');
    setAvailableModels([]);
    setModelFetchError('');
  };

  const handleFetchModels = async () => {
    try {
      setIsFetchingModels(true);
      setModelFetchError('');
      const models = await fetchOllamaModels(newUrl);
      setAvailableModels(models);
      if (models.length > 0) {
        setNewModel(models[0]);
      }
      if (models.length === 0) {
        setModelFetchError('Model bulunamadı.');
      }
    } catch (error: any) {
      setModelFetchError(error.message || 'Modeller alınamadı.');
    } finally {
      setIsFetchingModels(false);
    }
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
      {modalVisible ? (
        <Modal
          animationType="slide"
          transparent={true}
          visible
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
                      <View
                        style={[
                          styles.providerItem, 
                          activeProviderId === item.id && styles.providerItemActive
                        ]}
                      >
                        <TouchableOpacity
                          style={styles.providerSelectArea}
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
                          <Text style={styles.providerModel}>{item.defaultModel}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            Alert.alert('Sağlayıcı silinsin mi?', `${item.name} kalıcı olarak silinecek.`, [
                              { text: 'Vazgeç', style: 'cancel' },
                              {
                                text: 'Sil',
                                style: 'destructive',
                                onPress: () => removeProvider(item.id),
                              },
                            ])
                          }
                          style={styles.removeButton}
                        >
                          <Text style={styles.removeButtonText}>Sil</Text>
                        </TouchableOpacity>
                      </View>
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
                        setNewModel('gpt-4o');
                        setAvailableModels([]);
                        setModelFetchError('');
                      }}
                    >
                      <Text>OpenAI</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.typeButton, newType === 'ollama' && styles.typeActive]}
                      onPress={() => {
                        setNewType('ollama');
                        setNewUrl('http://127.0.0.1:11434');
                        setNewModel('qwen2.5:3b');
                        setAvailableModels([]);
                        setModelFetchError('');
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

                  <TextInput
                    style={styles.input}
                    placeholder={newType === 'ollama' ? 'Model (örn. qwen2.5:3b)' : 'Model (örn. gpt-4o)'}
                    value={newModel}
                    onChangeText={setNewModel}
                    autoCapitalize="none"
                  />

                  {newType === 'ollama' && (
                    <View style={styles.ollamaModelsSection}>
                      <TouchableOpacity style={styles.fetchModelsButton} onPress={handleFetchModels} disabled={isFetchingModels}>
                        <Text style={styles.fetchModelsButtonText}>
                          {isFetchingModels ? 'Modeller getiriliyor...' : 'Local modelleri çek'}
                        </Text>
                      </TouchableOpacity>
                      {modelFetchError ? <Text style={styles.errorText}>{modelFetchError}</Text> : null}
                      {availableModels.length > 0 && (
                        <View style={styles.modelList}>
                          {availableModels.map((model) => (
                            <TouchableOpacity
                              key={model}
                              style={[styles.modelChip, newModel === model && styles.modelChipActive]}
                              onPress={() => setNewModel(model)}
                            >
                              <Text style={[styles.modelChipText, newModel === model && styles.modelChipTextActive]}>{model}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                  
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
      ) : null}
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
  providerItem: { padding: 16, borderBottomWidth: 1, borderColor: '#EEE', flexDirection: 'row', alignItems: 'center' },
  providerSelectArea: { flex: 1, gap: 4 },
  providerItemActive: { backgroundColor: '#F0F8FF' },
  providerName: { fontSize: 16 },
  providerModel: { fontSize: 13, color: '#666' },
  providerNameActive: { fontWeight: 'bold', color: '#007AFF' },
  removeButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#FFE5E5' },
  removeButtonText: { color: '#D11A2A', fontWeight: '600' },
  addButton: { marginTop: 20, padding: 16, backgroundColor: '#E5E5EA', borderRadius: 8, alignItems: 'center' },
  addButtonText: { color: '#007AFF', fontWeight: '600' },
  formContainer: { gap: 12 },
  input: { borderWidth: 1, borderColor: '#CCC', padding: 12, borderRadius: 8, fontSize: 16 },
  ollamaModelsSection: { gap: 8 },
  fetchModelsButton: { padding: 12, backgroundColor: '#E5E5EA', borderRadius: 8, alignItems: 'center' },
  fetchModelsButtonText: { color: '#007AFF', fontWeight: '600' },
  errorText: { color: '#D11A2A', fontSize: 13 },
  modelList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modelChip: { borderWidth: 1, borderColor: '#CCC', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6 },
  modelChipActive: { borderColor: '#007AFF', backgroundColor: '#EAF3FF' },
  modelChipText: { color: '#333' },
  modelChipTextActive: { color: '#007AFF', fontWeight: '600' },
  typeSelector: { flexDirection: 'row', gap: 10 },
  typeButton: { flex: 1, padding: 12, borderWidth: 1, borderColor: '#CCC', borderRadius: 8, alignItems: 'center' },
  typeActive: { backgroundColor: '#E5E5EA', borderColor: '#007AFF' },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 10 },
  cancelBtn: { padding: 12 },
  saveBtn: { padding: 12, backgroundColor: '#007AFF', borderRadius: 8 }
});

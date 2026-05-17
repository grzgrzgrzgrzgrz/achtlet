import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Title, Text, Snackbar, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { saveN8nConfig } from '../services/api';

const ConfigScreen = ({ navigation }) => {
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const validateUrl = (text: string) => {
    try {
      new URL(text);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleSave = async () => {
    // Validate inputs
    if (!url.trim()) {
      setError('n8n URL is required');
      setSnackbarVisible(true);
      return;
    }

    if (!validateUrl(url)) {
      setError('Please enter a valid URL');
      setSnackbarVisible(true);
      return;
    }

    if (!apiKey.trim()) {
      setError('API Key is required');
      setSnackbarVisible(true);
      return;
    }

    setLoading(true);
    try {
      await saveN8nConfig(url, apiKey);
      setSuccess(true);
      setSnackbarVisible(true);
      setError('');
      
      // Navigate back to dashboard after a short delay
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (err) {
      setError('Failed to save configuration');
      setSuccess(false);
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formContainer}>
            <Title style={styles.title}>n8n Configuration</Title>
            <Text style={styles.subtitle}>
              Enter your n8n instance details to connect
            </Text>
            
            <TextInput
              label="n8n URL"
              value={url}
              onChangeText={setUrl}
              style={styles.input}
              mode="outlined"
              placeholder="https://your-n8n-instance.com"
              autoCapitalize="none"
            />
            <HelperText type="info">
              The full URL to your n8n instance
            </HelperText>
            
            <TextInput
              label="API Key"
              value={apiKey}
              onChangeText={setApiKey}
              style={styles.input}
              mode="outlined"
              secureTextEntry
              placeholder="Your n8n API key"
            />
            <HelperText type="info">
              API key with workflows:read and workflows:update permissions
            </HelperText>
            
            <Button
              mode="contained"
              onPress={handleSave}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              Save Configuration
            </Button>
            
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </Button>
          </View>
        </ScrollView>
        
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          style={{
            backgroundColor: success ? '#51CF66' : '#FF6B6B',
          }}
          action={{
            label: 'Close',
            onPress: () => setSnackbarVisible(false),
          }}
        >
          {success ? 'Configuration saved successfully!' : error}
        </Snackbar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  formContainer: {
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#212529',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  input: {
    marginBottom: 8,
    backgroundColor: 'white',
  },
  button: {
    marginTop: 24,
    padding: 8,
    backgroundColor: '#FF6B6B',
  },
  cancelButton: {
    marginTop: 12,
    padding: 8,
    borderColor: '#FF6B6B',
  },
});

export default ConfigScreen;

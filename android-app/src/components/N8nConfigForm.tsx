import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { saveN8nConfig } from '../services/api';

interface N8nConfigFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

const N8nConfigForm: React.FC<N8nConfigFormProps> = ({ 
  onSuccess,
  onCancel
}) => {
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [apiKeyError, setApiKeyError] = useState('');

  const validateUrl = (text: string) => {
    try {
      new URL(text);
      setUrlError('');
      return true;
    } catch (e) {
      setUrlError('Please enter a valid URL');
      return false;
    }
  };

  const validateApiKey = (text: string) => {
    if (!text.trim()) {
      setApiKeyError('API Key is required');
      return false;
    }
    setApiKeyError('');
    return true;
  };

  const handleSubmit = async () => {
    const isUrlValid = validateUrl(url);
    const isApiKeyValid = validateApiKey(apiKey);

    if (!isUrlValid || !isApiKeyValid) {
      return;
    }

    setLoading(true);
    try {
      await saveN8nConfig(url, apiKey);
      onSuccess();
    } catch (err) {
      setUrlError('Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="n8n URL"
        value={url}
        onChangeText={(text) => {
          setUrl(text);
          if (urlError) validateUrl(text);
        }}
        style={styles.input}
        mode="outlined"
        placeholder="https://your-n8n-instance.com"
        autoCapitalize="none"
        error={!!urlError}
      />
      {!!urlError && <HelperText type="error">{urlError}</HelperText>}
      <HelperText type="info">
        The full URL to your n8n instance
      </HelperText>
      
      <TextInput
        label="API Key"
        value={apiKey}
        onChangeText={(text) => {
          setApiKey(text);
          if (apiKeyError) validateApiKey(text);
        }}
        style={styles.input}
        mode="outlined"
        secureTextEntry
        placeholder="Your n8n API key"
        error={!!apiKeyError}
      />
      {!!apiKeyError && <HelperText type="error">{apiKeyError}</HelperText>}
      <HelperText type="info">
        API key with workflows:read and workflows:update permissions
      </HelperText>
      
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={styles.submitButton}
        >
          Save Configuration
        </Button>
        
        {onCancel && (
          <Button
            mode="outlined"
            onPress={onCancel}
            style={styles.cancelButton}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  input: {
    marginBottom: 8,
    backgroundColor: 'white',
  },
  buttonContainer: {
    marginTop: 16,
  },
  submitButton: {
    padding: 8,
    backgroundColor: '#FF6B6B',
    marginBottom: 12,
  },
  cancelButton: {
    padding: 8,
    borderColor: '#FF6B6B',
  },
});

export default N8nConfigForm;

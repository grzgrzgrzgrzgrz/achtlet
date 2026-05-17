import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Appbar, Text, ActivityIndicator, Menu, Divider, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { fetchWorkflows, toggleWorkflow, checkApiStatus, logout } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WorkflowCard from '../components/WorkflowCard';
import StatusIndicator from '../components/StatusIndicator';

// Workflow interface from our shared schema
interface Workflow {
  id: string;
  name: string;
  description: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const DashboardScreen = ({ navigation }) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [n8nConnected, setN8nConnected] = useState(false);
  const [sortOrder, setSortOrder] = useState<string>('name-asc');
  const [menuVisible, setMenuVisible] = useState(false);

  // Load workflows when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadWorkflows();
      checkConnection();
    }, [])
  );

  const loadWorkflows = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchWorkflows();
      setWorkflows(data);
    } catch (err) {
      setError('Failed to load workflows');
      console.error(err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const checkConnection = async () => {
    try {
      const { connected } = await checkApiStatus();
      setN8nConnected(connected);
    } catch (err) {
      setN8nConnected(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadWorkflows();
    checkConnection();
  };

  const handleToggleWorkflow = async (id: string, currentStatus: boolean) => {
    try {
      await toggleWorkflow(id, !currentStatus);
      // Update local state
      setWorkflows(prevWorkflows => 
        prevWorkflows.map(workflow => 
          workflow.id === id ? { ...workflow, active: !currentStatus } : workflow
        )
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to toggle workflow status');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      await AsyncStorage.removeItem('isLoggedIn');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }]
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const handleSettings = () => {
    navigation.navigate('Config');
  };

  const handleViewExecutions = () => {
    navigation.navigate('Executions');
  };

  const sortWorkflows = (workflowsToSort: Workflow[]) => {
    const sorted = [...workflowsToSort];
    
    switch (sortOrder) {
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case 'date-asc':
        return sorted.sort((a, b) => {
          if (!a.updatedAt) return 1;
          if (!b.updatedAt) return -1;
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        });
      case 'date-desc':
        return sorted.sort((a, b) => {
          if (!a.updatedAt) return 1;
          if (!b.updatedAt) return -1;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
      case 'status':
        return sorted.sort((a, b) => {
          if (a.active === b.active) return a.name.localeCompare(b.name);
          return a.active ? -1 : 1;
        });
      default:
        return sorted;
    }
  };

  const renderWorkflowItem = ({ item }: { item: Workflow }) => (
    <WorkflowCard
      id={item.id}
      name={item.name}
      description={item.description}
      active={item.active}
      updatedAt={item.updatedAt}
      onStatusChange={handleToggleWorkflow}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Achtlet" />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={<Appbar.Action icon="dots-vertical" onPress={() => setMenuVisible(true)} />}
        >
          <Menu.Item onPress={handleViewExecutions} title="View Executions" />
          <Menu.Item onPress={handleSettings} title="Settings" />
          <Divider />
          <Menu.Item onPress={handleLogout} title="Logout" />
        </Menu>
      </Appbar.Header>

      {/* Connection Status */}
      <View style={styles.statusBar}>
        <View style={styles.statusContainer}>
          <StatusIndicator connected={n8nConnected} size="small" />
          <Text style={styles.statusText}>
            {n8nConnected ? 'Connected to n8n' : 'Connection failed'}
          </Text>
        </View>
        <Text style={styles.workflowCount}>
          {workflows.length} workflows
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Button 
          mode="outlined" 
          onPress={handleViewExecutions}
          style={styles.actionButton}
          icon="history"
        >
          View Executions
        </Button>
        <Button 
          mode="outlined" 
          onPress={handleSettings}
          style={styles.actionButton}
          icon="cog"
        >
          Settings
        </Button>
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading workflows...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={sortWorkflows(workflows)}
          renderItem={renderWorkflowItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh}
              colors={['#FF6B6B']}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.centerContainer}>
              <Text>No workflows found</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#FF6B6B',
  },
  statusBar: {
    backgroundColor: 'white',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  workflowCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  quickActions: {
    backgroundColor: 'white',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
});

export default DashboardScreen;

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Appbar, Text, ActivityIndicator, Menu, Divider, Chip, Card, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { fetchExecutions, fetchWorkflows } from '../services/api';

// Execution interface from our shared schema
interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName?: string;
  mode: string;
  status: 'success' | 'error' | 'running' | 'waiting' | 'canceled' | 'crashed' | 'new';
  startedAt: string;
  stoppedAt?: string;
  duration?: number;
  retryOf?: string;
  retrySuccessId?: string;
  error?: string;
  data?: any;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const ExecutionsScreen = ({ navigation }) => {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [workflowFilter, setWorkflowFilter] = useState<string>('all');
  const [limit, setLimit] = useState(50);
  const [menuVisible, setMenuVisible] = useState(false);

  // Load executions when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadExecutions();
      loadWorkflows();
    }, [statusFilter, workflowFilter, limit])
  );

  const loadExecutions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = { limit };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (workflowFilter !== 'all') params.workflowId = workflowFilter;
      
      const data = await fetchExecutions(params);
      setExecutions(data);
    } catch (err) {
      setError('Failed to load executions');
      console.error(err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const loadWorkflows = async () => {
    try {
      const data = await fetchWorkflows();
      setWorkflows(data);
    } catch (err) {
      console.error('Failed to load workflows for filter:', err);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadExecutions();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#F44336';
      case 'running':
        return '#2196F3';
      case 'waiting':
        return '#FF9800';
      case 'canceled':
        return '#9E9E9E';
      default:
        return '#9E9E9E';
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A';
    
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const renderExecutionItem = ({ item }: { item: WorkflowExecution }) => (
    <Card style={styles.card} mode="outlined">
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text style={styles.workflowName} numberOfLines={1}>
            {item.workflowName || 'Unknown Workflow'}
          </Text>
          <Chip 
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
            textStyle={{ color: 'white', fontSize: 12 }}
          >
            {item.status.toUpperCase()}
          </Chip>
        </View>
        
        <View style={styles.executionDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Started:</Text>
            <Text style={styles.detailValue}>{formatDate(item.startedAt)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={styles.detailValue}>{formatDuration(item.duration)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Mode:</Text>
            <Text style={styles.detailValue}>{item.mode}</Text>
          </View>
        </View>
        
        {item.error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorLabel}>Error:</Text>
            <Text style={styles.errorText} numberOfLines={3}>
              {item.error}
            </Text>
          </View>
        )}
        
        <View style={styles.cardFooter}>
          <Text style={styles.executionId}>ID: {item.id}</Text>
          {item.stoppedAt && (
            <Text style={styles.timestamp}>
              Stopped: {formatDate(item.stoppedAt)}
            </Text>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  const renderFilterMenu = () => (
    <Menu
      visible={menuVisible}
      onDismiss={() => setMenuVisible(false)}
      anchor={
        <Appbar.Action 
          icon="filter" 
          onPress={() => setMenuVisible(true)}
          iconColor="#FF6B6B"
        />
      }
    >
      <Menu.Item 
        onPress={() => {
          setStatusFilter('all');
          setMenuVisible(false);
        }} 
        title="All Status" 
      />
      <Menu.Item 
        onPress={() => {
          setStatusFilter('success');
          setMenuVisible(false);
        }} 
        title="Success Only" 
      />
      <Menu.Item 
        onPress={() => {
          setStatusFilter('error');
          setMenuVisible(false);
        }} 
        title="Errors Only" 
      />
      <Divider />
      <Menu.Item 
        onPress={() => {
          setWorkflowFilter('all');
          setMenuVisible(false);
        }} 
        title="All Workflows" 
      />
      {workflows.slice(0, 5).map((workflow) => (
        <Menu.Item 
          key={workflow.id}
          onPress={() => {
            setWorkflowFilter(workflow.id);
            setMenuVisible(false);
          }} 
          title={workflow.name} 
        />
      ))}
    </Menu>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Workflow Executions" />
        {renderFilterMenu()}
        <Appbar.Action 
          icon="refresh" 
          onPress={handleRefresh}
          iconColor="#FF6B6B"
        />
      </Appbar.Header>

      {/* Filter Status */}
      <View style={styles.filterStatus}>
        <Text style={styles.filterText}>
          Showing: {statusFilter === 'all' ? 'All Status' : statusFilter} | 
          {workflowFilter === 'all' ? ' All Workflows' : ` ${workflows.find(w => w.id === workflowFilter)?.name || 'Selected Workflow'}`}
        </Text>
        <Text style={styles.countText}>
          {executions.length} executions
        </Text>
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading executions...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="outlined" onPress={handleRefresh} style={styles.retryButton}>
            Retry
          </Button>
        </View>
      ) : (
        <FlatList
          data={executions}
          renderItem={renderExecutionItem}
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
              <Text style={styles.emptyText}>No executions found</Text>
              <Text style={styles.emptySubtext}>
                Try adjusting your filters or check if workflows have been executed
              </Text>
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
  filterStatus: {
    backgroundColor: 'white',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  countText: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
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
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 8,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    backgroundColor: 'white',
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workflowName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  statusChip: {
    height: 28,
  },
  executionDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#c62828',
    marginBottom: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  executionId: {
    fontSize: 12,
    color: '#999',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
});

export default ExecutionsScreen; 
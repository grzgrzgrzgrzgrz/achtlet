import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Paragraph, Switch, Text, Chip } from 'react-native-paper';

interface WorkflowCardProps {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  onStatusChange: (id: string, active: boolean) => void;
}

const WorkflowCard: React.FC<WorkflowCardProps> = ({
  id,
  name,
  description,
  active,
  updatedAt,
  onStatusChange,
}) => {
  return (
    <Card style={styles.card} mode="outlined">
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{name}</Text>
          <Switch
            value={active}
            onValueChange={() => onStatusChange(id, active)}
            color="#339AF0"
          />
        </View>
        
        {description && (
          <Paragraph style={styles.description} numberOfLines={2}>
            {description}
          </Paragraph>
        )}
        
        <View style={styles.cardFooter}>
          <Chip 
            style={[
              styles.statusChip, 
              { backgroundColor: active ? '#E6F7FF' : '#FFF0F5' }
            ]}
            textStyle={{ 
              color: active ? '#339AF0' : '#FF6B6B',
              fontSize: 12
            }}
          >
            {active ? 'Active' : 'Inactive'}
          </Chip>
          
          {updatedAt && (
            <Text style={styles.timestamp}>
              Updated: {new Date(updatedAt).toLocaleDateString()}
            </Text>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    backgroundColor: 'white',
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  statusChip: {
    height: 24,
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
  },
});

export default WorkflowCard;
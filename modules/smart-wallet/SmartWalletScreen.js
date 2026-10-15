import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList
} from 'react-native';
import Header from '../../components/shared/Header';
import InfoCard from '../../components/shared/InfoCard';
import { useAppContext } from '../../context/AppContext';

const COMPETITOR_MARGINS = [
  { id: 'shop-a', name: 'LoopMart', profitPercent: 18 },
  { id: 'shop-b', name: 'Green Basket', profitPercent: 22 },
  { id: 'shop-c', name: 'Urban Pantry', profitPercent: 15 }
];

// Helps track micro-purchases while benchmarking against competitors.
const SmartWalletScreen = () => {
  const { state, addWalletEntry } = useAppContext();
  const [productName, setProductName] = useState('');
  const [cost, setCost] = useState('');
  const [retail, setRetail] = useState('');
  const [comparisonMessage, setComparisonMessage] = useState(
    'Log your product margins to gauge progress.'
  );

  const competitorAverage = useMemo(() => {
    const total = COMPETITOR_MARGINS.reduce(
      (sum, competitor) => sum + competitor.profitPercent,
      0
    );
    return Math.round(total / COMPETITOR_MARGINS.length);
  }, []);

  const handleAddEntry = useCallback(() => {
    const trimmedName = productName.trim();
    const costValue = Number.parseFloat(cost);
    const retailValue = Number.parseFloat(retail);

    if (!trimmedName || !Number.isFinite(costValue) || !Number.isFinite(retailValue)) {
      setComparisonMessage(
        'Provide a product name, cost, and retail price to calculate profit.'
      );
      return;
    }

    if (costValue <= 0) {
      setComparisonMessage('Cost must be greater than zero for a valid margin.');
      return;
    }

    const profitPercent = ((retailValue - costValue) / costValue) * 100;
    const normalizedProfit = Number.isFinite(profitPercent) ? profitPercent : 0;
    const entry = {
      id: Date.now().toString(),
      name: trimmedName,
      cost: costValue,
      retail: retailValue,
      profitPercent: Number(normalizedProfit.toFixed(2)),
      createdAt: new Date().toISOString()
    };

    addWalletEntry(entry);
    setProductName('');
    setCost('');
    setRetail('');

    const closestCompetitor = COMPETITOR_MARGINS.reduce((best, competitor) => {
      const distance = Math.abs(competitor.profitPercent - normalizedProfit);
      if (!best || distance < best.distance) {
        return { competitor, distance };
      }
      return best;
    }, null);

    const competitorLabel = closestCompetitor
      ? `${closestCompetitor.competitor.name} at ${closestCompetitor.competitor.profitPercent}%`
      : `competitor average at ${competitorAverage}%`;

    setComparisonMessage(
      `Margin logged at ${entry.profitPercent}%. Closest benchmark: ${competitorLabel}.`
    );
  }, [productName, cost, retail, addWalletEntry, competitorAverage]);

  return (
    <View style={styles.container}>
      <Header title="Smart Wallet" subtitle="Stay on top of your spend" />
      <View style={styles.content}>
        <InfoCard
          icon="account-balance-wallet"
          title="Competitor Benchmark"
          message={`Average competitor margin: ${competitorAverage}%. ${comparisonMessage}`}
        />
        <View style={styles.form}>
          <Text style={styles.formTitle}>Add Product Margin</Text>
          <TextInput
            style={styles.input}
            placeholder="Product name"
            value={productName}
            onChangeText={setProductName}
          />
          <TextInput
            style={styles.input}
            placeholder="Cost"
            keyboardType="decimal-pad"
            value={cost}
            onChangeText={setCost}
          />
          <TextInput
            style={styles.input}
            placeholder="Retail price"
            keyboardType="decimal-pad"
            value={retail}
            onChangeText={setRetail}
          />
          <TouchableOpacity style={styles.button} onPress={handleAddEntry}>
            <Text style={styles.buttonLabel}>Save entry</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.historyTitle}>Recent margins</Text>
        <FlatList
          data={state.walletHistory}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.historyItem}>
              <View style={styles.historyTextGroup}>
                <Text style={styles.historyName}>{item.name}</Text>
                <Text style={styles.historyMeta}>
                  Cost ${item.cost.toFixed(2)} • Retail ${item.retail.toFixed(2)}
                </Text>
              </View>
              <Text style={styles.historyProfit}>{item.profitPercent}%</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyState}>
              No entries tracked yet. Add one to start modeling your wallet loop.
            </Text>
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  content: {
    flex: 1,
    padding: 24
  },
  form: {
    marginTop: 24,
    backgroundColor: '#e2e8f0',
    borderRadius: 16,
    padding: 20
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a'
  },
  input: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#94a3b8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: '#f8fafc'
  },
  button: {
    marginTop: 16,
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center'
  },
  buttonLabel: {
    color: '#f8fafc',
    fontWeight: '600',
    fontSize: 16
  },
  historyTitle: {
    marginTop: 24,
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a'
  },
  listContent: {
    paddingVertical: 16
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12
  },
  historyTextGroup: {
    flex: 1
  },
  historyName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a'
  },
  historyMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#475569'
  },
  historyProfit: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16a34a'
  },
  emptyState: {
    marginTop: 12,
    fontSize: 14,
    color: '#475569'
  }
});

export default SmartWalletScreen;

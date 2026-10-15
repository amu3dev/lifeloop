import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/shared/Header';
import InfoCard from '../../components/shared/InfoCard';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import TextField from '../../components/shared/TextField';
import { useAppContext } from '../../context/AppContext';
import {
  colors,
  fontSize,
  moduleThemes,
  radius,
  spacing
} from '../../theme/theme';

const theme = moduleThemes.SmartWallet;

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
    <SafeAreaView edges={['top']} style={styles.container}>
      <FlatList
        data={state.walletHistory}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Header title="Smart Wallet" subtitle="Stay on top of your spend" theme={theme} />
            <InfoCard
              icon="account-balance-wallet"
              title="Competitor Benchmark"
              message={`Average competitor margin: ${competitorAverage}%. ${comparisonMessage}`}
              theme={theme}
            />
            <Card style={styles.form}>
              <Text style={styles.formTitle}>Add Product Margin</Text>
              <TextField
                placeholder="Product name"
                value={productName}
                onChangeText={setProductName}
              />
              <TextField
                placeholder="Cost"
                keyboardType="decimal-pad"
                value={cost}
                onChangeText={setCost}
              />
              <TextField
                placeholder="Retail price"
                keyboardType="decimal-pad"
                value={retail}
                onChangeText={setRetail}
              />
              <Button
                label="Save entry"
                onPress={handleAddEntry}
                theme={theme}
                style={styles.saveButton}
              />
            </Card>
            <Text style={styles.historyTitle}>Recent margins</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.historyItem}>
            <View style={styles.historyTextGroup}>
              <Text style={styles.historyName}>{item.name}</Text>
              <Text style={styles.historyMeta}>
                Cost ${item.cost.toFixed(2)} • Retail ${item.retail.toFixed(2)}
              </Text>
            </View>
            <View style={styles.historyProfitBadge}>
              <Text style={styles.historyProfit}>{item.profitPercent}%</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyState}>
            No entries tracked yet. Add one to start modeling your wallet loop.
          </Text>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl
  },
  listHeader: {
    gap: spacing.md,
    marginBottom: spacing.md
  },
  form: {
    gap: spacing.md
  },
  formTitle: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: colors.ink
  },
  saveButton: {
    marginTop: spacing.xs
  },
  historyTitle: {
    marginTop: spacing.md,
    marginHorizontal: spacing.xs,
    fontSize: fontSize.heading,
    fontWeight: '600',
    color: colors.ink
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm
  },
  historyTextGroup: {
    flex: 1
  },
  historyName: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: colors.ink
  },
  historyMeta: {
    marginTop: 2,
    fontSize: fontSize.caption,
    color: colors.inkMuted
  },
  historyProfitBadge: {
    backgroundColor: theme.background,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md
  },
  historyProfit: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: theme.accent
  },
  emptyState: {
    marginHorizontal: spacing.xs,
    fontSize: fontSize.caption,
    lineHeight: 18,
    color: colors.inkMuted
  }
});

export default SmartWalletScreen;

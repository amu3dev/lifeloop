import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../components/shared/Header';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import { useAppContext } from '../../context/AppContext';
import {
  colors,
  fontSize,
  moduleThemes,
  radius,
  spacing
} from '../../theme/theme';

const theme = moduleThemes.MealMood;

export const MEAL_STORAGE_KEY = '@lifeloop/meal-mood/latest';

// Rough set of healthy meal ideas to rotate through.
const MEAL_OPTIONS = [
  {
    id: 'salmon-quinoa',
    title: 'Grilled Salmon & Quinoa',
    description: 'Omega-3 boost with fiber-rich quinoa and steamed greens.'
  },
  {
    id: 'tofu-bowl',
    title: 'Tofu Power Bowl',
    description: 'Marinated tofu, brown rice, roasted veggies, sesame crunch.'
  },
  {
    id: 'avocado-toast',
    title: 'Avocado Toast + Poached Egg',
    description: 'Slow carbs with healthy fats to sustain morning energy.'
  },
  {
    id: 'lentil-soup',
    title: 'Spiced Lentil Soup',
    description: 'Plant-protein with warming spices to stabilize mood.'
  },
  {
    id: 'mediterranean-wrap',
    title: 'Mediterranean Wrap',
    description: 'Whole-grain wrap with hummus, olives, tomatoes, greens.'
  }
];

// Surfaces daily meal inspiration while keeping mood synced with context.
const MealMoodScreen = () => {
  const { state, setMood } = useAppContext();
  const [currentMeal, setCurrentMeal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const randomMeal = useCallback(() => {
    const index = Math.floor(Math.random() * MEAL_OPTIONS.length);
    return MEAL_OPTIONS[index];
  }, []);

  const loadStoredMeal = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(MEAL_STORAGE_KEY);

      if (stored) {
        setCurrentMeal(JSON.parse(stored));
      } else {
        const initial = randomMeal();
        setCurrentMeal(initial);
        await AsyncStorage.setItem(MEAL_STORAGE_KEY, JSON.stringify(initial));
      }
    } catch (error) {
      console.warn('Failed to fetch last meal suggestion', error);
    } finally {
      setIsLoading(false);
    }
  }, [randomMeal]);

  useEffect(() => {
    loadStoredMeal();
  }, [loadStoredMeal]);

  const handleNewMeal = useCallback(async () => {
    const nextMeal = randomMeal();
    setCurrentMeal(nextMeal);

    try {
      await AsyncStorage.setItem(MEAL_STORAGE_KEY, JSON.stringify(nextMeal));
    } catch (error) {
      console.warn('Could not persist meal suggestion', error);
    }
  }, [randomMeal]);

  const handleMoodChange = useCallback(
    moodChoice => {
      setMood(moodChoice);
    },
    [setMood]
  );

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Header title="Meal Mood" subtitle="Plan meals that match your energy" theme={theme} />
        <Card>
          <View style={styles.mealLabelRow}>
            <View style={styles.mealIcon}>
              <MaterialIcons name="restaurant" size={20} color={theme.accent} />
            </View>
            <Text style={styles.mealLabel}>Suggested Pairing</Text>
          </View>
          {isLoading || !currentMeal ? (
            <Text style={styles.mealDescription}>Loading meal inspiration...</Text>
          ) : (
            <>
              <Text style={styles.mealTitle}>{currentMeal.title}</Text>
              <Text style={styles.mealDescription}>{currentMeal.description}</Text>
            </>
          )}
          <Button
            label="New Meal"
            icon="refresh"
            onPress={handleNewMeal}
            theme={theme}
            variant="secondary"
            style={styles.newMealButton}
          />
        </Card>
        <Text style={styles.sectionTitle}>How are you feeling?</Text>
        <View style={styles.moodRow}>
          {['Happy', 'Tired', 'Hungry'].map(mood => {
            const isActive = state.todayMood === mood;

            return (
              <TouchableOpacity
                key={mood}
                style={[styles.moodChip, isActive && styles.moodChipActive]}
                onPress={() => handleMoodChange(mood)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.moodChipLabel,
                    isActive && styles.moodChipLabelActive
                  ]}
                >
                  {mood}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.note}>
          Current mood: {state.todayMood || 'unset'}. Tap a mood to sync it
          across the app.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl
  },
  mealLabelRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  mealIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.background,
    marginRight: spacing.md
  },
  mealLabel: {
    fontSize: fontSize.caption,
    color: colors.inkMuted
  },
  mealTitle: {
    marginTop: spacing.md,
    fontSize: fontSize.heading,
    fontWeight: '600',
    color: theme.ink
  },
  mealDescription: {
    marginTop: spacing.xs,
    fontSize: fontSize.body,
    lineHeight: 21,
    color: colors.inkMuted
  },
  newMealButton: {
    marginTop: spacing.lg
  },
  sectionTitle: {
    marginTop: spacing.md,
    marginHorizontal: spacing.xs,
    fontSize: fontSize.heading,
    fontWeight: '600',
    color: colors.ink
  },
  moodRow: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  moodChip: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  moodChipActive: {
    backgroundColor: theme.accent,
    borderColor: theme.accent
  },
  moodChipLabel: {
    fontSize: fontSize.body,
    fontWeight: '500',
    color: colors.ink
  },
  moodChipLabelActive: {
    color: colors.surface
  },
  note: {
    marginHorizontal: spacing.xs,
    fontSize: fontSize.caption,
    lineHeight: 18,
    color: colors.inkMuted
  }
});

export default MealMoodScreen;

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../components/shared/Header';
import InfoCard from '../../components/shared/InfoCard';
import { useAppContext } from '../../context/AppContext';

const MEAL_STORAGE_KEY = '@lifeloop/meal-mood/latest';

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
    <View style={styles.container}>
      <Header title="Meal Mood" subtitle="Plan meals that match your energy" />
      <ScrollView contentContainerStyle={styles.content}>
        <InfoCard
          icon="restaurant"
          title="Suggested Pairing"
          message={
            isLoading || !currentMeal
              ? 'Loading meal inspiration...'
              : `${currentMeal.title} — ${currentMeal.description}`
          }
        />
        <TouchableOpacity style={styles.button} onPress={handleNewMeal}>
          <Text style={styles.buttonLabel}>New Meal</Text>
        </TouchableOpacity>
        <Text style={styles.sectionTitle}>How are you feeling?</Text>
        <View style={styles.moodRow}>
          {['Happy', 'Tired', 'Hungry'].map(mood => {
            const isActive = state.todayMood === mood;

            return (
              <TouchableOpacity
                key={mood}
                style={[styles.moodChip, isActive && styles.moodChipActive]}
                onPress={() => handleMoodChange(mood)}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9'
  },
  content: {
    padding: 24
  },
  note: {
    marginTop: 24,
    fontSize: 15,
    lineHeight: 22,
    color: '#1e293b'
  },
  button: {
    marginTop: 24,
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
  sectionTitle: {
    marginTop: 32,
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a'
  },
  moodRow: {
    flexDirection: 'row',
    marginTop: 16
  },
  moodChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#64748b',
    marginRight: 12
  },
  moodChipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a'
  },
  moodChipLabel: {
    color: '#0f172a',
    fontWeight: '500'
  },
  moodChipLabelActive: {
    color: '#f8fafc'
  }
});

export default MealMoodScreen;

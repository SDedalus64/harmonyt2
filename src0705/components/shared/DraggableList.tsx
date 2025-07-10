import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { isTablet, getLayoutValue } from '../../platform/deviceUtils';
import DraggableListItem from './DraggableListItem';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

// Export the DraggableItem interface
export interface DraggableItem {
  id: string;
  title: string;
  subtitle?: string;
}

interface DraggableListProps {
  items: DraggableItem[];
  onItemsReorder?: (newItems: DraggableItem[]) => void;
  onItemPress?: (item: DraggableItem) => void;
  onItemLongPress?: (item: DraggableItem) => void;
  renderItemContent?: (item: DraggableItem) => React.ReactNode;
  style?: any;
}

export default function DraggableList({
  items,
  onItemsReorder,
  onItemPress,
  onItemLongPress,
  renderItemContent,
  style,
}: DraggableListProps) {
  const [localItems, setLocalItems] = useState(items);
  const [draggedItem, setDraggedItem] = useState<DraggableItem | null>(null);

  const handleDragStart = (item: DraggableItem) => {
    setDraggedItem(item);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  const handleDragEnd = (item: DraggableItem, newIndex: number) => {
    if (!draggedItem) return;

    const currentIndex = localItems.findIndex(i => i.id === item.id);
    const newItems = [...localItems];

    // Remove item from current position
    newItems.splice(currentIndex, 1);
    // Insert at new position
    newItems.splice(currentIndex + newIndex, 0, item);

    setLocalItems(newItems);
    setDraggedItem(null);
    onItemsReorder?.(newItems);

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  const renderItem = ({ item, index }: { item: DraggableItem; index: number }) => (
    <DraggableListItem
      id={item.id}
      title={item.title}
      subtitle={item.subtitle}
      onDragStart={() => handleDragStart(item)}
      onDragEnd={(newIndex) => handleDragEnd(item, newIndex)}
      onPress={() => onItemPress?.(item)}
      onLongPress={() => onItemLongPress?.(item)}
      style={[
        styles.item,
        isTablet() && styles.itemTablet,
      ]}
    >
      {renderItemContent?.(item)}
    </DraggableListItem>
  );

  return (
    <View style={[styles.container, style]}>
      <FlatList
        data={localItems}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        numColumns={isTablet() ? 2 : 1}
        columnWrapperStyle={isTablet() ? styles.columnWrapper : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingVertical: getLayoutValue('small', 'spacing'),
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  item: {
    flex: 1,
    marginHorizontal: getLayoutValue('small', 'spacing'),
  },
  itemTablet: {
    marginHorizontal: getLayoutValue('medium', 'spacing'),
  },
});

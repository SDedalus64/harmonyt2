import React from "react";
import HistoryScreen from "../screens/HistoryScreen";
import { HistoryItem } from "../hooks/useHistory";

interface HistoryColumnContentProps {
  // Controls HistoryScreen's refresh behaviour when the drawer opens/closes
  visible?: boolean;
  // Callback when the user taps a history row
  onItemPress?: (item: HistoryItem) => void;
}

const HistoryColumnContent: React.FC<HistoryColumnContentProps> = ({
  visible = true,
  onItemPress,
}) => {
  return <HistoryScreen visible={visible} onItemPress={onItemPress} />;
};

export default HistoryColumnContent;

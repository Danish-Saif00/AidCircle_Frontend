import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  type StatusBarStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {SafeAreaView, type Edge} from 'react-native-safe-area-context';

import {colors, spacing, type AppColorName} from '../theme';

export type ScreenProps = {
  children: React.ReactNode;
  backgroundColor?: AppColorName;
  safeArea?: boolean;
  edges?: Edge[];
  scrollable?: boolean;
  keyboardAvoiding?: boolean;
  statusBarStyle?: StatusBarStyle;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  showsVerticalScrollIndicator?: boolean;
};

export const Screen = ({
  children,
  backgroundColor = 'background',
  safeArea = true,
  edges = ['top', 'left', 'right'],
  scrollable = false,
  keyboardAvoiding = false,
  statusBarStyle = 'dark-content',
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
}: ScreenProps) => {
  const background = colors[backgroundColor];

  const Container = safeArea ? SafeAreaView : View;

  const content = scrollable ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, contentContainerStyle]}>{children}</View>
  );

  return (
    <Container
      edges={safeArea ? edges : undefined}
      style={[styles.container, {backgroundColor: background}, style]}>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={background}
        translucent={false}
      />

      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoiding}>
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: spacing.screenVertical,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: spacing.screenVertical,
  },
});
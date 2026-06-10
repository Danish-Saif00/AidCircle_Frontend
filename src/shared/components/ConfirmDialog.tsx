import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {colors, radius, shadows, spacing} from '../theme';
import {Button} from './Button';
import {Text} from './Text';

type ConfirmDialogTone = 'primary' | 'danger';

export type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmDialogTone;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  style?: StyleProp<ViewStyle>;
};

export const ConfirmDialog = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'primary',
  loading = false,
  onConfirm,
  onCancel,
  style,
}: ConfirmDialogProps) => {
  const confirmVariant = tone === 'danger' ? 'danger' : 'primary';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />

        <View style={[styles.dialog, style]}>
          <Text variant="headingSmall" color="onSurface">
            {title}
          </Text>

          {message ? (
            <Text
              variant="bodyMedium"
              color="onSurfaceVariant"
              style={styles.message}>
              {message}
            </Text>
          ) : null}

          <View style={styles.actions}>
            <Button
              title={cancelLabel}
              variant="outline"
              disabled={loading}
              onPress={onCancel}
              style={styles.actionButton}
            />

            <Button
              title={confirmLabel}
              variant={confirmVariant}
              loading={loading}
              onPress={onConfirm}
              style={styles.actionButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.screenHorizontal,
  },
  dialog: {
    backgroundColor: colors.cardBackground,
    borderRadius: radius.modal,
    padding: spacing.xxl,
    width: '100%',
    ...shadows.lg,
  },
  message: {
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xxl,
  },
  actionButton: {
    flex: 1,
  },
});
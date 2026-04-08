import { useState } from 'react';
import { View, Text, Pressable, Image, Modal, StyleSheet, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ImageIcon, XCircle } from 'lucide-react-native';
import { Colors, BorderRadius, Spacing } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useTheme } from '@/lib/ThemeContext';

interface ReceiptCaptureProps {
  imageUri: string | null;
  onImageSelected: (uri: string) => void;
  onImageRemoved: () => void;
}

export function ReceiptCapture({ imageUri, onImageSelected, onImageRemoved }: ReceiptCaptureProps) {
  const { colors } = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  const pickFromCamera = async () => {
    setShowPicker(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (!result.canceled && result.assets[0]) {
      onImageSelected(result.assets[0].uri);
    }
  };

  const pickFromLibrary = async () => {
    setShowPicker(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (!result.canceled && result.assets[0]) {
      onImageSelected(result.assets[0].uri);
    }
  };

  if (imageUri) {
    return (
      <View style={styles.previewContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Receipt</Text>
        <View style={styles.previewWrapper}>
          <Image source={{ uri: imageUri }} style={styles.preview} />
          <Pressable
            style={styles.removeButton}
            onPress={onImageRemoved}
            accessibilityRole="button"
            accessibilityLabel="Remove receipt photo"
          >
            <XCircle size={24} color={Colors.error} strokeWidth={1.5} />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>Receipt</Text>
      <Pressable
        style={({ pressed }) => [
          styles.addButton,
          { backgroundColor: colors.background, borderColor: colors.border },
          pressed && styles.pressed,
        ]}
        onPress={() => {
          if (Platform.OS === 'web') {
            pickFromLibrary();
          } else {
            setShowPicker(true);
          }
        }}
        accessibilityRole="button"
        accessibilityLabel="Add receipt photo"
        accessibilityHint="Tap to take a photo or choose from your library"
      >
        <Camera size={20} color={colors.textSecondary} strokeWidth={1.5} />
        <Text style={[styles.addButtonText, { color: colors.textSecondary }]}>Add Receipt</Text>
      </Pressable>

      <Modal visible={showPicker} animationType="fade" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setShowPicker(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Receipt</Text>

            <Pressable
              style={({ pressed }) => [
                styles.optionCard,
                { backgroundColor: colors.background, borderColor: colors.border },
                pressed && styles.pressed,
              ]}
              onPress={pickFromCamera}
              accessibilityRole="button"
              accessibilityLabel="Take photo"
            >
              <View style={[styles.optionIcon, { backgroundColor: 'rgba(0,102,255,0.15)' }]}>
                <Camera size={20} color={Colors.secondary} strokeWidth={1.5} />
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>Take Photo</Text>
                <Text style={[styles.optionSub, { color: colors.textSecondary }]}>
                  Use your camera to capture the receipt
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.optionCard,
                { backgroundColor: colors.background, borderColor: colors.border },
                pressed && styles.pressed,
              ]}
              onPress={pickFromLibrary}
              accessibilityRole="button"
              accessibilityLabel="Choose from library"
            >
              <View style={[styles.optionIcon, { backgroundColor: 'rgba(0,200,83,0.15)' }]}>
                <ImageIcon size={20} color={Colors.success} strokeWidth={1.5} />
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>Choose from Library</Text>
                <Text style={[styles.optionSub, { color: colors.textSecondary }]}>
                  Select an existing photo from your device
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
              onPress={() => setShowPicker(false)}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm,
  },
  previewContainer: {
    marginBottom: Spacing.sm,
  },
  label: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: BorderRadius.input,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.85,
  },
  previewWrapper: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  preview: {
    width: 120,
    height: 160,
    borderRadius: BorderRadius.input,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.white,
    borderRadius: 12,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  modalTitle: {
    fontFamily: Fonts.lexend.bold,
    fontSize: 18,
    textAlign: 'center',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    gap: Spacing.md,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 15,
  },
  optionSub: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
    marginTop: 2,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 15,
  },
});

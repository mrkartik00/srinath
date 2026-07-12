import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput,
  RefreshControl,
  Animated,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import {
  GlassCard,
  PressableButton,
  ScreenHeader,
  SectionHeader,
  StatusBadge,
  EmptyState,
  SkeletonList,
  BottomSheet,
  Chip,
  FAB,
  PageLoader,
} from '../components/ui';
import { useScreenAnimation } from '../hooks/useAnimations';
import {
  getVaultDocuments,
  getDocumentDownloadUrl,
  deleteDocument,
  uploadDocument,
} from '../api/vault';
import haptics from '../utils/haptics';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Helpers ---

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getCategoryIcon = (category) => {
  const map = {
    lab_report: { icon: 'flask', color: '#8B5CF6' },
    xray: { icon: 'body', color: '#06B6D4' },
    scan: { icon: 'scan', color: '#F59E0B' },
    prescription: { icon: 'document-text', color: '#10B981' },
    discharge_summary: { icon: 'clipboard', color: '#EC4899' },
    insurance: { icon: 'shield-checkmark', color: '#3B82F6' },
    other: { icon: 'folder', color: '#6B7280' },
  };
  return map[category] || map.other;
};

const getFileTypeIcon = (mimeType) => {
  if (!mimeType) return { icon: 'document', color: '#6B7280' };
  if (mimeType.includes('pdf')) return { icon: 'document-text', color: '#EF4444' };
  if (mimeType.includes('image')) return { icon: 'image', color: '#3B82F6' };
  if (mimeType.includes('video')) return { icon: 'videocam', color: '#8B5CF6' };
  if (mimeType.includes('audio')) return { icon: 'musical-notes', color: '#F59E0B' };
  return { icon: 'document', color: '#6B7280' };
};

const CATEGORIES = [
  { label: 'All', value: 'all' },
  { label: 'Lab Reports', value: 'lab_report' },
  { label: 'X-Ray', value: 'xray' },
  { label: 'Scan', value: 'scan' },
  { label: 'Prescription', value: 'prescription' },
  { label: 'Discharge', value: 'discharge_summary' },
  { label: 'Insurance', value: 'insurance' },
  { label: 'Other', value: 'other' },
];

const MedicalVaultScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const screenAnimation = useScreenAnimation();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [uploadSheetVisible, setUploadSheetVisible] = useState(false);
  const [deleteSheetVisible, setDeleteSheetVisible] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pendingFile, setPendingFile] = useState(null);
  const [detailsSheetVisible, setDetailsSheetVisible] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('other');
  const [uploadDescription, setUploadDescription] = useState('');

  const filteredDocuments =
    selectedCategory === 'all'
      ? documents
      : documents.filter((doc) => doc.category === selectedCategory);

  // --- Data Fetching ---

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await getVaultDocuments();
      setDocuments(response?.data || []);
    } catch (error) {
      const msg =
        (Array.isArray(error) && error.join('\n')) ||
        (typeof error === 'string' && error) ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch documents. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDocuments();
  }, [fetchDocuments]);

  // --- Document Actions ---

  const handleDocumentTap = async (doc) => {
    haptics.light();
    try {
      const response = await getDocumentDownloadUrl(doc._id);
      const url = response?.data?.url || response?.url;
      if (!url) {
        Alert.alert('Error', 'No download URL was returned for this document.');
        return;
      }

      // The /raw fallback route (used when no cloud storage is configured)
      // requires the same Bearer auth as every other request — presigned
      // cloud URLs are self-authenticating and ignore this header.
      const token = await AsyncStorage.getItem('token');
      const fileUri = FileSystem.documentDirectory + doc.fileName;
      const downloadResult = await FileSystem.downloadAsync(url, fileUri, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (downloadResult.status === 200) {
        haptics.success();
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(downloadResult.uri);
        }
      } else {
        Alert.alert('Error', `Download failed (status ${downloadResult.status}).`);
      }
    } catch (error) {
      haptics.error();
      const msg =
        (Array.isArray(error) && error.join('\n')) ||
        (typeof error === 'string' && error) ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to download document.';
      Alert.alert('Error', msg);
    }
  };

  const handleDocumentLongPress = (doc) => {
    haptics.medium();
    setSelectedDoc(doc);
    setDeleteSheetVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDoc) return;
    haptics.heavy();
    try {
      await deleteDocument(selectedDoc._id);
      haptics.success();
      setDocuments((prev) => prev.filter((d) => d._id !== selectedDoc._id));
      setDeleteSheetVisible(false);
      setSelectedDoc(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete document.');
    }
  };

  // --- Upload Handlers ---

  const handleUploadPress = () => {
    haptics.light();
    setUploadSheetVisible(true);
  };

  // A file was picked — stage it and open the details step (title/category/
  // description) instead of uploading immediately.
  const openDetailsFor = (file) => {
    setPendingFile(file);
    setUploadTitle(file.fileName || file.name || 'Untitled Document');
    setUploadCategory('other');
    setUploadDescription('');
    setDetailsSheetVisible(true);
  };

  const handleTakePhoto = async () => {
    setUploadSheetVisible(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Camera access is needed to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      openDetailsFor(result.assets[0]);
    }
  };

  const handleChooseGallery = async () => {
    setUploadSheetVisible(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Gallery access is needed to select photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      openDetailsFor(result.assets[0]);
    }
  };

  const handleChooseFile = async () => {
    setUploadSheetVisible(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/msword'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        openDetailsFor(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document.');
    }
  };

  const handleConfirmUpload = async () => {
    if (!pendingFile) return;
    setDetailsSheetVisible(false);
    await processUpload(pendingFile, {
      title: uploadTitle.trim() || 'Untitled Document',
      category: uploadCategory,
      description: uploadDescription.trim(),
    });
    setPendingFile(null);
  };

  const processUpload = async (file, details) => {
    haptics.medium();
    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.fileName || file.name || 'document',
        type: file.mimeType || file.type || 'application/octet-stream',
      });
      formData.append('title', details?.title || file.fileName || file.name || 'Untitled Document');
      formData.append('category', details?.category || 'other');
      if (details?.description) formData.append('description', details.description);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 300);

      await uploadDocument(formData);
      clearInterval(progressInterval);
      setUploadProgress(100);
      haptics.success();
      fetchDocuments();
    } catch (error) {
      haptics.error();
      // The axios interceptor already unwraps failed requests into a plain
      // string or an array of validation errors (see api/axios.js), not an
      // Error/AxiosError — surface that real reason instead of a generic one.
      const msg =
        (Array.isArray(error) && error.join('\n')) ||
        (typeof error === 'string' && error) ||
        error?.response?.data?.message ||
        error?.message ||
        'Could not upload the document. Please try again.';
      Alert.alert('Upload Failed', msg);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // --- Render Helpers ---

  const renderCategoryFilter = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}
      style={styles.filterScroll}
    >
      {CATEGORIES.map((cat) => (
        <Chip
          key={cat.value}
          label={cat.label}
          active={selectedCategory === cat.value}
          onPress={() => {
            haptics.light();
            setSelectedCategory(cat.value);
          }}
        />
      ))}
    </ScrollView>
  );

  const renderDocumentCard = (doc) => {
    const fileType = getFileTypeIcon(doc.mimeType);
    const categoryInfo = getCategoryIcon(doc.category);
    const categoryLabel =
      CATEGORIES.find((c) => c.value === doc.category)?.label || 'Other';
    const uploadDate = doc.createdAt
      ? new Date(doc.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '';

    return (
      <TouchableOpacity
        key={doc._id}
        activeOpacity={0.7}
        onPress={() => handleDocumentTap(doc)}
        onLongPress={() => handleDocumentLongPress(doc)}
        delayLongPress={500}
      >
        <GlassCard style={styles.documentCard}>
          <View style={styles.cardContent}>
            {/* File Type Icon */}
            <View style={[styles.fileIconContainer, { backgroundColor: fileType.color + '20' }]}>
              <Ionicons name={fileType.icon} size={24} color={fileType.color} />
            </View>

            {/* Document Info */}
            <View style={styles.docInfo}>
              <Text style={[styles.docTitle, { color: theme.text }]} numberOfLines={1}>
                {doc.title}
              </Text>
              <View style={styles.docMeta}>
                <View style={[styles.categoryBadge, { backgroundColor: `${categoryInfo.color}1A` }]}>
                  <View style={[styles.categoryDot, { backgroundColor: categoryInfo.color }]} />
                  <Text style={[styles.categoryBadgeText, { color: categoryInfo.color }]}>{categoryLabel}</Text>
                </View>
                <Text style={[styles.docSize, { color: theme.textSecondary }]}>
                  {formatFileSize(doc.fileSize)}
                </Text>
              </View>
              {doc.description ? (
                <Text style={[styles.docDescription, { color: theme.textMuted }]} numberOfLines={2}>
                  {doc.description}
                </Text>
              ) : null}
              <View style={styles.docFooter}>
                <Text style={[styles.docDate, { color: theme.textMuted }]}>
                  {uploadDate}
                </Text>
                {doc.uploaderRole && (
                  <Text style={[styles.uploaderRole, { color: theme.textMuted }]}>
                    • {doc.uploaderRole}
                  </Text>
                )}
              </View>
            </View>

            {/* Download/Chevron Icon */}
            <TouchableOpacity
              onPress={() => handleDocumentTap(doc)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="cloud-download-outline"
                size={22}
                color={theme.primary}
              />
            </TouchableOpacity>
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  const renderUploadProgress = () => {
    if (!uploading) return null;
    return (
      <GlassCard style={styles.uploadProgressCard}>
        <View style={styles.uploadProgressContent}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={[styles.uploadProgressText, { color: theme.text }]}>
            Uploading... {uploadProgress}%
          </Text>
        </View>
        <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${uploadProgress}%`, backgroundColor: theme.primary },
            ]}
          />
        </View>
      </GlassCard>
    );
  };

  // --- Main Render ---

  return (
    <LinearGradient
      colors={theme.gradient || [theme.bg, theme.bg]}
      style={styles.container}
    >
      <Animated.View style={[styles.content, { opacity: screenAnimation.fadeAnim, transform: [{ translateY: screenAnimation.slideAnim }] }]}>
        <ScreenHeader
          title="Medical Vault"
          subtitle="Your secure documents"
          onBack={() => navigation.goBack()}
          rightIcon="add"
          onRightPress={handleUploadPress}
        />

        {renderCategoryFilter()}
        {renderUploadProgress()}

        {loading ? (
          <View style={styles.loaderContainer}>
            <PageLoader fullScreen={false} />
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.primary}
              />
            }
          >
            {filteredDocuments.length === 0 ? (
              <EmptyState
                icon="document-text-outline"
                title="No documents yet"
                message="Upload your first document"
                actionLabel="Upload Document"
                onAction={handleUploadPress}
              />
            ) : (
              <View style={styles.documentList}>
                {filteredDocuments.map((doc) => renderDocumentCard(doc))}
              </View>
            )}

            <View style={styles.bottomSpacer} />
          </ScrollView>
        )}

        {/* Upload Options BottomSheet */}
        <BottomSheet
          visible={uploadSheetVisible}
          onClose={() => setUploadSheetVisible(false)}
          title="Upload Document"
        >
          <View style={styles.uploadOptions}>
            <PressableButton
              onPress={handleTakePhoto}
              style={styles.uploadOption}
            >
              <View style={styles.uploadOptionContent}>
                <View style={[styles.uploadOptionIcon, { backgroundColor: '#EF444420' }]}>
                  <Ionicons name="camera" size={24} color="#EF4444" />
                </View>
                <Text style={[styles.uploadOptionText, { color: theme.text }]}>
                  Take Photo
                </Text>
              </View>
            </PressableButton>

            <PressableButton
              onPress={handleChooseGallery}
              style={styles.uploadOption}
            >
              <View style={styles.uploadOptionContent}>
                <View style={[styles.uploadOptionIcon, { backgroundColor: '#3B82F620' }]}>
                  <Ionicons name="images" size={24} color="#3B82F6" />
                </View>
                <Text style={[styles.uploadOptionText, { color: theme.text }]}>
                  Choose from Gallery
                </Text>
              </View>
            </PressableButton>

            <PressableButton
              onPress={handleChooseFile}
              style={styles.uploadOption}
            >
              <View style={styles.uploadOptionContent}>
                <View style={[styles.uploadOptionIcon, { backgroundColor: '#8B5CF620' }]}>
                  <Ionicons name="folder-open" size={24} color="#8B5CF6" />
                </View>
                <Text style={[styles.uploadOptionText, { color: theme.text }]}>
                  Choose File
                </Text>
              </View>
            </PressableButton>
          </View>
        </BottomSheet>

        {/* Document Details BottomSheet — title, category, optional description */}
        <BottomSheet
          visible={detailsSheetVisible}
          onClose={() => {
            setDetailsSheetVisible(false);
            setPendingFile(null);
          }}
          title="Document Details"
          height={560}
        >
          <ScrollView style={styles.detailsContent} keyboardShouldPersistTaps="handled">
            <Text style={[styles.detailsLabel, { color: theme.textMuted }]}>Title</Text>
            <TextInput
              style={[styles.detailsInput, { color: theme.text, backgroundColor: theme.chipBg }]}
              value={uploadTitle}
              onChangeText={setUploadTitle}
              placeholder="Document title"
              placeholderTextColor={theme.textMuted}
            />

            <Text style={[styles.detailsLabel, { color: theme.textMuted, marginTop: 16 }]}>Type of Document</Text>
            <View style={styles.detailsChipRow}>
              {CATEGORIES.filter((cat) => cat.value !== 'all').map((cat) => (
                <Chip
                  key={cat.value}
                  label={cat.label}
                  active={uploadCategory === cat.value}
                  onPress={() => { haptics.selection(); setUploadCategory(cat.value); }}
                />
              ))}
            </View>

            <Text style={[styles.detailsLabel, { color: theme.textMuted, marginTop: 16 }]}>Description (optional)</Text>
            <TextInput
              style={[styles.detailsInput, styles.detailsTextarea, { color: theme.text, backgroundColor: theme.chipBg }]}
              value={uploadDescription}
              onChangeText={setUploadDescription}
              placeholder="Add any notes about this document..."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <PressableButton
              onPress={handleConfirmUpload}
              hapticType="medium"
              style={styles.detailsUploadBtnWrapper}
              scaleTo={0.97}
            >
              <View style={[styles.detailsUploadBtn, { backgroundColor: theme.primary }]}>
                <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                <Text style={styles.detailsUploadBtnText}>Upload Document</Text>
              </View>
            </PressableButton>
            <View style={{ height: 24 }} />
          </ScrollView>
        </BottomSheet>

        {/* Delete Confirmation BottomSheet */}
        <BottomSheet
          visible={deleteSheetVisible}
          onClose={() => {
            setDeleteSheetVisible(false);
            setSelectedDoc(null);
          }}
          title="Delete Document"
        >
          <View style={styles.deleteConfirmContent}>
            <Text style={[styles.deleteConfirmText, { color: theme.textSecondary }]}>
              Are you sure you want to delete "{selectedDoc?.title}"? This action cannot be undone.
            </Text>
            <View style={styles.deleteActions}>
              <PressableButton
                onPress={() => {
                  setDeleteSheetVisible(false);
                  setSelectedDoc(null);
                }}
                style={[styles.deleteBtn, styles.cancelBtn]}
              >
                <Text style={[styles.cancelBtnText, { color: theme.text }]}>Cancel</Text>
              </PressableButton>
              <PressableButton
                onPress={handleDeleteConfirm}
                style={[styles.deleteBtn, styles.confirmDeleteBtn]}
              >
                <Text style={styles.confirmDeleteBtnText}>Delete</Text>
              </PressableButton>
            </View>
          </View>
        </BottomSheet>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  chipRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterScroll: {
    flexGrow: 0,
  },
  chip: {
    marginRight: 8,
  },
  scrollView: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  documentList: {
    gap: 12,
  },
  documentCard: {
    marginBottom: 0,
    padding: 14,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  docInfo: {
    flex: 1,
    marginRight: 8,
  },
  docTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  docMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  docSize: {
    fontSize: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  docDescription: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 4,
  },
  docFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docDate: {
    fontSize: 11,
  },
  uploaderRole: {
    fontSize: 11,
    marginLeft: 4,
  },
  uploadProgressCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
  },
  uploadProgressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  uploadProgressText: {
    fontSize: 13,
    fontWeight: '500',
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  uploadOptions: {
    padding: 16,
    gap: 12,
  },
  uploadOption: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  uploadOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 14,
  },
  uploadOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadOptionText: {
    fontSize: 15,
    fontWeight: '500',
  },
  detailsContent: {
    padding: 16,
  },
  detailsLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  detailsInput: {
    fontSize: 15,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  detailsTextarea: {
    minHeight: 90,
  },
  detailsChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailsUploadBtnWrapper: {
    marginTop: 24,
    borderRadius: 14,
    overflow: 'hidden',
  },
  detailsUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  detailsUploadBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteConfirmContent: {
    padding: 16,
  },
  deleteConfirmText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  deleteActions: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: 'rgba(107, 114, 128, 0.15)',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  confirmDeleteBtn: {
    backgroundColor: '#EF4444',
  },
  confirmDeleteBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 120,
  },
});

export default MedicalVaultScreen;

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  Text,
  TextInput,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Alert,
  Image,
  Linking,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useFonts, Urbanist_600SemiBold, Urbanist_700Bold } from '@expo-google-fonts/urbanist';
import { useTheme } from '../context/ThemeContext';
import { Avatar } from '../components/ui';
import { getMessages, createConversation, uploadChatFile, getAttachmentUrl, shareVaultInChat } from '../api/chat';
import { getVaultDocuments } from '../api/vault';
import haptics from '../utils/haptics';
import { API_BASE_URL } from '../api/axios';

const SERVER_URL = API_BASE_URL;


export default function ChatScreen({ route, navigation }) {
  const { conversationId: routeConversationId, doctorName: routeDoctorName, doctorId: routeDoctorId, doctorAvatar, doctor } = route.params || {};
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const [conversationId, setConversationId] = useState(routeConversationId);
  const doctorId = routeDoctorId || doctor?.id || doctor?._id;
  const doctorName = routeDoctorName || doctor?.name || 'Doctor';

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState(null);

  // Vault share state
  const [vaultModalVisible, setVaultModalVisible] = useState(false);
  const [vaultDocuments, setVaultDocuments] = useState([]);
  const [selectedVaultIds, setSelectedVaultIds] = useState([]);
  const [vaultLoading, setVaultLoading] = useState(false);
  const [vaultSharing, setVaultSharing] = useState(false);

  const [fontsLoaded] = useFonts({ Urbanist_600SemiBold, Urbanist_700Bold });

  const socketRef = useRef(null);
  const flatListRef = useRef(null);
  const typingAnim = useRef(new Animated.Value(0)).current;

  // Typing indicator animation
  useEffect(() => {
    if (isTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(typingAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    } else {
      typingAnim.setValue(0);
    }
  }, [isTyping]);

  // Track keyboard visibility and height so we can pad the screen manually,
  // bypassing any KeyboardAvoidingView bugs on iOS.
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates?.height || 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Fetch/create conversation if not present
  useEffect(() => {
    if (!conversationId && doctorId) {
      (async () => {
        try {
          setLoading(true);
          const response = await createConversation(doctorId);
          setConversationId(response.data?._id);
        } catch (err) {
          console.error('Failed to create/fetch conversation:', err);
          setLoading(false);
        }
      })();
    }
  }, [conversationId, doctorId]);

  // Fetch message history once conversationId is available
  useEffect(() => {
    if (conversationId) {
      (async () => {
        try {
          setLoading(true);
          const res = await getMessages(conversationId);
          const fetched = res.data || [];
          setMessages(fetched);
          setHasMore(fetched.length >= 50);
        } catch (err) {
          console.error('Failed to fetch messages:', err);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [conversationId]);

  // Socket.IO connection
  useEffect(() => {
    if (!conversationId) return;
    let socket;
    (async () => {
      const token = await AsyncStorage.getItem('token');
      socket = io(SERVER_URL, { auth: { token }, transports: ['websocket'] });
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('conversation:join', conversationId);
        socket.emit('messages:read', conversationId);
      });

      socket.on('message:new', (data) => {
        const msg = data.message || data;
        setMessages((prev) => {
          const existingIndex = prev.findIndex(
            (m) => m._id === msg._id || (msg.idempotencyKey && m._id === msg.idempotencyKey)
          );
          if (existingIndex !== -1) {
            const next = [...prev];
            next[existingIndex] = msg;
            return next;
          }
          return [...prev, msg];
        });
        socket.emit('messages:read', conversationId);
        haptics.selection();
        scrollToBottom();
      });

      socket.on('typing', ({ userId }) => {
        if (userId !== doctorId) return;
        setIsTyping(true);
        clearTimeout(socket._typingTimeout);
        socket._typingTimeout = setTimeout(() => setIsTyping(false), 3000);
      });
    })();

    return () => {
      if (socket) {
        socket.emit('conversation:leave', conversationId);
        socket.disconnect();
      }
    };
  }, [conversationId, doctorId]);

  // Scroll to bottom helper
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  // Scroll to bottom when messages load
  useEffect(() => {
    if (!loading && messages.length > 0) scrollToBottom();
  }, [loading, messages.length, scrollToBottom]);

  // Send message
  const handleSend = useCallback(async () => {
    const body = inputText.trim();

    if (pendingAttachment) {
      if (!conversationId) return;
      const attUri = pendingAttachment.uri;
      const attName = pendingAttachment.fileName || `photo-${Date.now()}.jpg`;
      const attType = pendingAttachment.mimeType || 'image/jpeg';

      const formData = new FormData();
      if (attUri.startsWith('blob:') || attUri.startsWith('http')) {
        // Web — resolve the blob URL to a real Blob/File first
        const blobRes = await fetch(attUri);
        const blob = await blobRes.blob();
        formData.append('file', new File([blob], attName, { type: attType }));
      } else {
        // Native — use RN-style file descriptor
        formData.append('file', { uri: attUri, name: attName, type: attType });
      }
      if (body) {
        formData.append('caption', body);
      }

      haptics.medium();
      setUploadingAttachment(true);
      try {
        const res = await uploadChatFile(conversationId, formData);
        const uploadedMessage = res.data;
        setMessages((prev) => {
          if (prev.some((m) => m._id === uploadedMessage._id)) return prev;
          return [...prev, uploadedMessage];
        });
        haptics.success();
        setInputText('');
        setPendingAttachment(null);
        scrollToBottom();
      } catch (err) {
        haptics.error();
        const msg = (Array.isArray(err) && err.join('\n')) || (typeof err === 'string' && err) || 'Failed to send the photo.';
        Alert.alert('Upload Failed', msg);
      } finally {
        setUploadingAttachment(false);
      }
      return;
    }

    if (!body || !socketRef.current) return;

    const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const optimisticMsg = {
      _id: idempotencyKey,
      body,
      senderId: { _id: 'me', name: 'You', role: 'patient' },
      senderRole: 'patient',
      type: 'text',
      attachments: [],
      createdAt: new Date().toISOString(),
      readAt: null,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText('');
    haptics.medium();
    scrollToBottom();

    socketRef.current.emit('message:send', {
      conversationId,
      body,
      type: 'text',
      idempotencyKey,
    });
  }, [inputText, pendingAttachment, conversationId, scrollToBottom]);

  // Attach image
  const handleAttach = useCallback(async () => {
    haptics.light();
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Gallery access is needed to send photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    
    setPendingAttachment(result.assets[0]);
    haptics.medium();
  }, []);

  // Open vault share modal
  const handleOpenVaultShare = useCallback(async () => {
    haptics.light();
    setVaultModalVisible(true);
    setSelectedVaultIds([]);
    try {
      setVaultLoading(true);
      const res = await getVaultDocuments();
      setVaultDocuments(res.data || res.documents || res || []);
    } catch (err) {
      console.error('Failed to fetch vault documents:', err);
      Alert.alert('Error', 'Could not load vault documents.');
    } finally {
      setVaultLoading(false);
    }
  }, []);

  // Toggle vault document selection
  const toggleVaultSelection = useCallback((docId) => {
    setSelectedVaultIds((prev) => {
      if (prev.includes(docId)) return prev.filter((id) => id !== docId);
      if (prev.length >= 5) {
        Alert.alert('Limit Reached', 'You can share up to 5 documents at a time.');
        return prev;
      }
      return [...prev, docId];
    });
  }, []);

  // Share selected vault documents
  const handleShareVault = useCallback(async () => {
    if (!conversationId || selectedVaultIds.length === 0) return;
    try {
      setVaultSharing(true);
      await shareVaultInChat(conversationId, selectedVaultIds);
      haptics.success();
      setVaultModalVisible(false);
      setSelectedVaultIds([]);
      // Refresh messages to show shared documents
      const res = await getMessages(conversationId);
      const fetched = res.data || [];
      setMessages(fetched);
      scrollToBottom();
    } catch (err) {
      haptics.error();
      const msg = Array.isArray(err) ? err.join('\n') : (typeof err === 'string' ? err : 'Failed to share documents.');
      Alert.alert('Share Failed', msg);
    } finally {
      setVaultSharing(false);
    }
  }, [conversationId, selectedVaultIds, scrollToBottom]);

  // Typing events
  const handleFocus = useCallback(() => {
    socketRef.current?.emit('typing:start', { conversationId });
    scrollToBottom();
  }, [conversationId, scrollToBottom]);

  const handleBlur = useCallback(() => {
    socketRef.current?.emit('typing:stop', { conversationId });
  }, [conversationId]);

  // Load older messages (pagination)
  const loadOlderMessages = useCallback(async () => {
    if (loadingOlder || !hasMore || messages.length === 0 || !conversationId) return;
    try {
      setLoadingOlder(true);
      const oldestMessage = messages[0];
      const res = await getMessages(conversationId, { before: oldestMessage.createdAt });
      const olderMessages = res.data || [];
      setHasMore(olderMessages.length >= 50);
      if (olderMessages.length > 0) {
        setMessages((prev) => [...olderMessages, ...prev]);
      }
    } catch (err) {
      console.error('Failed to load older messages:', err);
    } finally {
      setLoadingOlder(false);
    }
  }, [loadingOlder, hasMore, messages, conversationId]);

  const renderHeader = useCallback(() => {
    if (!hasMore) return null;
    return (
      <View style={styles.loadOlderContainer}>
        {loadingOlder ? (
          <ActivityIndicator size="small" color={PRIMARY_COLOR} />
        ) : (
          <TouchableOpacity onPress={loadOlderMessages} style={styles.loadOlderBtn}>
            <Ionicons name="refresh-circle-outline" size={20} color={PRIMARY_COLOR} />
            <Text style={styles.loadOlderText}>Load older messages</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [hasMore, loadingOlder, loadOlderMessages]);

  // Format time
  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  // Open an image/document attachment — uses the direct URL if the server
  // already returned one, otherwise fetches a presigned download link.
  const handleOpenAttachment = useCallback(async (item) => {
    const attachment = item.attachments?.[0];
    if (!attachment) return;
    try {
      let url = attachment.fileUrl;
      if (!url) {
        const res = await getAttachmentUrl(item._id);
        url = res.data?.url;
      }
      if (url) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Unavailable', 'This file is not available right now.');
      }
    } catch {
      Alert.alert('Error', 'Failed to open attachment.');
    }
  }, []);

  // Render message bubble
  const renderMessage = useCallback(
    ({ item }) => {
      const { senderRole, body, createdAt, readAt, type, attachments } = item;

      // System message
      if (senderRole === 'system' || type === 'system') {
        return (
          <View style={styles.systemRow}>
            <Text style={styles.systemText}>{body}</Text>
          </View>
        );
      }

      const isPatient = senderRole === 'patient';
      const isAI = senderRole === 'ai';

      const bubbleStyle = isPatient
        ? styles.bubbleRight
        : styles.bubbleLeft;

      const rowStyle = isPatient
        ? styles.rowRight
        : styles.rowLeft;

      const attachment = attachments?.[0];
      const bodyTextStyle = isPatient ? styles.bubbleTextWhite : styles.bubbleText;
      // The server auto-generates a caption ("Sent a photo: x.jpg") when no
      // real caption was provided — skip showing that redundant text under
      // the attachment preview itself.
      const isAutoCaption = !!attachment && (body?.startsWith('Sent a photo:') || body?.startsWith('Sent a document:'));

      return (
        <View style={rowStyle}>
          {/* AI robot icon */}
          {isAI && (
            <View style={styles.aiIcon}>
              <Ionicons name="hardware-chip-outline" size={14} color="#0d9488" />
            </View>
          )}

          <View style={[styles.bubble, bubbleStyle, { backgroundColor: isPatient ? theme.primary : theme.card }]}>
            {attachment && type === 'image' && attachment.fileUrl ? (
              <TouchableOpacity onPress={() => handleOpenAttachment(item)} activeOpacity={0.9}>
                <Image source={{ uri: attachment.fileUrl }} style={styles.attachmentImage} resizeMode="cover" />
              </TouchableOpacity>
            ) : attachment ? (
              <TouchableOpacity onPress={() => handleOpenAttachment(item)} style={styles.attachmentRow} activeOpacity={0.8}>
                <Ionicons
                  name={type === 'image' ? 'image' : 'document-text'}
                  size={22}
                  color={isPatient ? '#FFFFFF' : theme.primary}
                />
                <Text style={[styles.attachmentName, bodyTextStyle]} numberOfLines={1}>
                  {attachment.fileName || 'Attachment'}
                </Text>
              </TouchableOpacity>
            ) : null}
            {body && !isAutoCaption ? <Text style={bodyTextStyle}>{body}</Text> : null}
          </View>

          {/* Time + read receipt */}
          <View style={[styles.metaRow, isPatient && styles.metaRight]}>
            <Text style={styles.timeText}>
              {formatTime(createdAt)}
            </Text>
            {isPatient && readAt && (
              <Ionicons
                name="checkmark-done"
                size={14}
                color={theme.primary}
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </View>
      );
    },
    [handleOpenAttachment]
  );

  // Typing indicator
  const renderTypingIndicator = () => {
    if (!isTyping) return null;
    const translateY = typingAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });
    return (
      <View style={styles.typingRow}>
        <Animated.View style={[styles.dot, { transform: [{ translateY }] }]} />
        <Animated.View style={[styles.dot, { transform: [{ translateY }], marginLeft: 4 }]} />
        <Animated.View style={[styles.dot, { transform: [{ translateY }], marginLeft: 4 }]} />
        <Text style={styles.typingText}> typing...</Text>
      </View>
    );
  };

  if (!fontsLoaded) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      {/* WhatsApp-style compact header */}
      <View style={[styles.chatHeader, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.chatHeaderBack} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={26} color={theme.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.chatHeaderAvatarTap}
          activeOpacity={0.7}
          onPress={() => {
            if (doctorId) {
              navigation.navigate('DoctorDetail', { doctor: { _id: doctorId, name: doctorName, avatar: doctorAvatar, ...(doctor || {}) } });
            }
          }}
        >
          <View style={styles.chatHeaderAvatar}>
            <Avatar name={doctorName} size={42} uri={doctorAvatar} />
          </View>
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatHeaderName} numberOfLines={1}>{doctorName}</Text>
            <Text style={styles.chatHeaderSub} numberOfLines={1}>Doctor</Text>
          </View>
        </TouchableOpacity>
      </View>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item._id}
            renderItem={renderMessage}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={renderHeader}
            ListFooterComponent={renderTypingIndicator}
          />
        )}

        {/* Input Bar */}
        <View style={[styles.inputBarContainer, { paddingBottom: keyboardVisible && Platform.OS === 'android' ? 12 : Math.max(insets.bottom, 12) }]}>
          <View style={styles.inputRow}>
            <TouchableOpacity onPress={handleAttach} style={styles.attachBtn} disabled={uploadingAttachment}>
              <Ionicons name="attach" size={26} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleOpenVaultShare} style={styles.attachBtn} disabled={uploadingAttachment}>
              <Ionicons name="folder-open-outline" size={24} color={theme.textSecondary} />
            </TouchableOpacity>

            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor={theme.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={2000}
              numberOfLines={4}
              textAlignVertical="center"
              onFocus={handleFocus}
              onBlur={handleBlur}
            />

            <TouchableOpacity onPress={handleSend} disabled={!inputText.trim() || uploadingAttachment}>
              <View
                style={[
                  styles.sendBtn,
                  { backgroundColor: inputText.trim() ? theme.primary : theme.textSecondary + '55' }
                ]}
              >
                {uploadingAttachment ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      {/* Full Screen Image Preview Modal */}
      <Modal visible={!!pendingAttachment} animationType="fade" transparent={false} onRequestClose={() => setPendingAttachment(null)}>
        <View style={[styles.modalContainer, { paddingTop: Math.max(insets.top, 20) }]}>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setPendingAttachment(null)}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.modalImageWrapper}>
            {pendingAttachment && <Image source={{ uri: pendingAttachment.uri }} style={styles.modalImage} resizeMode="contain" />}
          </View>
          
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={[styles.modalInputRow, { paddingBottom: Math.max(insets.bottom, 12) }]}>
              <View style={styles.modalInputWrapper}>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="Add a caption..."
                  placeholderTextColor="#8F9BB3"
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={2000}
                />
              </View>
              <TouchableOpacity onPress={handleSend} disabled={uploadingAttachment} style={styles.modalSendBtn}>
                {uploadingAttachment ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="send" size={18} color="#FFFFFF" style={{ marginLeft: 2 }} />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Vault Share Modal */}
      <Modal visible={vaultModalVisible} animationType="slide" transparent={true} onRequestClose={() => setVaultModalVisible(false)}>
        <View style={styles.vaultModalOverlay}>
          <View style={[styles.vaultModalContainer, { backgroundColor: theme.card }]}>
            <View style={styles.vaultModalHeader}>
              <Text style={styles.vaultModalTitle}>Share from Vault</Text>
              <TouchableOpacity onPress={() => setVaultModalVisible(false)} activeOpacity={0.7}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            {vaultLoading ? (
              <View style={styles.vaultLoadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
              </View>
            ) : vaultDocuments.length === 0 ? (
              <View style={styles.vaultLoadingContainer}>
                <Text style={styles.vaultEmptyText}>No documents in your vault.</Text>
              </View>
            ) : (
              <FlatList
                data={vaultDocuments}
                keyExtractor={(item) => item._id || item.id}
                style={styles.vaultList}
                renderItem={({ item }) => {
                  const docId = item._id || item.id;
                  const isSelected = selectedVaultIds.includes(docId);
                  return (
                    <TouchableOpacity
                      style={[styles.vaultDocRow, isSelected && { backgroundColor: theme.primary + '15' }]}
                      onPress={() => toggleVaultSelection(docId)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.vaultCheckbox, isSelected && { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                        {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                      </View>
                      <Ionicons name="document-text-outline" size={20} color={theme.primary} style={{ marginRight: 10 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.vaultDocName} numberOfLines={1}>{item.originalName || item.fileName || item.name || 'Document'}</Text>
                        {item.category ? <Text style={styles.vaultDocCategory}>{item.category}</Text> : null}
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}

            <View style={styles.vaultModalFooter}>
              <Text style={styles.vaultSelectedCount}>{selectedVaultIds.length}/5 selected</Text>
              <TouchableOpacity
                style={[styles.vaultShareBtn, (selectedVaultIds.length === 0 || vaultSharing) && { opacity: 0.5 }]}
                onPress={handleShareVault}
                disabled={selectedVaultIds.length === 0 || vaultSharing}
                activeOpacity={0.8}
              >
                {vaultSharing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.vaultShareBtnText}>Share</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  chatHeaderBack: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  chatHeaderAvatar: {
    marginRight: 10,
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatHeaderName: {
    fontSize: 17,
    fontFamily: 'Urbanist_700Bold',
    color: theme.text,
    letterSpacing: -0.3,
  },
  chatHeaderSub: {
    fontSize: 13,
    fontFamily: 'Urbanist_600SemiBold',
    color: theme.textSecondary,
    marginTop: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  // Message rows
  rowRight: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  rowLeft: {
    alignItems: 'flex-start',
    marginBottom: 12,
    flexDirection: 'column',
  },
  // Bubbles
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  bubbleRight: {
    borderBottomRightRadius: 6,
    alignSelf: 'flex-end',
  },
  bubbleLeft: {
    borderBottomLeftRadius: 6,
    alignSelf: 'flex-start',
  },
  bubbleTextWhite: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Urbanist_600SemiBold',
    lineHeight: 22,
  },
  bubbleText: {
    color: theme.text,
    fontSize: 16,
    fontFamily: 'Urbanist_600SemiBold',
    lineHeight: 22,
  },
  attachmentImage: {
    width: 200,
    height: 200,
    borderRadius: 14,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 140,
  },
  attachmentName: {
    fontSize: 14,
    fontFamily: 'Urbanist_600SemiBold',
    flexShrink: 1,
  },
  // System
  systemRow: {
    alignItems: 'center',
    marginVertical: 12,
  },
  systemText: {
    fontSize: 13,
    fontFamily: 'Urbanist_600SemiBold',
    color: theme.textSecondary,
    fontStyle: 'italic',
  },
  // Meta (time + read receipt)
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginHorizontal: 4,
  },
  metaRight: {
    alignSelf: 'flex-end',
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Urbanist_600SemiBold',
    color: theme.textSecondary,
  },
  // AI icon
  aiIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  // Typing
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    paddingVertical: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.textSecondary,
  },
  typingText: {
    fontSize: 13,
    fontFamily: 'Urbanist_600SemiBold',
    color: theme.textSecondary,
    marginLeft: 6,
  },
  // Input bar
  inputBarContainer: {
    backgroundColor: theme.card,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  attachBtn: {
    padding: 8,
    marginRight: 4,
    marginBottom: 2,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Urbanist_600SemiBold',
    backgroundColor: theme.bg,
    color: theme.text,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  modalImageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#111111',
  },
  modalInputWrapper: {
    flex: 1,
    backgroundColor: '#222222',
    borderRadius: 22,
    minHeight: 44,
    maxHeight: 120,
    justifyContent: 'center',
  },
  modalTextInput: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Urbanist_600SemiBold',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  modalSendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  loadOlderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  loadOlderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.card,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  loadOlderText: {
    fontSize: 13,
    fontFamily: 'Urbanist_600SemiBold',
    color: theme.primary,
  },
  // Tappable avatar header
  chatHeaderAvatarTap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  // Vault share modal
  vaultModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  vaultModalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingTop: 16,
  },
  vaultModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  vaultModalTitle: {
    fontSize: 18,
    fontFamily: 'Urbanist_700Bold',
    color: theme.text,
  },
  vaultLoadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaultEmptyText: {
    fontSize: 15,
    fontFamily: 'Urbanist_600SemiBold',
    color: theme.textSecondary,
  },
  vaultList: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  vaultDocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  vaultCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vaultDocName: {
    fontSize: 14,
    fontFamily: 'Urbanist_600SemiBold',
    color: theme.text,
  },
  vaultDocCategory: {
    fontSize: 12,
    fontFamily: 'Urbanist_600SemiBold',
    color: theme.textSecondary,
    marginTop: 2,
  },
  vaultModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  vaultSelectedCount: {
    fontSize: 14,
    fontFamily: 'Urbanist_600SemiBold',
    color: theme.textSecondary,
  },
  vaultShareBtn: {
    backgroundColor: theme.primary,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  vaultShareBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Urbanist_700Bold',
  },
});

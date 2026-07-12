import React, { useState, useEffect, useRef, useCallback } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useFonts, Urbanist_600SemiBold, Urbanist_700Bold } from '@expo-google-fonts/urbanist';
import { useTheme } from '../context/ThemeContext';
import { ScreenHeader } from '../components/ui';
import { getMessages, createConversation, uploadChatFile, getAttachmentUrl } from '../api/chat';
import haptics from '../utils/haptics';
import { API_BASE_URL } from '../api/axios';

const SERVER_URL = API_BASE_URL;

const BG_COLOR = '#F5F7FA';
const PRIMARY_COLOR = '#223263';
const TEXT_SECONDARY = '#8F9BB3';
const BLUE_LIGHT = '#EEF2F8';

export default function ChatScreen({ route, navigation }) {
  const { conversationId: routeConversationId, doctorName: routeDoctorName, doctorId: routeDoctorId, doctor } = route.params || {};
  const { theme } = useTheme();
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
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

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

  // Track keyboard visibility so the input bar doesn't double up its
  // bottom safe-area padding on top of the keyboard (which already sits
  // flush with the screen edge).
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
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
  const handleSend = useCallback(() => {
    const body = inputText.trim();
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
  }, [inputText, conversationId, scrollToBottom]);

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
    if (result.canceled || !result.assets?.[0] || !conversationId) return;

    const asset = result.assets[0];
    const formData = new FormData();
    formData.append('file', {
      uri: asset.uri,
      name: asset.fileName || `photo-${Date.now()}.jpg`,
      type: asset.mimeType || 'image/jpeg',
    });

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
      scrollToBottom();
    } catch (err) {
      haptics.error();
      const msg =
        (Array.isArray(err) && err.join('\n')) ||
        (typeof err === 'string' && err) ||
        'Failed to send the photo. Please try again.';
      Alert.alert('Upload Failed', msg);
    } finally {
      setUploadingAttachment(false);
    }
  }, [conversationId, scrollToBottom]);

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

          <View style={[styles.bubble, bubbleStyle, { backgroundColor: isPatient ? PRIMARY_COLOR : '#FFFFFF' }]}>
            {attachment && type === 'image' && attachment.fileUrl ? (
              <TouchableOpacity onPress={() => handleOpenAttachment(item)} activeOpacity={0.9}>
                <Image source={{ uri: attachment.fileUrl }} style={styles.attachmentImage} resizeMode="cover" />
              </TouchableOpacity>
            ) : attachment ? (
              <TouchableOpacity onPress={() => handleOpenAttachment(item)} style={styles.attachmentRow} activeOpacity={0.8}>
                <Ionicons
                  name={type === 'image' ? 'image' : 'document-text'}
                  size={22}
                  color={isPatient ? '#FFFFFF' : PRIMARY_COLOR}
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
                color={PRIMARY_COLOR}
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
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerWrapper}>
        <ScreenHeader title={doctorName} onBack={() => navigation.goBack()} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
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
        <View style={[styles.inputBar, { paddingBottom: keyboardVisible ? 12 : Math.max(insets.bottom, 12) }]}>
          <TouchableOpacity onPress={handleAttach} style={styles.attachBtn} disabled={uploadingAttachment}>
            {uploadingAttachment ? (
              <ActivityIndicator size="small" color={TEXT_SECONDARY} />
            ) : (
              <Ionicons name="attach" size={26} color={TEXT_SECONDARY} />
            )}
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={TEXT_SECONDARY}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={2000}
            numberOfLines={4}
            textAlignVertical="center"
            onFocus={handleFocus}
            onBlur={handleBlur}
          />

          <TouchableOpacity onPress={handleSend} disabled={!inputText.trim()}>
            <View
              style={[
                styles.sendBtn,
                { backgroundColor: inputText.trim() ? PRIMARY_COLOR : TEXT_SECONDARY + '55' }
              ]}
            >
              <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  headerWrapper: {
    paddingHorizontal: 16,
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
    shadowColor: PRIMARY_COLOR,
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
    color: PRIMARY_COLOR,
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
    color: TEXT_SECONDARY,
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
    color: TEXT_SECONDARY,
  },
  // AI icon
  aiIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: PRIMARY_COLOR,
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
    backgroundColor: TEXT_SECONDARY,
  },
  typingText: {
    fontSize: 13,
    fontFamily: 'Urbanist_600SemiBold',
    color: TEXT_SECONDARY,
    marginLeft: 6,
  },
  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: BLUE_LIGHT,
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
    backgroundColor: BG_COLOR,
    color: PRIMARY_COLOR,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BLUE_LIGHT,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  loadOlderText: {
    fontSize: 13,
    fontFamily: 'Urbanist_600SemiBold',
    color: PRIMARY_COLOR,
  },
});

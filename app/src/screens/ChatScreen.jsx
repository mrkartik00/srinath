import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  Text,
  TextInput,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';

import { useTheme } from '../context/ThemeContext';
import { ScreenHeader, GlassCard, PressableButton, Avatar } from '../components/ui';
import { getMessages } from '../api/chat';
import haptics from '../utils/haptics';

// Server URL (mirrors api/axios.js)
const SERVER_URL = 'https://api.janki.care';

export default function ChatScreen({ route, navigation }) {
  const { conversationId, doctorName, doctorId } = route.params;
  const { theme } = useTheme();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

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

  // Fetch message history
  useEffect(() => {
    (async () => {
      try {
        const res = await getMessages(conversationId);
        setMessages(res.data || []);
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [conversationId]);

  // Socket.IO connection
  useEffect(() => {
    let socket;
    (async () => {
      const token = await AsyncStorage.getItem('token');
      socket = io(SERVER_URL, { auth: { token }, transports: ['websocket'] });
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('conversation:join', { conversationId });
      });

      socket.on('message:new', (msg) => {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
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
        socket.emit('conversation:leave', { conversationId });
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
  }, [loading]);

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
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      // TODO: upload attachment and send via socket
      console.log('Selected image:', result.assets[0].uri);
    }
  }, []);

  // Typing events
  const handleFocus = useCallback(() => {
    socketRef.current?.emit('typing:start', { conversationId });
  }, [conversationId]);

  const handleBlur = useCallback(() => {
    socketRef.current?.emit('typing:stop', { conversationId });
  }, [conversationId]);

  // Format time
  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  // Render message bubble
  const renderMessage = useCallback(
    ({ item }) => {
      const { senderRole, body, createdAt, readAt, type } = item;

      // System message
      if (senderRole === 'system' || type === 'system') {
        return (
          <View style={styles.systemRow}>
            <Text style={[styles.systemText, { color: theme.subText }]}>{body}</Text>
          </View>
        );
      }

      const isPatient = senderRole === 'patient';
      const isAI = senderRole === 'ai';
      const isDoctor = senderRole === 'doctor';

      const bubbleStyle = isPatient
        ? styles.bubbleRight
        : styles.bubbleLeft;

      const rowStyle = isPatient
        ? styles.rowRight
        : styles.rowLeft;

      return (
        <View style={rowStyle}>
          {/* AI robot icon */}
          {isAI && (
            <View style={[styles.aiIcon, { backgroundColor: theme.chipBg }]}>
              <Ionicons name="hardware-chip-outline" size={14} color="#0d9488" />
            </View>
          )}

          {isPatient ? (
            <LinearGradient
              colors={[theme.primary || '#4f8cff', theme.accent || '#6366f1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.bubble, bubbleStyle]}
            >
              <Text style={styles.bubbleTextWhite}>{body}</Text>
            </LinearGradient>
          ) : (
            <View
              style={[
                styles.bubble,
                bubbleStyle,
                {
                  backgroundColor: isAI ? '#ccfbf1' : theme.chipBg,
                },
              ]}
            >
              <Text style={[styles.bubbleText, { color: isAI ? '#0f766e' : theme.text }]}>
                {body}
              </Text>
            </View>
          )}

          {/* Time + read receipt */}
          <View style={[styles.metaRow, isPatient && styles.metaRight]}>
            <Text style={[styles.timeText, { color: theme.subText }]}>
              {formatTime(createdAt)}
            </Text>
            {isPatient && readAt && (
              <Ionicons
                name="checkmark-done"
                size={14}
                color={theme.primary || '#4f8cff'}
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </View>
      );
    },
    [theme]
  );

  // Typing indicator
  const renderTypingIndicator = () => {
    if (!isTyping) return null;
    const translateY = typingAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });
    return (
      <View style={[styles.typingRow]}>
        <Animated.View style={[styles.dot, { backgroundColor: theme.subText, transform: [{ translateY }] }]} />
        <Animated.View style={[styles.dot, { backgroundColor: theme.subText, transform: [{ translateY }], marginLeft: 4 }]} />
        <Animated.View style={[styles.dot, { backgroundColor: theme.subText, transform: [{ translateY }], marginLeft: 4 }]} />
        <Text style={[styles.typingText, { color: theme.subText }]}> typing...</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScreenHeader title={doctorName} onBack={() => navigation.goBack()} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary || '#4f8cff'} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListFooterComponent={renderTypingIndicator}
        />
      )}

      {/* Input Bar */}
      <View style={[styles.inputBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <TouchableOpacity onPress={handleAttach} style={styles.attachBtn}>
          <Ionicons name="attach" size={24} color={theme.subText} />
        </TouchableOpacity>

        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: theme.chipBg,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          placeholder="Type a message..."
          placeholderTextColor={theme.subText}
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
          <LinearGradient
            colors={
              inputText.trim()
                ? [theme.primary || '#4f8cff', theme.accent || '#6366f1']
                : ['#ccc', '#aaa']
            }
            style={styles.sendBtn}
          >
            <Ionicons name="arrow-up" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleRight: {
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
  },
  bubbleLeft: {
    borderBottomLeftRadius: 4,
    alignSelf: 'flex-start',
  },
  bubbleTextWhite: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  // System
  systemRow: {
    alignItems: 'center',
    marginVertical: 8,
  },
  systemText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  // Meta (time + read receipt)
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    marginHorizontal: 4,
  },
  metaRight: {
    alignSelf: 'flex-end',
  },
  timeText: {
    fontSize: 11,
  },
  // AI icon
  aiIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  // Typing
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    paddingVertical: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  typingText: {
    fontSize: 12,
    marginLeft: 4,
  },
  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  attachBtn: {
    padding: 8,
    marginRight: 4,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});

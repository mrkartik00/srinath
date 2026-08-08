import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  Text,
  RefreshControl,
  Animated,
  StyleSheet,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Urbanist_600SemiBold, Urbanist_700Bold } from '@expo-google-fonts/urbanist';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  ScreenHeader,
  PressableButton,
  Avatar,
  StatusBadge,
  EmptyState,
  SkeletonList,
  BottomSheet,
  FAB,
} from '../components/ui';
import { useScreenAnimation, useStaggerAnimation } from '../hooks/useAnimations';
import { getConversations, createConversation, getMessages } from '../api/chat';
import { getDoctors } from '../api/config';
import haptics from '../utils/haptics';

// Helper: format relative time
const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const ChatListScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { screenStyle } = useScreenAnimation();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);
  const [allMessages, setAllMessages] = useState({});

  const [fontsLoaded] = useFonts({ Urbanist_600SemiBold, Urbanist_700Bold });
  const { getItemStyle, triggerStagger } = useStaggerAnimation(conversations.length);

  // Fetch conversations
  const fetchConversations = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await getConversations();
      const fetchedConversations = response.data || [];
      setConversations(fetchedConversations);
      
      // Fetch messages for deep searching in the background
      fetchedConversations.forEach(async (conv) => {
        try {
          const res = await getMessages(conv._id, { limit: 100 });
          setAllMessages(prev => ({ ...prev, [conv._id]: res.data || [] }));
        } catch (e) {
          // ignore
        }
      });

      setTimeout(() => {
        triggerStagger(fetchedConversations.length);
      }, 50);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch doctors for new chat sheet
  const fetchDoctors = async () => {
    try {
      setDoctorsLoading(true);
      const response = await getDoctors();
      setDoctors(response.data || []);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    } finally {
      setDoctorsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
      fetchDoctors();
    }, [])
  );

  const handleRefresh = () => {
    fetchConversations(true);
    fetchDoctors();
  };

  const handleNewChat = () => {
    haptics.medium();
    setSheetVisible(true);
  };

  const handleSelectDoctor = async (doctor) => {
    try {
      setCreatingChat(true);
      haptics.medium();
      const docId = doctor.id || doctor._id;
      const response = await createConversation(docId);
      setSheetVisible(false);
      navigation.navigate('ChatConversation', {
        conversationId: response.data._id,
        doctorName: doctor.name,
        doctorId: docId,
        doctorAvatar: doctor.profileImage || doctor.avatar || null,
      });
      fetchConversations();
    } catch (error) {
      console.error('Failed to create conversation:', error);
    } finally {
      setCreatingChat(false);
    }
  };

  const handleConversationTap = (conversation) => {
    haptics.light();
    setConversations((prev) =>
      prev.map((c) => (c._id === conversation._id ? { ...c, unreadByPatient: 0 } : c))
    );
    
    const docId = conversation.doctorId?._id || conversation.doctorId?.id || conversation.doctorId;
    const docConfig = doctors.find(d => d.id === docId || d._id === docId);
    const finalAvatar = docConfig?.avatar || conversation.doctorId?.profileImage || conversation.doctorId?.avatar || null;
    
    navigation.navigate('ChatConversation', {
      conversationId: conversation._id,
      doctorName: conversation.doctorId?.name,
      doctorId: docId,
      doctorAvatar: finalAvatar,
    });
  };

  const truncatePreview = (text, maxLength = 50) => {
    if (!text) return 'No messages yet';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);

  // Filter conversations with deep search
  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations;
    const q = searchQuery.toLowerCase();
    
    return conversations.map(c => {
      const docName = (c.doctorId?.name || '').toLowerCase();
      const defaultPreview = (c.lastMessagePreview || '').toLowerCase();
      
      // If doctor name matches, return standard conversation
      if (docName.includes(q)) return c;
      
      // Check for deep message match
      const messages = allMessages[c._id] || [];
      const matchedMsg = messages.find(m => {
        const bodyMatch = (m.body || '').toLowerCase().includes(q);
        const attachMatch = m.attachments?.some(a => (a.fileName || '').toLowerCase().includes(q));
        return bodyMatch || attachMatch;
      });
      
      if (matchedMsg) {
        // Construct preview for matched message
        const isImage = matchedMsg.type === 'image';
        const attachName = matchedMsg.attachments?.[0]?.fileName;
        const previewStr = attachName ? `📎 ${attachName}` : matchedMsg.body;
        
        return {
          ...c,
          lastMessagePreview: previewStr,
          lastMessageAt: matchedMsg.createdAt,
          isSearchMatch: true // flag to highlight search result
        };
      }
      
      // Fallback default preview match
      if (defaultPreview.includes(q)) return c;
      
      return null;
    }).filter(Boolean).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
  }, [conversations, searchQuery, allMessages]);

  if (!fontsLoaded) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const renderConversationCard = (conversation, index) => {
    const animStyle = getItemStyle(index);
    const doctorName = conversation.doctorId?.name || 'Doctor';
    const docId = conversation.doctorId?._id || conversation.doctorId?.id || conversation.doctorId;
    const docConfig = doctors.find(d => d.id === docId || d._id === docId);
    const avatarUri = docConfig?.avatar || conversation.doctorId?.profileImage || conversation.doctorId?.avatar;
    const unread = conversation.unreadByPatient || 0;

    return (
      <Animated.View key={conversation._id} style={animStyle}>
        <TouchableOpacity
          onPress={() => handleConversationTap(conversation)}
          activeOpacity={0.7}
        >
          <View style={styles.listItem}>
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              <Avatar name={doctorName} size={56} uri={avatarUri} />
              {unread > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>
                    {unread > 99 ? '99+' : unread}
                  </Text>
                </View>
              )}
            </View>

            {/* Content */}
            <View style={styles.listBody}>
              <View style={styles.listHeader}>
                <Text
                  style={[
                    styles.doctorName,
                    { color: theme.primary },
                    unread > 0 && styles.doctorNameUnread,
                  ]}
                  numberOfLines={1}
                >
                  {doctorName}
                </Text>
                <Text style={[styles.timeText, unread > 0 && styles.timeTextUnread]}>
                  {formatRelativeTime(conversation.lastMessageAt)}
                </Text>
              </View>

              <View style={styles.listFooter}>
                <Text
                  style={[
                    styles.previewText,
                    unread > 0 && styles.previewTextUnread,
                  ]}
                  numberOfLines={2}
                >
                  {truncatePreview(conversation.lastMessagePreview, 80)}
                </Text>
                <Ionicons name="checkmark-circle" size={16} color={theme.primary} style={{marginLeft: 8, marginTop: 4, alignSelf: 'flex-start'}} />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderDoctorItem = (doctor) => (
    <PressableButton
      key={doctor.id || doctor._id}
      onPress={() => handleSelectDoctor(doctor)}
      disabled={creatingChat}
      style={styles.doctorItem}
    >
      <View style={styles.doctorItemContent}>
        <Avatar name={doctor.name} size={48} uri={doctor.profileImage || doctor.avatar} />
        <View style={styles.doctorItemInfo}>
          <Text style={styles.doctorItemName}>
            {doctor.name}
          </Text>
          {doctor.email && (
            <Text style={styles.doctorItemEmail}>
              {doctor.email}
            </Text>
          )}
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={theme.textSecondary}
        />
      </View>
    </PressableButton>
  );

  return (
    <Animated.View style={[styles.container, screenStyle]}>
      <View style={styles.gradient}>
        {/* Custom Header */}
        <View style={styles.customHeader}>
          <View style={styles.headerLeft}>
            <Avatar uri={user?.avatar} name={user?.name || 'User'} size={48} />
            <View style={styles.headerTextContainer}>
              <Text style={styles.welcomeText}>Welcome Back</Text>
              <Text style={styles.inboxText}>Inbox</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.circleIconBtn} onPress={() => setSearchVisible(!searchVisible)}>
              <Ionicons name="search-outline" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>

        {searchVisible && (
          <View style={styles.searchContainer}>
            <TextInput
              style={[styles.searchInput, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
              placeholder="Search messages or doctors..."
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>
        )}

        {loading ? (
          <SkeletonList count={6} style={styles.skeletonContainer} />
        ) : filteredConversations.length === 0 ? (
          <EmptyState
            icon="chatbubbles-outline"
            title="No conversations found"
            subtitle={searchQuery ? "Try a different search term" : "Start a conversation with your doctor"}
            actionLabel={searchQuery ? "Clear Search" : "New Conversation"}
            onAction={searchQuery ? () => setSearchQuery('') : handleNewChat}
          />
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={theme.primary}
                colors={[theme.primary]}
              />
            }
          >
            {filteredConversations.map((conversation, index) =>
              renderConversationCard(conversation, index)
            )}
          </ScrollView>
        )}

        {/* New Chat Bottom Sheet */}
        <BottomSheet
          visible={sheetVisible}
          onClose={() => setSheetVisible(false)}
          title="Start New Conversation"
        >
          <View style={styles.sheetContent}>
            <Text style={styles.sheetSubtitle}>
              Select a doctor to start chatting
            </Text>

            {doctorsLoading ? (
              <SkeletonList count={4} />
            ) : doctors.length === 0 ? (
              <Text style={styles.noDoctorsText}>
                No doctors available
              </Text>
            ) : (
              <ScrollView
                style={styles.doctorsList}
                showsVerticalScrollIndicator={false}
              >
                {doctors.map(renderDoctorItem)}
              </ScrollView>
            )}
          </View>
        </BottomSheet>
      </View>

      <FAB
        icon="add"
        onPress={handleNewChat}
        style={styles.fab}
        color={theme.primary}
      />
    </Animated.View>
  );
};

const makeStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  gradient: {
    flex: 1,
  },
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextContainer: {
    marginLeft: 12,
  },
  welcomeText: {
    fontSize: 13,
    color: theme.textSecondary,
    fontFamily: 'Urbanist_600SemiBold',
  },
  inboxText: {
    fontSize: 24,
    color: theme.text,
    fontFamily: 'Urbanist_700Bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circleIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchInput: {
    height: 46,
    borderRadius: 24,
    paddingHorizontal: 20,
    borderWidth: 1,
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 15,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    paddingTop: 8,
  },
  skeletonContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  listItem: {
    backgroundColor: theme.card,
    borderRadius: 24,
    marginBottom: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: Platform.OS === 'android' ? 2 : 8,
    borderWidth: Platform.OS === 'android' ? 1 : 0,
    borderColor: theme.border,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  unreadBadge: {
    position: 'absolute',
    top: 0,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: theme.bg,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Urbanist_700Bold',
  },
  listBody: {
    flex: 1,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  doctorName: {
    fontSize: 17,
    fontFamily: 'Urbanist_600SemiBold',
    flex: 1,
    marginRight: 8,
  },
  doctorNameUnread: {
    fontFamily: 'Urbanist_700Bold',
  },
  timeText: {
    fontSize: 13,
    fontFamily: 'Urbanist_600SemiBold',
    color: theme.textSecondary,
  },
  timeTextUnread: {
    color: theme.primary,
    fontFamily: 'Urbanist_700Bold',
  },
  listFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewText: {
    fontSize: 14,
    fontFamily: 'Urbanist_600SemiBold',
    color: theme.textSecondary,
    flex: 1,
    marginRight: 8,
    lineHeight: 20,
  },
  previewTextUnread: {
    color: theme.primary,
    fontFamily: 'Urbanist_700Bold',
  },
  // Bottom Sheet
  sheetContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  sheetSubtitle: {
    fontSize: 15,
    fontFamily: 'Urbanist_600SemiBold',
    color: theme.textSecondary,
    marginBottom: 20,
  },
  doctorsList: {
    flex: 1,
  },
  doctorItem: {
    marginBottom: 12,
  },
  doctorItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: theme.card,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  doctorItemInfo: {
    flex: 1,
    marginLeft: 14,
  },
  doctorItemName: {
    fontSize: 17,
    fontFamily: 'Urbanist_700Bold',
    color: theme.text,
  },
  doctorItemEmail: {
    fontSize: 14,
    fontFamily: 'Urbanist_600SemiBold',
    color: theme.textSecondary,
    marginTop: 4,
  },
  noDoctorsText: {
    fontSize: 15,
    fontFamily: 'Urbanist_600SemiBold',
    color: theme.textSecondary,
    textAlign: 'center',
    paddingVertical: 24,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 130,
  },
});

export default ChatListScreen;

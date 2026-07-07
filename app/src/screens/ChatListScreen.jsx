import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  RefreshControl,
  Animated,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import {
  ScreenHeader,
  GlassCard,
  PressableButton,
  Avatar,
  StatusBadge,
  EmptyState,
  SkeletonList,
  BottomSheet,
} from '../components/ui';
import { useScreenAnimation, useStaggerAnimation } from '../hooks/useAnimations';
import { getConversations, createConversation } from '../api/chat';
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
  const { screenStyle } = useScreenAnimation();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);

  const { getItemStyle, triggerStagger } = useStaggerAnimation(conversations.length);

  // Fetch conversations
  const fetchConversations = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await getConversations();
      setConversations(response.data || []);
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

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleRefresh = () => {
    fetchConversations(true);
  };

  const handleNewChat = () => {
    haptics.medium();
    setSheetVisible(true);
    fetchDoctors();
  };

  const handleSelectDoctor = async (doctor) => {
    try {
      setCreatingChat(true);
      haptics.medium();
      const response = await createConversation(doctor._id);
      setSheetVisible(false);
      navigation.navigate('ChatConversation', {
        conversationId: response.data._id,
        doctorName: doctor.name,
        doctorId: doctor._id,
      });
      // Refresh list when returning
      fetchConversations();
    } catch (error) {
      console.error('Failed to create conversation:', error);
    } finally {
      setCreatingChat(false);
    }
  };

  const handleConversationTap = (conversation) => {
    haptics.light();
    navigation.navigate('ChatConversation', {
      conversationId: conversation._id,
      doctorName: conversation.doctorId?.name,
      doctorId: conversation.doctorId?._id,
    });
  };

  const truncatePreview = (text, maxLength = 50) => {
    if (!text) return 'No messages yet';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const renderConversationCard = (conversation, index) => {
    const animStyle = getItemStyle(index);

    const doctorName = conversation.doctorId?.name || 'Doctor';
    const unread = conversation.unreadByPatient || 0;

    return (
      <Animated.View key={conversation._id} style={animStyle}>
        <GlassCard
          onPress={() => handleConversationTap(conversation)}
          style={styles.conversationCard}
        >
          <View style={styles.cardContent}>
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              <Avatar name={doctorName} size={50} />
              {unread > 0 && (
                <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
                  <Text style={styles.unreadText}>
                    {unread > 99 ? '99+' : unread}
                  </Text>
                </View>
              )}
            </View>

            {/* Content */}
            <View style={styles.cardBody}>
              <View style={styles.cardHeader}>
                <Text
                  style={[
                    styles.doctorName,
                    { color: theme.text },
                    unread > 0 && styles.doctorNameUnread,
                  ]}
                  numberOfLines={1}
                >
                  {doctorName}
                </Text>
                <Text style={[styles.timeText, { color: theme.textSecondary }]}>
                  {formatRelativeTime(conversation.lastMessageAt)}
                </Text>
              </View>

              <View style={styles.cardFooter}>
                <Text
                  style={[
                    styles.previewText,
                    { color: theme.textSecondary },
                    unread > 0 && { color: theme.text },
                  ]}
                  numberOfLines={1}
                >
                  {truncatePreview(conversation.lastMessagePreview)}
                </Text>
                <StatusBadge status={conversation.status} />
              </View>
            </View>
          </View>
        </GlassCard>
      </Animated.View>
    );
  };

  const renderDoctorItem = (doctor) => (
    <PressableButton
      key={doctor._id}
      onPress={() => handleSelectDoctor(doctor)}
      disabled={creatingChat}
      style={styles.doctorItem}
    >
      <View style={styles.doctorItemContent}>
        <Avatar name={doctor.name} size={42} />
        <View style={styles.doctorItemInfo}>
          <Text style={[styles.doctorItemName, { color: theme.text }]}>
            {doctor.name}
          </Text>
          {doctor.email && (
            <Text style={[styles.doctorItemEmail, { color: theme.textSecondary }]}>
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
      <LinearGradient
        colors={theme.gradient || [theme.bg, theme.bg]}
        style={styles.gradient}
      >
        <ScreenHeader
          title="Messages"
          rightIcon="create-outline"
          onRightPress={handleNewChat}
        />

        {loading ? (
          <SkeletonList count={6} style={styles.skeletonContainer} />
        ) : conversations.length === 0 ? (
          <EmptyState
            icon="chatbubbles-outline"
            title="No conversations yet"
            subtitle="Start a conversation with your doctor"
            actionLabel="New Conversation"
            onAction={handleNewChat}
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
            {conversations.map((conversation, index) =>
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
            <Text style={[styles.sheetSubtitle, { color: theme.textSecondary }]}>
              Select a doctor to start chatting
            </Text>

            {doctorsLoading ? (
              <SkeletonList count={4} />
            ) : doctors.length === 0 ? (
              <Text style={[styles.noDoctorsText, { color: theme.textSecondary }]}>
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
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    paddingTop: 8,
  },
  skeletonContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  conversationCard: {
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  cardBody: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  doctorNameUnread: {
    fontWeight: '700',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '400',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewText: {
    fontSize: 14,
    fontWeight: '400',
    flex: 1,
    marginRight: 8,
  },
  // Bottom Sheet
  sheetContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sheetSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  doctorsList: {
    maxHeight: 350,
  },
  doctorItem: {
    marginBottom: 8,
  },
  doctorItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  doctorItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  doctorItemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  doctorItemEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  noDoctorsText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 24,
  },
});

export default ChatListScreen;

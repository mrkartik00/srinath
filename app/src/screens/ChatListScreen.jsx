import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Urbanist_600SemiBold, Urbanist_700Bold } from '@expo-google-fonts/urbanist';
import { useTheme } from '../context/ThemeContext';
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
import { getConversations, createConversation } from '../api/chat';
import { getDoctors } from '../api/config';
import haptics from '../utils/haptics';

const BG_COLOR = '#F5F7FA';
const PRIMARY_COLOR = '#223263';
const TEXT_SECONDARY = '#8F9BB3';
const BLUE_LIGHT = '#EEF2F8';

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
      triggerStagger(fetchedConversations.length);
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
      const docId = doctor.id || doctor._id;
      const response = await createConversation(docId);
      setSheetVisible(false);
      navigation.navigate('ChatConversation', {
        conversationId: response.data._id,
        doctorName: doctor.name,
        doctorId: docId,
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

  if (!fontsLoaded) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      </View>
    );
  }

  const renderConversationCard = (conversation, index) => {
    const animStyle = getItemStyle(index);

    const doctorName = conversation.doctorId?.name || 'Doctor';
    const unread = conversation.unreadByPatient || 0;

    return (
      <Animated.View key={conversation._id} style={animStyle}>
        <PressableButton
          onPress={() => handleConversationTap(conversation)}
        >
          <View style={styles.conversationCard}>
            <View style={styles.cardContent}>
              {/* Avatar */}
              <View style={styles.avatarContainer}>
                <Avatar name={doctorName} size={50} />
                {unread > 0 && (
                  <View style={styles.unreadBadge}>
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

                <View style={styles.cardFooter}>
                  <Text
                    style={[
                      styles.previewText,
                      unread > 0 && styles.previewTextUnread,
                    ]}
                    numberOfLines={1}
                  >
                    {truncatePreview(conversation.lastMessagePreview)}
                  </Text>
                  <StatusBadge status={conversation.status} />
                </View>
              </View>
            </View>
          </View>
        </PressableButton>
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
        <Avatar name={doctor.name} size={48} />
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
          color={TEXT_SECONDARY}
        />
      </View>
    </PressableButton>
  );

  return (
    <Animated.View style={[styles.container, screenStyle]}>
      <View style={styles.gradient}>
        <View style={styles.headerWrapper}>
          <ScreenHeader
            title="Messages"
            rightIcon="create-outline"
            onRightPress={handleNewChat}
          />
        </View>

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
                tintColor={PRIMARY_COLOR}
                colors={[PRIMARY_COLOR]}
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
        color={PRIMARY_COLOR}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  gradient: {
    flex: 1,
  },
  headerWrapper: {
    paddingHorizontal: 20,
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
  conversationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 16,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Urbanist_700Bold',
  },
  cardBody: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  doctorName: {
    fontSize: 17,
    fontFamily: 'Urbanist_600SemiBold',
    color: PRIMARY_COLOR,
    flex: 1,
    marginRight: 8,
  },
  doctorNameUnread: {
    fontFamily: 'Urbanist_700Bold',
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Urbanist_600SemiBold',
    color: TEXT_SECONDARY,
  },
  timeTextUnread: {
    color: PRIMARY_COLOR,
    fontFamily: 'Urbanist_700Bold',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewText: {
    fontSize: 14,
    fontFamily: 'Urbanist_600SemiBold',
    color: TEXT_SECONDARY,
    flex: 1,
    marginRight: 8,
  },
  previewTextUnread: {
    color: PRIMARY_COLOR,
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
    color: TEXT_SECONDARY,
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
    backgroundColor: '#FFFFFF',
    shadowColor: PRIMARY_COLOR,
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
    color: PRIMARY_COLOR,
  },
  doctorItemEmail: {
    fontSize: 14,
    fontFamily: 'Urbanist_600SemiBold',
    color: TEXT_SECONDARY,
    marginTop: 4,
  },
  noDoctorsText: {
    fontSize: 15,
    fontFamily: 'Urbanist_600SemiBold',
    color: TEXT_SECONDARY,
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

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  Text, 
  TouchableOpacity, 
  Platform, 
  Animated, 
  TextInput, 
  Image, 
  Dimensions,
  ActivityIndicator,
  DeviceEventEmitter,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts, Urbanist_600SemiBold, Urbanist_700Bold } from '@expo-google-fonts/urbanist';
import api from '../api/axios';
import { getMyAppointments } from '../api/appointments';
import { useAuth } from '../context/AuthContext';
import { haptics } from '../utils/haptics';
import { PageLoader } from '../components/ui';
import { hasUnreadNotifications } from '../utils/notificationsHelper';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

// Icon lookup for known specialties, keyed by lowercase name. Any specialty
// not listed here (including ones added later without a matching app update)
// falls back to DEFAULT_SPECIALTY_ICON instead of being hidden.
const SPECIALTY_ICONS = {
  neurology: 'brain',
  dentistry: 'tooth-outline',
  gynecology: 'gender-female',
  cardiology: 'heart-pulse',
  orthopedics: 'bone',
  orthopedic: 'bone',
  ortho: 'bone',
  dermatology: 'human',
  'general physician': 'stethoscope',
};
const DEFAULT_SPECIALTY_ICON = 'stethoscope';

// Builds the specialty pill list purely from the doctors actually returned
// by the API — no fixed/hardcoded specialty set — sorted by doctor count.
const deriveSpecialties = (doctors) => {
  const counts = {};
  const labels = {};
  doctors.forEach(doc => {
    const raw = doc.specialty ? doc.specialty.trim() : '';
    if (!raw) return;
    const key = raw.toLowerCase();
    counts[key] = (counts[key] || 0) + 1;
    if (!labels[key]) labels[key] = raw;
  });
  return Object.keys(counts)
    .sort((a, b) => counts[b] - counts[a])
    .map(key => ({
      id: key,
      label: labels[key],
      icon: SPECIALTY_ICONS[key] || DEFAULT_SPECIALTY_ICON,
      count: counts[key],
    }));
};

const BANNERS = [
  {
    id: 'b1',
    titleMain: '25%',
    titleSub: 'EXTRA\nDISCOUNT',
    subtitle: 'Get your first consultation\nwith 25% discount',
    buttonText: 'Get Now',
    colors: ['#3B6FF0', '#1C9BF0'], 
    image: require('../../assets/images/banner_doctors.png'),
    route: 'Doctors'
  },
  {
    id: 'b2',
    titleMain: 'PRO',
    titleSub: 'PREMIUM\nPLANS',
    subtitle: 'Subscribe to our plans\nfor unlimited benefits',
    buttonText: 'View Plans',
    colors: ['#8B5CF6', '#6366F1'],
    image: require('../../assets/images/banner_premium.png'),
    route: 'Subscription'
  },
  {
    id: 'b3',
    titleMain: 'HOT',
    titleSub: 'HEALTH\nFEED',
    subtitle: 'Read the latest medical\narticles and tips',
    buttonText: 'Read Now',
    colors: ['#14B8A6', '#0D9488'],
    image: require('../../assets/images/banner_health.png'),
    route: 'Health'
  },
  {
    id: 'b4',
    titleMain: 'ALL',
    titleSub: 'YOUR\nMEDS',
    subtitle: 'View and manage your\nmedical prescriptions',
    buttonText: 'View All',
    colors: ['#F97316', '#EA580C'],
    image: require('../../assets/images/banner_pills.png'),
    route: 'Prescriptions'
  }
];

const CAROUSEL_BANNERS = [...BANNERS, { ...BANNERS[0], id: 'b1_clone' }];

const QUICK_ACTIONS = [
  { id: 'q1', label: 'Book\nAppointment', icon: 'calendar-month-outline', route: 'BookAppointment' },
  { id: 'q2', label: 'Browse\nDoctors', icon: 'account-search-outline', route: 'Doctors' },
  { id: 'q3', label: 'Prescriptions', icon: 'pill', route: 'Prescriptions' },
  { id: 'q4', label: 'Medical\nReminder', icon: 'bell-outline', route: 'Reminders' },
  { id: 'q5', label: 'Medical\nVault', icon: 'folder-open-outline', route: 'MedicalVault' },
  { id: 'q6', label: 'Subscription', icon: 'card-outline', route: 'Subscription' },
];
// Theme-aware styles are now derived from makeStyles(theme) inside the component

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { incomingCall } = useSocket();
  const { isDark, toggleTheme, theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const PRIMARY_COLOR = theme?.primary || '#223263';
  const TEXT_SECONDARY = theme?.textSecondary || '#8F9BB3';
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSpecialty, setActiveSpecialty] = useState('');
  const [allDoctors, setAllDoctors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllQA, setShowAllQA] = useState(false);
  const [showAllSpecialties, setShowAllSpecialties] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [hasUnreadNotifs, setHasUnreadNotifs] = useState(false);
  const [upcomingApt, setUpcomingApt] = useState(null);

  const checkUnread = async () => {
    const unread = await hasUnreadNotifications();
    setHasUnreadNotifs(unread);
  };

  useFocusEffect(
    React.useCallback(() => {
      checkUnread();
    }, [])
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('notifications_updated', checkUnread);
    return () => sub.remove();
  }, []);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const bannerScrollRef = useRef(null);
  const currentBannerIndex = useRef(0);
  const placeholderFade = useRef(new Animated.Value(1)).current;
  const [activeBanner, setActiveBanner] = useState(0);

  const [fontsLoaded] = useFonts({ Urbanist_600SemiBold, Urbanist_700Bold });

  // Rotating search placeholder — built from the actual doctors/specialties
  // the API returned, so it stays true to real data instead of static copy.
  const searchSuggestions = React.useMemo(() => {
    const specialties = deriveSpecialties(allDoctors).slice(0, 3).map((s) => `Search ${s.label}`);
    const doctorNames = allDoctors.slice(0, 3).map((d) => `Search ${d.name}`);
    const suggestions = ['Search Doctors', 'Search Specialties', ...specialties, ...doctorNames];
    return suggestions;
  }, [allDoctors]);

  useEffect(() => {
    if (searchSuggestions.length <= 1) return;
    const interval = setInterval(() => {
      Animated.timing(placeholderFade, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
        setPlaceholderIndex((prev) => (prev + 1) % searchSuggestions.length);
        Animated.timing(placeholderFade, { toValue: 1, duration: 250, useNativeDriver: true }).start();
      });
    }, 2400);
    return () => clearInterval(interval);
  }, [searchSuggestions.length]);

  // Auto-scroll effect for banners
  useEffect(() => {
    const timer = setInterval(() => {
      let nextIndex = currentBannerIndex.current + 1;
      
      bannerScrollRef.current?.scrollTo({
        x: nextIndex * (width - 32),
        animated: true,
      });

      setActiveBanner(nextIndex % BANNERS.length);
      currentBannerIndex.current = nextIndex;

      // If we just scrolled to the cloned first item, snap back silently
      if (nextIndex === BANNERS.length) {
        setTimeout(() => {
          if (bannerScrollRef.current) {
            bannerScrollRef.current.scrollTo({ x: 0, animated: false });
            currentBannerIndex.current = 0;
          }
        }, 500); // wait for animated slide to finish
      }
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    try { 
      const res = await api.get('/api/v1/patients/me/stats'); 
      setStats(res.data); 
    } catch {}

    try {
      const doctorsRes = await api.get('/api/v1/config/doctors');
      if (doctorsRes.success) {
        setAllDoctors(doctorsRes.data);
      }
    } catch {}

    // Fetch upcoming appointment using the same endpoint as AppointmentsScreen
    // so video.status and all fields are available for canJoinCall logic.
    try {
      const aptRes = await getMyAppointments({ limit: 20 });
      let list = [];
      if (Array.isArray(aptRes)) list = aptRes;
      else if (Array.isArray(aptRes?.data)) list = aptRes.data;
      else if (Array.isArray(aptRes?.data?.data)) list = aptRes.data.data;

      const getEffectiveStatus = (apt) => {
        if (!apt) return 'scheduled';
        if (apt.status === 'cancelled') return 'cancelled';
        if (apt.status === 'completed') return 'completed';
        if (apt.video?.status === 'ended' || apt.video?.endedAt) return 'completed';
        const nowTime = Date.now();
        const endTime = new Date(apt.dateTime).getTime() + (apt.duration || 30) * 60000;
        if (nowTime > endTime) return 'completed';
        return apt.status;
      };

      const next = list
        .filter(apt => {
          const st = getEffectiveStatus(apt);
          return st === 'scheduled' || st === 'in_progress';
        })
        .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))[0] || null;

      setUpcomingApt(next);
    } catch {}
  };

  useEffect(() => {
    fetchData();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 12, bounciness: 6 }),
    ]).start();
  }, []);

  useEffect(() => {
    if (allDoctors.length > 0) {
      const sorted = deriveSpecialties(allDoctors);
      if (sorted.length > 0) {
        setActiveSpecialty(sorted[0].label);
      }
    }
  }, [allDoctors]);

  const s = stats || {};
  // Use appointment from the full appointments API (same as AppointmentsScreen)
  // so video.status is always accurate. Fall back to stats API if not yet loaded.
  const statsApt = (s.upcomingAppointments || [])[0] || null;
  const currentApt = upcomingApt || statsApt;

  const currentDoctor = React.useMemo(() => {
    if (!currentApt?.doctorId) return null;
    const docId = (currentApt.doctorId._id || currentApt.doctorId || '').toString();
    const matched = allDoctors.find(d => (d.id || d._id || '').toString() === docId);
    return {
      name: currentApt.doctorId.name || matched?.name || 'Doctor',
      avatar: matched?.avatar || currentApt.doctorId.avatar || null,
      specialty: matched?.specialty || 'General Physician'
    };
  }, [currentApt, allDoctors]);

  const onRefresh = async () => { haptics.light(); setRefreshing(true); await fetchData(); setRefreshing(false); };

  if (!fontsLoaded) {
    return <PageLoader />;
  }

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const userName = user?.name || 'Trystan';

  const aptDate = currentApt ? new Date(currentApt.dateTime) : null;
  const aptEndDate = currentApt ? new Date(aptDate.getTime() + (currentApt.duration || 30) * 60000) : null;
  const formatClockTime = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  // Same canJoinCall logic as AppointmentsScreen — works for early starts too.
  const canJoinCall = (apt) => {
    if (!apt) return false;
    if (apt.status === 'completed' || apt.status === 'cancelled' || apt.video?.status === 'ended') return false;
    if (apt.video?.status === 'live' || apt.status === 'in_progress') return true;
    // Real-time socket: doctor just pressed Start Call
    if (incomingCall?.appointmentId === apt._id) return true;
    return false;
  };

  const isVirtualApt = currentApt?.type === 'virtual' || currentApt?.consultationType === 'video';
  const aptCanJoin = isVirtualApt && canJoinCall(currentApt);

  // Specialty pills, derived entirely from the doctors actually returned by the API
  const sortedSpecialties = deriveSpecialties(allDoctors);

  const filteredDoctors = activeSpecialty
    ? allDoctors.filter(doc => doc.specialty && doc.specialty.trim().toLowerCase() === activeSpecialty.toLowerCase())
    : [];

  const cleanQuery = searchQuery.trim().toLowerCase();
  const matchingSpecialties = cleanQuery.length > 0
    ? sortedSpecialties.filter(s => s.label.toLowerCase().includes(cleanQuery))
    : [];
  const matchingDoctors = cleanQuery.length > 0
    ? allDoctors.filter(doc => doc.name.toLowerCase().includes(cleanQuery) || (doc.specialty && doc.specialty.toLowerCase().includes(cleanQuery)))
    : [];
  
  return (
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY_COLOR} />}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.profileAvatarContainer}>
              <Image
                source={{ uri: user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=223263&color=fff&size=100` }}
                style={styles.profileAvatar}
              />
            </TouchableOpacity>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Text style={[styles.greetingText, { marginBottom: 0 }]}>{greeting}</Text>

                {user?.subscriptionStatus === 'active' ? (
                  <TouchableOpacity
                    style={styles.subActiveBadge}
                    onPress={() => navigation.navigate('Subscription')}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="crown" size={11} color="#B58E2E" />
                    <Text style={styles.subActiveText}>PRO</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.subInactiveBadge}
                    onPress={() => navigation.navigate('Subscription')}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="crown-outline" size={11} color="#8F9BB3" />
                    <Text style={styles.subInactiveText}>FREE</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.nameText}>{userName}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => { haptics.light(); toggleTheme(); }}
              style={[styles.themeBtn, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isDark ? 'sunny' : 'moon'}
                size={20}
                color={isDark ? '#FFD60A' : '#223263'}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.bellIcon}>
              <Ionicons name="notifications-outline" size={24} color={PRIMARY_COLOR} />
              {hasUnreadNotifs && <View style={styles.notificationDot} />}
            </TouchableOpacity>
          </View>
        </View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={22} color={TEXT_SECONDARY} style={styles.searchIcon} />
            <View style={styles.searchInputWrapper}>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length === 0 && (
                <Animated.Text
                  pointerEvents="none"
                  numberOfLines={1}
                  style={[styles.searchPlaceholder, { opacity: placeholderFade }]}
                >
                  {searchSuggestions[placeholderIndex % searchSuggestions.length]}
                </Animated.Text>
              )}
            </View>
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={TEXT_SECONDARY} />
              </TouchableOpacity>
            )}
          </View>

          {cleanQuery.length > 0 ? (
            <View style={styles.searchResultsContainer}>
              {/* Specialties Section */}
              {matchingSpecialties.length > 0 && (
                <View style={styles.searchResultSection}>
                  <Text style={styles.searchResultSectionTitle}>Specialties</Text>
                  {matchingSpecialties.map(item => (
                    <TouchableOpacity 
                      key={item.id} 
                      style={styles.searchResultItem}
                      onPress={() => {
                        setSearchQuery('');
                        navigation.navigate('Doctors', { specialty: item.label });
                      }}
                    >
                      <View style={styles.searchResultIconBox}>
                        <MaterialCommunityIcons name={item.icon} size={20} color={PRIMARY_COLOR} />
                      </View>
                      <View>
                        <Text style={styles.searchResultText}>{item.label}</Text>
                        <Text style={styles.searchResultSubtext}>Specialty • View doctors</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={TEXT_SECONDARY} style={{ marginLeft: 'auto' }} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Doctors Section */}
              {matchingDoctors.length > 0 && (
                <View style={styles.searchResultSection}>
                  <Text style={styles.searchResultSectionTitle}>Doctors</Text>
                  {matchingDoctors.map(doc => (
                    <TouchableOpacity
                      key={doc.id || doc._id}
                      style={styles.searchResultItem}
                      activeOpacity={0.75}
                      onPress={() => {
                        setSearchQuery('');
                        navigation.navigate('DoctorDetail', { doctor: doc });
                      }}
                    >
                      {doc.avatar ? (
                        <Image source={{ uri: doc.avatar }} style={styles.searchResultAvatar} />
                      ) : (
                        <View style={[styles.searchResultAvatar, styles.searchResultAvatarFallback]}>
                          <Ionicons name="person" size={20} color={TEXT_SECONDARY} />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.searchResultText}>{doc.name}</Text>
                        <Text style={styles.searchResultSubtext}>{doc.specialty || 'General Physician'} • {doc.clinicAddress || 'Consult Online'}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.searchBookBtn}
                        activeOpacity={0.8}
                        onPress={(e) => {
                          e.stopPropagation();
                          setSearchQuery('');
                          navigation.navigate('BookAppointment', { doctorId: doc.id || doc._id, doctorName: doc.name });
                        }}
                      >
                        <Text style={styles.searchBookBtnText}>Book</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {matchingSpecialties.length === 0 && matchingDoctors.length === 0 && (
                <View style={styles.emptySearchContainer}>
                  <MaterialCommunityIcons name="account-search-outline" size={48} color={TEXT_SECONDARY} style={{ opacity: 0.5 }} />
                  <Text style={styles.emptySearchText}>No matches found for "{searchQuery}"</Text>
                </View>
              )}
              <View style={{ height: 100 }} />
            </View>
          ) : (
            <>
              {/* BANNERS */}
              <ScrollView 
                ref={bannerScrollRef}
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.bannerScrollContent}
                snapToInterval={width - 32} // snap strictly per item block
                decelerationRate="fast"
                style={styles.bannerContainer}
                onMomentumScrollEnd={(e) => {
                  const newIndex = Math.round(e.nativeEvent.contentOffset.x / (width - 32));
                  if (newIndex === BANNERS.length) {
                    bannerScrollRef.current?.scrollTo({ x: 0, animated: false });
                    setActiveBanner(0);
                    currentBannerIndex.current = 0;
                  } else {
                    setActiveBanner(newIndex);
                    currentBannerIndex.current = newIndex;
                  }
                }}
              >
                {CAROUSEL_BANNERS.map((banner, index) => (
                  <TouchableOpacity key={banner.id} activeOpacity={0.9} onPress={() => navigation.navigate(banner.route)}>
                    <LinearGradient colors={banner.colors} style={styles.bannerCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                      <View style={styles.bannerLeft}>
                        <View style={styles.bannerTitleRow}>
                          <Text style={styles.bannerTitleMain}>{banner.titleMain}</Text>
                          <Text style={styles.bannerTitleSub}>{banner.titleSub}</Text>
                        </View>
                        <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                        <View style={styles.bannerButton}>
                          <Text style={styles.bannerButtonText}>{banner.buttonText}</Text>
                        </View>
                      </View>
                      <Image source={banner.image} style={styles.bannerImage} />
                      
                      {/* Pagination Dots */}
                      <View style={styles.paginationContainer}>
                        {BANNERS.map((_, i) => (
                          <View 
                            key={`dot-${i}`} 
                            style={[
                              styles.paginationDot, 
                              i === activeBanner && styles.paginationDotActive
                            ]} 
                          />
                        ))}
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* QUICK ACTIONS */}
              <View style={styles.quickActionsContainer}>
                <View style={[styles.sectionHeader, { marginBottom: 12 }]}>
                  <Text style={styles.sectionTitleQA}>Quick Actions</Text>
                  <TouchableOpacity onPress={() => { haptics.light(); setShowAllQA(!showAllQA); }}>
                    <Text style={styles.seeAllText}>{showAllQA ? 'Show Less' : 'View All'}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.quickActionsRow}>
                  {(showAllQA ? QUICK_ACTIONS : QUICK_ACTIONS.slice(0, 3)).map(action => (
                    <TouchableOpacity key={action.id} style={styles.quickActionCard} onPress={() => navigation.navigate(action.route)}>
                      <View style={styles.quickActionIconCircle}>
                        <MaterialCommunityIcons name={action.icon} size={32} color={PRIMARY_COLOR} />
                      </View>
                      <Text style={styles.quickActionLabel} textAlign="center">{action.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Upcoming Appointment */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Upcoming Appointment</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Appointments')}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>

              {!currentApt ? (
                <View style={styles.emptyDoctorsContainer}>
                  <Ionicons name="calendar-outline" size={48} color={TEXT_SECONDARY} style={{ opacity: 0.5 }} />
                  <Text style={styles.emptyDoctorsText}>No upcoming appointments</Text>
                  <TouchableOpacity style={styles.bookNowBtn} onPress={() => navigation.navigate('BookAppointment')}>
                    <Text style={styles.bookNowBtnText}>Book an Appointment</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.upcomingCard}>
                  <View style={styles.upcomingTopRow}>
                    <View style={styles.upcomingInfo}>
                      <Text style={styles.doctorName}>{currentDoctor?.name}</Text>
                      <View style={styles.specialtyRow}>
                        <MaterialCommunityIcons name="stethoscope" size={16} color={TEXT_SECONDARY} />
                        <Text style={styles.specialtyText}>{currentDoctor?.specialty}</Text>
                      </View>
                    </View>
                    {currentDoctor?.avatar ? (
                      <Image source={{ uri: currentDoctor.avatar }} style={styles.upcomingImage} resizeMode="cover" />
                    ) : (
                      <View style={[styles.upcomingImage, styles.upcomingImageFallback]}>
                        <Ionicons name="person" size={48} color={TEXT_SECONDARY} />
                      </View>
                    )}
                  </View>

                  <View style={styles.upcomingBottomPanel}>
                    <View style={styles.dateTimeRow}>
                      <View style={styles.dateTimeLeft}>
                        <View style={styles.dateItem}>
                          <Ionicons name="calendar-outline" size={15} color={theme.textSecondary} />
                          <Text style={styles.dateTimeText}>
                            {aptDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}, {aptDate.toLocaleDateString('en-US', { weekday: 'short' })}
                          </Text>
                        </View>
                        <View style={styles.dateItem}>
                          <Ionicons name="time-outline" size={15} color={theme.textSecondary} />
                          <Text style={styles.dateTimeText}>
                            {formatClockTime(aptDate)} - {formatClockTime(aptEndDate)}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.actionButtonsRow}>
                      {isVirtualApt && (
                        aptCanJoin ? (
                          <TouchableOpacity
                            style={[styles.detailsBtn, { backgroundColor: '#22c55e', marginRight: 10 }]}
                            onPress={() => navigation.navigate('VideoCall', { appointmentId: currentApt._id, doctorName: currentApt.doctorId?.name })}
                          >
                            <Ionicons name="videocam" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                            <Text style={[styles.detailsBtnText, { color: '#FFFFFF' }]}>Join Call</Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={[styles.detailsBtn, { backgroundColor: theme.chipBg, marginRight: 10 }]}>
                            <Ionicons name="time-outline" size={16} color={theme.textSecondary} style={{ marginRight: 6 }} />
                            <Text style={[styles.detailsBtnText, { color: theme.textSecondary }]}>Call Not Started</Text>
                          </View>
                        )
                      )}
                      <TouchableOpacity
                        style={styles.detailsBtn}
                        onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: currentApt._id })}
                      >
                        <Text style={styles.detailsBtnText}>Details</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {/* Doctor Specialty */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Doctor Specialty</Text>
                <TouchableOpacity onPress={() => { haptics.light(); setShowAllSpecialties(!showAllSpecialties); }}>
                  <Text style={styles.seeAllText}>{showAllSpecialties ? 'Show Less' : 'See All'}</Text>
                </TouchableOpacity>
              </View>
              {showAllSpecialties ? (
                <View style={styles.specialtyGrid}>
                  {sortedSpecialties.map(item => {
                    const isActive = activeSpecialty === item.label;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.specialtyPill, isActive && styles.specialtyPillActive]}
                        onPress={() => setActiveSpecialty(item.label)}
                      >
                        <View style={[styles.specialtyIconBox, isActive && styles.specialtyIconBoxActive]}>
                          <MaterialCommunityIcons name={item.icon} size={20} color={isActive ? PRIMARY_COLOR : TEXT_SECONDARY} />
                        </View>
                        <Text style={[styles.specialtyLabel, isActive && styles.specialtyLabelActive]}>{item.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.specialtyList}>
                  {sortedSpecialties.slice(0, 6).map(item => {
                    const isActive = activeSpecialty === item.label;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.specialtyPill, isActive && styles.specialtyPillActive]}
                        onPress={() => setActiveSpecialty(item.label)}
                      >
                        <View style={[styles.specialtyIconBox, isActive && styles.specialtyIconBoxActive]}>
                          <MaterialCommunityIcons name={item.icon} size={20} color={isActive ? PRIMARY_COLOR : TEXT_SECONDARY} />
                        </View>
                        <Text style={[styles.specialtyLabel, isActive && styles.specialtyLabelActive]}>{item.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              {/* Popular Doctors */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Popular Doctors</Text>
                <TouchableOpacity onPress={() => { haptics.light(); navigation.navigate('Doctors'); }}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              
              {filteredDoctors.length === 0 ? (
                <View style={styles.emptyDoctorsContainer}>
                  <MaterialCommunityIcons name="account-search-outline" size={48} color={TEXT_SECONDARY} style={{ opacity: 0.5 }} />
                  <Text style={styles.emptyDoctorsText}>No doctors available for {activeSpecialty}</Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.popularList}>
                  {filteredDoctors.map(doc => (
                    <TouchableOpacity 
                      key={doc.id || doc._id} 
                      style={styles.popularCard}
                      onPress={() => navigation.navigate('DoctorDetail', { doctor: doc })}
                      activeOpacity={0.9}
                    >
                      <View style={styles.popularImageContainer}>
                        {doc.avatar ? (
                          <Image
                            source={{ uri: doc.avatar }}
                            style={styles.popularImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.popularEmojiContainer}>
                            <Ionicons name="person" size={54} color={TEXT_SECONDARY} />
                          </View>
                        )}
                        <View style={[styles.popularTopIcons, { justifyContent: 'flex-end' }]}>
                        </View>
                      </View>
                      <View style={styles.popularInfoPanel}>
                        <Text style={styles.popularName} numberOfLines={1}>{doc.name}</Text>
                        <View style={styles.popularMetaRow}>
                          <MaterialCommunityIcons name="stethoscope" size={12} color={TEXT_SECONDARY} />
                          <Text style={styles.popularMetaText} numberOfLines={1}>{doc.specialty}</Text>
                        </View>
                        <View style={styles.popularMetaRow}>
                          <Ionicons name="time-outline" size={12} color={TEXT_SECONDARY} />
                          <Text style={styles.popularMetaText} numberOfLines={1}>{doc.experience ? `${doc.experience} Years Exp` : '3+ Years Exp'}</Text>
                        </View>
                        <TouchableOpacity 
                          style={styles.viewProfileBtn}
                          onPress={() => navigation.navigate('DoctorDetail', { doctor: doc })}
                        >
                          <Text style={styles.viewProfileText}>View Profile</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              <View style={{ height: 100 }} />
            </>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  content: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 28) + 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: theme.card,
    borderWidth: 1.5,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  profileAvatar: {
    width: '100%',
    height: '100%',
  },
  greetingText: {
    fontSize: 14,
    color: theme.textSecondary,
    fontFamily: 'Urbanist_600SemiBold',
    marginBottom: 4,
  },
  nameText: {
    fontSize: 24,
    fontFamily: 'Urbanist_700Bold',
    color: theme.primary,
  },
  subActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    borderWidth: 1,
    borderColor: '#F3D280',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  subActiveText: {
    fontSize: 10,
    fontFamily: 'Urbanist_700Bold',
    color: '#B58E2E',
    marginLeft: 3,
  },
  subInactiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  subInactiveText: {
    fontSize: 10,
    fontFamily: 'Urbanist_600SemiBold',
    color: theme.textSecondary,
    marginLeft: 3,
  },
  bellIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  themeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  notificationDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6B6B',
    borderWidth: 2,
    borderColor: theme.card,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 28,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 32,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInputWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  searchInput: {
    fontSize: 15,
    fontFamily: 'Urbanist_600SemiBold',
    color: theme.text,
    padding: 0,
  },
  searchPlaceholder: {
    position: 'absolute',
    left: 0,
    right: 0,
    fontSize: 15,
    fontFamily: 'Urbanist_600SemiBold',
    color: theme.textSecondary,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.chipBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Banners Styles
  bannerContainer: {
    marginBottom: 24,
    marginHorizontal: -24,
  },
  bannerScrollContent: {
    paddingHorizontal: 24,
    gap: 16,
  },
  bannerCard: {
    width: width - 48,
    height: 190,
    borderRadius: 24,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  bannerLeft: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    zIndex: 2,
  },
  bannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bannerTitleMain: {
    fontSize: 42,
    fontFamily: 'Urbanist_700Bold',
    color: '#FFFFFF',
    marginRight: 6,
    includeFontPadding: false,
    lineHeight: 46,
  },
  bannerTitleSub: {
    fontSize: 12,
    fontFamily: 'Urbanist_700Bold',
    color: '#FFFFFF',
    lineHeight: 14,
  },
  bannerSubtitle: {
    fontSize: 13,
    fontFamily: 'Urbanist_600SemiBold',
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 16,
    lineHeight: 18,
  },
  bannerButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Urbanist_700Bold',
  },
  bannerImage: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 200,
    height: 190,
    resizeMode: 'contain',
    zIndex: 1,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 16,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 3,
  },
  paginationDotActive: {
    width: 16,
    backgroundColor: '#FFFFFF',
  },
  // Quick Actions Styles
  quickActionsContainer: {
    marginBottom: 32,
  },
  sectionTitleQA: {
    fontSize: 18,
    fontFamily: 'Urbanist_700Bold',
    color: theme.primary,
    marginBottom: 16,
  },
  quickActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 12,
  },
  quickActionCard: {
    width: (width - 48 - 24) / 3,
    backgroundColor: theme.card,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 12,
  },
  quickActionIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.chipBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionLabel: {
    fontSize: 13,
    fontFamily: 'Urbanist_600SemiBold',
    color: theme.text,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Urbanist_700Bold',
    color: theme.primary,
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: 'Urbanist_600SemiBold',
    color: theme.textSecondary,
  },
  upcomingCard: {
    backgroundColor: theme.card,
    borderRadius: 24,
    marginBottom: 32,
    marginTop: 20,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  upcomingTopRow: {
    paddingLeft: 20,
    paddingTop: 16,
    paddingBottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  upcomingInfo: {
    flex: 1,
    paddingRight: 12,
  },
  doctorName: {
    fontSize: 18,
    fontFamily: 'Urbanist_700Bold',
    color: theme.primary,
    marginBottom: 6,
  },
  specialtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  specialtyText: {
    fontSize: 14,
    fontFamily: 'Urbanist_600SemiBold',
    color: theme.textSecondary,
  },
  upcomingImage: {
    width: 120,
    height: 155,
    marginTop: -40,
    marginBottom: -10,
    borderTopRightRadius: 24,
  },
  upcomingBottomPanel: {
    backgroundColor: theme.chipBg,
    padding: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateTimeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateTimeText: {
    fontSize: 12,
    fontFamily: 'Urbanist_700Bold',
    color: theme.primary,
  },
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  detailsBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsBtnText: {
    fontSize: 14,
    fontFamily: 'Urbanist_700Bold',
    color: '#FFFFFF',
  },
  specialtyList: {
    paddingBottom: 24,
    gap: 12,
  },
  specialtyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    padding: 8,
    paddingRight: 20,
    borderRadius: 28,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  specialtyPillActive: {
    backgroundColor: theme.primary,
  },
  specialtyIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.chipBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  specialtyIconBoxActive: {
    backgroundColor: theme.card,
  },
  specialtyLabel: {
    fontSize: 15,
    fontFamily: 'Urbanist_700Bold',
    color: theme.primary,
  },
  specialtyLabelActive: {
    color: '#FFFFFF',
  },
  popularList: {
    paddingBottom: 32,
    gap: 14,
  },
  popularCard: {
    width: 165,
    backgroundColor: theme.card,
    borderRadius: 20,
    marginTop: 20,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  popularImageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: theme.chipBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'relative',
  },
  popularTopIcons: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  popularImage: {
    width: '100%',
    height: 160,
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  popularEmojiContainer: {
    width: '100%',
    height: 160,
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popularInfoPanel: {
    padding: 12,
  },
  popularName: {
    fontSize: 14,
    fontFamily: 'Urbanist_700Bold',
    color: theme.primary,
    marginBottom: 6,
  },
  popularMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  popularMetaText: {
    fontSize: 11,
    fontFamily: 'Urbanist_600SemiBold',
    color: theme.textSecondary,
    marginLeft: 5,
    flex: 1,
  },
  viewProfileBtn: {
    marginTop: 8,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
  },
  viewProfileText: {
    fontSize: 12,
    fontFamily: 'Urbanist_700Bold',
    color: theme.primary,
  },
  emptyDoctorsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    backgroundColor: theme.card,
    borderRadius: 20,
    marginBottom: 32,
  },
  emptyDoctorsText: {
    fontSize: 15,
    fontFamily: 'Urbanist_600SemiBold',
    color: theme.textSecondary,
    marginTop: 12,
  },
  bookNowBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: theme.primary,
  },
  bookNowBtnText: {
    fontSize: 14,
    fontFamily: 'Urbanist_700Bold',
    color: '#FFFFFF',
  },
  upcomingImageFallback: {
    backgroundColor: theme.chipBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  specialtyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 24,
  },
  searchResultsContainer: {
    backgroundColor: theme.card,
    borderRadius: 24,
    padding: 16,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 32,
  },
  searchResultsTitle: {
    fontSize: 18,
    fontFamily: 'Urbanist_700Bold',
    color: theme.primary,
    marginBottom: 16,
  },
  searchResultSection: {
    marginBottom: 20,
  },
  searchResultSectionTitle: {
    fontSize: 14,
    fontFamily: 'Urbanist_700Bold',
    color: theme.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  searchResultIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.chipBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  searchResultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  searchResultAvatarFallback: {
    backgroundColor: theme.chipBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultText: {
    fontSize: 15,
    fontFamily: 'Urbanist_700Bold',
    color: theme.primary,
  },
  searchResultSubtext: {
    fontSize: 12,
    fontFamily: 'Urbanist_600SemiBold',
    color: theme.textSecondary,
    marginTop: 2,
  },
  searchBookBtn: {
    backgroundColor: theme.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginLeft: 10,
  },
  searchBookBtnText: {
    fontSize: 13,
    fontFamily: 'Urbanist_700Bold',
    color: '#FFFFFF',
  },
  emptySearchContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptySearchText: {
    fontSize: 15,
    fontFamily: 'Urbanist_600SemiBold',
    color: theme.textSecondary,
    marginTop: 12,
  },
});

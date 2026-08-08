import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Text, Animated, Image, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ScreenHeader, SkeletonList, EmptyState, PageLoader } from '../components/ui';
import { useScreenAnimation, useStaggerAnimation } from '../hooks/useAnimations';
import { getDoctors } from '../api/config';
import haptics from '../utils/haptics';

export default function DoctorsScreen({ navigation, route }) {
  const { theme } = useTheme();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { fadeAnim, slideAnim } = useScreenAnimation();
  const { getItemStyle, triggerStagger } = useStaggerAnimation(10);

  const fetchDoctors = async () => {
    try {
      const res = await getDoctors();
      let list = res.data || [];
      const filterSpecialty = route.params?.specialty;
      if (filterSpecialty) {
        list = list.filter(doc => doc.specialty && doc.specialty.toLowerCase() === filterSpecialty.toLowerCase());
      }
      setDoctors(list);
      triggerStagger(list.length || 0);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchDoctors(); }, [route.params?.specialty]);

  const onRefresh = async () => {
    haptics.light();
    setRefreshing(true);
    await fetchDoctors();
    setRefreshing(false);
  };

  const openDoctor = (doctor) => {
    haptics.light();
    navigation.navigate('DoctorDetail', { doctor });
  };

  return (
    <LinearGradient colors={theme.gradient} style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        <ScreenHeader 
          title={route.params?.specialty || "Doctors"} 
          subtitle={route.params?.specialty ? `Browse ${route.params.specialty} doctors` : "Browse available doctors"} 
          onBack={() => navigation.goBack()} 
        />

        {loading ? (
          <PageLoader />
        ) : doctors.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="No Doctors Found"
            message="No doctors are currently available. Please check back later."
          />
        ) : (
          <Animated.View style={[styles.gridContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {doctors.map((doc, index) => (
              <Animated.View key={doc.id || index} style={[getItemStyle(index), { width: '48%' }]}>
                <TouchableOpacity 
                  style={[styles.popularCard, { backgroundColor: theme.card }]}
                  onPress={() => openDoctor(doc)}
                  activeOpacity={0.9}
                >
                  <View style={[styles.popularImageContainer, { backgroundColor: theme.chipBg }]}>
                    {(!doc.avatar || doc.avatar.includes('ui-avatars.com')) && !(doc.name?.toLowerCase().includes('arun') || doc.name?.toLowerCase().includes('sharma')) ? (
                      <View style={styles.popularEmojiContainer}>
                        <Ionicons name="person" size={54} color={theme.textSecondary} />
                      </View>
                    ) : (
                      <Image 
                        source={(doc.name?.toLowerCase().includes('arun') || doc.name?.toLowerCase().includes('sharma'))
                          ? require('../../assets/images/dummy_doctor.png')
                          : { uri: doc.avatar }} 
                        style={styles.popularImage} 
                        resizeMode="cover" 
                      />
                    )}
                    <View style={styles.popularTopIcons}>
                      <View style={styles.ratingBadgePopular}>
                        <Ionicons name="star" size={10} color="#FFB800" />
                        <Text style={styles.ratingTextPopular}>{doc.rating || '4.8'}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.popularInfoPanel}>
                    <Text style={[styles.popularName, { color: theme.text }]} numberOfLines={1}>{doc.name}</Text>
                    <View style={styles.popularMetaRow}>
                      <MaterialCommunityIcons name="stethoscope" size={12} color={theme.textSecondary} />
                      <Text style={[styles.popularMetaText, { color: theme.textSecondary }]} numberOfLines={1}>{doc.specialty || 'General Physician'}</Text>
                    </View>
                    <View style={styles.popularMetaRow}>
                      <Ionicons name="time-outline" size={12} color={theme.textSecondary} />
                      <Text style={[styles.popularMetaText, { color: theme.textSecondary }]} numberOfLines={1}>{doc.experience ? `${doc.experience} Years Exp` : '3+ Years Exp'}</Text>
                    </View>
                    <TouchableOpacity 
                      style={[styles.viewProfileBtn, { borderColor: theme.border }]}
                      onPress={() => openDoctor(doc)}
                    >
                      <Text style={[styles.viewProfileText, { color: theme.text }]}>View Profile</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </Animated.View>
        )}
        <View style={{ height: 120 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 20 },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  popularCard: {
    borderRadius: 20,
    marginBottom: 16,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  popularImageContainer: {
    width: '100%',
    height: 140,
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
  ratingBadgePopular: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  ratingTextPopular: {
    fontSize: 10,
    fontFamily: 'Urbanist_700Bold',
    color: '#223263',
    marginLeft: 3,
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
  popularEmojiText: {
    fontSize: 54,
  },
  popularInfoPanel: {
    padding: 12,
  },
  popularName: {
    fontSize: 14,
    fontFamily: 'Urbanist_700Bold',
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
    marginLeft: 5,
    flex: 1,
  },
  viewProfileBtn: {
    marginTop: 8,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  viewProfileText: {
    fontSize: 12,
    fontFamily: 'Urbanist_700Bold',
  },
});

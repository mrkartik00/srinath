import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  Alert,
  Animated,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import {
  ScreenHeader,
  GlassCard,
  StatusBadge,
  SectionHeader,
  PressableButton,
} from '../components/ui';
import { useScreenAnimation } from '../hooks/useAnimations';
import { getPrescriptionPdfUrl } from '../api/prescriptions';
import haptics from '../utils/haptics';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PrescriptionDetailScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { prescription } = route.params;
  const [downloading, setDownloading] = useState(false);

  const { fadeAnim, slideAnim } = useScreenAnimation();

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleDownloadPdf = async () => {
    haptics.medium();
    setDownloading(true);

    try {
      const token = await AsyncStorage.getItem('token');
      const url = getPrescriptionPdfUrl(prescription._id);
      const fileUri = `${FileSystem.cacheDirectory}prescription_${prescription._id}.pdf`;

      const downloadResult = await FileSystem.downloadAsync(url, fileUri, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (downloadResult.status === 200) {
        haptics.success();
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Prescription PDF',
        });
      } else {
        haptics.error();
        Alert.alert('Download Failed', 'Could not download the prescription PDF. Please try again.');
      }
    } catch (error) {
      haptics.error();
      console.error('PDF download error:', error);
      Alert.alert('Error', 'Something went wrong while downloading the PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const renderMedicineCard = (medicine, index) => (
    <GlassCard key={index} style={styles.medicineCard}>
      <View style={styles.medicineHeader}>
        <Ionicons name="medical" size={18} color={theme.primary} />
        <Text style={[styles.medicineName, { color: theme.text }]}>
          {medicine.name}
        </Text>
      </View>

      <View style={styles.medicineDetails}>
        {medicine.dosage ? (
          <View style={styles.medicineRow}>
            <Text style={[styles.medicineLabel, { color: theme.textSecondary }]}>
              Dosage
            </Text>
            <Text style={[styles.medicineValue, { color: theme.text }]}>
              {medicine.dosage}
            </Text>
          </View>
        ) : null}

        {medicine.frequency ? (
          <View style={styles.medicineRow}>
            <Text style={[styles.medicineLabel, { color: theme.textSecondary }]}>
              Frequency
            </Text>
            <Text style={[styles.medicineValue, { color: theme.text }]}>
              {medicine.frequency}
            </Text>
          </View>
        ) : null}

        {medicine.timings && medicine.timings.length > 0 ? (
          <View style={styles.medicineRow}>
            <Text style={[styles.medicineLabel, { color: theme.textSecondary }]}>
              Timings
            </Text>
            <Text style={[styles.medicineValue, { color: theme.text }]}>
              {medicine.timings.join(', ')}
            </Text>
          </View>
        ) : null}

        {medicine.duration ? (
          <View style={styles.medicineRow}>
            <Text style={[styles.medicineLabel, { color: theme.textSecondary }]}>
              Duration
            </Text>
            <Text style={[styles.medicineValue, { color: theme.text }]}>
              {medicine.duration} days
            </Text>
          </View>
        ) : null}

        {medicine.instructions ? (
          <View style={styles.medicineRow}>
            <Text style={[styles.medicineLabel, { color: theme.textSecondary }]}>
              Instructions
            </Text>
            <Text style={[styles.medicineValue, { color: theme.text }]}>
              {medicine.instructions}
            </Text>
          </View>
        ) : null}
      </View>
    </GlassCard>
  );

  return (
    <LinearGradient
      colors={theme.gradientBackground}
      style={styles.container}
    >
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <ScreenHeader title="Prescription" onBack={() => navigation.goBack()} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Status Badge */}
          <View style={styles.statusRow}>
            <StatusBadge status={prescription.status} size="md" />
          </View>

          {/* Diagnosis Card */}
          <GlassCard style={styles.diagnosisCard}>
            <Text style={[styles.diagnosisLabel, { color: theme.textSecondary }]}>
              Diagnosis
            </Text>
            <Text style={[styles.diagnosisText, { color: theme.text }]}>
              {prescription.diagnosis}
            </Text>

            <View style={styles.doctorRow}>
              <Ionicons name="person-outline" size={16} color={theme.primary} />
              <Text style={[styles.doctorText, { color: theme.textSecondary }]}>
                Dr. {prescription.doctorId?.name || 'Unknown'}
              </Text>
            </View>

            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={16} color={theme.primary} />
              <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                Issued on {formatDate(prescription.issuedAt)}
              </Text>
            </View>
          </GlassCard>

          {/* Medicines Section */}
          <SectionHeader title="Medicines" />
          {prescription.medicines && prescription.medicines.length > 0 ? (
            prescription.medicines.map((medicine, index) =>
              renderMedicineCard(medicine, index)
            )
          ) : (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No medicines listed
            </Text>
          )}

          {/* Notes Card */}
          {prescription.notes ? (
            <>
              <SectionHeader title="Notes" />
              <GlassCard style={styles.notesCard}>
                <Text style={[styles.notesText, { color: theme.text }]}>
                  {prescription.notes}
                </Text>
              </GlassCard>
            </>
          ) : null}

          {/* PDF Download Button */}
          {prescription.pdfPath ? (
            <PressableButton
              onPress={handleDownloadPdf}
              disabled={downloading}
              style={[styles.downloadButton, { backgroundColor: theme.primary }]}
            >
              <View style={styles.downloadButtonContent}>
                <Ionicons
                  name={downloading ? 'hourglass-outline' : 'download-outline'}
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.downloadButtonText}>
                  {downloading ? 'Downloading...' : 'Download PDF'}
                </Text>
              </View>
            </PressableButton>
          ) : null}

          <View style={styles.bottomSpacer} />
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  statusRow: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  diagnosisCard: {
    padding: 20,
    marginBottom: 20,
  },
  diagnosisLabel: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  diagnosisText: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  doctorText: {
    fontSize: 15,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 14,
  },
  medicineCard: {
    padding: 16,
    marginBottom: 10,
  },
  medicineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  medicineDetails: {
    gap: 8,
  },
  medicineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medicineLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  medicineValue: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  notesCard: {
    padding: 16,
    marginBottom: 20,
  },
  notesText: {
    fontSize: 15,
    lineHeight: 22,
  },
  downloadButton: {
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  downloadButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 120,
  },
});

export default PrescriptionDetailScreen;

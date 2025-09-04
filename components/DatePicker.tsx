import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';

interface DatePickerProps {
  label: string;
  value: string;
  onDateChange: (date: string) => void;
  placeholder?: string;
  minimumDate?: Date;
  error?: string;
  required?: boolean;
}

// Utility to parse YYYY-MM-DD as local date
function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export default function DatePicker({
  label,
  value,
  onDateChange,
  placeholder = "Select date",
  minimumDate,
  error,
  required = false
}: DatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(
    value ? parseLocalDate(value) : new Date()
  );

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      // Android: Close immediately on selection
      setShowPicker(false);
      if (date) {
        const formattedDate = date.toISOString().split('T')[0];
        onDateChange(formattedDate);
      }
    } else {
      // iOS: Just update temp date, don't close yet
      if (date) {
        setTempDate(date);
      }
    }
  };

  const handleDone = () => {
    setShowPicker(false);
    const formattedDate = tempDate.toISOString().split('T')[0];
    onDateChange(formattedDate);
  };

  const handleCancel = () => {
    setShowPicker(false);
    // Reset temp date to original value
    setTempDate(value ? parseLocalDate(value) : new Date());
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    const date = parseLocalDate(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const openPicker = () => {
    if (Platform.OS === 'web') {
      // For web, we'll use the native HTML date input
      const input = document.createElement('input');
      input.type = 'date';
      input.value = value || '';
      if (minimumDate) {
        input.min = minimumDate.toISOString().split('T')[0];
      }
      
      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        if (target.value) {
          onDateChange(target.value);
        }
      };
      
      input.click();
    } else {
      // Set temp date to current value when opening
      setTempDate(value ? parseLocalDate(value) : new Date());
      setShowPicker(true);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      
      <TouchableOpacity 
        style={[styles.dateButton, error && styles.dateButtonError]} 
        onPress={openPicker}
      >
        <Calendar size={18} color="#64748B" strokeWidth={2} />
          <Text style={{ color: '#F8FAFC' }}>{value ? formatDisplayDate(value) : placeholder}</Text>
      </TouchableOpacity>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {showPicker && Platform.OS !== 'web' && (
        <Modal
          visible={showPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={handleCancel}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Select Date</Text>
                <TouchableOpacity onPress={handleDone} style={styles.headerButton}>
                  <Text style={styles.doneText}>Done</Text>
                </TouchableOpacity>
              </View>
              
              <DateTimePicker
                value={tempDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={minimumDate}
                style={styles.picker}
                locale="en"
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 8,
    letterSpacing: -0.1,
  },
  required: {
    color: '#EF4444',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  dateButtonError: {
    borderColor: '#EF4444',
  },
  placeholderText: {
    color: '#64748B',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    fontWeight: '500',
  },
  
    // New modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 50,
    },
    pickerContainer: {
      backgroundColor: '#1E293B',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#334155',
      width: '100%',
      maxWidth: 400,
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 16,
    },
    pickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#334155',
    },
    picker: {
      backgroundColor: '#1E293B',
      alignSelf: 'center',
      width: '100%',
    },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '500',
  },
  doneText: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '600',
  },
});
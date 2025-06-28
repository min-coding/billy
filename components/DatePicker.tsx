import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
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
  const [selectedDate, setSelectedDate] = useState<Date>(
    value ? new Date(value) : new Date()
  );

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (date) {
      setSelectedDate(date);
      // Format date as YYYY-MM-DD for consistency with existing code
      const formattedDate = date.toISOString().split('T')[0];
      onDateChange(formattedDate);
    }
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
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
        <Text style={[styles.dateText, !value && styles.placeholderText]}>
          {value ? formatDisplayDate(value) : placeholder}
        </Text>
      </TouchableOpacity>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {showPicker && Platform.OS !== 'web' && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={minimumDate}
          style={styles.picker}
        />
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
  dateText: {
    flex: 1,
    fontSize: 16,
    color: '#F8FAFC',
    fontWeight: '500',
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
  picker: {
    backgroundColor: '#1E293B',
  },
});
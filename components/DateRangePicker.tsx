import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  label?: string;
}

// Utility to parse YYYY-MM-DD as local date
function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  label = "Date Range"
}: DateRangePickerProps) {
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState<Date>(
    startDate ? parseLocalDate(startDate) : new Date()
  );
  const [selectedEndDate, setSelectedEndDate] = useState<Date>(
    endDate ? parseLocalDate(endDate) : new Date()
  );

  const handleStartDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartPicker(false);
    }
    
    if (date) {
      setSelectedStartDate(date);
      // ✅ Fix: Use local date formatting instead of UTC conversion
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      onStartDateChange(formattedDate);
    }
  };

  const handleEndDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndPicker(false);
    }
    
    if (date) {
      setSelectedEndDate(date);
      // ✅ Fix: Use local date formatting instead of UTC conversion
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      onEndDateChange(formattedDate);
    }
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    const date = parseLocalDate(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const openStartPicker = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'date';
      input.value = startDate || '';
      
      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        if (target.value) {
          onStartDateChange(target.value);
        }
      };
      
      input.click();
    } else {
      setShowStartPicker(true);
    }
  };

  const openEndPicker = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'date';
      input.value = endDate || '';
      if (startDate) {
        input.min = startDate;
      }
      
      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        if (target.value) {
          onEndDateChange(target.value);
        }
      };
      
      input.click();
    } else {
      setShowEndPicker(true);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      <View style={styles.dateRangeContainer}>
        <TouchableOpacity style={styles.dateButton} onPress={openStartPicker}>
          <Calendar size={16} color="#64748B" strokeWidth={2} />
          <Text style={[styles.dateText, !startDate && styles.placeholderText]}>
            {startDate ? formatDisplayDate(startDate) : 'Start date'}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.separator}>to</Text>
        
        <TouchableOpacity style={styles.dateButton} onPress={openEndPicker}>
          <Calendar size={16} color="#64748B" strokeWidth={2} />
          <Text style={[styles.dateText, !endDate && styles.placeholderText]}>
            {endDate ? formatDisplayDate(endDate) : 'End date'}
          </Text>
        </TouchableOpacity>
      </View>

      {showStartPicker && Platform.OS !== 'web' && (
        <DateTimePicker
          value={selectedStartDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleStartDateChange}
          style={styles.picker}
        />
      )}

      {showEndPicker && Platform.OS !== 'web' && (
        <DateTimePicker
          value={selectedEndDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleEndDateChange}
          minimumDate={startDate ? new Date(startDate) : undefined}
          style={styles.picker}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  dateRangeContainer: {
    gap: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
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
  separator: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '600',
  },
  picker: {
    backgroundColor: '#1E293B',
  },
});
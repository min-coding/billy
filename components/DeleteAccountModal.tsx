import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Modal } from 'react-native';
import { X, AlertTriangle, Lock } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function DeleteAccountModal({ visible, onClose }: DeleteAccountModalProps) {
  const { deleteAccount } = useAuth();
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [step, setStep] = useState<'warning' | 'password'>('warning');

  const handleDeleteAccount = async () => {
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAccount(password);
      // Modal will close automatically when user is redirected
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete account');
      setIsDeleting(false);
    }
  };

  const resetModal = () => {
    setPassword('');
    setStep('warning');
    setIsDeleting(false);
    onClose();
  };

  const nextStep = () => {
    setStep('password');
  };

  const prevStep = () => {
    setStep('warning');
  };

  const renderWarningStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.iconContainer}>
        <AlertTriangle size={48} color="#EF4444" strokeWidth={2} />
      </View>
      <Text style={styles.title}>Delete Account</Text>
      <Text style={styles.subtitle}>
        This action cannot be undone. All your data including bills, friends, and chat history will be permanently deleted.
      </Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={resetModal}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
          <Text style={styles.nextButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPasswordStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.iconContainer}>
        <Lock size={48} color="#EF4444" strokeWidth={2} />
      </View>
      <Text style={styles.title}>Enter Password</Text>
      <Text style={styles.subtitle}>
        Please enter your password to confirm account deletion.
      </Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.passwordInput}
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          placeholderTextColor="#64748B"
          secureTextEntry
          autoFocus
        />
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={prevStep}>
          <Text style={styles.cancelButtonText}>Go Back</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]} 
          onPress={handleDeleteAccount}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={resetModal}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={resetModal}>
              <X size={20} color="#64748B" strokeWidth={2} />
            </TouchableOpacity>
          </View>
          
          {step === 'warning' && renderWarningStep()}
          {step === 'password' && renderPasswordStep()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    alignItems: 'flex-end',
    padding: 16,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepContent: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    fontWeight: '500',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 32,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#F8FAFC',
    backgroundColor: '#0F172A',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  cancelButtonText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    backgroundColor: '#7F1D1D',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});

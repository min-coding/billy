import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function SignupScreen() {
  const router = useRouter();
  const { signup, isLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ 
    username?: string;
    name?: string; 
    email?: string; 
    password?: string; 
    confirmPassword?: string; 
    general?: string;
  }>({});

  const validateForm = () => {
    const newErrors: { 
      username?: string;
      name?: string; 
      email?: string; 
      password?: string; 
      confirmPassword?: string;
    } = {};
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;
    try {
      setErrors({});
      await signup({
        username: formData.username.trim(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
      router.replace('/(tabs)/' as any);
    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : 'Signup failed' });
    }
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <LinearGradient
      colors={['#0F172A', '#1E293B', '#334155']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <ArrowLeft size={20} color="#F8FAFC" strokeWidth={2} />
              </TouchableOpacity>
              
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={['#F59E0B', '#EAB308', '#F97316']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.logo}
                >
                  <UserPlus size={32} color="#FFFFFF" strokeWidth={2} />
                </LinearGradient>
              </View>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join thousands of users splitting bills effortlessly</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* General Error */}
              {errors.general && (
                <LinearGradient
                  colors={['#FEF2F2', '#FECACA']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.errorContainer}
                >
                  <Text style={styles.errorText}>{errors.general}</Text>
                </LinearGradient>
              )}

              {/* Username Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Username</Text>
                <LinearGradient
                  colors={['#1E293B', '#334155']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.inputGradient, errors.username && styles.inputError]}
                >
                  <View style={styles.inputContainer}>
                    <User size={18} color="#64748B" strokeWidth={2} />
                    <TextInput
                      style={styles.input}
                      value={formData.username}
                      onChangeText={(text) => updateField('username', text)}
                      placeholder="Choose a username"
                      placeholderTextColor="#64748B"
                      autoCapitalize="none"
                      editable={!isLoading}
                    />
                  </View>
                </LinearGradient>
                {errors.username && <Text style={styles.fieldError}>{errors.username}</Text>}
                <Text style={styles.helpText}>
                  Username cannot be changed later and must be unique.
                </Text>
              </View>

              {/* Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <LinearGradient
                  colors={['#1E293B', '#334155']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.inputGradient, errors.name && styles.inputError]}
                >
                  <View style={styles.inputContainer}>
                    <User size={18} color="#64748B" strokeWidth={2} />
                    <TextInput
                      style={styles.input}
                      value={formData.name}
                      onChangeText={(text) => updateField('name', text)}
                      placeholder="Enter your full name"
                      placeholderTextColor="#64748B"
                      autoCapitalize="words"
                      editable={!isLoading}
                    />
                  </View>
                </LinearGradient>
                {errors.name && <Text style={styles.fieldError}>{errors.name}</Text>}
              </View>

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <LinearGradient
                  colors={['#1E293B', '#334155']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.inputGradient, errors.email && styles.inputError]}
                >
                  <View style={styles.inputContainer}>
                    <Mail size={18} color="#64748B" strokeWidth={2} />
                    <TextInput
                      style={styles.input}
                      value={formData.email}
                      onChangeText={(text) => updateField('email', text)}
                      placeholder="Enter your email"
                      placeholderTextColor="#64748B"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                  </View>
                </LinearGradient>
                {errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <LinearGradient
                  colors={['#1E293B', '#334155']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.inputGradient, errors.password && styles.inputError]}
                >
                  <View style={styles.inputContainer}>
                    <Lock size={18} color="#64748B" strokeWidth={2} />
                    <TextInput
                      style={styles.input}
                      value={formData.password}
                      onChangeText={(text) => updateField('password', text)}
                      placeholder="Create a password"
                      placeholderTextColor="#64748B"
                      secureTextEntry={!showPassword}
                      editable={!isLoading}
                    />
                    <TouchableOpacity 
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                    >
                      {showPassword ? (
                        <EyeOff size={18} color="#64748B" strokeWidth={2} />
                      ) : (
                        <Eye size={18} color="#64748B" strokeWidth={2} />
                      )}
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
                {errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <LinearGradient
                  colors={['#1E293B', '#334155']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.inputGradient, errors.confirmPassword && styles.inputError]}
                >
                  <View style={styles.inputContainer}>
                    <Lock size={18} color="#64748B" strokeWidth={2} />
                    <TextInput
                      style={styles.input}
                      value={formData.confirmPassword}
                      onChangeText={(text) => updateField('confirmPassword', text)}
                      placeholder="Confirm your password"
                      placeholderTextColor="#64748B"
                      secureTextEntry={!showConfirmPassword}
                      editable={!isLoading}
                    />
                    <TouchableOpacity 
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.eyeButton}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} color="#64748B" strokeWidth={2} />
                      ) : (
                        <Eye size={18} color="#64748B" strokeWidth={2} />
                      )}
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
                {errors.confirmPassword && <Text style={styles.fieldError}>{errors.confirmPassword}</Text>}
              </View>

              {/* Password Requirements */}
              <LinearGradient
                colors={['#1E293B', '#334155']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.requirementsContainer}
              >
                <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                <Text style={styles.requirementItem}>• At least 6 characters long</Text>
                <Text style={styles.requirementItem}>• Must match confirmation password</Text>
              </LinearGradient>

              {/* Signup Button */}
              <LinearGradient
                colors={isLoading ? ['#475569', '#64748B'] : ['#F59E0B', '#EAB308', '#F97316']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.signupButtonGradient}
              >
                <TouchableOpacity 
                  style={styles.signupButton} 
                  onPress={handleSignup}
                  disabled={isLoading}
                >
                  <UserPlus size={18} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.signupButtonText}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Text>
                </TouchableOpacity>
              </LinearGradient>

              {/* Divider */}
              <View style={styles.divider}>
                <LinearGradient
                  colors={['transparent', '#334155', 'transparent']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.dividerLine}
                />
                <Text style={styles.dividerText}>or</Text>
                <LinearGradient
                  colors={['transparent', '#334155', 'transparent']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.dividerLine}
                />
              </View>

              {/* Login Link */}
              <LinearGradient
                colors={['#1E293B', '#334155']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.loginButtonGradient}
              >
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity style={styles.loginButton} disabled={isLoading}>
                    <Text style={styles.loginButtonText}>Already have an account? Sign In</Text>
                  </TouchableOpacity>
                </Link>
              </LinearGradient>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                By creating an account, you agree to our Terms of Service and Privacy Policy
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  form: {
    flex: 1,
  },
  errorContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 8,
    letterSpacing: -0.1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  inputGradient: {
    borderRadius: 12,
    padding: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 11,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#F8FAFC',
    fontWeight: '500',
  },
  eyeButton: {
    padding: 4,
  },
  fieldError: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 6,
    fontWeight: '500',
  },
  helpText: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  requirementsContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  requirementItem: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 4,
    fontWeight: '500',
  },
  signupButtonGradient: {
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#F59E0B',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  signupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 8,
  },
  loginButtonGradient: {
    borderRadius: 12,
    padding: 1,
  },
  loginButton: {
    backgroundColor: '#0F172A',
    paddingVertical: 16,
    borderRadius: 11,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  footer: {
    marginTop: 32,
    paddingTop: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },
});
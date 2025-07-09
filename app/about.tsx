import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Users, Calculator, MessageCircle, CreditCard, Bell, Shield, Smartphone, Globe, ExternalLink, Receipt, Camera, UserPlus, CircleCheck as CheckCircle } from 'lucide-react-native';

export default function AboutScreen() {
  const router = useRouter();

  const features = [
    {
      icon: Receipt,
      title: "Smart Bill Creation",
      description: "Create detailed bills with multiple items, quantities, and custom descriptions. Add receipt photos for reference."
    },
    {
      icon: Users,
      title: "Friend Management",
      description: "Connect with friends using usernames, manage your network, and easily add participants to bills."
    },
    {
      icon: Calculator,
      title: "Flexible Splitting",
      description: "Let participants choose their own items or split costs evenly. Our smart calculator handles the math automatically."
    },
    {
      icon: MessageCircle,
      title: "Bill Chat",
      description: "Communicate with bill participants through integrated chat. Share payment confirmations and updates in real-time."
    },
    {
      icon: Camera,
      title: "Payment Verification",
      description: "Upload payment slips and receipts for verification. Hosts can approve or reject payments with visual proof."
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Stay updated with push notifications for bill updates, payment confirmations, and friend requests."
    },
    {
      icon: CreditCard,
      title: "Secure Payments",
      description: "Track payments securely with bank account integration. All financial data is encrypted and protected."
    },
    {
      icon: CheckCircle,
      title: "Bill Lifecycle",
      description: "Manage bills through selection, payment, and completion phases with clear status tracking for all participants."
    }
  ];

  const stats = [
    { number: "1000+", label: "Active Users" },
    { number: "5000+", label: "Bills Split" },
    { number: "$50K+", label: "Money Managed" },
    { number: "99.9%", label: "Uptime" }
  ];

  const handlePrivacyPress = () => {
    router.push('/privacy');
  };

  const handleContactPress = () => {
    Linking.openURL('mailto:support@billy-app.com');
  };

  const handleWebsitePress = () => {
    Linking.openURL('https://billy-app.com');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#F8FAFC" strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>About Billy</Text>
          <Text style={styles.subtitle}>Split bills with friends, effortlessly</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/images/ios-light.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.heroTitle}>Billy</Text>
          <Text style={styles.heroSubtitle}>
            The modern way to split bills and manage shared expenses with friends, 
            family, and colleagues.
          </Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>Trusted by Users Worldwide</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <Text style={styles.statNumber}>{stat.number}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          <Text style={styles.sectionSubtitle}>
            Everything you need to manage shared expenses seamlessly
          </Text>
          
          {features.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <feature.icon size={24} color="#3B82F6" strokeWidth={2} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* How It Works Section */}
        <View style={styles.howItWorksSection}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <Text style={styles.sectionSubtitle}>
            Simple steps to split any bill
          </Text>
          
          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Create a Bill</Text>
              <Text style={styles.stepDescription}>
                Add bill details, items, and invite friends to participate. Upload receipt photos for reference.
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Select Items</Text>
              <Text style={styles.stepDescription}>
                Participants choose which items they want to pay for. Costs are automatically calculated and split.
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Make Payments</Text>
              <Text style={styles.stepDescription}>
                Send payments using provided bank details and upload payment confirmations for verification.
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Track & Complete</Text>
              <Text style={styles.stepDescription}>
                Monitor payment status in real-time and close bills once everyone has paid their share.
              </Text>
            </View>
          </View>
        </View>

        {/* Mission Section */}
        <View style={styles.missionSection}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.missionText}>
            We believe that splitting bills shouldn't be complicated or awkward. Billy was created 
            to eliminate the hassle of managing shared expenses, making it easy for friends and 
            groups to enjoy experiences together without worrying about who owes what.
          </Text>
          <Text style={styles.missionText}>
            Our goal is to provide a transparent, secure, and user-friendly platform that handles 
            all the complexity of bill splitting, so you can focus on what matters most - spending 
            time with the people you care about.
          </Text>
        </View>

        {/* Security Section */}
        <View style={styles.securitySection}>
          <View style={styles.securityHeader}>
            <Shield size={24} color="#10B981" strokeWidth={2} />
            <Text style={styles.securityTitle}>Security & Privacy</Text>
          </View>
          <Text style={styles.securityText}>
            Your financial data and personal information are protected with bank-level security. 
            We use end-to-end encryption, secure payment processing, and never store sensitive 
            payment information on our servers.
          </Text>
          <TouchableOpacity style={styles.privacyButton} onPress={handlePrivacyPress}>
            <Text style={styles.privacyButtonText}>Read Privacy Policy</Text>
            <ExternalLink size={16} color="#3B82F6" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Platform Section */}
        <View style={styles.platformSection}>
          <Text style={styles.sectionTitle}>Available Everywhere</Text>
          <View style={styles.platformGrid}>
            <View style={styles.platformCard}>
              <Smartphone size={32} color="#3B82F6" strokeWidth={2} />
              <Text style={styles.platformTitle}>Mobile Apps</Text>
              <Text style={styles.platformDescription}>iOS and Android native apps</Text>
            </View>
            <View style={styles.platformCard}>
              <Globe size={32} color="#3B82F6" strokeWidth={2} />
              <Text style={styles.platformTitle}>Web App</Text>
              <Text style={styles.platformDescription}>Access from any browser</Text>
            </View>
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Get in Touch</Text>
          <Text style={styles.contactText}>
            Have questions, feedback, or need support? We'd love to hear from you.
          </Text>
          
          <TouchableOpacity style={styles.contactButton} onPress={handleContactPress}>
            <Text style={styles.contactButtonText}>Contact Support</Text>
            <ExternalLink size={16} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.websiteButton} onPress={handleWebsitePress}>
            <Text style={styles.websiteButtonText}>Visit Our Website</Text>
            <ExternalLink size={16} color="#3B82F6" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made with ❤️ for people who love sharing experiences
          </Text>
          <Text style={styles.copyright}>
            © 2025 Billy. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#0F172A',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    backgroundColor: '#1E293B',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    marginBottom: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
    marginBottom: 16,
  },
  version: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statsSection: {
    backgroundColor: '#1E293B',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginBottom: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: -0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  featuresSection: {
    backgroundColor: '#1E293B',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginBottom: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 24,
    fontWeight: '500',
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  featureDescription: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
    fontWeight: '500',
  },
  howItWorksSection: {
    backgroundColor: '#1E293B',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginBottom: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  stepDescription: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
    fontWeight: '500',
  },
  missionSection: {
    backgroundColor: '#1E293B',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginBottom: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  missionText: {
    fontSize: 15,
    color: '#94A3B8',
    lineHeight: 24,
    fontWeight: '500',
    marginBottom: 16,
  },
  securitySection: {
    backgroundColor: '#1E293B',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginBottom: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  securityTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F8FAFC',
    marginLeft: 12,
    letterSpacing: -0.3,
  },
  securityText: {
    fontSize: 15,
    color: '#94A3B8',
    lineHeight: 24,
    fontWeight: '500',
    marginBottom: 20,
  },
  privacyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
    alignSelf: 'flex-start',
    gap: 8,
  },
  privacyButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  platformSection: {
    backgroundColor: '#1E293B',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginBottom: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  platformGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  platformCard: {
    width: '48%',
    backgroundColor: '#0F172A',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  platformTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginTop: 12,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  platformDescription: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '500',
  },
  contactSection: {
    backgroundColor: '#1E293B',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginBottom: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  contactText: {
    fontSize: 15,
    color: '#94A3B8',
    lineHeight: 24,
    fontWeight: '500',
    marginBottom: 24,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
    gap: 8,
  },
  websiteButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 8,
  },
  copyright: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
  },
});
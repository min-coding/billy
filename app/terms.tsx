import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, FileText, Shield, Users, CreditCard, Bell, Smartphone, Globe, AlertTriangle, CheckCircle } from 'lucide-react-native';

export default function TermsScreen() {
  const router = useRouter();

  const sections = [
    {
      title: "Acceptance of Terms",
      icon: CheckCircle,
      content: [
        {
          subtitle: "Agreement to Terms",
          text: "By accessing and using Billy, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service."
        },
        {
          subtitle: "Modification of Terms",
          text: "We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the new Terms of Service in the app and updating the 'Last updated' date."
        }
      ]
    },
    {
      title: "Service Description",
      icon: FileText,
      content: [
        {
          subtitle: "What Billy Does",
          text: "Billy is a bill splitting application that allows users to create, manage, and split bills with friends, family, and colleagues. Our service includes bill creation, participant management, payment tracking, and communication tools."
        },
        {
          subtitle: "Service Availability",
          text: "We strive to provide reliable service but cannot guarantee uninterrupted access. We may temporarily suspend the service for maintenance, updates, or technical issues."
        }
      ]
    },
    {
      title: "User Accounts",
      icon: Users,
      content: [
        {
          subtitle: "Account Creation",
          text: "You must create an account to use Billy. You are responsible for providing accurate, current, and complete information during registration and keeping your account credentials secure."
        },
        {
          subtitle: "Account Security",
          text: "You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account."
        },
        {
          subtitle: "Account Termination",
          text: "You may terminate your account at any time through the app's profile settings. When you delete your account, all your data will be permanently removed and cannot be recovered. We may terminate or suspend your account if you violate these terms or for any other reason at our discretion."
        }
      ]
    },
    {
      title: "User Conduct",
      icon: Shield,
      content: [
        {
          subtitle: "Acceptable Use",
          text: "You agree to use Billy only for lawful purposes and in accordance with these Terms. You agree not to use the service to transmit harmful, offensive, or inappropriate content."
        },
        {
          subtitle: "Prohibited Activities",
          text: "You may not attempt to gain unauthorized access to any part of the service, interfere with or disrupt the service, or use the service for any commercial purpose without our written consent."
        }
      ]
    },
    {
      title: "Financial Transactions",
      icon: CreditCard,
      content: [
        {
          subtitle: "Payment Processing",
          text: "Billy facilitates bill splitting and payment tracking but does not process actual payments. All financial transactions between users are their responsibility. We are not liable for any payment disputes or financial losses."
        },
        {
          subtitle: "Bank Information",
          text: "When you provide bank account details, you authorize us to store this information securely for payment facilitation purposes only. We do not have access to your actual bank accounts or funds."
        }
      ]
    },
    {
      title: "Privacy and Data",
      icon: Bell,
      content: [
        {
          subtitle: "Data Collection",
          text: "We collect and process your data as described in our Privacy Policy. By using Billy, you consent to our data practices as outlined in that policy."
        },
        {
          subtitle: "Data Sharing",
          text: "We may share your information with other users as necessary for the service (e.g., sharing your name with bill participants) and as described in our Privacy Policy."
        }
      ]
    },
    {
      title: "Intellectual Property",
      icon: Smartphone,
      content: [
        {
          subtitle: "Our Rights",
          text: "Billy and its original content, features, and functionality are owned by us and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws."
        },
        {
          subtitle: "Your Content",
          text: "You retain ownership of content you submit to Billy. By submitting content, you grant us a license to use, store, and display that content as necessary to provide our service."
        }
      ]
    },
    {
      title: "Limitation of Liability",
      icon: AlertTriangle,
      content: [
        {
          subtitle: "Service Limitations",
          text: "Billy is provided 'as is' without warranties of any kind. We are not liable for any damages arising from your use of the service, including but not limited to financial losses or data breaches."
        },
        {
          subtitle: "Maximum Liability",
          text: "Our total liability to you for any claims arising from these terms or your use of Billy shall not exceed the amount you paid us, if any, in the 12 months preceding the claim."
        }
      ]
    },
    {
      title: "Governing Law",
      icon: Globe,
      content: [
        {
          subtitle: "Jurisdiction",
          text: "These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Billy operates, without regard to its conflict of law provisions."
        },
        {
          subtitle: "Dispute Resolution",
          text: "Any disputes arising from these Terms or your use of Billy shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association."
        }
      ]
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#F8FAFC" strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Terms of Service</Text>
          <Text style={styles.subtitle}>Our terms and conditions</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.introSection}>
          <Text style={styles.introText}>
            These Terms of Service govern your use of Billy and outline the rules and guidelines for using our bill splitting application. Please read them carefully before using our service.
          </Text>
          <Text style={styles.lastUpdated}>Last updated: January 2025</Text>
        </View>

        {sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <section.icon size={20} color="#3B82F6" strokeWidth={2} />
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            
            {section.content.map((item, itemIndex) => (
              <View key={itemIndex} style={styles.contentItem}>
                <Text style={styles.contentSubtitle}>{item.subtitle}</Text>
                <Text style={styles.contentText}>{item.text}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Contact Us</Text>
          <Text style={styles.contactText}>
            If you have any questions about these Terms of Service, please contact us at:
          </Text>
          <View style={styles.contactInfo}>
            <Text style={styles.contactDetail}>Email: nichapha.trai@gmail.com</Text>
          </View>
          <Text style={styles.relatedLinksText}>
            Related: <Text style={styles.linkText} onPress={() => router.push('/privacy')}>Privacy Policy</Text>
          </Text>
        </View>

        <View style={styles.changesSection}>
          <Text style={styles.changesTitle}>Changes to These Terms</Text>
          <Text style={styles.changesText}>
            We may update these Terms of Service from time to time. We will notify you of any material changes by posting the new Terms in the app and updating the "Last updated" date. Your continued use of Billy after such changes constitutes acceptance of the updated terms.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using Billy, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
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
  introSection: {
    backgroundColor: '#1E293B',
    padding: 20,
    marginBottom: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  introText: {
    fontSize: 16,
    color: '#CBD5E1',
    lineHeight: 24,
    fontWeight: '500',
    marginBottom: 16,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  section: {
    backgroundColor: '#1E293B',
    marginBottom: 12,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  contentItem: {
    marginBottom: 20,
  },
  contentSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  contentText: {
    fontSize: 15,
    color: '#94A3B8',
    lineHeight: 22,
    fontWeight: '500',
  },
  contactSection: {
    backgroundColor: '#1E293B',
    padding: 20,
    marginBottom: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  contactText: {
    fontSize: 15,
    color: '#94A3B8',
    lineHeight: 22,
    fontWeight: '500',
    marginBottom: 16,
  },
  contactInfo: {
    backgroundColor: '#0F172A',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  contactDetail: {
    fontSize: 14,
    color: '#CBD5E1',
    fontWeight: '500',
    marginBottom: 4,
  },
  changesSection: {
    backgroundColor: '#1E293B',
    padding: 20,
    marginBottom: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  changesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  changesText: {
    fontSize: 15,
    color: '#94A3B8',
    lineHeight: 22,
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  relatedLinksText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  linkText: {
    color: '#3B82F6',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});

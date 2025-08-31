import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Shield, Eye, Lock, Database, Bell, Users, CreditCard } from 'lucide-react-native';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  const sections = [
    {
      title: "Information We Collect",
      icon: Database,
      content: [
        {
          subtitle: "Account Information",
          text: "When you create an account, we collect your name, email address, username, and profile picture. This information is necessary to provide our bill splitting services and enable you to connect with friends."
        },
        {
          subtitle: "Bill and Transaction Data",
          text: "We collect information about the bills you create and participate in, including bill titles, descriptions, amounts, items, and payment details. This data is essential for our core bill splitting functionality."
        },
        {
          subtitle: "Usage Information",
          text: "We automatically collect information about how you use our app, including features accessed, time spent, and interaction patterns. This helps us improve our services and user experience."
        },
        {
          subtitle: "Device Information",
          text: "We may collect device identifiers, operating system information, and app version data to ensure compatibility and provide technical support."
        }
      ]
    },
    {
      title: "How We Use Your Information",
      icon: Eye,
      content: [
        {
          subtitle: "Service Provision",
          text: "We use your information to provide, maintain, and improve our bill splitting services, including creating bills, managing participants, and facilitating payments."
        },
        {
          subtitle: "Communication",
          text: "We use your contact information to send you important updates about your bills, payment notifications, and service announcements."
        },
        {
          subtitle: "Friend Connections",
          text: "We use your information to help you find and connect with friends on the platform, and to manage your social interactions within the app."
        },
        {
          subtitle: "Analytics and Improvement",
          text: "We analyze usage patterns to understand how our app is used and to identify areas for improvement and new features."
        }
      ]
    },
    {
      title: "Information Sharing",
      icon: Users,
      content: [
        {
          subtitle: "With Other Users",
          text: "When you participate in bills or add friends, certain information (name, profile picture, bill participation) is shared with other participants as necessary for the service."
        },
        {
          subtitle: "Service Providers",
          text: "We may share information with trusted third-party service providers who help us operate our app, such as cloud hosting, analytics, and customer support services."
        },
        {
          subtitle: "Legal Requirements",
          text: "We may disclose information if required by law, regulation, legal process, or governmental request, or to protect our rights, property, or safety."
        },
        {
          subtitle: "Business Transfers",
          text: "In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction."
        }
      ]
    },
    {
      title: "Data Security",
      icon: Lock,
      content: [
        {
          subtitle: "Encryption",
          text: "We use industry-standard encryption to protect your data both in transit and at rest. All communications between your device and our servers are encrypted using TLS."
        },
        {
          subtitle: "Access Controls",
          text: "We implement strict access controls to ensure that only authorized personnel can access your personal information, and only when necessary for service provision."
        },
        {
          subtitle: "Regular Security Audits",
          text: "We regularly review and update our security practices to protect against unauthorized access, alteration, disclosure, or destruction of your information."
        },
        {
          subtitle: "Incident Response",
          text: "We have procedures in place to detect, respond to, and notify users of any security incidents that may affect their personal information."
        }
      ]
    },
    {
      title: "Your Rights and Choices",
      icon: Shield,
      content: [
        {
          subtitle: "Account Management",
          text: "You can update your account information, profile details, and privacy settings at any time through the app's settings menu."
        },
        {
          subtitle: "Data Access and Portability",
          text: "You have the right to request a copy of your personal information and to receive it in a structured, machine-readable format."
        },
        {
          subtitle: "Data Deletion",
          text: "You can delete your account and associated data at any time through the app's profile settings. When you delete your account, all your data including bills, friends, chat messages, and notifications will be permanently removed. This action cannot be undone."
        },
        {
          subtitle: "Communication Preferences",
          text: "You can control notification settings and opt out of non-essential communications through your account settings."
        }
      ]
    },
    {
      title: "Push Notifications",
      icon: Bell,
      content: [
        {
          subtitle: "Notification Types",
          text: "We send push notifications for bill updates, payment reminders, friend requests, and other important account activities. These help you stay informed about your shared expenses."
        },
        {
          subtitle: "Managing Notifications",
          text: "You can control which notifications you receive through your device settings or the app's notification preferences. You can disable notifications at any time."
        },
        {
          subtitle: "Notification Data",
          text: "We store notification preferences and delivery information to ensure reliable service and respect your communication choices."
        }
      ]
    },
    {
      title: "Payment Information",
      icon: CreditCard,
      content: [
        {
          subtitle: "Payment Processing",
          text: "We do not store your payment card information. All payment processing is handled by secure, PCI-compliant third-party payment processors."
        },
        {
          subtitle: "Transaction Records",
          text: "We maintain records of bill payments and settlements for accounting purposes and to provide you with transaction history."
        },
        {
          subtitle: "Bank Account Information",
          text: "When you provide bank account details for receiving payments, this information is encrypted and stored securely. We only use this information to facilitate payments."
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
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.subtitle}>How we protect and use your data</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.introSection}>
          <Text style={styles.introText}>
            At Billy, we take your privacy seriously. This Privacy Policy explains how we collect, use, 
            protect, and share your personal information when you use our bill splitting application.
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
            If you have any questions about this Privacy Policy or our data practices, 
            please contact us at:
          </Text>
          <View style={styles.contactInfo}>
            <Text style={styles.contactDetail}>Email: nichapha.trai@gmail.com</Text>
          </View>
          <Text style={styles.relatedLinksText}>
            Related: <Text style={styles.linkText} onPress={() => router.push('/terms')}>Terms of Service</Text>
          </Text>
        </View>

        <View style={styles.changesSection}>
          <Text style={styles.changesTitle}>Changes to This Policy</Text>
          <Text style={styles.changesText}>
            We may update this Privacy Policy from time to time. We will notify you of any 
            material changes by posting the new Privacy Policy in the app and updating the 
            "Last updated" date. Your continued use of the app after such changes constitutes 
            acceptance of the updated policy.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using Billy, you acknowledge that you have read and understood this Privacy Policy.
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
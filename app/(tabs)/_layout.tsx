import { Tabs } from 'expo-router';
import { Receipt, User, Users} from 'lucide-react-native';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#F59E0B',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#0F172A',
          borderTopWidth: 0,
          paddingBottom: 12,
          paddingTop: 12,
          height: 95,
          shadowColor: '#000000',
          shadowOffset: {
            width: 0,
            height: -4,
          },
          shadowOpacity: 0.3,
          shadowRadius: 16,
          elevation: 16,
        },
        tabBarBackground: () => (
          <LinearGradient
            colors={['#0F172A', '#1E293B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        ),
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 0.5,
          marginTop: 12,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Bills',
          tabBarIcon: ({ size, color, focused }) => (
            <View style={styles.tabIconContainer}>
              {focused ? (
                <LinearGradient
                  colors={['#F59E0B', '#EAB308']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.activeIconBackground}
                >
                  <Receipt size={22} color="#FFFFFF" strokeWidth={2} />
                </LinearGradient>
              ) : (
                <Receipt size={size} color={color} strokeWidth={2} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'Friends',
          tabBarIcon: ({ size, color, focused }) => (
            <View style={styles.tabIconContainer}>
              {focused ? (
                <LinearGradient
                  colors={['#F59E0B', '#EAB308']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.activeIconBackground}
                >
                  <Users size={22} color="#FFFFFF" strokeWidth={2} />
                </LinearGradient>
              ) : (
                <Users size={size} color={color} strokeWidth={2} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color, focused }) => (
            <View style={styles.tabIconContainer}>
              {focused ? (
                <LinearGradient
                  colors={['#F59E0B', '#EAB308']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.activeIconBackground}
                >
                  <User size={22} color="#FFFFFF" strokeWidth={2} />
                </LinearGradient>
              ) : (
                <User size={size} color={color} strokeWidth={2} />
              )}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  activeIconBackground: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0F172A',
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
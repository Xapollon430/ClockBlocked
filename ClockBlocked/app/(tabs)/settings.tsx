import { Switch, View, Text } from 'react-native';

export default function SettingsScreen() {
  return (
    <View style={{ padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>Settings</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ flex: 1 }}>Enable Notifications</Text>
        <Switch value={true} onValueChange={() => {}} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ flex: 1 }}>Dark Mode</Text>
        <Switch value={false} onValueChange={() => {}} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ flex: 1 }}>Snooze Duration</Text>
        <Text>10 min</Text>
      </View>
    </View>
  );
}

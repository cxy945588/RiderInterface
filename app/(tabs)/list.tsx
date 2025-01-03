import { View, Text, FlatList,StyleSheet, Button,Image, Platform, SafeAreaView  } from 'react-native';
import { Card, Divider, List, Paragraph, TextInput, Title } from 'react-native-paper';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface Location {
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

interface Order {
  id: string;
  restaurant: Location;
  customer: Location;
  items: string[];
  total: number;
  status: 'pending' | 'accepted' | 'pickedUp' | 'delivered';
}

interface CompletedOrder extends Order {
completedAt: Date;
}

const mockCompletedOrders: CompletedOrder[] = [
{
  id: '1',
  restaurant: {
    name: '甜點天堂',
    address: '台北市大安區忠孝東路四段100號',
    coordinates: { latitude: 25.041171, longitude: 121.550690 }
  },
  customer: {
    name: '張小明',
    address: '台北市大安區信義路四段30號',
    coordinates: { latitude: 25.033671, longitude: 121.543590 }
  },
  items: ['蘋果派', '藍莓慕斯'],
  total: 140,
  status: 'delivered',
  completedAt: new Date(2023, 4, 15, 14, 30) // 2023年5月15日 14:30
},
// 可以添加更多模擬的已完成訂單
];

export default function TabThreeScreen() {
  const renderOrderItem = ({ item }: { item: CompletedOrder }) => (
    <Card style={styles.orderCard}>
      <Card.Content>
        <Title>{item.restaurant.name}</Title>
        <Paragraph>送餐地址: {item.customer.address}</Paragraph>
        <Paragraph>顧客: {item.customer.name}</Paragraph>
        <Paragraph>商品: {item.items.join(', ')}</Paragraph>
        <Paragraph>訂單金額: ${item.total}</Paragraph>
        <Paragraph>完成時間: {item.completedAt.toLocaleString()}</Paragraph>
      </Card.Content>
    </Card>
  );

  
  return (
    <SafeAreaView style={styles.container}>
      <List.Section>
        <List.Subheader>已完成訂單</List.Subheader>
        <FlatList
          data={mockCompletedOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <Divider />}
        />
      </List.Section>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
  },
  
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  orderCard: {
    margin: 8,
  },
});

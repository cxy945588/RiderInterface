import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert, Image } from 'react-native';
import { 
  Provider as PaperProvider,
  Card, Title, Paragraph, Button, FAB, Text, 
  Appbar, Avatar, Divider, List, Switch, Portal, Modal,
  DefaultTheme
} from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

import MapView, { Marker, Region } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';

const DEFAULT_LATITUDE = 25.033671;  // 台北市的大致緯度
const DEFAULT_LONGITUDE = 121.564590;  // 台北市的大致經度

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1976D2',
    accent: '#FF4081',
  },
};

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

const mockOrders: Order[] = [
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
    status: 'pending'
  },
  // 可以在這裡添加更多模擬訂單
];

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <DeliveryHomeScreen />
      </SafeAreaProvider>
    </PaperProvider>
  );
}

function DeliveryHomeScreen() {
  const [isOnline, setIsOnline] = useState(true);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [earnings, setEarnings] = useState(0);
  const [deliveryPhoto, setDeliveryPhoto] = useState<string | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [mapError, setMapError] = useState(null);


  useEffect(() => {
    setAvailableOrders(mockOrders.filter(order => order.status === 'pending'));
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const acceptOrder = (order: Order) => {
    setCurrentOrder(order);
    setAvailableOrders(availableOrders.filter(o => o.id !== order.id));
  };

  const completeOrder = async () => {
    if (currentOrder) {
      if (!deliveryPhoto) {
        Alert.alert("錯誤", "請先拍攝送達照片");
        return;
      }
      setEarnings(earnings + currentOrder.total * 0.1);
      setCurrentOrder(null);
      setDeliveryPhoto(null);
      Alert.alert("成功", "訂單已完成");
    }
  };

  const generateFakeOrder = () => {
    if (mockOrders.length === 0) {
      Alert.alert("錯誤", "沒有可用的訂單模板");
      return;
    }
    const randomOrder = {...mockOrders[Math.floor(Math.random() * mockOrders.length)]};
    
    randomOrder.id = Date.now().toString();
    
    if (randomOrder.restaurant && randomOrder.restaurant.coordinates) {
      randomOrder.restaurant.coordinates = {
        latitude: randomOrder.restaurant.coordinates.latitude + (Math.random() - 0.5) * 0.002,
        longitude: randomOrder.restaurant.coordinates.longitude + (Math.random() - 0.5) * 0.002
      };
    }
    if (randomOrder.customer && randomOrder.customer.coordinates) {
      randomOrder.customer.coordinates = {
        latitude: randomOrder.customer.coordinates.latitude + (Math.random() - 0.5) * 0.002,
        longitude: randomOrder.customer.coordinates.longitude + (Math.random() - 0.5) * 0.002
      };
    }

    setAvailableOrders(prevOrders => [randomOrder, ...prevOrders]);
    Alert.alert("新訂單", `來自${randomOrder.restaurant?.name || '未知餐廳'}的新訂單已加入列表！`);
  };

  const takeDeliveryPhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("錯誤", "需要相機權限才能拍照");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const photoUri = result.assets[0].uri;
      if (photoUri) {
        setDeliveryPhoto(photoUri);
        setShowPhotoModal(true);
      } else {
        Alert.alert("錯誤", "無法獲取照片");
      }
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <Card style={styles.orderCard}>
      <Card.Content>
        <Title>{item.restaurant?.name || '未知餐廳'}</Title>
        <Paragraph>取餐地址: {item.restaurant?.address || '地址未提供'}</Paragraph>
        <Paragraph>送餐地址: {item.customer?.address || '地址未提供'}</Paragraph>
        <Paragraph>顧客: {item.customer?.name || '未知顧客'}</Paragraph>
        <Paragraph>商品: {item.items?.join(', ') || '無商品信息'}</Paragraph>
        <Paragraph>訂單金額: ${item.total || 0}</Paragraph>
      </Card.Content>
      <Card.Actions>
        <Button mode="contained" onPress={() => acceptOrder(item)}>
          接受訂單
        </Button>
      </Card.Actions>
    </Card>
  );

  const calculateInitialRegion = (order: Order): Region => {
    const restaurantLat = order.restaurant?.coordinates?.latitude;
    const restaurantLong = order.restaurant?.coordinates?.longitude;
    const customerLat = order.customer?.coordinates?.latitude;
    const customerLong = order.customer?.coordinates?.longitude;

    if (restaurantLat && restaurantLong && customerLat && customerLong) {
      return {
        latitude: (restaurantLat + customerLat) / 2,
        longitude: (restaurantLong + customerLong) / 2,
        latitudeDelta: Math.abs(restaurantLat - customerLat) * 1.5,
        longitudeDelta: Math.abs(restaurantLong - customerLong) * 1.5,
      };
    } else if (restaurantLat && restaurantLong) {
      return {
        latitude: restaurantLat,
        longitude: restaurantLong,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    } else if (customerLat && customerLong) {
      return {
        latitude: customerLat,
        longitude: customerLong,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    } else {
      return {
        latitude: DEFAULT_LATITUDE,
        longitude: DEFAULT_LONGITUDE,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
    }
  };

  return (
    <View style={styles.container}>
    <StatusBar style="dark" />
    <LinearGradient
      colors={['#f0f0f0', '#FFFFFF', '#FFFFFF', '#FFFFFF']}
      style={StyleSheet.absoluteFillObject}
    />
<SafeAreaView style={styles.safeArea} edges={['right', 'bottom', 'left']}>


      <Appbar.Header style={styles.appbar}>
        <Appbar.Content title="BaoDao Food Rider" />
        <Switch value={isOnline} onValueChange={setIsOnline} />
        <Appbar.Action icon="account" onPress={() => {}} />
      </Appbar.Header>

      <View style={styles.content}>
        {currentOrder ? (
          <View style={styles.currentOrderContainer}>
            
            <MapView
              style={styles.map}
              initialRegion={calculateInitialRegion(currentOrder)}
            >
              {currentOrder.restaurant?.coordinates && (
                <Marker
                  coordinate={currentOrder.restaurant.coordinates}
                  title={currentOrder.restaurant.name || '取餐地點'}
                  description="取餐地點"
                  pinColor="blue"
                />
              )}
              {currentOrder.customer?.coordinates && (
                <Marker
                  coordinate={currentOrder.customer.coordinates}
                  title={currentOrder.customer.name || '送餐地點'}
                  description="送餐地點"
                  pinColor="red"
                />
              )}
            </MapView>
            <Card style={styles.currentOrderCard}>
              <Card.Content>
                <Title>當前訂單: {currentOrder.restaurant?.name || '未知餐廳'}</Title>
                <Paragraph>取餐地址: {currentOrder.restaurant?.address || '地址未提供'}</Paragraph>
                <Paragraph>送餐地址: {currentOrder.customer?.address || '地址未提供'}</Paragraph>
                <Paragraph>顧客: {currentOrder.customer?.name || '未知顧客'}</Paragraph>
                <Paragraph>商品: {currentOrder.items?.join(', ') || '無商品信息'}</Paragraph>
                <Paragraph>訂單金額: ${currentOrder.total || 0}</Paragraph>
              </Card.Content>
              <Card.Actions>
                <Button mode="outlined" onPress={takeDeliveryPhoto} style={styles.photoButton}>
                  拍攝送達照片
                </Button>
                <Button mode="contained" onPress={completeOrder} disabled={!deliveryPhoto}>
                  完成訂單
                </Button>
              </Card.Actions>
            </Card>
          </View>
        ) : (
          <FlatList
            data={availableOrders}
            renderItem={renderOrderItem}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListHeaderComponent={
              <View style={styles.statsContainer}>
                <List.Item
                  title="今日收入"
                  description={`$${earnings.toFixed(2)}`}
                  left={props => <List.Icon {...props} icon="cash" />}
                />
                <Divider />
                <List.Item
                  title="已完成訂單"
                  description={`${Math.floor(earnings / 10)}`}
                  left={props => <List.Icon {...props} icon="check-circle" />}
                />
                <Divider />
              </View>
            }
          />
        )}
      </View>

      <FAB
        style={styles.fab}
        icon={"play"}
        onPress={generateFakeOrder}
        label={""}
      />

      <Portal>
        <Modal visible={showPhotoModal} onDismiss={() => setShowPhotoModal(false)} contentContainerStyle={styles.modalContainer}>
          {deliveryPhoto ? (
            <Image source={{ uri: deliveryPhoto }} style={styles.modalImage} />
          ) : (
            <Text>沒有可用的照片</Text>
          )}
          <Button mode="contained" onPress={() => setShowPhotoModal(false)} style={styles.modalButton}>
            確認照片
          </Button>
        </Modal>
      </Portal>
    </SafeAreaView>
    </View>

  );
}

const styles = StyleSheet.create({
  appbar:{
    

  },
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    backgroundColor: 'white',
    marginBottom: 10,
    padding: 10,
  },
  currentOrderContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  currentOrderCard: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
  },
  orderCard: {
    margin: 10,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    left: 0,
    bottom: -20,
  },
  photoButton: {
    marginRight: 8,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  modalImage: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  modalButton: {
    marginTop: 10,
  },
});
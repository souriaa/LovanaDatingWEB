import { openSettings } from "expo-linking";
import * as Location from "expo-location";
import { FC, useEffect, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { LocationData } from "../types/location";

interface Props {
  location: LocationData;
  onLocationChange: (location: LocationData | null) => void;
}

export const LocationView: FC<Props> = ({ location, onLocationChange }) => {
  const [neighborhood, setNeighborhood] = useState(
    location?.neighborhood ?? ""
  );

  useEffect(() => {
    if (location?.latitude && location?.longitude && location?.neighborhood) {
      setNeighborhood(location.neighborhood);
    }
  }, [location]);

  const getPermissions = async () => {
    const { status: existingStatus } =
      await Location.getForegroundPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Location.requestForegroundPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      Alert.alert(
        "Allow Location Access",
        "Please enable Location Services so we can introduce you to new people near you.",
        [{ text: "Cancel" }, { text: "Settings", onPress: openSettings }]
      );
      return;
    }
  };

  const updateCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Please allow location access to detect your current position."
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = position.coords;

      const geocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      const address = geocode[0];
      let neighborhoodName =
        address.city || address.subregion || address.region || "Unknown";

      setNeighborhood(neighborhoodName);
      onLocationChange({ latitude, longitude, neighborhood: neighborhoodName });
    } catch (error: any) {
      Alert.alert("Error", "Unable to fetch location. Please try again later.");
    }
  };

  return (
    <View className="w-full h-3/5 justify-center items-center">
      <TouchableOpacity
        onPress={updateCurrentLocation}
        className="bg-blue-500 px-4 py-2 rounded-lg mb-4"
      >
        <Text className="text-white font-poppins-regular text-base">
          Detect My Location
        </Text>
      </TouchableOpacity>

      <View className="bg-black py-2 px-4 rounded-md">
        <Text className="text-white text-base font-poppins-regular">
          {neighborhood || "No location detected"}
        </Text>
      </View>
    </View>
  );
};

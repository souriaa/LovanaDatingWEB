import { openSettings } from "expo-linking";
import * as Location from "expo-location";
import { FC, useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { LocationData } from "../types/location";
import { useAlert } from "./alert-provider";

interface Props {
  location: LocationData;
  onLocationChange: (location: LocationData | null) => void;
}

export const LocationView: FC<Props> = ({ location, onLocationChange }) => {
  const [neighborhood, setNeighborhood] = useState(
    location?.neighborhood ?? ""
  );

  const { showAlert } = useAlert();

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
      showAlert({
        title: "Allow Location Access",
        message:
          "Please enable Location Services so we can introduce you to new people near you.",
        buttons: [
          { text: "Cancel", style: "cancel" },
          { text: "Settings", onPress: openSettings },
        ],
      });
      return;
    }
  };

  const updateCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showAlert({
          title: "Permission denied",
          message:
            "Please allow location access to detect your current position.",
          buttons: [{ text: "OK", style: "cancel" }],
        });
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
      showAlert({
        title: "Error",
        message: "Unable to fetch location. Please try again later.",
        buttons: [{ text: "OK", style: "cancel" }],
      });
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

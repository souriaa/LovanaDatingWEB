import { Ionicons } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { FC, useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import {
  Dimensions,
  Modal,
  Platform,
  TouchableOpacity,
  View,
} from "react-native";
import { DraggableGrid } from "react-native-draggable-grid";
import { theme } from "~/constants/theme";
import { Photo, PrivateProfile } from "../api/my-profile/types";
import { useAlert } from "../components/alert-provider";
import { supabase } from "../lib/supabase";
import { useEdit } from "../store/edit";
import { getCroppedImg } from "../utils/cropUtils";
import { StackBottom } from "./stack-bottom";

type Item = {
  key: string;
  photo: Photo;
  disabledDrag?: boolean;
  disabledReSorted?: boolean;
};

interface Props {
  profile: PrivateProfile;
  margin?: number;
  columns?: number;
  spacing?: number;
  slots?: number;
  containerWidth?: number;
}

export const PhotoGrid: FC<Props> = ({
  profile,
  margin = 10,
  columns = 3,
  spacing = 10,
  slots = 6,
  containerWidth,
}) => {
  const actualContainerWidth =
    containerWidth ?? Dimensions.get("window").width * 0.66 - margin * 2;

  const itemSize = (actualContainerWidth - (columns - 1) * spacing) / columns;

  const [data, setData] = useState<Item[]>([]);
  const { setEdits, setGridActive } = useEdit();
  const { showAlert } = useAlert();

  // Web crop modal states
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const rows = Math.ceil(data.filter((d) => d.photo).length / columns) || 1;
  const totalRows = Math.ceil(slots / columns);
  const containerHeight = Math.max(
    rows * itemSize + (rows - 1) * spacing,
    totalRows * itemSize + (totalRows - 1) * spacing
  );

  useEffect(() => {
    const initialData: Item[] = Array(slots)
      .fill(null)
      .map((_, index) => {
        const photo = profile?.photos?.[index] || null;
        return {
          key: index.toString(),
          photo,
          disabledDrag: photo === null,
          disabledReSorted: photo === null,
        };
      });
    setData(initialData);
  }, []);

  const deletePhoto = async (item: Item) => {
    if (!item.photo?.id) return;

    const remainingPhotos = data.filter((d) => d.photo?.photo_url);

    if (remainingPhotos.length <= 1) {
      showAlert({
        title: "Cannot Delete",
        message: "You must keep at least one photo in your profile.",
        buttons: [{ text: "OK" }],
      });
      return;
    }

    showAlert({
      title: "Delete Photo",
      message: "Are you sure you want to delete this photo?",
      buttons: [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {},
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (item.photo.id.startsWith("temp_")) {
                const updatedData = data.map((d) =>
                  d.key === item.key
                    ? {
                        ...d,
                        photo: null,
                        disabledDrag: true,
                        disabledReSorted: true,
                      }
                    : d
                );

                const updatedPhotos = updatedData
                  .map(
                    (d, index) => ({ ...d.photo, photo_order: index }) as Photo
                  )
                  .filter((d) => d?.photo_url);

                setData(updatedData);
                setEdits({ ...profile, photos: updatedPhotos });
                return;
              }

              // Delete from Supabase
              const { error } = await supabase
                .from("profile_photos")
                .delete()
                .eq("id", item.photo!.id);
              if (error) throw error;

              // Delete file from storage
              const filePath = `${profile.id}/photos/${item.photo.photo_url.split("/").pop()}`;
              await supabase.storage.from("profiles").remove([filePath]);

              // Update local state
              const updatedData = data.map((d) =>
                d.key === item.key
                  ? {
                      ...d,
                      photo: null,
                      disabledDrag: true,
                      disabledReSorted: true,
                    }
                  : d
              );

              const updatedPhotos = updatedData
                .map(
                  (d, index) => ({ ...d.photo, photo_order: index }) as Photo
                )
                .filter((d) => d?.photo_url);

              setData(updatedData);
              setEdits({ ...profile, photos: updatedPhotos });
            } catch (err) {
              console.error("Failed to delete photo:", err);
              showAlert({
                title: "Error",
                message: "Failed to delete photo. Please try again.",
                buttons: [{ text: "OK" }],
              });
            }
          },
        },
      ],
    });
  };

  const rendertem = (item: Item) => {
    return (
      <View
        key={item.key}
        style={{
          height: itemSize,
          width: itemSize,
          position: "relative",
          padding: 10,
        }}
      >
        {item.photo?.photo_url ? (
          <View className="flex-1 rounded-md overflow-hidden">
            <Image
              source={item.photo.photo_url}
              className="flex-1 bg-neutral-200"
            />
            <TouchableOpacity
              onPress={() => deletePhoto(item)}
              style={{
                position: "absolute",
                top: 4,
                right: 4,
                backgroundColor: "rgba(0,0,0,0.5)",
                borderRadius: 12,
                width: 24,
                height: 24,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="close" size={16} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={pickPhoto}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: theme.colors.primaryDark,
              borderStyle: "dashed",
              borderRadius: 8,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="add" size={32} color={theme.colors.primaryDark} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const onDragRelease = (data: Item[]) => {
    const photos = data
      .map((item, index) => ({ ...item.photo, photo_order: index }))
      .filter((item) => item.photo_order !== undefined);
    setData(data);
    setEdits({ ...profile, photos });
    setGridActive(false);
  };

  const onDragItemActive = () => {
    setGridActive(true);
  };

  const onItemPress = (item: Item) => {
    if (!item.photo) pickPhoto();
  };

  const pickPhoto = async () => {
    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setCropImage(url);
        setCropModalVisible(true);
      };
      input.click();
    } else {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        allowsMultipleSelection: true,
        selectionLimit: slots - data.filter((item) => item.photo).length,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        const updatedData = data.map((item, index) => {
          if (!item.photo && result.assets?.length) {
            const currentAsset = result.assets.shift();
            if (currentAsset) {
              return {
                ...item,
                photo: {
                  id: "temp_" + Crypto.randomUUID(),
                  photo_url: currentAsset.uri,
                  photo_order: index,
                },
                disabledDrag: false,
                disabledReSorted: false,
              };
            }
          }
          return item;
        });

        const updatedPhotos = updatedData
          .map(
            (item, index) => ({ ...item?.photo, photo_order: index }) as Photo
          )
          .filter((item) => item.photo_url);

        setData(updatedData as Item[]);
        setEdits({ ...profile, photos: updatedPhotos });
      }
    }
  };

  const handleCropSave = async () => {
    if (cropImage && croppedAreaPixels) {
      const croppedUri = await getCroppedImg(cropImage, croppedAreaPixels);

      const emptyIndex = data.findIndex((item) => !item.photo);
      if (emptyIndex === -1) return;

      const updatedData = [...data];
      updatedData[emptyIndex] = {
        ...updatedData[emptyIndex],
        photo: {
          id: "temp_" + Crypto.randomUUID(),
          photo_url: croppedUri,
          photo_order: emptyIndex,
        },
        disabledDrag: false,
        disabledReSorted: false,
      };

      const updatedPhotos = updatedData
        .map((item, index) => ({ ...item?.photo, photo_order: index }) as Photo)
        .filter((item) => item.photo_url);

      setData(updatedData);
      setEdits({ ...profile, photos: updatedPhotos });

      setCropModalVisible(false);
      setCropImage(null);
      setCroppedAreaPixels(null);
    }
  };

  return (
    <View style={{ height: containerHeight }}>
      <DraggableGrid
        numColumns={3}
        renderItem={rendertem}
        data={data}
        onDragRelease={onDragRelease}
        onDragItemActive={onDragItemActive}
        onItemPress={onItemPress}
      />

      {cropModalVisible && cropImage && Platform.OS === "web" && (
        <Modal visible={cropModalVisible} transparent animationType="fade">
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.8)",
              justifyContent: "center",
              alignItems: "center",
            }}
            onClick={(e: any) => {
              if (e.target === e.currentTarget) {
                setCropModalVisible(false);
              }
            }}
          >
            <View
              style={{
                position: "relative",
                width: "80vw",
                height: "80vh",
                background: "#fff",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={3 / 4}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, croppedAreaPixels) =>
                  setCroppedAreaPixels(croppedAreaPixels)
                }
              />
              <StackBottom
                visible={true}
                title="Edit Info"
                onPressSave={handleCropSave}
                onPressCancel={() => setCropModalVisible(false)}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

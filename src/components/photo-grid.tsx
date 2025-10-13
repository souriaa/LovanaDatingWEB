import { Ionicons } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { FC, useEffect, useState } from "react";
import { Alert, Dimensions, TouchableOpacity, View } from "react-native";
import { DraggableGrid } from "react-native-draggable-grid";
import { Photo, PrivateProfile } from "../api/my-profile/types";
import { supabase } from "../lib/supabase";
import { useEdit } from "../store/edit";

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
}

export const PhotoGrid: FC<Props> = ({
  profile,
  margin = 10,
  columns = 3,
  spacing = 10,
  slots = 6,
}) => {
  const containerWidth = Dimensions.get("window").width - margin * 2;
  const itemSize = containerWidth / columns - spacing;

  const [data, setData] = useState<Item[]>([]);
  const { setEdits, setGridActive } = useEdit();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deletePhoto = async (item: Item) => {
    if (!item.photo?.id) return;

    const remainingPhotos = data.filter((d) => d.photo?.photo_url);
    if (remainingPhotos.length <= 1) {
      Alert.alert(
        "Cannot Delete",
        "You must keep at least one photo in your profile."
      );
      return;
    }

    Alert.alert("Delete Photo", "Are you sure you want to delete this photo?", [
      { text: "Cancel", style: "cancel" },
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
              setEdits({
                ...profile,
                photos: updatedPhotos,
              });
              return;
            }
            const { error } = await supabase
              .from("profile_photos")
              .delete()
              .eq("id", item.photo!.id);

            if (error) throw error;

            const filePath = `${profile.id}/photos/${item.photo.photo_url.split("/").pop()}`;
            await supabase.storage.from("profiles").remove([filePath]);

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
              .map((d, index) => ({ ...d.photo, photo_order: index }) as Photo)
              .filter((d) => d?.photo_url);

            setData(updatedData);
            setEdits({
              ...profile,
              photos: updatedPhotos,
            });
          } catch (err) {
            console.error("Failed to delete photo:", err);
            Alert.alert("Error", "Failed to delete photo. Please try again.");
          }
        },
      },
    ]);
  };

  const rendertem = (item: Item) => {
    return (
      <View
        key={item.key}
        style={{
          height: itemSize,
          width: itemSize,
          position: "relative",
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
          <View className="flex-1 border border-red-600 border-dashed rounded-md" />
        )}
      </View>
    );
  };

  const onDragRelease = (data: Item[]) => {
    const photos = data
      .map((item, index) => {
        return {
          ...item.photo,
          photo_order: index,
        };
      })
      .filter((item) => item.photo_order !== undefined);
    setData(data);
    setEdits({
      ...profile,
      photos,
    });
    setGridActive(false);
  };

  const onDragItemActive = () => {
    setGridActive(true);
  };

  const onItemPress = (item: Item) => {
    if (!item.photo) {
      pickPhoto();
    }
    // else {
    //   replacePhoto(item);
    // }
  };

  const pickPhoto = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
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
        .map((item, index) => {
          return {
            ...item?.photo,
            photo_order: index,
          } as Photo;
        })
        .filter((item) => item.photo_url);

      setData(updatedData as Item[]);
      setEdits({
        ...profile,
        photos: updatedPhotos,
      });
    }
  };

  const replacePhoto = async (item: Item) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const updatedData = data.map((i, index) => {
        if (item.key === i.key && result.assets?.length) {
          const currentAsset = result.assets.shift();

          if (currentAsset) {
            return {
              ...i,
              photo: {
                ...i.photo,
                photo_url: currentAsset.uri,
              },
              disabledDrag: false,
              disabledReSorted: false,
            };
          }
        }
        return i;
      });

      const updatedPhotos = updatedData
        .map((item, index) => {
          return {
            ...item?.photo,
            photo_order: index,
          } as Photo;
        })
        .filter((item) => item.photo_url);

      setData(updatedData as Item[]);
      setEdits({
        ...profile,
        photos: updatedPhotos,
      });
    }
  };

  return (
    <View
      style={{
        width: containerWidth,
        alignSelf: "center",
      }}
    >
      <DraggableGrid
        numColumns={3}
        renderItem={rendertem}
        data={data}
        onDragRelease={onDragRelease}
        onDragItemActive={onDragItemActive}
        onItemPress={onItemPress}
      />
    </View>
  );
};

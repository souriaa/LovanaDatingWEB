import { Image } from "expo-image";
import { FC, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Photo } from "../types/profile";

interface Props {
  photo: Photo;
}

export const ProfilePhoto: FC<Props> = ({ photo }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handlePress = () => {
    setModalVisible(true);
  };

  const handleClose = () => {
    setModalVisible(false);
  };

  return (
    <>
      <Pressable onPress={handlePress}>
        <View style={styles.container}>
          <Image source={photo.photo_url} style={styles.image} />
        </View>
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleClose}
      >
        <Pressable style={styles.modalOverlay} onPress={handleClose}>
          <Image
            source={photo.photo_url}
            style={styles.modalImage}
            contentFit="contain"
          />
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#E5E5E5",
  },
  image: {
    flex: 1,
    width: "100%",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: "90%",
    height: "90%",
  },
});

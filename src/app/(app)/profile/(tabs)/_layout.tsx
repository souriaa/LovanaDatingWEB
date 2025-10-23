import { StackBottom } from "@/components/stack-bottom";
import { router, Stack } from "expo-router";
import { isEqual } from "lodash";
import colors from "tailwindcss/colors";
import { theme } from "../../../../../constants/theme";
import { useMyProfile, useUpdateProfile } from "../../../../api/my-profile";
import { useAlert } from "../../../../components/alert-provider";
import { MaterialTopTabs } from "../../../../layouts/material-top-tabs";
import { useEdit } from "../../../../store/edit";

export default function Layout() {
  const { data: profile } = useMyProfile();
  const { edits, setEdits, gridActive } = useEdit();
  const { mutate } = useUpdateProfile();

  const { showAlert } = useAlert();

  const handlePressCancel = async () => {
    if (isEqual(profile, edits)) {
      router.push("/lovana");
      return;
    }

    showAlert({
      title: "Discard Changes",
      message: "Are you sure you want to discard your changes?",
      buttons: [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            setEdits(profile);
            router.dismiss();
          },
        },
      ],
    });
  };

  const handlePressDone = async () => {
    if (!edits) {
      showAlert({
        title: "Error",
        message: "Something went wrong, please try again later",
        buttons: [{ text: "OK", style: "cancel" }],
      });
      return;
    }

    if (isEqual(profile, edits)) {
      router.push("/lovana");
      return;
    }

    mutate(edits, {
      onSuccess: () => {
        router.dismiss();
      },
      onError: () => {
        showAlert({
          title: "Error",
          message: "Something went wrong, please try again later",
          buttons: [{ text: "OK", style: "cancel" }],
        });
      },
    });
  };
  return (
    <>
      <MaterialTopTabs
        screenOptions={{
          tabBarIndicatorStyle: {
            backgroundColor: theme.colors.primaryDark,
          },
          tabBarLabelStyle: {
            textTransform: "capitalize",
            fontWeight: "bold",
            fontSize: 13,
          },
          tabBarActiveTintColor: theme.colors.primaryDark,
          tabBarInactiveTintColor: colors.neutral[300],
          swipeEnabled: !gridActive,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "Edit",
          }}
        />
        <Stack.Screen
          name="view"
          options={{
            title: "View",
          }}
        />
      </MaterialTopTabs>
      <StackBottom
        visible={true}
        title="Edit Info"
        onPressCancel={handlePressCancel}
        onPressSave={handlePressDone}
      />
    </>
  );
}

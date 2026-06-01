import { StyleSheet } from "react-native";

export const commonStyles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F5ECE1",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1E1E1E",
    flex: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 12,
    paddingVertical: 4,
    paddingRight: 4,
  },
});

import styled from "renderer/styles";
import Label from "renderer/pages/PreferencesPage/Label";

export const SettingsGroup = styled.div.withConfig({
  displayName: "Preferences-SettingsGroup",
})`
  display: flex;
  flex-direction: column;
`;

export const SettingsGroupRow = styled(Label).withConfig({
  displayName: "Preferences-SettingsGroupRow",
})``;

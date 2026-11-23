import { actions } from "common/actions";
import urls from "common/constants/urls";
import React from "react";
import Icon from "renderer/basics/Icon";
import SimpleSelect, { BaseOptionType } from "renderer/basics/SimpleSelect";
import { useAppDispatch, useAppSelector } from "renderer/hooks/redux";
import {
  SettingsGroup,
  SettingsGroupRow,
} from "renderer/pages/PreferencesPage/SettingsGroup";
import styled from "renderer/styles";
import { T } from "renderer/t";

const Spacer = styled.div`
  width: 8px;
  height: 2px;
`;

const LanguageSelect = styled(SimpleSelect)`
  flex-grow: 0;
  flex-basis: 300px;
`;

const LanguageSettings = () => {
  const dispatch = useAppDispatch();
  const locales = useAppSelector((rs) => rs.i18n.locales);
  const lang = useAppSelector((rs) => rs.i18n.lang);
  const sniffedLang = useAppSelector((rs) => rs.system.sniffedLanguage);

  const autoLang: BaseOptionType = {
    // "en" is the app-wide fallback, see main/reactors/i18n.ts
    label: ["preferences.language.auto", { language: sniffedLang || "en" }],
    value: "__",
  };
  const options: BaseOptionType[] = [autoLang, ...locales];

  let translateUrl = `${urls.itchTranslationPlatform}/projects/itchio/itch`;
  const english = /^en/.test(lang);
  if (!english && lang !== "__") {
    translateUrl += `/${lang}`;
  }

  const badgeLang = lang ? lang.substr(0, 2) : "en";
  const translationBadgeUrl = `${urls.itchTranslationPlatform}/widgets/itchio/${badgeLang}/itch/svg-badge.svg`;

  const onLanguageChange = (value: BaseOptionType) => {
    if (!value) {
      return;
    }
    let lang = value.value;
    if (lang === "__") {
      lang = null;
    }
    dispatch(actions.updatePreferences({ lang }));
  };

  return (
    <>
      <h2>{T(["preferences.language"])}</h2>
      <SettingsGroup className="language-form">
        <SettingsGroupRow active>
          <Icon icon="earth" />
          <Spacer />
          <LanguageSelect
            onChange={onLanguageChange}
            options={options}
            value={options.find((o) => o.value === lang) || autoLang}
          />
        </SettingsGroupRow>
      </SettingsGroup>

      <p className="explanation flex">
        {T(["preferences.language.get_involved", { name: "itch" }])}{" "}
        <a href={translateUrl}>
          <img className="weblate-badge" src={translationBadgeUrl} />
        </a>
      </p>
    </>
  );
};

export default LanguageSettings;

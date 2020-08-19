import { actions } from "common/actions";
import urls from "common/constants/urls";
import { Dispatch, LocaleInfo, RootState } from "common/types";
import React from "react";
import Floater from "renderer/basics/Floater";
import Icon from "renderer/basics/Icon";
import IconButton from "renderer/basics/IconButton";
import SimpleSelect, { BaseOptionType } from "renderer/basics/SimpleSelect";
import { hook } from "renderer/hocs/hook";
import Label from "renderer/pages/PreferencesPage/Label";
import styled from "renderer/styles";
import { T } from "renderer/t";
import { findWhere } from "underscore";

const Spacer = styled.div`
  width: 8px;
  height: 2px;
`;

const LanguageSelect = styled(SimpleSelect)`
  flex-grow: 0;
  flex-basis: 300px;
`;

class LanguageSettings extends React.PureComponent<Props> {
  render() {
    const { dispatch, locales, lang, sniffedLang } = this.props;

    let autoLang: BaseOptionType = {
      label: ["preferences.language.auto", { language: sniffedLang }],
      value: "__",
    };
    const options: BaseOptionType[] = [autoLang, ...locales];

    let translateUrl = `${urls.itchTranslationPlatform}/projects/itch/itch`;
    const english = /^en/.test(lang);
    if (!english && lang !== "__") {
      translateUrl += `/${lang}`;
    }

    const badgeLang = lang ? lang.substr(0, 2) : "en";
    const translationBadgeUrl = `${urls.itchTranslationPlatform}/widgets/itchio/${badgeLang}/itch/svg-badge.svg`;

    const downloading = this.props.downloading[lang];

    return (
      <>
        <h2>{T(["preferences.language"])}</h2>
        <div className="language-form">
          <Label active>
            <Icon icon="earth" />
            <Spacer />
            <LanguageSelect
              onChange={this.onLanguageChange}
              options={options}
              value={findWhere(options, { value: lang }) || autoLang}
            />
            {downloading ? (
              <Floater />
            ) : (
              <IconButton icon="repeat" onClick={this.queueLocaleDownload} />
            )}
          </Label>
        </div>

        <p className="explanation flex">
          {T(["preferences.language.get_involved", { name: "itch" }])}{" "}
          <a href={translateUrl}>
            <img className="weblate-badge" src={translationBadgeUrl} />
          </a>
        </p>
      </>
    );
  }

  queueLocaleDownload = (e: React.MouseEvent<any>) => {
    const { dispatch, lang } = this.props;
    e.preventDefault();
    dispatch(actions.queueLocaleDownload({ lang }));
  };

  onLanguageChange = (value: BaseOptionType) => {
    const { dispatch } = this.props;
    if (!value) {
      return;
    }
    let lang = value.value;
    if (lang === "__") {
      lang = null;
    }
    dispatch(actions.updatePreferences({ lang }));
  };
}

interface Props {
  dispatch: Dispatch;

  locales: LocaleInfo[];
  lang: string;
  sniffedLang: string;
  downloading: RootState["i18n"]["downloading"];
}

export default hook((map) => ({
  locales: map((rs) => rs.i18n.locales),
  lang: map((rs) => rs.i18n.lang),
  sniffedLang: map((rs) => rs.system.sniffedLanguage),
  downloading: map((rs) => rs.i18n.downloading),
}))(LanguageSettings);

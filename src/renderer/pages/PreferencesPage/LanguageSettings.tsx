import { actions } from "common/actions";
import urls from "common/constants/urls";
import { Dispatch, LocaleInfo, RootState } from "common/types";
import React from "react";
import Icon from "renderer/basics/Icon";
import IconButton from "renderer/basics/IconButton";
import LoadingCircle from "renderer/basics/LoadingCircle";
import SelectRow, { SelectOption } from "renderer/basics/SelectRow";
import { hook } from "renderer/hocs/hook";
import styled from "renderer/styles";
import { T } from "renderer/t";
import Label from "renderer/pages/PreferencesPage/Label";

const Spacer = styled.div`
  width: 8px;
  height: 2px;
`;

class LanguageSettings extends React.PureComponent<Props> {
  render() {
    const { dispatch, locales, lang, sniffedLang } = this.props;

    const options: SelectOption[] = [
      {
        label: ["preferences.language.auto", { language: sniffedLang }],
        value: "__",
      },
      ...locales,
    ];

    let translateUrl = `${urls.itchTranslationPlatform}/projects/itch/itch`;
    const english = /^en/.test(lang);
    if (!english && lang !== "__") {
      translateUrl += `/${lang}`;
    }

    const badgeLang = lang ? lang.substr(0, 2) : "en";
    const translationBadgeUrl = `${
      urls.itchTranslationPlatform
    }/widgets/itch/${badgeLang}/svg-badge.svg`;

    const downloading = this.props.downloading[lang];

    return (
      <>
        <h2>{T(["preferences.language"])}</h2>
        <div className="language-form">
          <Label active>
            <Icon icon="earth" />
            <Spacer />
            <SelectRow
              onChange={this.onLanguageChange}
              options={options}
              value={lang || "__"}
            />
            {downloading ? (
              <LoadingCircle progress={-1} />
            ) : (
              <IconButton
                icon="repeat"
                onClick={e => {
                  e.preventDefault();
                  dispatch(actions.queueLocaleDownload({ lang }));
                }}
              />
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

  onLanguageChange = (lang: string) => {
    const { dispatch } = this.props;
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

export default hook(map => ({
  locales: map(rs => rs.i18n.locales),
  lang: map(rs => rs.i18n.lang),
  sniffedLang: map(rs => rs.system.sniffedLanguage),
  downloading: map(rs => rs.i18n.downloading),
}))(LanguageSettings);

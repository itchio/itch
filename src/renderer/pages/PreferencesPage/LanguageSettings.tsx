import React from "react";
import {
  connect,
  Dispatchers,
  actionCreatorsList,
} from "renderer/hocs/connect";
import urls from "common/constants/urls";
import { T } from "renderer/t";

import SelectRow, { SelectOption } from "renderer/basics/SelectRow";
import Icon from "renderer/basics/Icon";
import IconButton from "renderer/basics/IconButton";
import LoadingCircle from "renderer/basics/LoadingCircle";

import Label from "./Label";

import { LocaleInfo, IRootState } from "common/types";

import styled from "renderer/styles";
import { createStructuredSelector } from "reselect";
const Spacer = styled.div`
  width: 8px;
  height: 2px;
`;

class LanguageSettings extends React.PureComponent<Props & DerivedProps> {
  render() {
    const { queueLocaleDownload, locales, lang, sniffedLang } = this.props;

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
                  queueLocaleDownload({ lang });
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
    const { updatePreferences } = this.props;
    if (lang === "__") {
      lang = null;
    }

    updatePreferences({ lang });
  };
}

interface Props {}

const actionCreators = actionCreatorsList(
  "queueLocaleDownload",
  "updatePreferences"
);

type DerivedProps = Dispatchers<typeof actionCreators> & {
  locales: LocaleInfo[];
  lang: string;
  sniffedLang: string;
  downloading: IRootState["i18n"]["downloading"];
};

export default connect<Props>(
  LanguageSettings,
  {
    actionCreators,
    state: createStructuredSelector({
      locales: (rs: IRootState) => rs.i18n.locales,
      lang: (rs: IRootState) => rs.i18n.lang,
      sniffedLang: (rs: IRootState) => rs.system.sniffedLanguage,
      downloading: (rs: IRootState) => rs.i18n.downloading,
    }),
  }
);

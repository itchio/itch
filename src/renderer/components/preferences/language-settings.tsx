import React from "react";
import { connect, Dispatchers, actionCreatorsList } from "../connect";
import urls from "common/constants/urls";
import { T } from "renderer/t";

import SelectRow, { ISelectOption } from "../basics/select-row";
import Icon from "../basics/icon";
import IconButton from "../basics/icon-button";
import LoadingCircle from "../basics/loading-circle";

import Label from "./label";

import { ILocaleInfo, IRootState } from "common/types";

import styled from "../styles";
import { createStructuredSelector } from "reselect";
const Spacer = styled.div`
  width: 8px;
  height: 2px;
`;

class LanguageSettings extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { queueLocaleDownload, locales, lang, sniffedLang } = this.props;

    const options: ISelectOption[] = [
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

interface IProps {}

const actionCreators = actionCreatorsList(
  "queueLocaleDownload",
  "updatePreferences"
);

type IDerivedProps = Dispatchers<typeof actionCreators> & {
  locales: ILocaleInfo[];
  lang: string;
  sniffedLang: string;
  downloading: IRootState["i18n"]["downloading"];
};

export default connect<IProps>(LanguageSettings, {
  actionCreators,
  state: createStructuredSelector({
    locales: (rs: IRootState) => rs.i18n.locales,
    lang: (rs: IRootState) => rs.i18n.lang,
    sniffedLang: (rs: IRootState) => rs.system.sniffedLanguage,
    downloading: (rs: IRootState) => rs.i18n.downloading,
  }),
});

import * as React from "react";
import { connect, I18nProps } from "../../connect";
import { map } from "underscore";

import { slugify } from "../../../format";

/**
 * A bunch of errors displayed in a list
 * Supports the following API i18n keys:
 *  - errors.api.login.incorrect_username_or_password
 *  - errors.api.login.password_must_be_provided
 *  - errors.api.login.username_must_be_provided
 */
class ErrorList extends React.PureComponent<IProps & I18nProps> {
  render() {
    const { t, errors, before = "", i18nNamespace, ...restProps } = this.props;
    const prefix = i18nNamespace ? `errors.${i18nNamespace}` : "errors";

    if (!errors) {
      return <div />;
    }

    const errorArray = Array.isArray(errors) ? errors : [errors];

    return (
      <ul className="form-errors" {...restProps}>
        {map(errorArray, (error, key) => {
          const i18nKey = prefix + "." + slugify(error);
          const message = t(i18nKey, { defaultValue: error });
          return (
            <li key={key}>
              {before}
              {message}
            </li>
          );
        })}
      </ul>
    );
  }
}

interface IProps {
  errors: string[];
  before: JSX.Element;
  i18nNamespace: string;
  id?: string;
}

export default connect<IProps>(ErrorList);

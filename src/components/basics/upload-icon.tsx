import * as React from "react";
import Icon from "./icon";
import { Upload } from "../../buse/messages";
import { uploadIcon, uploadTypeHint } from "../../reactors/make-upload-button";

export default class UploadIcon extends React.PureComponent<IProps> {
  render() {
    const { upload } = this.props;
    return <Icon icon={uploadIcon(upload)} hint={uploadTypeHint(upload)} />;
  }
}

interface IProps {
  upload: Upload;
}

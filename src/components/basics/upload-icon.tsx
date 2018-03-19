import * as React from "react";
import Icon from "./icon";
import { Upload } from "../../buse/messages";
import { uploadIcon, uploadTypeHint } from "../../reactors/make-upload-button";

class UploadIcon extends React.PureComponent<IProps> {
  render() {
    const { upload } = this.props;
    return <Icon icon={uploadIcon(upload)} hint={uploadTypeHint(upload)} />;
  }
}

export default UploadIcon;

interface IProps {
  upload: Upload;
}

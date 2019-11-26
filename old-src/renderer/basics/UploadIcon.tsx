import { Upload } from "common/butlerd/messages";
import { uploadIcon, uploadTypeHint } from "main/reactors/make-upload-button";
import React from "react";
import Icon from "renderer/basics/Icon";

class UploadIcon extends React.PureComponent<Props> {
  render() {
    const { upload } = this.props;
    if (!upload) {
      return null;
    }
    return <Icon icon={uploadIcon(upload)} hint={uploadTypeHint(upload)} />;
  }
}

export default UploadIcon;

interface Props {
  upload: Upload;
}

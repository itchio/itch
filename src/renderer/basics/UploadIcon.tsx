import { Upload } from "common/butlerd/messages";
import { uploadIcon, uploadTypeHint } from "main/reactors/make-upload-button";
import React from "react";
import Icon from "renderer/basics/Icon";

interface Props {
  upload: Upload;
}

const UploadIcon = ({ upload }: Props) => {
  if (!upload) {
    return null;
  }
  return <Icon icon={uploadIcon(upload)} hint={uploadTypeHint(upload)} />;
};

export default React.memo(UploadIcon);

import React from "react";

const ImagePreview = ({imgLink, ...props}) => {
return(
    <div style={{marginTop: "20px"}}>
      <object
        type="image/svg+xml"
        data={imgLink}
        height="540px"
        width="540px"
      />
    </div>)
}

export default ImagePreview;
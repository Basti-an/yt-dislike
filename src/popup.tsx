import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

const Popup = () => {
  return (
    <>
      <p>HELLO POPUP!</p>
    </>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
  document.getElementById("root")
);

import React from "react";
import { Fragment } from "react";

const LoadingSpinner = ({ className = "h-12 w-12 border-gray-900", containerClass = "pb-10" }) => {
  return (
    <Fragment>
      <div className={`flex justify-center items-center ${containerClass}`}>
        <div className={`inline-block animate-spin rounded-full border-t-2 border-b-2 ${className}`}></div>
      </div>
    </Fragment>
  );
};

export default LoadingSpinner;


import { BrowserRouter } from "react-router-dom";
import React from "react";
import Layout from "./components/Layout/Layout";
import "./App.css";


import ErrorBoundary from "./components/ErrorBoundary";
import ScrollToTop from "./components/ScrollToTop";
import AppToast from "./components/ui/AppToast";

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <AppToast />
        <Layout />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

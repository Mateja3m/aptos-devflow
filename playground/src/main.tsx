import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.js";
import "./styles.css";

const theme = createTheme({
  palette: {
    primary: {
      main: "#16324f",
    },
    secondary: {
      main: "#cb6d51",
    },
    background: {
      default: "#f3ebdc",
      paper: "rgba(255, 255, 255, 0.82)",
    },
  },
  shape: {
    borderRadius: 18,
  },
  typography: {
    fontFamily: '"IBM Plex Sans", "Segoe UI", sans-serif',
    h1: {
      fontSize: "clamp(2.25rem, 5vw, 4.4rem)",
      fontWeight: 700,
      lineHeight: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);

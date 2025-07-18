import { ThemeProvider, createTheme, CssBaseline } from "@mui/material"
import KanbanBoard from "../components/KanbanBoard"

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#00b4a5",
    },
  },
})

export default function Home() {
  return (
    <ThemeProvider theme={theme}>

      <CssBaseline />
      <KanbanBoard />
    </ThemeProvider>
  )
}

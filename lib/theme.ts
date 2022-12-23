import { grey, red } from '@mui/material/colors'
import { createTheme } from '@mui/material/styles'
import { Roboto } from '@next/font/google'

export const robotoFont = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  fallback: ['Helvetica', 'Arial', 'sans-serif'],
})

// Create a theme instance.
// https://mui.com/material-ui/migration/v5-component-changes/#%E2%9C%85-remove-default-color-prop
const theme = createTheme({
  palette: {
    white: { main: '#fff' },
    primary: { main: '#a5790a' },
    secondary: { main: red.A400 },
    grey: {
      main: grey[300],
      dark: grey[400],
    },
  },
  typography: {
    fontFamily: robotoFont.style.fontFamily,
  },
  components: {
    MuiFormControl: {
      defaultProps: {
        variant: 'standard',
      },
    },
    MuiSelect: {
      defaultProps: {
        variant: 'standard',
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'standard',
      },
    },
  },
})

declare module '@mui/material/styles' {
  interface Palette {
    white: Palette['primary']
  }

  interface PaletteOptions {
    white: PaletteOptions['primary']
  }

  interface PaletteColor {
    white?: string
  }

  interface SimplePaletteColorOptions {
    white?: string
  }
}
declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    grey: true
  }
}

declare module '@mui/material/ButtonGroup' {
  interface ButtonGroupPropsColorOverrides {
    grey: true
  }
}

declare module '@mui/material/IconButton' {
  interface IconButtonPropsColorOverrides {
    white: true
  }
}

declare module '@mui/material/ButtonGroup' {
  interface ButtonPropsColorOverrides {
    grey: true
  }
}

declare module '@mui/material' {
  interface Color {
    main: string
    dark: string
  }
}

export default theme

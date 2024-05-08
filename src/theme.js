import { createTheme } from '@mui/material/styles';

const getTheme = (mode) => {
  return createTheme({
    palette: {
      mode,
      ...(mode === 'dark' && {
        background: {
          default: '#121212',
          paper: '#1e1e1e',
        },
      }),
    },
  });
};

export default getTheme;
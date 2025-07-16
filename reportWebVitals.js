const reportWebVitals = onPerfEntry => {
if (onPerfEntry && onPerfEntry instanceof Function) {
    *import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {*

      *getCLS(onPerfEntry);*

      *getFID(onPerfEntry);*

      *getFCP(onPerfEntry);*

      *getLCP(onPerfEntry);*

      *getTTFB(onPerfEntry);*

    *});*

}
};

export default reportWebVitals;



themes.js
import { createTheme } from '@mui/material/styles';

export default createTheme({
palette: {
    *primary: { main: '#3f51b5' },*

    *secondary: { main: '#f50057' }*

}
});

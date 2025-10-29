import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import TraceabilityTestComponent from './components/TraceabilityTestComponent';

function App() {
  return (
    <BrowserRouter>
      <TraceabilityTestComponent />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;

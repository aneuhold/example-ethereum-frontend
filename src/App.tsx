import { Toaster } from '@/components/ui/sonner';
import { Route, Routes } from 'react-router-dom';
import ExposurePage from './pages/ExposurePage';

export default function App() {
  return (
    <div className="p-4">
      <Routes>
        <Route path="/" element={<ExposurePage />} />
        <Route path="/exposure" element={<ExposurePage />} />
      </Routes>
      {/* The app has no ThemeProvider, so the Toaster would otherwise follow the OS theme */}
      <Toaster theme="light" />
    </div>
  );
}

import { Route, Routes } from 'react-router-dom';
import ExposurePage from './pages/ExposurePage';

export default function App() {
  return (
    <div className="p-4">
      <Routes>
        <Route path="/" element={<ExposurePage />} />
        <Route path="/exposure" element={<ExposurePage />} />
      </Routes>
    </div>
  );
}
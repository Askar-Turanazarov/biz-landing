import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { LandingPage } from './LandingPage';
import { captureTraffic } from './lib/tracking';

/**
 * Админка грузится отдельным чанком: её код не попадает в бандл лендинга,
 * который видят посетители. Маршрут нигде не линкуется и закрыт в robots.txt.
 */
const SuperAdminPage = lazy(() => import('./admin/SuperAdminPage'));

export default function App() {
  useEffect(() => {
    // Метки источника запоминаем один раз за визит, до любых переходов.
    captureTraffic();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/superadmin"
          element={
            <Suspense fallback={<AdminLoading />}>
              <SuperAdminPage />
            </Suspense>
          }
        />
        {/* Любой неизвестный адрес показывает лендинг: отдельная 404 здесь избыточна. */}
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
}

function AdminLoading() {
  return (
    <div className="grid min-h-screen place-items-center text-sm text-slate-500">
      Загружаем панель…
    </div>
  );
}

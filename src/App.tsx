import { BrowserRouter, Routes, Route } from "react-router-dom"
import ProfilePage from "./pages/ProfilePage"
import DashboardPage from "./pages/DashboardPage"
import SpentPage from "./pages/SpentPage"
import NafPage from "./pages/NafPage"
import TestCompletePage from "./pages/TestCompletePage"
import SpentNafHistoryPage from "./pages/SpentNafHistoryPage"
import BloodTestPage from "./pages/BloodtestPage"
import FoodPage from "./pages/FoodPage"
import ProfileSettingsPage from "./pages/ProfileSettingsPage"
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProfilePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Add your other pages here as you build them */}
        <Route path="/profile/settings" element={<ProfileSettingsPage />} />
        <Route path="/test/spent" element={<SpentPage />} />
        <Route path="/test/naf" element={<NafPage/>} />
        <Route path="/test/complete" element={<TestCompletePage/>} />
        <Route path="/health/blood-test" element={<BloodTestPage />} />
        <Route path="/history/spent-naf" element={<SpentNafHistoryPage />} />
        <Route path="/food/today" element={<FoodPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
import { BrowserRouter, Routes, Route } from "react-router-dom"
import ProfilePage from "./pages/ProfilePage"
import DashboardPage from "./pages/DashboardPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProfilePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Add your other pages here as you build them */}
        {/* <Route path="/profile/settings" element={<ProfileSettingsPage />} /> */}
        {/* <Route path="/test/spent-naf" element={<SpentNafPage />} /> */}
        {/* <Route path="/health/blood-test" element={<BloodTestPage />} /> */}
        {/* <Route path="/history/spent-naf" element={<NafHistoryPage />} /> */}
        {/* <Route path="/food/today" element={<FoodTodayPage />} /> */}
      </Routes>
    </BrowserRouter>
  )
}

export default App
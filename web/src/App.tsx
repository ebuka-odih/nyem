import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Onboarding from './screens/Onboarding';
import SignIn from './screens/SignIn';
import PhoneEntry from './screens/PhoneEntry';
import OtpVerification from './screens/OtpVerification';
import Discover from './screens/Discover';
import Upload from './screens/Upload';
import Matches from './screens/Matches';
import Profile from './screens/Profile';
import AdminDashboard from './screens/admin/AdminDashboard';
import AdminUsers from './screens/admin/AdminUsers';
import AdminMatches from './screens/admin/AdminMatches';
import AdminItems from './screens/admin/AdminItems';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Onboarding />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<PhoneEntry />} />
        <Route path="/phone-entry" element={<PhoneEntry />} />
        <Route path="/otp-verification" element={<OtpVerification />} />
        {/* Inner pages (authenticated) */}
        <Route path="/discover" element={<Discover />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/profile" element={<Profile />} />
        {/* Admin routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/matches" element={<AdminMatches />} />
        <Route path="/admin/items" element={<AdminItems />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

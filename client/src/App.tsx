import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import ShareKeyRegister from "./pages/ShareKeyRegisterPage";
import ShareKeyLogin from "./pages/ShareKeyLoginPage";
import NotFound from "./components/NotFound";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Key from "./components/[key]";

function App() {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/shareregister" element={<ShareKeyRegister />} />
          <Route path="/sharelogin" element={<ShareKeyLogin />} />
          <Route path="/share/retrieve/:key" element={<Key />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;

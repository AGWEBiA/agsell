import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

// Auth Pages
import Login from "./pages/Login";
import Register from "./pages/Register";

// Dashboard Pages
import Dashboard from "./pages/Dashboard";
import Contacts from "./pages/Contacts";
import Companies from "./pages/Companies";
import Pipeline from "./pages/Pipeline";
import Tags from "./pages/Tags";
import Tasks from "./pages/Tasks";
import Inbox from "./pages/Inbox";
import Email from "./pages/Email";
import WhatsApp from "./pages/WhatsApp";
import Automations from "./pages/Automations";
import LeadScoring from "./pages/LeadScoring";
import Forms from "./pages/Forms";
import Analytics from "./pages/Analytics";
import Integrations from "./pages/Integrations";
import AIAssistant from "./pages/AIAssistant";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Routes */}
              <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="contacts" element={<Contacts />} />
                <Route path="companies" element={<Companies />} />
                <Route path="pipeline" element={<Pipeline />} />
                <Route path="tags" element={<Tags />} />
                <Route path="tasks" element={<Tasks />} />
                <Route path="inbox" element={<Inbox />} />
                <Route path="email" element={<Email />} />
                <Route path="whatsapp" element={<WhatsApp />} />
                <Route path="automations" element={<Automations />} />
                <Route path="lead-scoring" element={<LeadScoring />} />
                <Route path="forms" element={<Forms />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="integrations" element={<Integrations />} />
                <Route path="ai-assistant" element={<AIAssistant />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

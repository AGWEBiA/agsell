import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import { AdminViewProvider } from "@/contexts/AdminViewContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { FeatureRequiredPage } from "@/components/permissions/FeatureRequiredPage";

// Auth Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Pricing from "./pages/Pricing";
import PurchaseSuccess from "./pages/PurchaseSuccess";
import SubscriptionExpired from "./pages/SubscriptionExpired";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

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
import InstagramPage from "./pages/Instagram";
import WhatsAppFlowsPage from "./pages/WhatsAppFlows";
import Automations from "./pages/Automations";
import LeadScoring from "./pages/LeadScoring";
import Forms from "./pages/Forms";
import FormView from "./pages/FormView";
import Analytics from "./pages/Analytics";
import Gamification from "./pages/Gamification";
import Integrations from "./pages/Integrations";
import AIAssistant from "./pages/AIAssistant";
import AIAgents from "./pages/AIAgents";
import Settings from "./pages/Settings";
import Organization from "./pages/Organization";
import Plans from "./pages/Plans";
import Permissions from "./pages/Permissions";
import Admin from "./pages/Admin";
import ApiKeys from "./pages/ApiKeys";
import Webhooks from "./pages/Webhooks";
import EmailDomain from "./pages/EmailDomain";
import InboxSettings from "./pages/InboxSettings";
import SystemGuide from "./pages/SystemGuide";
import HelpCenter from "./pages/HelpCenter";
import AgencyClients from "./pages/AgencyClients";
import AgencyInvite from "./pages/AgencyInvite";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <OrganizationProvider>
          <PermissionsProvider>
            <AdminViewProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <GlobalSearch />
                <Routes>
                {/* Public Routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms-of-service" element={<TermsOfService />} />
                  <Route path="/purchase-success" element={<PurchaseSuccess />} />
                  <Route path="/forms/:formId" element={<FormView />} />
                  <Route path="/agency-invite/:token" element={<AgencyInvite />} />
                  <Route path="/subscription-expired" element={<ProtectedRoute allowExpired><SubscriptionExpired /></ProtectedRoute>} />
                  
                  {/* Protected Routes */}
                  <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="contacts" element={<Contacts />} />
                    <Route path="companies" element={<Companies />} />
                    <Route path="pipeline" element={<Pipeline />} />
                    <Route path="tags" element={<Tags />} />
                    <Route path="tasks" element={<Tasks />} />
                    <Route path="inbox" element={<Inbox />} />
                    <Route path="inbox-settings" element={<InboxSettings />} />
                    <Route path="email" element={<FeatureRequiredPage feature="email_marketing" featureLabel="E-mail Marketing"><Email /></FeatureRequiredPage>} />
                    <Route path="whatsapp" element={<FeatureRequiredPage feature="whatsapp" featureLabel="WhatsApp Business"><WhatsApp /></FeatureRequiredPage>} />
                    <Route path="instagram" element={<FeatureRequiredPage feature="instagram" featureLabel="Instagram"><InstagramPage /></FeatureRequiredPage>} />
                    <Route path="whatsapp-flows" element={<FeatureRequiredPage feature="whatsapp" featureLabel="WhatsApp Flows"><WhatsAppFlowsPage /></FeatureRequiredPage>} />
                    <Route path="automations" element={<FeatureRequiredPage feature="automacoes" featureLabel="Automações"><Automations /></FeatureRequiredPage>} />
                    <Route path="lead-scoring" element={<FeatureRequiredPage feature="lead_scoring" featureLabel="Lead Scoring"><LeadScoring /></FeatureRequiredPage>} />
                    <Route path="forms" element={<Forms />} />
                    <Route path="analytics" element={<FeatureRequiredPage feature="analytics" featureLabel="Analytics"><Analytics /></FeatureRequiredPage>} />
                    <Route path="gamification" element={<Gamification />} />
                    <Route path="integrations" element={<FeatureRequiredPage feature="integrações" featureLabel="Integrações"><Integrations /></FeatureRequiredPage>} />
                    <Route path="ai-assistant" element={<AIAssistant />} />
                    <Route path="ai-agents" element={<AIAgents />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="organization" element={<Organization />} />
                    <Route path="plans" element={<Plans />} />
                    <Route path="permissions" element={<Permissions />} />
                    <Route path="admin" element={<Admin />} />
                    <Route path="api-keys" element={<FeatureRequiredPage feature="api" featureLabel="API Keys"><ApiKeys /></FeatureRequiredPage>} />
                    <Route path="webhooks" element={<FeatureRequiredPage feature="api" featureLabel="Webhooks"><Webhooks /></FeatureRequiredPage>} />
                    <Route path="email-domain" element={<FeatureRequiredPage feature="email_marketing" featureLabel="Domínio de E-mail"><EmailDomain /></FeatureRequiredPage>} />
                    <Route path="system-guide" element={<SystemGuide />} />
                    <Route path="help-center" element={<HelpCenter />} />
                    <Route path="agency-clients" element={<FeatureRequiredPage feature="agency_management" featureLabel="Gestão de Agência"><AgencyClients /></FeatureRequiredPage>} />
                  </Route>
                  
                  {/* Plans accessible even with expired subscription */}
                  <Route path="/renew-plans" element={<ProtectedRoute allowExpired><DashboardLayout /></ProtectedRoute>}>
                    <Route index element={<Plans />} />
                    <Route path="permissions" element={<Permissions />} />
                    <Route path="admin" element={<Admin />} />
                    <Route path="api-keys" element={<ApiKeys />} />
                    <Route path="webhooks" element={<Webhooks />} />
                    <Route path="email-domain" element={<EmailDomain />} />
                  </Route>
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
            </AdminViewProvider>
          </PermissionsProvider>
        </OrganizationProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

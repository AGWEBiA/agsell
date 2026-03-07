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
import EmailInbox from "./pages/EmailInbox";
import InboxSettings from "./pages/InboxSettings";
import InboxReports from "./pages/InboxReports";
import SystemGuide from "./pages/SystemGuide";
import HelpCenter from "./pages/HelpCenter";
import AgencyClients from "./pages/AgencyClients";
import AgencyInvite from "./pages/AgencyInvite";
import ABTests from "./pages/ABTests";
import GrowthTools from "./pages/GrowthTools";
import Sequences from "./pages/Sequences";
import Channels from "./pages/Channels";
import FlowBuilder from "./pages/FlowBuilder";
import TechnicalManual from "./pages/TechnicalManual";
import Migration from "./pages/Migration";
import SupportTickets from "./pages/SupportTickets";
import SupportCenter from "./pages/SupportCenter";
import SupportPortal from "./pages/SupportPortal";
import SupportPortalSettingsPage from "./pages/SupportPortalSettings";
import TicketTracker from "./pages/TicketTracker";
import WhatsAppTemplates from "./pages/WhatsAppTemplates";
import ContactPreferences from "./pages/ContactPreferences";
import EventTracking from "./pages/EventTracking";
import Attribution from "./pages/Attribution";
import LandingPagesPage from "./pages/LandingPages";
import AIBuilder from "./pages/AIBuilder";
import PredictiveSending from "./pages/PredictiveSending";
import SentimentDashboard from "./pages/SentimentDashboard";
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
                  <Route path="/ticket/:protocol" element={<TicketTracker />} />
                  <Route path="/ticket" element={<TicketTracker />} />
                  <Route path="/agency-invite/:token" element={<AgencyInvite />} />
                  <Route path="/support-portal/:orgSlug" element={<SupportPortal />} />
                  <Route path="/manual-tecnico" element={<TechnicalManual />} />
                  <Route path="/subscription-expired" element={<ProtectedRoute allowExpired><SubscriptionExpired /></ProtectedRoute>} />
                  
                  {/* Protected Routes */}
                  <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="contacts" element={<Contacts />} />
                    <Route path="companies" element={<Companies />} />
                    <Route path="pipeline" element={<Pipeline />} />
                    <Route path="tags" element={<Tags />} />
                    <Route path="tasks" element={<Tasks />} />
                    <Route path="inbox" element={<Inbox />} />
                    <Route path="inbox-settings" element={<InboxSettings />} />
                    <Route path="inbox-reports" element={<InboxReports />} />
                    <Route path="email" element={<FeatureRequiredPage feature="email_marketing" featureLabel="E-mail Marketing"><Email /></FeatureRequiredPage>} />
                    <Route path="email-inbox" element={<FeatureRequiredPage feature="email_marketing" featureLabel="Caixa de E-mail"><EmailInbox /></FeatureRequiredPage>} />
                    <Route path="whatsapp" element={<FeatureRequiredPage feature="whatsapp" featureLabel="WhatsApp Business"><WhatsApp /></FeatureRequiredPage>} />
                    <Route path="instagram" element={<FeatureRequiredPage feature="instagram" featureLabel="Instagram"><InstagramPage /></FeatureRequiredPage>} />
                    <Route path="whatsapp-flows" element={<FeatureRequiredPage feature="whatsapp" featureLabel="WhatsApp Flows"><WhatsAppFlowsPage /></FeatureRequiredPage>} />
                    <Route path="whatsapp-templates" element={<FeatureRequiredPage feature="whatsapp" featureLabel="Templates API Oficial"><WhatsAppTemplates /></FeatureRequiredPage>} />
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
                    <Route path="ab-tests" element={<ABTests />} />
                    <Route path="growth-tools" element={<GrowthTools />} />
                    <Route path="flow-builder" element={<FlowBuilder />} />
                    <Route path="sequences" element={<Sequences />} />
                    <Route path="channels" element={<Channels />} />
                    <Route path="migration" element={<Migration />} />
                    <Route path="contact-preferences" element={<ContactPreferences />} />
                    <Route path="event-tracking" element={<EventTracking />} />
                    <Route path="attribution" element={<Attribution />} />
                    <Route path="landing-pages" element={<LandingPagesPage />} />
                    <Route path="ai-builder" element={<AIBuilder />} />
                    <Route path="predictive-sending" element={<PredictiveSending />} />
                    <Route path="sentiment" element={<SentimentDashboard />} />
                    <Route path="support" element={<SupportTickets />} />
                    <Route path="support-center" element={<SupportCenter />} />
                    <Route path="support-portal-settings" element={<FeatureRequiredPage feature="customer_support_center" featureLabel="Portal de Suporte"><SupportPortalSettingsPage /></FeatureRequiredPage>} />
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

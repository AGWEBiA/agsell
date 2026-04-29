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
import { RuntimeProtection } from "@/components/security/RuntimeProtection";
import React, { Suspense } from "react";

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

// Lazy-loaded public pages
const Index = React.lazy(() => import("./pages/Index"));
const Login = React.lazy(() => import("./pages/Login"));
const Register = React.lazy(() => import("./pages/Register"));
const Pricing = React.lazy(() => import("./pages/Pricing"));
const Features = React.lazy(() => import("./pages/Features"));
const Apresentacao = React.lazy(() => import("./pages/Apresentacao"));
const Vendas = React.lazy(() => import("./pages/Vendas"));
const SalesPitch = React.lazy(() => import("./pages/SalesPitch"));
const PurchaseSuccess = React.lazy(() => import("./pages/PurchaseSuccess"));
const SubscriptionExpired = React.lazy(() => import("./pages/SubscriptionExpired"));
const PrivacyPolicy = React.lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = React.lazy(() => import("./pages/TermsOfService"));
const ApiDocs = React.lazy(() => import("./pages/ApiDocs"));
const DataDeletion = React.lazy(() => import("./pages/DataDeletion"));
const FormView = React.lazy(() => import("./pages/FormView"));
const TicketTracker = React.lazy(() => import("./pages/TicketTracker"));
const AgencyInvite = React.lazy(() => import("./pages/AgencyInvite"));
const SupportPortal = React.lazy(() => import("./pages/SupportPortal"));
const GroupRedirect = React.lazy(() => import("./pages/GroupRedirect"));
const TechnicalManual = React.lazy(() => import("./pages/TechnicalManual"));
const SystemStatus = React.lazy(() => import("./pages/SystemStatus"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

// Lazy-loaded protected pages
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Contacts = React.lazy(() => import("./pages/Contacts"));
const Companies = React.lazy(() => import("./pages/Companies"));
const Pipeline = React.lazy(() => import("./pages/Pipeline"));
const Tags = React.lazy(() => import("./pages/Tags"));
const Tasks = React.lazy(() => import("./pages/Tasks"));
const Inbox = React.lazy(() => import("./pages/Inbox"));
const Email = React.lazy(() => import("./pages/Email"));
const WhatsApp = React.lazy(() => import("./pages/WhatsApp"));
const InstagramPage = React.lazy(() => import("./pages/Instagram"));
const WhatsAppFlowsPage = React.lazy(() => import("./pages/WhatsAppFlows"));
const Automations = React.lazy(() => import("./pages/Automations"));
const LeadScoring = React.lazy(() => import("./pages/LeadScoring"));
const Forms = React.lazy(() => import("./pages/Forms"));
const Analytics = React.lazy(() => import("./pages/Analytics"));
const Gamification = React.lazy(() => import("./pages/Gamification"));
const Integrations = React.lazy(() => import("./pages/Integrations"));
const AIAssistant = React.lazy(() => import("./pages/AIAssistant"));
const AIAgents = React.lazy(() => import("./pages/AIAgents"));
const Settings = React.lazy(() => import("./pages/Settings"));
const Organization = React.lazy(() => import("./pages/Organization"));
const Plans = React.lazy(() => import("./pages/Plans"));
const Permissions = React.lazy(() => import("./pages/Permissions"));
const Admin = React.lazy(() => import("./pages/Admin"));
const ApiKeys = React.lazy(() => import("./pages/ApiKeys"));
const Webhooks = React.lazy(() => import("./pages/Webhooks"));
const ApiWebhooks = React.lazy(() => import("./pages/ApiWebhooks"));
const EmailDomain = React.lazy(() => import("./pages/EmailDomain"));
const EmailInbox = React.lazy(() => import("./pages/EmailInbox"));
const InboxSettings = React.lazy(() => import("./pages/InboxSettings"));
const InboxReports = React.lazy(() => import("./pages/InboxReports"));
const SystemGuide = React.lazy(() => import("./pages/SystemGuide"));
const HelpCenter = React.lazy(() => import("./pages/HelpCenter"));
const AgencyClients = React.lazy(() => import("./pages/AgencyClients"));
const ABTests = React.lazy(() => import("./pages/ABTests"));
const GrowthTools = React.lazy(() => import("./pages/GrowthTools"));
const Sequences = React.lazy(() => import("./pages/Sequences"));
const Channels = React.lazy(() => import("./pages/Channels"));
const FlowBuilder = React.lazy(() => import("./pages/FlowBuilder"));
const Migration = React.lazy(() => import("./pages/Migration"));
const SupportTickets = React.lazy(() => import("./pages/SupportTickets"));
const SupportCenter = React.lazy(() => import("./pages/SupportCenter"));
const SupportPortalSettingsPage = React.lazy(() => import("./pages/SupportPortalSettings"));
const WhatsAppTemplates = React.lazy(() => import("./pages/WhatsAppTemplates"));
const ContactPreferences = React.lazy(() => import("./pages/ContactPreferences"));
const EventTracking = React.lazy(() => import("./pages/EventTracking"));
const Attribution = React.lazy(() => import("./pages/Attribution"));
const LandingPagesPage = React.lazy(() => import("./pages/LandingPages"));
const AIBuilder = React.lazy(() => import("./pages/AIBuilder"));
const PredictiveSending = React.lazy(() => import("./pages/PredictiveSending"));
const SentimentDashboard = React.lazy(() => import("./pages/SentimentDashboard"));
const SiteTracking = React.lazy(() => import("./pages/SiteTracking"));
const SalesRouting = React.lazy(() => import("./pages/SalesRouting"));
const Goals = React.lazy(() => import("./pages/Goals"));
const WinProbability = React.lazy(() => import("./pages/WinProbability"));
const ConditionalContent = React.lazy(() => import("./pages/ConditionalContent"));
const CommunicationCampaigns = React.lazy(() => import("./pages/CommunicationCampaigns"));
const CustomReports = React.lazy(() => import("./pages/CustomReports"));
const RevenueReporting = React.lazy(() => import("./pages/RevenueReporting"));
const PaidGroups = React.lazy(() => import("./pages/PaidGroups"));
const VoIP = React.lazy(() => import("./pages/VoIP"));
const VoipCampaigns = React.lazy(() => import("./pages/VoipCampaigns"));
const WhatsAppCampaignsPage = React.lazy(() => import("./pages/WhatsAppCampaignsPage"));
const WhatsAppGroupMessagesPage = React.lazy(() => import("./pages/WhatsAppGroupMessagesPage"));
const GroupRotator = React.lazy(() => import("./pages/GroupRotator"));
const ChatbotBuilder = React.lazy(() => import("./pages/ChatbotBuilder"));
const FunnelPlanner = React.lazy(() => import("./pages/FunnelPlanner"));
const FunnelBI = React.lazy(() => import("./pages/FunnelBI"));
const AutomationMetrics = React.lazy(() => import("./pages/AutomationMetrics"));
const SMSMarketing = React.lazy(() => import("./pages/SMSMarketing"));
const Notifications = React.lazy(() => import("./pages/Notifications"));
const CRMAdmin = React.lazy(() => import("./pages/CRMAdmin"));
const CRMIntelligence = React.lazy(() => import("./pages/CRMIntelligence"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

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
              <RuntimeProtection />
              <BrowserRouter>
                <GlobalSearch />
                <Suspense fallback={<PageLoader />}>
                <Routes>
                {/* Public Routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/features" element={<Features />} />
                  <Route path="/apresentacao" element={<Apresentacao />} />
                  <Route path="/vendas" element={<Vendas />} />
                  <Route path="/pitch" element={<SalesPitch />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms-of-service" element={<TermsOfService />} />
                  <Route path="/data-deletion" element={<DataDeletion />} />
                  <Route path="/purchase-success" element={<PurchaseSuccess />} />
                  <Route path="/forms/:formId" element={<FormView />} />
                  <Route path="/ticket/:protocol" element={<TicketTracker />} />
                  <Route path="/ticket" element={<TicketTracker />} />
                  <Route path="/agency-invite/:token" element={<AgencyInvite />} />
                  <Route path="/support-portal/:orgSlug" element={<SupportPortal />} />
                  <Route path="/r/:slug" element={<GroupRedirect />} />
                  <Route path="/api-docs" element={<ApiDocs />} />
                  <Route path="/manual-tecnico" element={<TechnicalManual />} />
                  <Route path="/status" element={<SystemStatus />} />
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
                    <Route path="api-keys" element={<ApiKeys />} />
                    <Route path="webhooks" element={<Webhooks />} />
                    <Route path="api-webhooks" element={<ApiWebhooks />} />
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
                    <Route path="site-tracking" element={<SiteTracking />} />
                    <Route path="sales-routing" element={<SalesRouting />} />
                    <Route path="goals" element={<Goals />} />
                    <Route path="win-probability" element={<WinProbability />} />
                    <Route path="conditional-content" element={<ConditionalContent />} />
                    <Route path="sms-marketing" element={<Navigate to="/communication-campaigns" replace />} />
                    <Route path="communication-campaigns" element={<CommunicationCampaigns />} />
                    <Route path="custom-reports" element={<CustomReports />} />
                    <Route path="revenue-reporting" element={<RevenueReporting />} />
                    <Route path="paid-groups" element={<FeatureRequiredPage feature="paid_groups" featureLabel="Grupos Pagos"><PaidGroups /></FeatureRequiredPage>} />
                    <Route path="voip" element={<VoIP />} />
                    <Route path="voip-campaigns" element={<Navigate to="/communication-campaigns" replace />} />
                    <Route path="whatsapp-campaigns" element={<FeatureRequiredPage feature="whatsapp" featureLabel="Campanhas WhatsApp"><WhatsAppCampaignsPage /></FeatureRequiredPage>} />
                    <Route path="whatsapp-group-messages" element={<FeatureRequiredPage feature="whatsapp" featureLabel="Mensagens Grupos"><WhatsAppGroupMessagesPage /></FeatureRequiredPage>} />
                    <Route path="group-rotator" element={<GroupRotator />} />
                    <Route path="chatbot-builder" element={<ChatbotBuilder />} />
                    <Route path="funnel-planner" element={<FunnelPlanner />} />
                    <Route path="funnel-bi" element={<FunnelBI />} />
                    <Route path="automation-metrics" element={<AutomationMetrics />} />
                    <Route path="support" element={<SupportTickets />} />
                    <Route path="support-center" element={<SupportCenter />} />
                    <Route path="support-portal-settings" element={<FeatureRequiredPage feature="customer_support_center" featureLabel="Portal de Suporte"><SupportPortalSettingsPage /></FeatureRequiredPage>} />
                    <Route path="notifications" element={<Notifications />} />
                    <Route path="crm-admin" element={<CRMAdmin />} />
                    <Route path="crm-intelligence" element={<CRMIntelligence />} />
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
                </Suspense>
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

import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedAdminRoute } from "@/components/admin/protected-admin-route";

// Regular pages
import Home from "@/pages/home";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import ParentDashboard from "@/pages/dashboard/parent";
import ChildDashboard from "@/pages/dashboard/child";
import CreateStory from "@/pages/story/create";
import ReadStory from "@/pages/story/read";
import SubscriptionPlans from "@/pages/subscription/plans";
import NotFound from "@/pages/not-found";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

// Admin pages
import AdminDashboard from "@/pages/admin";
import AdminPage from "./routes/AdminPage";
import AITestImagePage from "./routes/AITestImagePage";

function Router() {
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Rainbow dots border at the top of the entire app */}
      <div className="rainbow-dots-border w-full"></div>
      
      {/* Regular routes with header/footer */}
      <Switch>
        {/* Admin routes - no header/footer */}
        <ProtectedAdminRoute path="/admin" component={AdminDashboard} />
        <ProtectedAdminRoute path="/admin/users" component={AdminDashboard} />
        <ProtectedAdminRoute path="/admin/stories" component={AdminDashboard} />
        <ProtectedAdminRoute path="/admin/subscriptions" component={AdminDashboard} />
        <ProtectedAdminRoute path="/admin/characters-themes" component={AdminDashboard} />
        <ProtectedAdminRoute path="/admin/ai-providers" component={AdminDashboard} />
        <ProtectedAdminRoute path="/admin/api-keys" component={AdminDashboard} />
        <ProtectedAdminRoute path="/admin/page" component={AdminPage} />
        <ProtectedAdminRoute path="/admin/ai-test/image" component={AITestImagePage} />
        
        {/* Regular routes */}
        <Route path="*">
          <>
            <div className="pt-8"> {/* Add padding to account for the rainbow border */}
              <Header />
              <main className="flex-grow">
                <Switch>
                  <Route path="/" component={Home} />
                  <Route path="/login" component={Login} />
                  <Route path="/register" component={Register} />
                  <Route path="/dashboard/parent" component={ParentDashboard} />
                  <Route path="/dashboard/child/:id" component={ChildDashboard} />
                  <Route path="/story/create" component={CreateStory} />
                  <Route path="/story/read/:id" component={ReadStory} />
                  <Route path="/stories/:id" component={ReadStory} />
                  <Route path="/subscription/plans" component={SubscriptionPlans} />
                  <Route path="/admin-direct" component={AdminPage} />
                  <Route component={NotFound} />
                </Switch>
              </main>
              <Footer />
            </div>
          </>
        </Route>
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

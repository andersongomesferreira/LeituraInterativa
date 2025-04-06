import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

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

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/dashboard/parent" component={ParentDashboard} />
          <Route path="/dashboard/child/:id" component={ChildDashboard} />
          <Route path="/story/create" component={CreateStory} />
          <Route path="/stories/:id" component={ReadStory} />
          <Route path="/subscription/plans" component={SubscriptionPlans} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Categories from "./pages/Categories";
import CategoryListings from "./pages/CategoryListings";
import Marketplace from "./pages/Marketplace";
import Search from "./pages/Search";
import ProductDetail from "./pages/ProductDetail";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import PostListing from "./pages/PostListing";
import EditListing from "./pages/EditListing";
import StaticPage from "./pages/StaticPage";
import SellerProfile from "./pages/SellerProfile";
import Messages from "./pages/Messages";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";

// Layout
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="login" element={<Login />} />
              <Route path="signup" element={<Signup />} />
              <Route path="categories" element={<Categories />} />
              <Route path="category/:slug" element={<CategoryListings />} />
              <Route path="marketplace" element={<Marketplace />} />
              <Route path="search" element={<Search />} />
              <Route path="listing/:id" element={<ProductDetail />} />
              <Route path="seller/:id" element={<SellerProfile />} />
              <Route path="page/:slug" element={<StaticPage />} />
              <Route path="blog" element={<Blog />} />
              <Route path="blog/:slug" element={<BlogPost />} />
              
              {/* Protected Routes */}
              <Route path="dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="sell" element={
                <ProtectedRoute>
                  <PostListing />
                </ProtectedRoute>
              } />
              <Route path="post-listing" element={
                <ProtectedRoute>
                  <PostListing />
                </ProtectedRoute>
              } />
              <Route path="edit-listing/:id" element={
                <ProtectedRoute>
                  <EditListing />
                </ProtectedRoute>
              } />
              <Route path="messages" element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              } />
              <Route path="messages/:id" element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              } />
              
              {/* Admin Routes */}
              <Route path="admin/*" element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } />
            </Route>
          </Routes>
          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

export const authConfig = {
  providers: [], // Providers are defined in the route.js file
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request }) {

      return true; // Allow all requests to pass through

      // const isLoggedIn = auth?.user;
      // const isOnDashboard = request.nextUrl.pathname.startsWith("/dashboard");
      // if (isOnDashboard) {
      //   if (isLoggedIn) return true;
      //   return false;
      // } else if (isLoggedIn) {
      //   return Response.redirect(new URL("/dashboard", request.nextUrl));
      // }
      // return true;
    },
  },
};
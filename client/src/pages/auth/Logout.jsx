export default function Logout() {
  authService.removeToken();
  navigate("/login");
}

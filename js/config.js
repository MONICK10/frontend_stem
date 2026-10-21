/**
 * Single source of truth for the backend URL.
 *
 * This is the ONLY file in the project where a backend URL is written.
 * Every other script reads window.API_BASE_URL instead of hardcoding a host.
 *
 * Loaded as a plain <script> (not a module) before any script that calls the
 * backend, so window.API_BASE_URL is set by the time those scripts run.
 */
(function () {
  var hostname = window.location.hostname;
  var isLocal = hostname === "localhost" || hostname === "127.0.0.1";

  window.API_BASE_URL = isLocal
    ? "http://localhost:5001"
    : "https://stem-backend-he01.onrender.com";
})();

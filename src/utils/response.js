export function ok(res, message = "ok", data = {}) {
  return res.json({ success: true, message, ...("data" in data ? { data: data.data } : { data }) });
}
export function badRequest(res, message = "Bad Request", data = {}) {
  return res.status(400).json({ success: false, message, data });
}
export function notFound(res, message = "Not Found") {
  return res.status(404).json({ success: false, message });
}
export function serverError(res, err) {
  return res.status(500).json({ success: false, message: err?.message || "Server error" });
}
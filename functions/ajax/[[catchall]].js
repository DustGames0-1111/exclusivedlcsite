import worker from "../../worker.js";

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}

export async function onRequest(context) {
  return worker.fetch(context.request, context.env);
}

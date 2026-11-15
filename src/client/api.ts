export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch("/api" + path, {
    method,
    credentials: "same-origin",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("O serviço está indisponível. Tente novamente.");
  }
  if (!response.ok)
    throw new Error(
      (result as { error?: string }).error || "Não foi possível concluir.",
    );
  return result as T;
}

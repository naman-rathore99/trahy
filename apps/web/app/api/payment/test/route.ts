export async function POST(request: Request) {
    const body = await request.json();
    const authHeader = request.headers.get("Authorization");

    return Response.json({
        authHeader: authHeader || "MISSING",
        bodyToken: body._authToken ? body._authToken.substring(0, 20) : "MISSING",
        allHeaders: Object.fromEntries(request.headers.entries()),
        body: { ...body, _authToken: body._authToken ? "present" : "missing" },
    });
}